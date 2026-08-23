import {
  DocumentClassification,
  ExtractedDocument,
  ExtractedPage,
  ExtractedTable,
  OfficeConversionProgress,
  OfficeConversionResult,
  OfficeConversionSettings,
} from "./types";
import { buildDocxBlob } from "./docx-builder";
import { buildXlsxBlob } from "./xlsx-builder";
import { parseTableFromText } from "@/lib/tools/table-parser/table-engine";

let pdfjsCache: unknown = null;
async function getPdfjs() {
  if (typeof window === "undefined") {
    // Server / Node environment
    try {
      return await import("pdfjs-dist/legacy/build/pdf.mjs");
    } catch {
      return null;
    }
  }
  if (!pdfjsCache) {
    try {
      const pdfjs = await import("pdfjs-dist");
      if (pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || "4.10.38"}/pdf.worker.min.mjs`;
      }
      pdfjsCache = pdfjs;
    } catch {
      return null;
    }
  }
  return pdfjsCache as typeof import("pdfjs-dist");
}

interface RawTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

import type { PDFPageProxy } from "pdfjs-dist";

// Fallback OCR for scanned pages using Tesseract
async function ocrPageFallback(
  pdfPage: PDFPageProxy,
  pageNum: number,
  onProgress?: (progress: OfficeConversionProgress) => void
): Promise<{ text: string; lines: string[] }> {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return { text: "", lines: [] };
    }

    onProgress?.({
      stage: `Running client-side OCR on scanned page ${pageNum}...`,
      percent: 50,
      currentPage: pageNum,
    });

    const viewport = pdfPage.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { text: "", lines: [] };

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await pdfPage.render({ canvasContext: ctx, canvas, viewport }).promise;
    const dataUrl = canvas.toDataURL("image/png");

    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng", 1, {
      workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@v5/dist/worker.min.js",
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@v5",
      langPath: "https://tessdata.projectnaptha.com/4.0.0_fast",
    });

    const ret = await worker.recognize(dataUrl);
    await worker.terminate();

    const ocrText = ret.data.text || "";
    const lines = ocrText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return { text: ocrText, lines };
  } catch (err) {
    console.warn(`OCR fallback failed on page ${pageNum}:`, err);
    return { text: "", lines: [] };
  }
}

export async function extractPdfDocument(
  arrayBuffer: ArrayBuffer,
  enableOcrFallback = true,
  onProgress?: (progress: OfficeConversionProgress) => void
): Promise<ExtractedDocument> {
  const pdfjs = await getPdfjs();
  if (!pdfjs) throw new Error("Could not initialize PDF extraction engine.");

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  let totalWords = 0;
  let totalChars = 0;
  let ocrPagesCount = 0;
  const pages: ExtractedPage[] = [];
  const allTables: ExtractedTable[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const percent = Math.round((pageNum / pageCount) * 80);
    onProgress?.({
      stage: `Extracting page ${pageNum} of ${pageCount}...`,
      percent,
      currentPage: pageNum,
      totalPages: pageCount,
    });

    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const rawItems: RawTextItem[] = [];
    for (const item of content.items) {
      if ("str" in item && typeof item.str === "string" && item.str.trim()) {
        const transform = "transform" in item && Array.isArray(item.transform) ? item.transform : undefined;
        const width = "width" in item && typeof item.width === "number" ? item.width : 0;
        const height = "height" in item && typeof item.height === "number" ? item.height : 0;
        const fontSize = transform ? Math.hypot(transform[0], transform[1]) : 12;

        rawItems.push({
          str: item.str.trim(),
          x: Math.round(transform ? transform[4] : 0),
          y: Math.round(transform ? transform[5] : 0),
          width: Math.round(width),
          height: Math.round(height),
          fontSize: Math.round(fontSize),
        });
      }
    }

    // Check if page has sufficient native vector text or needs OCR fallback
    const nativeWordsCount = rawItems.reduce((acc, it) => acc + it.str.split(/\s+/).filter(Boolean).length, 0);

    if (nativeWordsCount < 5 && enableOcrFallback) {
      // Level 3: Automatic OCR Fallback for scanned page
      const ocrResult = await ocrPageFallback(page, pageNum, onProgress);
      if (ocrResult.lines.length > 0) {
        ocrPagesCount++;
        const ocrWords = ocrResult.text.split(/\s+/).filter(Boolean).length;
        totalWords += ocrWords;
        totalChars += ocrResult.text.length;

        const ocrTables = parseTableFromText(ocrResult.text);
        const paragraphs: { type: "heading" | "text" | "list_item"; text: string }[] = [];

        ocrResult.lines.forEach((line) => {
          const isHeading = line.length < 60 && (line.toUpperCase() === line || line.endsWith(":"));
          const isList = /^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line);
          if (isHeading) {
            paragraphs.push({ type: "heading", text: line });
          } else if (isList) {
            paragraphs.push({ type: "list_item", text: line });
          } else {
            paragraphs.push({ type: "text", text: line });
          }
        });

        pages.push({
          pageNumber: pageNum,
          source: "ocr",
          paragraphs,
          tables: ocrTables,
          totalWords: ocrWords,
        });
        allTables.push(...ocrTables);
        continue;
      }
    }

    if (rawItems.length === 0) {
      pages.push({
        pageNumber: pageNum,
        source: "native",
        paragraphs: [],
        tables: [],
        totalWords: 0,
      });
      continue;
    }

    // Group items into lines by vertical Y-coordinate tolerance (4pt)
    const lineBuckets: { y: number; items: RawTextItem[] }[] = [];
    for (const item of rawItems) {
      let bucket = lineBuckets.find((b) => Math.abs(b.y - item.y) <= 4);
      if (!bucket) {
        bucket = { y: item.y, items: [] };
        lineBuckets.push(bucket);
      }
      bucket.items.push(item);
    }

    // Sort lines top-to-bottom (descending Y)
    lineBuckets.sort((a, b) => b.y - a.y);
    // Sort items within each line left-to-right (ascending X)
    lineBuckets.forEach((b) => b.items.sort((a, b) => a.x - b.x));

    const pageParagraphs: { type: "heading" | "text" | "list_item"; text: string }[] = [];
    const pageTables: ExtractedTable[] = [];

    // Detect tabular structures vs headings vs lists vs paragraphs
    let currentTableRows: string[][] = [];
    let currentTableTitle: string | undefined = undefined;

    const flushCurrentTable = () => {
      if (currentTableRows.length > 0) {
        const colCount = Math.max(...currentTableRows.map((r) => r.length));
        if (colCount >= 2 && currentTableRows.length >= 2) {
          const normalizedRows = currentTableRows.map((r) => {
            const copy = [...r];
            while (copy.length < colCount) copy.push("");
            return copy;
          });
          const headers = normalizedRows[0];
          const rows = normalizedRows.slice(1);
          const tableObj: ExtractedTable = {
            title: currentTableTitle,
            headers,
            rows,
            rowCount: normalizedRows.length,
            columnCount: colCount,
          };
          pageTables.push(tableObj);
          allTables.push(tableObj);
        } else {
          currentTableRows.forEach((r) => {
            pageParagraphs.push({ type: "text", text: r.join(" - ") });
          });
        }
        currentTableRows = [];
        currentTableTitle = undefined;
      }
    };

    for (let i = 0; i < lineBuckets.length; i++) {
      const line = lineBuckets[i];
      const items = line.items;
      const combinedLineText = items.map((it) => it.str).join(" ");
      const wordsInLine = combinedLineText.split(/\s+/).filter(Boolean);
      totalWords += wordsInLine.length;
      totalChars += combinedLineText.length;

      // Multi-column row detection
      const isMultiColumn =
        items.length >= 2 &&
        items.some((it, idx) => idx > 0 && it.x - (items[idx - 1].x + items[idx - 1].width) >= 15);

      if (isMultiColumn) {
        const rowCells = items.map((it) => it.str);
        currentTableRows.push(rowCells);
      } else {
        if (currentTableRows.length >= 2) {
          flushCurrentTable();
        } else if (currentTableRows.length === 1) {
          pageParagraphs.push({ type: "text", text: currentTableRows[0].join(" : ") });
          currentTableRows = [];
        }

        const isHeading =
          items[0]?.fontSize > 13 ||
          (items[0]?.str.length < 50 &&
            (items[0]?.str.endsWith("Details") ||
              items[0]?.str.endsWith("Summary") ||
              items[0]?.str.endsWith("Calculation") ||
              items[0]?.str.endsWith("Report") ||
              items[0]?.str.startsWith("Order:")));

        const isList = /^[-*•]\s+/.test(combinedLineText) || /^\d+[.)]\s+/.test(combinedLineText);

        if (isHeading && i + 1 < lineBuckets.length && lineBuckets[i + 1].items.length >= 2) {
          currentTableTitle = items[0].str;
          pageParagraphs.push({ type: "heading", text: items[0].str });
        } else if (isHeading) {
          pageParagraphs.push({ type: "heading", text: combinedLineText });
        } else if (isList) {
          pageParagraphs.push({ type: "list_item", text: combinedLineText });
        } else {
          pageParagraphs.push({ type: "text", text: combinedLineText });
        }
      }
    }

    flushCurrentTable();

    pages.push({
      pageNumber: pageNum,
      source: "native",
      paragraphs: pageParagraphs,
      tables: pageTables,
      totalWords: nativeWordsCount,
    });
  }

  const classification: DocumentClassification =
    ocrPagesCount === 0
      ? "native"
      : ocrPagesCount === pageCount
      ? "scanned"
      : "mixed";

  return {
    pageCount,
    wordCount: totalWords,
    characterCount: totalChars,
    classification,
    ocrPagesCount,
    pages,
    allTables,
  };
}

export async function convertPdfToOffice(
  file: File,
  settings: OfficeConversionSettings,
  onProgress?: (progress: OfficeConversionProgress) => void
): Promise<OfficeConversionResult> {
  const startTime = performance.now();
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ stage: "Analyzing document structures...", percent: 10 });
  const docData = await extractPdfDocument(arrayBuffer, settings.enableOcrFallback !== false, onProgress);
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const title = baseName.replace(/[-_]/g, " ");

  let outputBlob: Blob;
  let outputName: string;

  if (settings.targetFormat === "docx") {
    onProgress?.({ stage: "Compiling OpenXML Word (.docx) package...", percent: 85 });
    outputBlob = await buildDocxBlob(docData, title);
    outputName = `${baseName}.docx`;
  } else {
    onProgress?.({ stage: "Compiling OpenXML Excel (.xlsx) workbook...", percent: 85 });
    outputBlob = await buildXlsxBlob(docData, title);
    outputName = `${baseName}.xlsx`;
  }

  // Validate resulting package
  if (outputBlob.size < 100) {
    throw new Error("Unable to generate a valid Office document package. Output size is too small.");
  }

  // Validate ZIP header signature (PK\x03\x04: 0x50, 0x4B, 0x03, 0x04)
  const headerBuf = await outputBlob.slice(0, 4).arrayBuffer();
  const headerView = new DataView(headerBuf);
  const signature = headerView.getUint32(0, true);
  if (signature !== 0x04034b50) {
    throw new Error("Office document validation failed: Invalid ZIP container signature.");
  }

  onProgress?.({ stage: "Validation complete.", percent: 100 });
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    fileName: file.name,
    outputSize: outputBlob.size,
    outputName,
    outputBlob,
    targetFormat: settings.targetFormat,
    durationMs,
    pageCount: docData.pageCount,
    wordCount: docData.wordCount,
    characterCount: docData.characterCount,
    classification: docData.classification,
    ocrPagesCount: docData.ocrPagesCount,
    tablesCount: docData.allTables.length,
    tables: docData.allTables,
  };
}
