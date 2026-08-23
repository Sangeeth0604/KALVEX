import { PDFDocument, PDFName, rgb } from "pdf-lib";
import { RedactionRule, SanitizerResult, SanitizerSettings } from "./types";

let pdfjsCache: unknown = null;
async function getPdfjs() {
  if (typeof window === "undefined") return null;
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

export const COMMON_PII_RULES: RedactionRule[] = [
  { id: "pii-ssn", type: "pattern_ssn", target: "\\b\\d{3}-\\d{2}-\\d{4}\\b", replacementLabel: "[REDACTED-SSN]" },
  { id: "pii-email", type: "pattern_email", target: "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", replacementLabel: "[REDACTED-EMAIL]" },
  { id: "pii-phone", type: "pattern_phone", target: "\\b(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b", replacementLabel: "[REDACTED-PHONE]" },
];

export async function sanitizeDocument(
  file: File,
  settings: SanitizerSettings
): Promise<SanitizerResult> {
  const startTime = performance.now();
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return await sanitizePdf(file, settings, startTime);
  } else {
    return await sanitizeTextFile(file, settings, startTime);
  }
}

async function sanitizePdf(
  file: File,
  settings: SanitizerSettings,
  startTime: number
): Promise<SanitizerResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const metadataStripped: string[] = [];

  if (settings.stripMetadata) {
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("KALVEX Privacy Sanitizer");
    pdfDoc.setCreator("KALVEX Local-First Suite");
    pdfDoc.setCreationDate(new Date(0));
    pdfDoc.setModificationDate(new Date(0));
    metadataStripped.push("Title", "Author", "Subject", "Keywords", "Creator", "Producer", "Dates");

    // Remove catalog /Metadata entry if present
    try {
      const metadataKey = PDFName.of("Metadata");
      const catalog = pdfDoc.catalog;
      if (catalog.has(metadataKey)) {
        catalog.delete(metadataKey);
        metadataStripped.push("XMP XML Stream");
      }
    } catch {
      // ignore
    }
  }

  let redactedCount = 0;

  // If text keyword rules exist, burn redaction boxes into each page
  if (settings.redactionRules.length > 0) {
    const pdfjs = await getPdfjs();
    if (pdfjs) {
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(arrayBuffer.slice(0)),
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pdfLibPage = pdfDoc.getPage(i - 1);

        for (const item of textContent.items) {
          if ("str" in item && item.str) {
            for (const rule of settings.redactionRules) {
              const regex = new RegExp(rule.target, "gi");
              if (regex.test(item.str)) {
                redactedCount++;
                const x = item.transform[4];
                const y = item.transform[5];
                const w = item.width || 50;
                const h = item.height || 12;

                // Draw permanent solid black opaque rectangle over text location
                pdfLibPage.drawRectangle({
                  x: Math.max(0, x - 2),
                  y: Math.max(0, y - 2),
                  width: w + 4,
                  height: h + 4,
                  color: rgb(0, 0, 0),
                  opacity: 1.0,
                });
              }
            }
          }
        }
      }
    }
  }

  const sanitizedBytes = await pdfDoc.save();
  const outputBlob = new Blob([new Uint8Array(sanitizedBytes)], { type: "application/pdf" });
  const outputName = `${file.name.replace(/\.[^/.]+$/, "")}-sanitized.pdf`;
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    fileName: file.name,
    originalSize: file.size,
    sanitizedSize: outputBlob.size,
    redactedCount,
    metadataFieldsStripped: metadataStripped,
    outputBlob,
    outputName,
    durationMs,
  };
}

async function sanitizeTextFile(
  file: File,
  settings: SanitizerSettings,
  startTime: number
): Promise<SanitizerResult> {
  let content = await file.text();
  let redactedCount = 0;

  for (const rule of settings.redactionRules) {
    const regex = new RegExp(rule.target, "g");
    content = content.replace(regex, () => {
      redactedCount++;
      return rule.replacementLabel || "[REDACTED]";
    });
  }

  const outputBlob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const outputName = `${file.name.replace(/\.[^/.]+$/, "")}-sanitized.txt`;
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    fileName: file.name,
    originalSize: file.size,
    sanitizedSize: outputBlob.size,
    redactedCount,
    metadataFieldsStripped: ["OS metadata"],
    outputBlob,
    outputName,
    durationMs,
  };
}
