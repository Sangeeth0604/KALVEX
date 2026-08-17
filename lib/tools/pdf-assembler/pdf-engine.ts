import { PDFDocument, degrees } from "pdf-lib";
import {
  PdfDocumentItem,
  PdfError,
  PdfExportResult,
  PdfPageItem,
} from "./types";

export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per file
export const MAX_PDF_SIZE_LABEL = "50 MB";

export const DOC_COLOR_PALETTE = [
  "#00F59B", // KALVEX Electric Green
  "#00D2FF", // Cyan
  "#A855F7", // Purple
  "#FFB800", // Amber
  "#FF5C00", // Orange
  "#EC4899", // Pink
  "#3B82F6", // Blue
  "#10B981", // Emerald
];

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function validatePdfFile(file: File): { valid: boolean; error?: PdfError } {
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

// PDF.js dynamic loader for browser canvas rendering
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

export async function renderPageThumbnail(
  arrayBuffer: ArrayBuffer,
  pageIndex: number
): Promise<{ thumbnailUrl: string; aspectRatio: number } | null> {
  try {
    const pdfjs = await getPdfjs();
    if (!pdfjs) return null;

    // Clone buffer for pdfjs worker to avoid detachment
    const bufferCopy = arrayBuffer.slice(0);
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(bufferCopy),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageIndex + 1);

    // Target a crisp 200px width thumbnail
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const targetWidth = 220;
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Fill white background for pages without explicit background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render page
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    };
    await page.render(renderContext).promise;

    const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.85);
    const aspectRatio = viewport.width / viewport.height;

    return { thumbnailUrl, aspectRatio };
  } catch {
    return null;
  }
}

export async function loadPdfDocument(
  file: File,
  colorIndex = 0
): Promise<{ document: PdfDocumentItem; pages: PdfPageItem[] }> {
  const arrayBuffer = await file.arrayBuffer();

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  } catch {
    throw {
      code: "CORRUPTED_PDF",
      message: `Failed to parse "${file.name}". The file may be password-protected or corrupted.`,
    } as PdfError;
  }

  const pageCount = pdfDoc.getPageCount();
  if (pageCount === 0) {
    throw {
      code: "EMPTY_FILE",
      message: `The PDF document "${file.name}" contains no pages.`,
    } as PdfError;
  }

  const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const colorTag = DOC_COLOR_PALETTE[colorIndex % DOC_COLOR_PALETTE.length];

  const docItem: PdfDocumentItem = {
    id: docId,
    name: file.name,
    size: file.size,
    pageCount,
    arrayBuffer,
    colorTag,
  };

  const pages: PdfPageItem[] = [];

  for (let i = 0; i < pageCount; i++) {
    const pageId = `${docId}-p${i + 1}`;
    const page = pdfDoc.getPage(i);
    const initialRotation = page.getRotation().angle || 0;

    // Asynchronously or sequentially load thumbnail
    let thumbnail: { thumbnailUrl: string; aspectRatio: number } | null = null;
    try {
      thumbnail = await renderPageThumbnail(arrayBuffer, i);
    } catch {
      thumbnail = null;
    }

    pages.push({
      id: pageId,
      docId,
      docName: file.name,
      colorTag,
      originalPageIndex: i,
      rotation: initialRotation,
      thumbnailUrl: thumbnail ? thumbnail.thumbnailUrl : null,
      aspectRatio: thumbnail ? thumbnail.aspectRatio : 0.707, // Standard A4 aspect ratio default
      isSelected: false,
    });
  }

  return { document: docItem, pages };
}

export async function generatePdfFromPages(
  documents: PdfDocumentItem[],
  pages: PdfPageItem[],
  customFileName?: string,
  operationType: "assemble" | "extract" = "assemble"
): Promise<PdfExportResult> {
  const startTime = performance.now();

  if (!pages || pages.length === 0) {
    throw {
      code: "EMPTY_WORKSPACE",
      message: "Cannot export an empty PDF document. Please keep at least one page.",
    } as PdfError;
  }

  try {
    const targetDoc = await PDFDocument.create();

    // Cache loaded source documents to avoid reloading the same ArrayBuffer multiple times
    const sourceDocCache = new Map<string, PDFDocument>();

    for (const docItem of documents) {
      if (!sourceDocCache.has(docItem.id)) {
        const loaded = await PDFDocument.load(docItem.arrayBuffer, {
          ignoreEncryption: true,
        });
        sourceDocCache.set(docItem.id, loaded);
      }
    }

    // Sequentially copy each page in exact workspace order
    for (const pageItem of pages) {
      const srcDoc = sourceDocCache.get(pageItem.docId);
      if (!srcDoc) {
        throw new Error(`Source document for page not found: ${pageItem.docName}`);
      }

      const [copiedPage] = await targetDoc.copyPages(srcDoc, [
        pageItem.originalPageIndex,
      ]);

      // Apply rotation: targetDoc page rotation in degrees
      const normalizedRotation = ((pageItem.rotation % 360) + 360) % 360;
      copiedPage.setRotation(degrees(normalizedRotation));

      targetDoc.addPage(copiedPage);
    }

    const pdfBytes = await targetDoc.save();
    const endTime = performance.now();
    const durationMs = Math.max(1, Math.round(endTime - startTime));

    const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
    const objectUrl = URL.createObjectURL(blob);

    const defaultName =
      operationType === "extract"
        ? `extracted-pages-${pages.length}.pdf`
        : documents.length > 1
        ? `merged-document-${pages.length}p.pdf`
        : `${documents[0]?.name.replace(/\.pdf$/i, "") || "document"}-assembled.pdf`;

    const fileName = customFileName || defaultName;

    return {
      pageCount: pages.length,
      fileSize: blob.size,
      fileName,
      blob,
      objectUrl,
      durationMs,
      operationType,
    };
  } catch (err) {
    throw {
      code: "EXPORT_FAILED",
      message:
        (err as Error).message ||
        "Failed to assemble the PDF document in browser memory.",
    } as PdfError;
  }
}
