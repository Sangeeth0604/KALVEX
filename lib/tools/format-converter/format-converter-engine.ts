import {
  ConversionResult,
  ConversionSettings,
  ConvertedPageResult,
  ConverterError,
  ImageOutputFormat,
  LoadedSourceInfo,
} from "./types";
import { documentBus } from "@/lib/document-bus/document-bus";

export const MAX_CONVERT_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_CONVERT_FILE_SIZE_LABEL = "50 MB";

export const SUPPORTED_SOURCE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
];

export function formatBytes(bytes: number, decimals = 2): string {
  const absBytes = Math.abs(bytes);
  if (absBytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  const formatted = `${parseFloat((absBytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  return bytes < 0 ? `-${formatted}` : formatted;
}

export function validateSourceFile(file: File | Blob, filename = "file"): {
  valid: boolean;
  error?: ConverterError;
} {
  if (!file) {
    return {
      valid: false,
      error: { code: "EMPTY_FILE", message: "No file provided." },
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: {
        code: "EMPTY_FILE",
        message: "The selected file is empty (0 bytes). Please select a valid file.",
      },
    };
  }

  if (file.size > MAX_CONVERT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File size (${formatBytes(file.size)}) exceeds the maximum client-side limit of ${MAX_CONVERT_FILE_SIZE_LABEL}.`,
      },
    };
  }

  const normalizedType = file.type.toLowerCase();
  const fileExt = filename.split(".").pop()?.toLowerCase();
  const isSupportedMime = SUPPORTED_SOURCE_MIME_TYPES.includes(normalizedType);
  const isSupportedExt = ["png", "jpg", "jpeg", "webp", "pdf"].includes(fileExt || "");

  if (!isSupportedMime && !isSupportedExt) {
    return {
      valid: false,
      error: {
        code: "UNSUPPORTED_TYPE",
        message: "This file type is not supported. Please select a PNG, JPG, WEBP, or PDF file.",
      },
    };
  }

  return { valid: true };
}

// PDF.js loader for page rendering
let pdfjsCache: unknown = null;

async function getPdfjs() {
  if (typeof window === "undefined") return null;
  if (!pdfjsCache) {
    try {
      const pdfjs = await import("pdfjs-dist");
      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || "4.10.38"}/build/pdf.worker.min.mjs`;
      }
      pdfjsCache = pdfjs;
    } catch {
      return null;
    }
  }
  return pdfjsCache as typeof import("pdfjs-dist");
}

export async function analyzeSourceDocument(
  file: File | Blob,
  filename = "document"
): Promise<LoadedSourceInfo> {
  const isPdf =
    file.type === "application/pdf" || filename.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await getPdfjs();
    if (!pdfjs) {
      throw {
        code: "CONVERSION_FAILED",
        message: "Failed to initialize client PDF rendering engine.",
      } as ConverterError;
    }

    try {
      const bufferCopy = arrayBuffer.slice(0);
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(bufferCopy),
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;

      // Render page 1 preview
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      const targetWidth = 300;
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(scaledViewport.width);
      canvas.height = Math.floor(scaledViewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport: scaledViewport,
        canvas: canvas,
      }).promise;

      const previewUrl = canvas.toDataURL("image/jpeg", 0.85);

      return {
        file,
        name: filename,
        size: file.size,
        mimeType: "application/pdf",
        inputType: "pdf",
        pageCount,
        previewUrl,
        dimensions: {
          width: Math.round(viewport.width),
          height: Math.round(viewport.height),
        },
      };
    } catch {
      throw {
        code: "CORRUPTED_FILE",
        message: `Could not parse PDF "${filename}". The document may be corrupted or password-protected.`,
      } as ConverterError;
    }
  } else {
    // Raster Image
    const objectUrl = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        resolve({
          file,
          name: filename,
          size: file.size,
          mimeType: file.type || "image/jpeg",
          inputType: "image",
          pageCount: 1,
          previewUrl: objectUrl,
          dimensions: { width, height },
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject({
          code: "CORRUPTED_FILE",
          message: `Could not decode image "${filename}". The file may be corrupt or unreadable.`,
        } as ConverterError);
      };
      img.src = objectUrl;
    });
  }
}

export function getTargetExtension(format: ImageOutputFormat): string {
  switch (format) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
}

export async function convertDocument(
  source: LoadedSourceInfo,
  settings: ConversionSettings
): Promise<ConversionResult> {
  const startTime = performance.now();
  const baseName = source.name.replace(/\.[^/.]+$/, "");
  const targetExt = getTargetExtension(settings.targetFormat);

  if (source.inputType === "image") {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject({
            code: "CONVERSION_FAILED",
            message: "Failed to initialize 2D canvas context.",
          } as ConverterError);
          return;
        }

        // Fill white background for JPEG conversions from transparent PNGs
        if (settings.targetFormat === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject({
                code: "CONVERSION_FAILED",
                message: "Failed to generate converted image blob.",
              } as ConverterError);
              return;
            }

            const outputName = `${baseName}.${targetExt}`;
            const objectUrl = URL.createObjectURL(blob);
            const durationMs = Math.max(1, Math.round(performance.now() - startTime));
            const sizeDifferenceBytes = source.size - blob.size;
            const percentageChange =
              source.size > 0 ? ((blob.size - source.size) / source.size) * 100 : 0;

            const pageResult: ConvertedPageResult = {
              pageNumber: 1,
              fileName: outputName,
              blob,
              objectUrl,
              size: blob.size,
              mimeType: settings.targetFormat,
              width: canvas.width,
              height: canvas.height,
            };

            // Register into Document Bus
            const busDoc = documentBus.addDocument({
              file: blob,
              filename: outputName,
              mimeType: settings.targetFormat,
              sourceTool: "format-converter",
              previewUrl: objectUrl,
              metadata: {
                width: canvas.width,
                height: canvas.height,
                durationMs,
                originalFormat: source.mimeType,
                convertedFormat: settings.targetFormat,
              },
            });

            resolve({
              originalName: source.name,
              originalSize: source.size,
              originalMimeType: source.mimeType,
              targetMimeType: settings.targetFormat,
              targetExtension: targetExt,
              totalOutputSize: blob.size,
              durationMs,
              pages: [pageResult],
              sizeDifferenceBytes,
              percentageChange,
              isLarger: blob.size > source.size,
              busDocumentId: busDoc.id,
            });
          },
          settings.targetFormat,
          settings.quality
        );
      };

      img.onerror = () => {
        reject({
          code: "CONVERSION_FAILED",
          message: "Failed to render source image for conversion.",
        } as ConverterError);
      };

      img.src = source.previewUrl;
    });
  } else {
    // PDF to Image Conversion
    const arrayBuffer = await source.file.arrayBuffer();
    const pdfjs = await getPdfjs();
    if (!pdfjs) {
      throw {
        code: "CONVERSION_FAILED",
        message: "Failed to initialize client PDF renderer.",
      } as ConverterError;
    }

    const bufferCopy = arrayBuffer.slice(0);
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(bufferCopy),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    let startPage = 1;
    let endPage = totalPages;

    if (settings.pageSelection === "range") {
      startPage = Math.max(1, Math.min(totalPages, settings.pageRangeStart));
      endPage = Math.max(startPage, Math.min(totalPages, settings.pageRangeEnd));
    }

    const pages: ConvertedPageResult[] = [];
    let totalOutputSize = 0;

    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const page = await pdf.getPage(pageNum);
      // 2.0x high resolution for crisp image conversion
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context");

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({
        canvasContext: ctx,
        viewport,
        canvas: canvas,
      }).promise;

      const pageBlob = await new Promise<Blob>((resBlob, rejBlob) => {
        canvas.toBlob(
          (b) => {
            if (b) resBlob(b);
            else rejBlob(new Error("Failed to render page blob"));
          },
          settings.targetFormat,
          settings.quality
        );
      });

      const pageFileName =
        totalPages > 1
          ? `${baseName}-page-${pageNum}.${targetExt}`
          : `${baseName}.${targetExt}`;
      const pageUrl = URL.createObjectURL(pageBlob);

      totalOutputSize += pageBlob.size;

      pages.push({
        pageNumber: pageNum,
        fileName: pageFileName,
        blob: pageBlob,
        objectUrl: pageUrl,
        size: pageBlob.size,
        mimeType: settings.targetFormat,
        width: canvas.width,
        height: canvas.height,
      });
    }

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));
    const sizeDifferenceBytes = source.size - totalOutputSize;
    const percentageChange =
      source.size > 0 ? ((totalOutputSize - source.size) / source.size) * 100 : 0;

    // Register primary converted document (or page 1) to Document Bus
    let busDocId: string | undefined;
    if (pages.length > 0) {
      const primaryPage = pages[0];
      const busDoc = documentBus.addDocument({
        file: primaryPage.blob,
        filename: primaryPage.fileName,
        mimeType: settings.targetFormat,
        sourceTool: "format-converter",
        previewUrl: primaryPage.objectUrl,
        metadata: {
          pageCount: pages.length,
          width: primaryPage.width,
          height: primaryPage.height,
          durationMs,
          convertedPages: pages.length,
        },
      });
      busDocId = busDoc.id;
    }

    return {
      originalName: source.name,
      originalSize: source.size,
      originalMimeType: source.mimeType,
      targetMimeType: settings.targetFormat,
      targetExtension: targetExt,
      totalOutputSize,
      durationMs,
      pages,
      sizeDifferenceBytes,
      percentageChange,
      isLarger: totalOutputSize > source.size,
      busDocumentId: busDocId,
    };
  }
}
