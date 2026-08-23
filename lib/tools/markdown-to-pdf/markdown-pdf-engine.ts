import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import { MarkdownPdfResult, MarkdownPdfSettings } from "./types";

interface InlineSpan {
  text: string;
  isBold?: boolean;
  isItalic?: boolean;
  isCode?: boolean;
  isLink?: boolean;
  linkUrl?: string;
  isStrikethrough?: boolean;
}

type BlockElement =
  | { type: "heading"; level: number; text: string; spans: InlineSpan[] }
  | { type: "paragraph"; spans: InlineSpan[] }
  | { type: "list_item"; ordered: boolean; number?: number; indentLevel: number; spans: InlineSpan[] }
  | { type: "blockquote"; spans: InlineSpan[] }
  | { type: "code_block"; language?: string; lines: string[] }
  | { type: "horizontal_rule" }
  | { type: "table"; headers: InlineSpan[][]; rows: InlineSpan[][][]; columnCount: number };

/**
 * Tokenizes markdown inline syntax (**bold**, *italic*, `code`, [link](url), ~~strike~~)
 */
function parseInlineSpans(rawText: string): InlineSpan[] {
  if (!rawText) return [];
  const spans: InlineSpan[] = [];

  // Regex to match inline tokens
  const pattern = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|___[^_]+___|__[^_]+__|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\)|~~[^~]+~~)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      spans.push({ text: rawText.substring(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("***") && token.endsWith("***")) {
      spans.push({ text: token.slice(3, -3), isBold: true, isItalic: true });
    } else if (token.startsWith("___") && token.endsWith("___")) {
      spans.push({ text: token.slice(3, -3), isBold: true, isItalic: true });
    } else if (token.startsWith("**") && token.endsWith("**")) {
      spans.push({ text: token.slice(2, -2), isBold: true });
    } else if (token.startsWith("__") && token.endsWith("__")) {
      spans.push({ text: token.slice(2, -2), isBold: true });
    } else if (token.startsWith("*") && token.endsWith("*")) {
      spans.push({ text: token.slice(1, -1), isItalic: true });
    } else if (token.startsWith("_") && token.endsWith("_")) {
      spans.push({ text: token.slice(1, -1), isItalic: true });
    } else if (token.startsWith("`") && token.endsWith("`")) {
      spans.push({ text: token.slice(1, -1), isCode: true });
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      spans.push({ text: token.slice(2, -2), isStrikethrough: true });
    } else if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        spans.push({ text: linkMatch[1], isLink: true, linkUrl: linkMatch[2] });
      } else {
        spans.push({ text: token });
      }
    } else {
      spans.push({ text: token });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < rawText.length) {
    spans.push({ text: rawText.substring(lastIndex) });
  }

  return spans.length > 0 ? spans : [{ text: rawText }];
}

/**
 * Parses markdown source into high-level AST blocks
 */
function parseMarkdownToBlocks(markdown: string): BlockElement[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: BlockElement[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Fenced Code Block (``` ... ```)
    if (trimmed.startsWith("```")) {
      const lang = trimmed.substring(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: "code_block", language: lang, lines: codeLines });
      continue;
    }

    // 2. Horizontal Rule (---, ***, ___)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "horizontal_rule" });
      i++;
      continue;
    }

    // 3. Headings (# H1, ## H2, ### H3, #### H4)
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      blocks.push({ type: "heading", level, text, spans: parseInlineSpans(text) });
      i++;
      continue;
    }

    // 4. Blockquotes (> ...)
    if (trimmed.startsWith(">")) {
      const quoteText = trimmed.replace(/^>\s*/, "").trim();
      blocks.push({ type: "blockquote", spans: parseInlineSpans(quoteText) });
      i++;
      continue;
    }

    // 5. Pipe Tables (| col1 | col2 |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const parseRow = (line: string) =>
          line
            .slice(1, -1)
            .split("|")
            .map((c) => parseInlineSpans(c.trim()));

        const headerRow = parseRow(tableLines[0]);
        const isDelimiter = (line: string) => /^\|(\s*:?-+:?\s*\|)+$/.test(line);

        let dataStartIndex = 1;
        if (tableLines.length > 1 && isDelimiter(tableLines[1])) {
          dataStartIndex = 2;
        }

        const dataRows = tableLines.slice(dataStartIndex).map(parseRow);
        const colCount = Math.max(headerRow.length, ...dataRows.map((r) => r.length));

        blocks.push({
          type: "table",
          headers: headerRow,
          rows: dataRows,
          columnCount: colCount,
        });
        continue;
      }
    }

    // 6. Unordered List Items (- item, * item, + item)
    const unorderedMatch = /^(\s*)([-*+])\s+(.*)$/.exec(rawLine);
    if (unorderedMatch) {
      const indentSpaces = unorderedMatch[1].length;
      const indentLevel = Math.min(3, Math.floor(indentSpaces / 2));
      const text = unorderedMatch[3].trim();
      blocks.push({
        type: "list_item",
        ordered: false,
        indentLevel,
        spans: parseInlineSpans(text),
      });
      i++;
      continue;
    }

    // 7. Ordered List Items (1. item, 2. item)
    const orderedMatch = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(rawLine);
    if (orderedMatch) {
      const indentSpaces = orderedMatch[1].length;
      const indentLevel = Math.min(3, Math.floor(indentSpaces / 2));
      const num = parseInt(orderedMatch[2], 10);
      const text = orderedMatch[3].trim();
      blocks.push({
        type: "list_item",
        ordered: true,
        number: num,
        indentLevel,
        spans: parseInlineSpans(text),
      });
      i++;
      continue;
    }

    // 8. Paragraph
    blocks.push({ type: "paragraph", spans: parseInlineSpans(trimmed) });
    i++;
  }

  return blocks;
}

/**
 * Normalizes HTML input into Markdown before block parsing
 */
function convertHtmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n")
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "\n> $1\n")
    .replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<hr\s*\/?>/gi, "\n---\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i>(.*?)<\/i>/gi, "*$1*")
    .replace(/<code>(.*?)<\/code>/gi, "`$1`")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "");
}

export async function renderMarkdownOrHtmlToPdf(
  content: string,
  settings: MarkdownPdfSettings
): Promise<MarkdownPdfResult> {
  const startTime = performance.now();
  const pdfDoc = await PDFDocument.create();

  // Load standard fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
  const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

  // Page geometry
  const isLetter = settings.pageSize === "letter";
  const pageWidth = isLetter ? 612 : 595.28;
  const pageHeight = isLetter ? 792 : 841.89;
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  const pages: PDFPage[] = [];
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  pages.push(currentPage);
  let currentY = pageHeight - margin;

  function ensurePageSpace(requiredHeight: number) {
    if (currentY - requiredHeight < margin + 20) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      pages.push(currentPage);
      currentY = pageHeight - margin;
    }
  }

  function getFontForSpan(span: InlineSpan): PDFFont {
    if (span.isCode) return fontMono;
    if (span.isBold && span.isItalic) return fontBoldItalic;
    if (span.isBold) return fontBold;
    if (span.isItalic) return fontItalic;
    return fontRegular;
  }

  // Draw Header Title on Page 1
  if (settings.title) {
    currentPage.drawText(settings.title, {
      x: margin,
      y: currentY - 24,
      size: 20,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.18),
    });
    currentY -= 32;

    currentPage.drawLine({
      start: { x: margin, y: currentY },
      end: { x: pageWidth - margin, y: currentY },
      thickness: 1.5,
      color: rgb(0.05, 0.58, 0.53),
    });
    currentY -= 20;
  }

  // Parse blocks
  const markdownSource = settings.mode === "html" ? convertHtmlToMarkdown(content) : content;
  const blocks = parseMarkdownToBlocks(markdownSource);

  // Draw Inline Text Helper (word wrapping across spans)
  function drawRichSpans(
    spans: InlineSpan[],
    startX: number,
    maxWidth: number,
    baseFontSize = 10,
    lineHeight = 14
  ) {
    // Break spans into word tokens
    interface WordToken {
      text: string;
      font: PDFFont;
      size: number;
      color: ReturnType<typeof rgb>;
      isCode?: boolean;
      isLink?: boolean;
      isStrikethrough?: boolean;
    }

    const words: WordToken[] = [];

    spans.forEach((span) => {
      const font = getFontForSpan(span);
      const size = span.isCode ? baseFontSize - 1 : baseFontSize;
      const color = span.isLink
        ? rgb(0.08, 0.45, 0.8)
        : span.isCode
        ? rgb(0.75, 0.15, 0.3)
        : rgb(0.12, 0.16, 0.22);

      const splitWords = span.text.split(/(\s+)/);
      splitWords.forEach((w) => {
        if (w) {
          words.push({
            text: w,
            font,
            size,
            color,
            isCode: span.isCode,
            isLink: span.isLink,
            isStrikethrough: span.isStrikethrough,
          });
        }
      });
    });

    // Flow words across lines
    let curX = startX;
    let lineTokens: { token: WordToken; x: number; width: number }[] = [];

    const flushLine = () => {
      if (lineTokens.length === 0) return;
      ensurePageSpace(lineHeight);

      lineTokens.forEach(({ token, x, width }) => {
        // Draw Code Chip Background
        if (token.isCode && token.text.trim()) {
          currentPage.drawRectangle({
            x: x - 2,
            y: currentY - 2,
            width: width + 4,
            height: lineHeight - 2,
            color: rgb(0.94, 0.95, 0.97),
          });
        }

        // Draw Text
        try {
          currentPage.drawText(token.text, {
            x,
            y: currentY,
            size: token.size,
            font: token.font,
            color: token.color,
          });
        } catch {
          // Fallback if unusual glyph
          currentPage.drawText(token.text.replace(/[^\x20-\x7E]/g, "?"), {
            x,
            y: currentY,
            size: token.size,
            font: token.font,
            color: token.color,
          });
        }

        // Link underline
        if (token.isLink && token.text.trim()) {
          currentPage.drawLine({
            start: { x, y: currentY - 1 },
            end: { x: x + width, y: currentY - 1 },
            thickness: 0.75,
            color: token.color,
          });
        }

        // Strikethrough
        if (token.isStrikethrough && token.text.trim()) {
          currentPage.drawLine({
            start: { x, y: currentY + token.size * 0.35 },
            end: { x: x + width, y: currentY + token.size * 0.35 },
            thickness: 0.75,
            color: token.color,
          });
        }
      });

      currentY -= lineHeight;
      lineTokens = [];
      curX = startX;
    };

    words.forEach((token) => {
      let wordWidth = 0;
      try {
        wordWidth = token.font.widthOfTextAtSize(token.text, token.size);
      } catch {
        wordWidth = token.size * 0.6 * token.text.length;
      }

      if (curX + wordWidth > startX + maxWidth && lineTokens.length > 0 && token.text.trim()) {
        flushLine();
      }

      lineTokens.push({ token, x: curX, width: wordWidth });
      curX += wordWidth;
    });

    flushLine();
  }

  // Render Blocks
  for (const block of blocks) {
    if (block.type === "horizontal_rule") {
      ensurePageSpace(20);
      currentY -= 8;
      currentPage.drawLine({
        start: { x: margin, y: currentY },
        end: { x: pageWidth - margin, y: currentY },
        thickness: 1,
        color: rgb(0.85, 0.88, 0.92),
      });
      currentY -= 12;
    } else if (block.type === "heading") {
      const fontSize = block.level === 1 ? 16 : block.level === 2 ? 13 : block.level === 3 ? 11 : 10;
      const topMargin = block.level === 1 ? 18 : block.level === 2 ? 14 : 10;
      ensurePageSpace(fontSize + topMargin + 8);
      currentY -= topMargin;

      const headingColor =
        block.level === 1
          ? rgb(0.06, 0.09, 0.14)
          : block.level === 2
          ? rgb(0.1, 0.15, 0.22)
          : rgb(0.15, 0.2, 0.3);

      try {
        currentPage.drawText(block.text, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: fontBold,
          color: headingColor,
        });
      } catch {
        currentPage.drawText(block.text.replace(/[^\x20-\x7E]/g, "?"), {
          x: margin,
          y: currentY,
          size: fontSize,
          font: fontBold,
          color: headingColor,
        });
      }

      currentY -= fontSize + 6;
    } else if (block.type === "list_item") {
      const indent = margin + block.indentLevel * 16;
      const itemWidth = contentWidth - block.indentLevel * 16 - 16;
      ensurePageSpace(16);

      if (block.ordered) {
        const numLabel = `${block.number || 1}.`;
        currentPage.drawText(numLabel, {
          x: indent,
          y: currentY,
          size: 9.5,
          font: fontBold,
          color: rgb(0.05, 0.58, 0.53),
        });
      } else {
        currentPage.drawCircle({
          x: indent + 4,
          y: currentY + 3.5,
          size: 2,
          color: rgb(0.05, 0.58, 0.53),
        });
      }

      drawRichSpans(block.spans, indent + 16, itemWidth, 9.5, 14);
      currentY -= 2;
    } else if (block.type === "blockquote") {
      const quoteHeight = 22;
      ensurePageSpace(quoteHeight);

      currentPage.drawRectangle({
        x: margin,
        y: currentY - 14,
        width: contentWidth,
        height: 20,
        color: rgb(0.96, 0.98, 0.98),
      });

      currentPage.drawLine({
        start: { x: margin, y: currentY - 14 },
        end: { x: margin, y: currentY + 6 },
        thickness: 3,
        color: rgb(0.05, 0.58, 0.53),
      });

      drawRichSpans(block.spans, margin + 12, contentWidth - 24, 9.5, 14);
      currentY -= 4;
    } else if (block.type === "code_block") {
      const codeBlockHeight = block.lines.length * 13 + 16;
      ensurePageSpace(Math.min(codeBlockHeight, 150));

      currentPage.drawRectangle({
        x: margin,
        y: currentY - block.lines.length * 13 - 10,
        width: contentWidth,
        height: block.lines.length * 13 + 14,
        color: rgb(0.95, 0.96, 0.98),
        borderColor: rgb(0.88, 0.9, 0.94),
        borderWidth: 1,
      });

      currentY -= 4;

      block.lines.forEach((line) => {
        ensurePageSpace(13);
        try {
          currentPage.drawText(line || " ", {
            x: margin + 8,
            y: currentY - 8,
            size: 8.5,
            font: fontMono,
            color: rgb(0.1, 0.15, 0.3),
          });
        } catch {
          currentPage.drawText((line || " ").replace(/[^\x20-\x7E]/g, "?"), {
            x: margin + 8,
            y: currentY - 8,
            size: 8.5,
            font: fontMono,
            color: rgb(0.1, 0.15, 0.3),
          });
        }
        currentY -= 13;
      });

      currentY -= 10;
    } else if (block.type === "table") {
      const colW = contentWidth / Math.max(1, block.columnCount);
      const rowHeight = 18;

      // Draw Headers
      ensurePageSpace(rowHeight * (block.rows.length + 1) + 10);

      currentPage.drawRectangle({
        x: margin,
        y: currentY - 14,
        width: contentWidth,
        height: rowHeight,
        color: rgb(0.92, 0.95, 0.97),
      });

      block.headers.forEach((cellSpans, cIdx) => {
        const cellX = margin + cIdx * colW + 4;
        drawRichSpans(cellSpans, cellX, colW - 8, 9, 12);
      });

      currentY -= rowHeight;

      // Draw Rows
      block.rows.forEach((rowCells, rIdx) => {
        ensurePageSpace(rowHeight);
        const bgFill = rIdx % 2 === 1 ? rgb(0.98, 0.99, 1.0) : rgb(1, 1, 1);
        currentPage.drawRectangle({
          x: margin,
          y: currentY - 14,
          width: contentWidth,
          height: rowHeight,
          color: bgFill,
          borderColor: rgb(0.9, 0.92, 0.95),
          borderWidth: 0.5,
        });

        rowCells.forEach((cellSpans, cIdx) => {
          const cellX = margin + cIdx * colW + 4;
          drawRichSpans(cellSpans, cellX, colW - 8, 9, 12);
        });

        currentY -= rowHeight;
      });

      currentY -= 8;
    } else if (block.type === "paragraph") {
      ensurePageSpace(14);
      drawRichSpans(block.spans, margin, contentWidth, 10, 14);
      currentY -= 6;
    }
  }

  // Draw Page Numbers in Footers
  const totalPages = pages.length;
  pages.forEach((pg, idx) => {
    const footerText = `Page ${idx + 1} of ${totalPages}`;
    pg.drawText(footerText, {
      x: pageWidth - margin - 60,
      y: 24,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.55, 0.6),
    });
  });

  const pdfBytes = await pdfDoc.save();
  const outputBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));
  const baseName = (settings.title || "document").replace(/\s+/g, "_").toLowerCase();

  return {
    fileName: `${baseName}.md`,
    outputSize: outputBlob.size,
    outputName: `${baseName}.pdf`,
    outputBlob,
    durationMs,
    pageCount: totalPages,
  };
}
