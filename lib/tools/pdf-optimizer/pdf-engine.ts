import { PDFDocument, PDFName } from "pdf-lib";
import {
  OptimizationOutcome,
  OptimizationResult,
  OptimizationSettings,
  PdfDocAnalysis,
  PdfOptimizerError,
} from "./types";

export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_PDF_SIZE_LABEL = "50 MB";

export const DEFAULT_OPTIMIZATION_SETTINGS: OptimizationSettings = {
  stripMetadata: true,
  useObjectStreams: true,
  pruneOrphanObjects: true,
};

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

export function validatePdfFile(file: File): { valid: boolean; error?: PdfOptimizerError } {
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
        message: "The selected file is empty (0 bytes). Please choose a valid PDF.",
      },
    };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File size (${formatBytes(file.size)}) exceeds the maximum client-side limit of ${MAX_PDF_SIZE_LABEL}.`,
      },
    };
  }

  const isPdfMime = file.type === "application/pdf";
  const isPdfExt = file.name.toLowerCase().endsWith(".pdf");

  if (!isPdfMime && !isPdfExt) {
    return {
      valid: false,
      error: {
        code: "UNSUPPORTED_TYPE",
        message: "This file type is not supported. Please select a valid PDF (.pdf) file.",
      },
    };
  }

  return { valid: true };
}

// PDF.js dynamic loader strictly for first-page visual preview
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

export async function analyzePdfDocument(file: File): Promise<PdfDocAnalysis> {
  const arrayBuffer = await file.arrayBuffer();

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  } catch {
    throw {
      code: "CORRUPTED_PDF",
      message: `Failed to parse "${file.name}". The file may be corrupt or malformed.`,
    } as PdfOptimizerError;
  }

  if (pdfDoc.isEncrypted) {
    throw {
      code: "ENCRYPTED_PDF",
      message: `"${file.name}" is password-protected or encrypted. Password-protected PDFs cannot be optimized locally without decryption.`,
    } as PdfOptimizerError;
  }

  const pageCount = pdfDoc.getPageCount();
  if (pageCount === 0) {
    throw {
      code: "EMPTY_FILE",
      message: `The PDF document "${file.name}" contains no pages.`,
    } as PdfOptimizerError;
  }

  const title = pdfDoc.getTitle() || undefined;
  const author = pdfDoc.getAuthor() || undefined;
  const creator = pdfDoc.getCreator() || undefined;
  const producer = pdfDoc.getProducer() || undefined;
  const hasMetadataStream = pdfDoc.catalog.has(PDFName.of("Metadata"));

  // Render first-page thumbnail for visual summary
  let previewUrl: string | null = null;
  try {
    const pdfjs = await getPdfjs();
    if (pdfjs) {
      const bufferCopy = arrayBuffer.slice(0);
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(bufferCopy),
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      const targetWidth = 260;
      const scale = targetWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(scaledViewport.width);
      canvas.height = Math.floor(scaledViewport.height);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
          canvas: canvas,
        }).promise;
        previewUrl = canvas.toDataURL("image/jpeg", 0.85);
      }
    }
  } catch {
    previewUrl = null;
  }

  return {
    name: file.name,
    size: file.size,
    pageCount,
    title,
    author,
    creator,
    producer,
    hasMetadataStream,
    previewUrl,
  };
}

export async function optimizePdf(
  file: File,
  settings: OptimizationSettings
): Promise<OptimizationResult> {
  const startTime = performance.now();
  const arrayBuffer = await file.arrayBuffer();

  try {
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    if (srcDoc.isEncrypted) {
      throw {
        code: "ENCRYPTED_PDF",
        message: "Encrypted PDFs cannot be optimized without decryption.",
      } as PdfOptimizerError;
    }

    const pageCount = srcDoc.getPageCount();
    let targetDoc: PDFDocument;

    // Structural Rebuilding (Profile 1):
    // If pruneOrphanObjects is enabled, rebuild the document into a clean context
    // copying only referenced page trees. This strips unreferenced historical incremental revision diffs.
    if (settings.pruneOrphanObjects) {
      const destDoc = await PDFDocument.create({ updateMetadata: false });
      const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
      const copiedPages = await destDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((page) => destDoc.addPage(page));
      targetDoc = destDoc;
    } else {
      targetDoc = srcDoc;
    }

    // Metadata & XML Stream Scrubbing
    if (settings.stripMetadata) {
      targetDoc.setTitle("");
      targetDoc.setAuthor("");
      targetDoc.setSubject("");
      targetDoc.setKeywords([]);
      targetDoc.setProducer("");
      targetDoc.setCreator("");

      // Purge catalog XMP metadata stream if present
      if (targetDoc.catalog.has(PDFName.of("Metadata"))) {
        targetDoc.catalog.delete(PDFName.of("Metadata"));
      }
    }

    // Serialize output using compressed Object Streams (useObjectStreams: true)
    const pdfBytes = await targetDoc.save({
      useObjectStreams: settings.useObjectStreams,
    });

    const endTime = performance.now();
    const durationMs = Math.max(1, Math.round(endTime - startTime));

    const originalSize = file.size;
    const optimizedSize = pdfBytes.byteLength;
    const reductionBytes = originalSize - optimizedSize;
    const savingsPercentage =
      originalSize > 0 ? (1 - optimizedSize / originalSize) * 100 : 0;

    let outcome: OptimizationOutcome = "reduced";
    if (optimizedSize > originalSize) {
      outcome = "larger";
    } else if (optimizedSize === originalSize) {
      outcome = "equal";
    }

    const baseName = file.name.replace(/\.pdf$/i, "");
    const candidateFileName = `${baseName}-optimized.pdf`;
    const candidateBlob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    const candidateObjectUrl = URL.createObjectURL(candidateBlob);

    // Effective output determination:
    // If reduced, effective file is the optimized PDF blob.
    // If equal or larger, effective file is the preserved original file.
    const effectiveBlob = outcome === "reduced" ? candidateBlob : file;
    const effectiveFileName = outcome === "reduced" ? candidateFileName : file.name;
    const effectiveObjectUrl =
      outcome === "reduced" ? candidateObjectUrl : URL.createObjectURL(file);

    return {
      originalSize,
      optimizedSize,
      reductionBytes,
      savingsPercentage,
      outcome,
      pageCount,
      effectiveBlob,
      effectiveObjectUrl,
      effectiveFileName,
      candidateBlob,
      candidateObjectUrl,
      candidateFileName,
      durationMs,
      settings,
    };
  } catch (err) {
    if ((err as PdfOptimizerError).code) {
      throw err;
    }
    throw {
      code: "OPTIMIZATION_FAILED",
      message: (err as Error).message || "Failed to optimize PDF document in browser memory.",
    } as PdfOptimizerError;
  }
}
