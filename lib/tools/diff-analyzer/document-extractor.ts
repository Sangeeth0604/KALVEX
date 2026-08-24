import JSZip from "jszip";

export type DocumentFormat = "pdf" | "docx" | "txt" | "md" | "html";

export interface NormalizedParagraph {
  id: string;
  page?: number;
  text: string;
  words: string[];
}

export interface NormalizedPage {
  pageNumber: number;
  paragraphs: NormalizedParagraph[];
}

export interface NormalizedDocument {
  filename: string;
  format: DocumentFormat;
  pages: NormalizedPage[];
  paragraphs: NormalizedParagraph[];
  lines: string[];
  text: string;
  wordCount: number;
}

let pdfjsCache: unknown = null;
async function getPdfjs() {
  if (typeof window === "undefined") {
    // Node / Server environment
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

/**
 * Detects document format using magic bytes, MIME type, and filename extensions
 */
export async function detectDocumentFormat(file: File | Blob, filename = ""): Promise<DocumentFormat> {
  const name = (file instanceof File ? file.name : filename).toLowerCase();

  try {
    const slice = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(slice);

    // PDF: %PDF (25 50 44 46)
    if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return "pdf";
    }

    // ZIP Package (DOCX): PK.. (50 4B 03 04)
    if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
      if (name.endsWith(".docx") || file.type.includes("wordprocessingml") || file.type.includes("docx")) {
        return "docx";
      }
      try {
        const zip = await JSZip.loadAsync(file);
        if (zip.file("word/document.xml")) {
          return "docx";
        }
      } catch {
        // Not a valid DOCX zip
      }
    }
  } catch {
    // Fallback to name/MIME
  }

  if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) return "docx";
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "md";
  if (name.endsWith(".html") || name.endsWith(".htm") || file.type.includes("html")) return "html";

  return "txt";
}

/**
 * Safely extracts human-readable text and tables from an OpenXML DOCX package
 */
export async function extractDocxText(file: File | Blob): Promise<string> {
  let zip: JSZip;
  try {
    const arrayBuffer = await file.arrayBuffer();
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch {
    throw new Error("Unable to read this DOCX document. The file may be corrupted or unsupported.");
  }

  const documentXmlFile = zip.file("word/document.xml");
  if (!documentXmlFile) {
    throw new Error("Unable to read this DOCX document. The file may be corrupted or unsupported.");
  }

  const xmlStr = await documentXmlFile.async("string");
  const paragraphs: string[] = [];

  // Match all <w:p> paragraphs
  const pRegex = /<w:p(?:\s+[^>]*)?>([\s\S]*?)<\/w:p>/g;
  let pMatch: RegExpExecArray | null;

  while ((pMatch = pRegex.exec(xmlStr)) !== null) {
    const pContent = pMatch[1];
    let pText = "";

    // Match <w:t>, <w:tab/>, <w:br/>, <w:cr/>
    const tokenRegex = /<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>|<w:cr\/>/g;
    let tMatch: RegExpExecArray | null;

    while ((tMatch = tokenRegex.exec(pContent)) !== null) {
      if (tMatch[0].startsWith("<w:t")) {
        const textChunk = tMatch[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        pText += textChunk;
      } else if (tMatch[0] === "<w:tab/>") {
        pText += "\t";
      } else if (tMatch[0] === "<w:br/>" || tMatch[0] === "<w:cr/>") {
        pText += "\n";
      }
    }

    const trimmed = pText.trim();
    if (trimmed) {
      paragraphs.push(trimmed);
    }
  }

  return paragraphs.join("\n");
}

/**
 * Normalizes line-break hyphenation (e.g. "acces-" + "sibility" -> "accessibility")
 * Preserves legitimate hyphens like "Client-Side", "AI-powered", "real-time", "+91-6305246724"
 */
export function normalizeLineBreakHyphenation(lines: string[]): string[] {
  const normalized: string[] = [];
  let i = 0;

  while (i < lines.length) {
    let currentLine = lines[i];

    if (i + 1 < lines.length) {
      // Line ends with a letter and hyphen (no space before hyphen): e.g. "acces-" or "recogni-"
      const match = currentLine.match(/([a-zA-Z]{2,})-$/);
      const nextLine = lines[i + 1];

      // Next line starts with lowercase letters: e.g. "sibility" or "tion"
      const nextMatch = nextLine.match(/^([a-z]{2,})(\b.*)$/);

      if (match && nextMatch) {
        const prefix = currentLine.slice(0, match.index);
        const dehyphenatedWord = match[1] + nextMatch[1];
        currentLine = prefix + dehyphenatedWord;
        lines[i + 1] = nextMatch[2].trim();
        if (!lines[i + 1]) {
          i++;
        }
      }
    }

    if (currentLine) {
      normalized.push(currentLine);
    }
    i++;
  }

  return normalized;
}

/**
 * Extracts natural line items page-by-page from a PDF document with span joining and dehyphenation
 */
export async function extractPdfLines(file: File | Blob): Promise<{ lines: string[]; pages: NormalizedPage[] }> {
  const pdfjs = await getPdfjs();
  if (!pdfjs) throw new Error("Could not initialize PDF text extraction engine.");

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const rawPageLines: string[] = [];
  const pages: NormalizedPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    interface RawItem {
      str: string;
      x: number;
      y: number;
      width: number;
    }

    const rawItems: RawItem[] = [];
    for (const item of textContent.items) {
      if ("str" in item && typeof item.str === "string" && item.str.length > 0) {
        const transform =
          "transform" in item &&
          item.transform &&
          typeof item.transform.length === "number"
            ? item.transform
            : undefined;
        const width = "width" in item && typeof item.width === "number" ? item.width : 0;
        rawItems.push({
          str: item.str,
          x: transform ? Number(transform[4]) : 0,
          y: transform ? Number(transform[5]) : 0,
          width,
        });
      }
    }

    // Group items into line buckets (4pt tolerance)
    const lineBuckets: { y: number; items: RawItem[] }[] = [];
    for (const item of rawItems) {
      let bucket = lineBuckets.find((b) => Math.abs(b.y - item.y) <= 4);
      if (!bucket) {
        bucket = { y: item.y, items: [] };
        lineBuckets.push(bucket);
      }
      bucket.items.push(item);
    }

    // Sort descending Y (top to bottom), then ascending X (left to right)
    lineBuckets.sort((a, b) => b.y - a.y);
    lineBuckets.forEach((b) => b.items.sort((a, b) => a.x - b.x));

    const currentPageLines: string[] = [];

    for (const b of lineBuckets) {
      let lineText = "";
      for (let i = 0; i < b.items.length; i++) {
        const it = b.items[i];
        if (i === 0) {
          lineText = it.str;
        } else {
          const prev = b.items[i - 1];
          const gap = it.x - (prev.x + prev.width);
          // Only add space if there is a gap > 1.5pt and neither string already has a space
          if (gap > 1.5 && !lineText.endsWith(" ") && !it.str.startsWith(" ")) {
            lineText += " " + it.str;
          } else {
            lineText += it.str;
          }
        }
      }
      lineText = lineText.trim();
      // Skip standalone page number footers (e.g. single digit at bottom)
      if (lineText && !(/^\d+$/.test(lineText) && b.y < 30)) {
        currentPageLines.push(lineText);
      }
    }

    const dehyphenatedPageLines = normalizeLineBreakHyphenation(currentPageLines);
    rawPageLines.push(...dehyphenatedPageLines);

    const pageParagraphs: NormalizedParagraph[] = dehyphenatedPageLines.map((lineText, idx) => ({
      id: `p_${pageNum}_${idx}`,
      page: pageNum,
      text: lineText,
      words: lineText.split(/\s+/).filter(Boolean),
    }));

    pages.push({
      pageNumber: pageNum,
      paragraphs: pageParagraphs,
    });
  }

  const finalLines = normalizeLineBreakHyphenation(rawPageLines);
  return { lines: finalLines, pages };
}

/**
 * Extracts plain text from HTML content
 */
export function extractHtmlText(rawHtml: string): string {
  let cleaned = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<(?:p|div|h[1-6]|li|tr|blockquote)[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return cleaned;
}

/**
 * Standardizes document content into uniform structural units
 */
export async function normalizeDocument(file: File): Promise<NormalizedDocument> {
  const format = await detectDocumentFormat(file, file.name);
  let lines: string[] = [];
  let pages: NormalizedPage[] = [];

  if (format === "docx") {
    const rawDocx = await extractDocxText(file);
    lines = rawDocx
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    pages = [
      {
        pageNumber: 1,
        paragraphs: lines.map((l, i) => ({
          id: `docx_p_${i}`,
          page: 1,
          text: l,
          words: l.split(/\s+/).filter(Boolean),
        })),
      },
    ];
  } else if (format === "pdf") {
    const pdfData = await extractPdfLines(file);
    lines = pdfData.lines;
    pages = pdfData.pages;
  } else if (format === "html") {
    const rawHtml = await file.text();
    const cleaned = extractHtmlText(rawHtml);
    lines = cleaned
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    pages = [
      {
        pageNumber: 1,
        paragraphs: lines.map((l, i) => ({
          id: `html_p_${i}`,
          page: 1,
          text: l,
          words: l.split(/\s+/).filter(Boolean),
        })),
      },
    ];
  } else {
    // Markdown or plain text
    const rawText = await file.text();
    lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    pages = [
      {
        pageNumber: 1,
        paragraphs: lines.map((l, i) => ({
          id: `txt_p_${i}`,
          page: 1,
          text: l,
          words: l.split(/\s+/).filter(Boolean),
        })),
      },
    ];
  }

  const fullText = lines.join("\n");
  const paragraphs = pages.flatMap((p) => p.paragraphs);
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  return {
    filename: file.name,
    format,
    pages,
    paragraphs,
    lines,
    text: fullText,
    wordCount,
  };
}
