import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { MarkdownPdfResult, MarkdownPdfSettings } from "./types";

export async function renderMarkdownOrHtmlToPdf(
  content: string,
  settings: MarkdownPdfSettings
): Promise<MarkdownPdfResult> {
  const startTime = performance.now();
  const pdfDoc = await PDFDocument.create();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  // Page dimensions (A4 = 595.28 x 841.89, Letter = 612 x 792)
  const isLetter = settings.pageSize === "letter";
  const pageWidth = isLetter ? 612 : 595.28;
  const pageHeight = isLetter ? 792 : 841.89;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  function checkPageBreak(requiredHeight: number) {
    if (currentY - requiredHeight < margin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = pageHeight - margin;
    }
  }

  // Draw Document Header / Title
  if (settings.title) {
    currentPage.drawText(settings.title, {
      x: margin,
      y: currentY - 24,
      size: 20,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.18),
    });
    currentY -= 36;

    currentPage.drawLine({
      start: { x: margin, y: currentY },
      end: { x: pageWidth - margin, y: currentY },
      thickness: 1,
      color: rgb(0.8, 0.84, 0.88),
    });
    currentY -= 20;
  }

  // Normalize HTML to simple text if mode is HTML
  let processedText = content;
  if (settings.mode === "html") {
    processedText = content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n")
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n")
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "");
  }

  const lines = processedText.split(/\r?\n/);

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      currentY -= 8;
      continue;
    }

    // Heading 1 (# ...)
    if (trimmed.startsWith("# ")) {
      checkPageBreak(36);
      currentY -= 12;
      const text = trimmed.substring(2).trim();
      currentPage.drawText(text, {
        x: margin,
        y: currentY,
        size: 16,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.22),
      });
      currentY -= 22;
      continue;
    }

    // Heading 2 (## ...)
    if (trimmed.startsWith("## ")) {
      checkPageBreak(30);
      currentY -= 8;
      const text = trimmed.substring(3).trim();
      currentPage.drawText(text, {
        x: margin,
        y: currentY,
        size: 13,
        font: fontBold,
        color: rgb(0.15, 0.2, 0.28),
      });
      currentY -= 18;
      continue;
    }

    // Heading 3 (### ...)
    if (trimmed.startsWith("### ")) {
      checkPageBreak(24);
      const text = trimmed.substring(4).trim();
      currentPage.drawText(text, {
        x: margin,
        y: currentY,
        size: 11,
        font: fontBold,
        color: rgb(0.2, 0.25, 0.35),
      });
      currentY -= 16;
      continue;
    }

    // Bullet List (- ... or * ...)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      checkPageBreak(16);
      const text = trimmed.substring(2).trim();
      currentPage.drawCircle({
        x: margin + 4,
        y: currentY + 3,
        size: 2,
        color: rgb(0.1, 0.5, 0.4),
      });
      currentPage.drawText(text, {
        x: margin + 14,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
      currentY -= 14;
      continue;
    }

    // Code block line / Mono
    if (rawLine.startsWith("    ") || rawLine.startsWith("\t") || trimmed.startsWith("`")) {
      checkPageBreak(16);
      const cleanCode = trimmed.replace(/`/g, "");
      currentPage.drawRectangle({
        x: margin,
        y: currentY - 2,
        width: contentWidth,
        height: 14,
        color: rgb(0.96, 0.97, 0.98),
      });
      currentPage.drawText(cleanCode, {
        x: margin + 6,
        y: currentY,
        size: 9,
        font: fontMono,
        color: rgb(0.1, 0.2, 0.4),
      });
      currentY -= 15;
      continue;
    }

    // Standard Paragraph text with word wrapping
    const words = trimmed.split(/\s+/);
    let lineBuffer = "";

    for (const word of words) {
      const testLine = lineBuffer ? `${lineBuffer} ${word}` : word;
      const testWidth = fontRegular.widthOfTextAtSize(testLine, 10);

      if (testWidth > contentWidth && lineBuffer) {
        checkPageBreak(14);
        currentPage.drawText(lineBuffer, {
          x: margin,
          y: currentY,
          size: 10,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
        currentY -= 14;
        lineBuffer = word;
      } else {
        lineBuffer = testLine;
      }
    }

    if (lineBuffer) {
      checkPageBreak(14);
      currentPage.drawText(lineBuffer, {
        x: margin,
        y: currentY,
        size: 10,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
      currentY -= 14;
    }
  }

  const pdfBytes = await pdfDoc.save();
  const outputBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const outputName = `${(settings.title || "document").toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    fileName: `${settings.title || "document"}.${settings.mode === "markdown" ? "md" : "html"}`,
    outputSize: outputBlob.size,
    outputName,
    outputBlob,
    pageCount: pdfDoc.getPageCount(),
    durationMs,
  };
}
