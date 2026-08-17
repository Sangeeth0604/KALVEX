import { createWorker, Worker } from "tesseract.js";
import {
  LoadedDocumentInfo,
  OcrError,
  OcrPageResult,
  OcrProgress,
  OcrResult,
} from "./types";

export const MAX_OCR_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_OCR_FILE_SIZE_LABEL = "50 MB";

export const SUPPORTED_MIME_TYPES: string[] = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
];

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function validateOcrFile(file: File): { valid: boolean; error?: OcrError } {
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
        message: "The selected file is empty (0 bytes). Please choose a valid image or PDF.",
      },
    };
  }

  if (file.size > MAX_OCR_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File size (${formatBytes(file.size)}) exceeds the maximum client-side limit of ${MAX_OCR_FILE_SIZE_LABEL}.`,
      },
    };
  }

  const normalizedType = file.type.toLowerCase();
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  const isSupportedMime = SUPPORTED_MIME_TYPES.includes(normalizedType);
  const isSupportedExt = ["png", "jpg", "jpeg", "webp", "pdf"].includes(fileExt || "");

  if (!isSupportedMime && !isSupportedExt) {
    return {
      valid: false,
      error: {
        code: "UNSUPPORTED_TYPE",
        message: "This file type is not supported. Please select a PNG, JPG, JPEG, WEBP, or PDF file.",
      },
    };
  }

  return { valid: true };
}

// PDF.js dynamic loader for high-DPI page rendering
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

export async function loadDocumentInfo(file: File): Promise<LoadedDocumentInfo> {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjs = await getPdfjs();
    if (!pdfjs) {
      throw {
        code: "RENDER_FAILED",
        message: "Failed to initialize client PDF rendering engine.",
      } as OcrError;
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
      const targetWidth = 320;
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
      const aspectRatio = scaledViewport.width / scaledViewport.height;

      return {
        file,
        name: file.name,
        size: file.size,
        type: file.type || "application/pdf",
        inputType: "pdf",
        pageCount,
        previewUrl,
        aspectRatio,
      };
    } catch {
      throw {
        code: "CORRUPTED_FILE",
        message: `Could not parse PDF "${file.name}". The document may be corrupted or password-protected.`,
      } as OcrError;
    }
  } else {
    // Raster Image
    const objectUrl = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const aspectRatio = width / height;
        resolve({
          file,
          name: file.name,
          size: file.size,
          type: file.type || "image/jpeg",
          inputType: "image",
          pageCount: 1,
          previewUrl: objectUrl,
          aspectRatio,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject({
          code: "CORRUPTED_FILE",
          message: `Could not decode image "${file.name}". The file may be corrupt or unreadable.`,
        } as OcrError);
      };
      img.src = objectUrl;
    });
  }
}

// Global OCR worker instance to reuse across extraction requests
let activeWorker: Worker | null = null;

export async function getOcrWorker(
  onProgress?: (progress: OcrProgress) => void
): Promise<Worker> {
  if (!activeWorker) {
    activeWorker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && onProgress) {
          const rawProg = Math.round((m.progress || 0) * 100);
          onProgress({
            currentPage: 1,
            totalPages: 1,
            stage: "Recognizing text",
            progress: rawProg,
          });
        }
      },
    });
  }
  return activeWorker;
}

export async function terminateOcrWorker(): Promise<void> {
  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch {
      // ignore
    }
    activeWorker = null;
  }
}

function countWordsAndLines(text: string): { words: number; lines: number } {
  const trimmed = text.trim();
  if (!trimmed) return { words: 0, lines: 0 };
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0).length;
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0).length;
  return { words, lines };
}

export async function runOcrExtraction(
  docInfo: LoadedDocumentInfo,
  onProgress: (progress: OcrProgress) => void
): Promise<OcrResult> {
  const startTime = performance.now();

  if (docInfo.inputType === "image") {
    onProgress({
      currentPage: 1,
      totalPages: 1,
      stage: "Initializing OCR Engine",
      progress: 10,
    });

    const worker = await getOcrWorker((p) => {
      onProgress({
        currentPage: 1,
        totalPages: 1,
        stage: p.stage,
        progress: Math.min(95, Math.max(10, p.progress)),
      });
    });

    onProgress({
      currentPage: 1,
      totalPages: 1,
      stage: "Recognizing text",
      progress: 30,
    });

    const ocrResult = await worker.recognize(docInfo.file);
    const rawText = ocrResult.data.text || "";
    const confidence = Math.round(ocrResult.data.confidence || 0);
    const { words, lines } = countWordsAndLines(rawText);

    const endTime = performance.now();
    const durationMs = Math.max(1, Math.round(endTime - startTime));

    const pageResult: OcrPageResult = {
      pageNumber: 1,
      text: rawText,
      confidence,
      wordsCount: words,
      linesCount: lines,
      previewUrl: docInfo.previewUrl,
    };

    onProgress({
      currentPage: 1,
      totalPages: 1,
      stage: "Extraction complete",
      progress: 100,
    });

    return {
      fullText: rawText,
      pages: [pageResult],
      totalPages: 1,
      totalWords: words,
      totalLines: lines,
      averageConfidence: confidence,
      durationMs,
      fileName: docInfo.name,
      fileSize: docInfo.size,
      inputType: "image",
    };
  } else {
    // Multi-page PDF Processing
    const arrayBuffer = await docInfo.file.arrayBuffer();
    const pdfjs = await getPdfjs();
    if (!pdfjs) {
      throw {
        code: "RENDER_FAILED",
        message: "Failed to initialize PDF renderer.",
      } as OcrError;
    }

    const bufferCopy = arrayBuffer.slice(0);
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(bufferCopy),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    const worker = await getOcrWorker();
    const pages: OcrPageResult[] = [];
    const fullTextParts: string[] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageBaseProgress = Math.round(((pageNum - 1) / totalPages) * 100);

      onProgress({
        currentPage: pageNum,
        totalPages,
        stage: `Rendering Page ${pageNum} of ${totalPages}`,
        progress: pageBaseProgress + 5,
      });

      const page = await pdf.getPage(pageNum);
      // High-DPI scale (1.75x) for crisp character recognition
      const viewport = page.getViewport({ scale: 1.75 });

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

      onProgress({
        currentPage: pageNum,
        totalPages,
        stage: `Recognizing Text on Page ${pageNum} of ${totalPages}`,
        progress: pageBaseProgress + 15,
      });

      const ocrResult = await worker.recognize(canvas);
      const pageText = (ocrResult.data.text || "").trim();
      const confidence = Math.round(ocrResult.data.confidence || 0);
      const { words, lines } = countWordsAndLines(pageText);

      // Low-res thumbnail for preview
      const thumbScale = 200 / viewport.width;
      const thumbViewport = page.getViewport({ scale: thumbScale });
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = Math.floor(thumbViewport.width);
      thumbCanvas.height = Math.floor(thumbViewport.height);
      const thumbCtx = thumbCanvas.getContext("2d");
      if (thumbCtx) {
        thumbCtx.fillStyle = "#FFFFFF";
        thumbCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
        await page.render({
          canvasContext: thumbCtx,
          viewport: thumbViewport,
          canvas: thumbCanvas,
        }).promise;
      }
      const pagePreviewUrl = thumbCanvas.toDataURL("image/jpeg", 0.8);

      pages.push({
        pageNumber: pageNum,
        text: pageText,
        confidence,
        wordsCount: words,
        linesCount: lines,
        previewUrl: pagePreviewUrl,
      });

      if (totalPages > 1) {
        fullTextParts.push(`--- Page ${pageNum} ---\n${pageText}`);
      } else {
        fullTextParts.push(pageText);
      }
    }

    const fullText = fullTextParts.join("\n\n");
    const { words: totalWords, lines: totalLines } = countWordsAndLines(fullText);

    const averageConfidence =
      pages.length > 0
        ? Math.round(
            pages.reduce((sum, p) => sum + p.confidence, 0) / pages.length
          )
        : 0;

    const endTime = performance.now();
    const durationMs = Math.max(1, Math.round(endTime - startTime));

    onProgress({
      currentPage: totalPages,
      totalPages,
      stage: "Extraction complete",
      progress: 100,
    });

    return {
      fullText,
      pages,
      totalPages,
      totalWords,
      totalLines,
      averageConfidence,
      durationMs,
      fileName: docInfo.name,
      fileSize: docInfo.size,
      inputType: "pdf",
    };
  }
}
