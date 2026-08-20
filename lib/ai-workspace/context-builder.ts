import { DocumentContext, DocumentPageContext } from "./types";
import { runOcrExtraction, loadDocumentInfo } from "@/lib/tools/ocr-extractor/ocr-engine";

interface TextContentItem {
  str?: string;
  hasEOL?: boolean;
}

// Lazy load pdfjs-dist on client
async function getPdfjs() {
  if (typeof window === "undefined") return null;
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

/**
 * Builds a normalized, structured DocumentContext locally in browser RAM.
 * Prefers fast digital PDF text streams, falling back to local OCR for scanned PDFs & images.
 */
export async function buildDocumentContext(
  fileOrBlob: File | Blob,
  filename: string,
  mimeType: string,
  sourceArtifactId?: string,
  existingTextPayload?: string,
  onProgress?: (status: string) => void
): Promise<DocumentContext> {
  const startTime = performance.now();
  const normalizedMime = mimeType.toLowerCase();

  // 1. Direct text payload provided (e.g. from OCR artifact or text file)
  if (existingTextPayload && existingTextPayload.trim().length > 0) {
    const text = existingTextPayload.trim();
    const durationMs = Math.max(1, Math.round(performance.now() - startTime));
    return {
      id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceArtifactId,
      filename,
      mimeType,
      kind: "text",
      pageCount: 1,
      extractedText: text,
      pages: [
        {
          pageNumber: 1,
          text,
          hasOcr: true,
          characterCount: text.length,
        },
      ],
      totalCharacters: text.length,
      estimatedTokens: Math.ceil(text.length / 4),
      extractionMethod: "direct_text",
      extractionDurationMs: durationMs,
      createdAt: Date.now(),
    };
  }

  // 2. Text / Markdown / JSON files
  if (
    normalizedMime.startsWith("text/") ||
    filename.endsWith(".txt") ||
    filename.endsWith(".md") ||
    filename.endsWith(".json")
  ) {
    onProgress?.("Reading plain text document...");
    const rawText = await fileOrBlob.text();
    const text = rawText.trim();
    const durationMs = Math.max(1, Math.round(performance.now() - startTime));
    return {
      id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceArtifactId,
      filename,
      mimeType: mimeType || "text/plain",
      kind: "text",
      pageCount: 1,
      extractedText: text,
      pages: [
        {
          pageNumber: 1,
          text,
          hasOcr: false,
          characterCount: text.length,
        },
      ],
      totalCharacters: text.length,
      estimatedTokens: Math.ceil(text.length / 4),
      extractionMethod: "direct_text",
      extractionDurationMs: durationMs,
      createdAt: Date.now(),
    };
  }

  // 3. PDF Documents (Digital Text Extraction with Scanned OCR Fallback)
  if (normalizedMime === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
    onProgress?.("Parsing PDF digital text streams...");
    const pdfjs = await getPdfjs();
    if (!pdfjs) {
      throw new Error("PDF renderer could not be initialized in browser.");
    }

    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const pageContexts: DocumentPageContext[] = [];
    let consolidatedText = "";

    for (let i = 1; i <= numPages; i++) {
      onProgress?.(`Extracting text from page ${i} of ${numPages}...`);
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      const pageStrings = (textContent.items as TextContentItem[])
        .map((item) => item.str || "")
        .filter((s) => s.length > 0);

      const pageText = pageStrings.join(" ").trim();
      pageContexts.push({
        pageNumber: i,
        text: pageText,
        hasOcr: false,
        characterCount: pageText.length,
      });
      if (pageText.length > 0) {
        consolidatedText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
    }

    // Check if the PDF has actual digital text or is a scanned image container
    const totalChars = consolidatedText.trim().length;
    if (totalChars >= 50) {
      const durationMs = Math.max(1, Math.round(performance.now() - startTime));
      return {
        id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sourceArtifactId,
        filename,
        mimeType: "application/pdf",
        kind: "pdf",
        pageCount: numPages,
        extractedText: consolidatedText.trim(),
        pages: pageContexts,
        totalCharacters: totalChars,
        estimatedTokens: Math.ceil(totalChars / 4),
        extractionMethod: "digital_text",
        extractionDurationMs: durationMs,
        createdAt: Date.now(),
      };
    }

    // Fallback to local OCR for scanned PDF
    onProgress?.("Scanned PDF detected. Running local WebAssembly OCR...");
    const fileObj =
      fileOrBlob instanceof File
        ? fileOrBlob
        : new File([fileOrBlob], filename, { type: "application/pdf" });

    const docInfo = await loadDocumentInfo(fileObj);
    const ocrResult = await runOcrExtraction(docInfo, (p) => {
      onProgress?.(`Local OCR (${p.stage}): ${Math.round(p.progress * 100)}%`);
    });

    const ocrPages: DocumentPageContext[] = ocrResult.pages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.text,
      hasOcr: true,
      characterCount: p.text.length,
    }));

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));
    return {
      id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceArtifactId,
      filename,
      mimeType: "application/pdf",
      kind: "pdf",
      pageCount: ocrResult.totalPages,
      extractedText: ocrResult.fullText,
      pages: ocrPages,
      totalCharacters: ocrResult.fullText.length,
      estimatedTokens: Math.ceil(ocrResult.fullText.length / 4),
      extractionMethod: "local_ocr",
      extractionDurationMs: durationMs,
      createdAt: Date.now(),
    };
  }

  // 4. Image Documents (PNG, JPEG, WEBP)
  if (
    normalizedMime.startsWith("image/") ||
    filename.endsWith(".png") ||
    filename.endsWith(".jpg") ||
    filename.endsWith(".jpeg") ||
    filename.endsWith(".webp")
  ) {
    onProgress?.("Running local OCR on image...");
    const fileObj =
      fileOrBlob instanceof File
        ? fileOrBlob
        : new File([fileOrBlob], filename, { type: mimeType });

    const docInfo = await loadDocumentInfo(fileObj);
    const ocrResult = await runOcrExtraction(docInfo, (p) => {
      onProgress?.(`Local OCR: ${Math.round(p.progress * 100)}%`);
    });

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));
    return {
      id: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceArtifactId,
      filename,
      mimeType,
      kind: "image",
      pageCount: 1,
      extractedText: ocrResult.fullText,
      pages: [
        {
          pageNumber: 1,
          text: ocrResult.fullText,
          hasOcr: true,
          characterCount: ocrResult.fullText.length,
        },
      ],
      totalCharacters: ocrResult.fullText.length,
      estimatedTokens: Math.ceil(ocrResult.fullText.length / 4),
      extractionMethod: "local_ocr",
      extractionDurationMs: durationMs,
      createdAt: Date.now(),
    };
  }

  throw new Error(`Unsupported document format for context extraction: ${mimeType}`);
}
