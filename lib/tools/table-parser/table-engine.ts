import { ParsedTableData, TableExportFormat } from "./types";

export const MAX_TABLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

const ADDRESS_PATTERNS = [
  /\b(Suite|Ste\.?|Apt\.?|Floor|Fl\.?|Unit|Way|Street|St\.?|Avenue|Ave\.?|Boulevard|Blvd\.?|Road|Rd\.?|Drive|Dr\.?|Lane|Ln\.?|Court|Ct\.?|Highway|Hwy\.?|P\.?O\.?\s*Box)\b/i,
  /\b[A-Z]{2}\s+\d{5}(-\d{4})?\b/, // State + Zip (e.g. CA 94107, NY 10001)
  /\b(San Francisco|New York|Los Angeles|Chicago|Seattle|Boston|Austin|London|Paris|Tokyo|Toronto)\b/i,
  /\bCorporate Blvd\b/i,
  /\bInnovation Way\b/i,
];

const CONTACT_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /\b(tel|phone|fax|email|contact|www\.|https?:)\b/i,
];

const PROSE_PATTERNS = [
  /\b(Thank you for|Payment is due|Terms and conditions|Please note that|All rights reserved|Subject to change)\b/i,
];

const HEADER_KEYWORDS = [
  /\b(ITEM|DESCRIPTION|DESC|QTY|QUANTITY|UNIT PRICE|PRICE|RATE|TOTAL|AMOUNT|SUBTOTAL|TAX|PRODUCT|SERVICE|HOURS|STATUS|ID|NO|CODE|DATE|CATEGORY|BALANCE|FEE|NAME|UNIT|COST|DISCOUNT)\b/i,
];

const NUMERIC_CELL_PATTERN = /^\$?\s*-?\d+([.,]\d{1,4})?\s*(%|USD|EUR|GBP)?$/i;

/**
 * Groups raw PDF text items within a single line into distinct column cells and starting X coordinates
 */
function extractLineColumnsAndXs(
  items: RawPdfItem[],
  columnGapThreshold = 18
): { cells: string[]; colXs: number[] } {
  if (items.length === 0) return { cells: [], colXs: [] };
  const cells: string[] = [];
  const colXs: number[] = [];
  let currentCell = items[0].str;
  let currentX = items[0].x;
  let lastRight = items[0].x + items[0].width;

  for (let i = 1; i < items.length; i++) {
    const it = items[i];
    const gap = it.x - lastRight;
    if (gap >= columnGapThreshold) {
      cells.push(currentCell.trim());
      colXs.push(currentX);
      currentCell = it.str;
      currentX = it.x;
    } else {
      currentCell += " " + it.str;
    }
    lastRight = Math.max(lastRight, it.x + it.width);
  }
  cells.push(currentCell.trim());
  colXs.push(currentX);

  return { cells: cells.filter(Boolean), colXs };
}

/**
 * Evaluates table candidate using positive structural signals and negative anti-table filters
 */
export function evaluateTableCandidate(
  headers: string[],
  rows: string[][]
): { isTable: boolean; confidenceScore: number; reason?: string } {
  if (headers.length < 2 || rows.length < 1) {
    return { isTable: false, confidenceScore: 0.0, reason: "Insufficient columns or rows" };
  }

  const allRows = [headers, ...rows];
  let positiveScore = 0.0;
  let negativeScore = 0.0;

  // 1. Header Analysis
  let headerKeywordMatches = 0;
  headers.forEach((h) => {
    for (const pattern of HEADER_KEYWORDS) {
      if (pattern.test(h.trim())) {
        headerKeywordMatches++;
        break;
      }
    }
  });

  if (headerKeywordMatches >= 2) {
    positiveScore += 0.55;
  } else if (headerKeywordMatches === 1) {
    positiveScore += 0.3;
  }

  // 2. Numeric / Data Columns Analysis in data rows
  let numericColumnsCount = 0;
  for (let c = 0; c < headers.length; c++) {
    let numericCells = 0;
    for (const row of rows) {
      const val = (row[c] || "").trim();
      if (val && NUMERIC_CELL_PATTERN.test(val)) {
        numericCells++;
      }
    }
    if (numericCells / rows.length >= 0.5) {
      numericColumnsCount++;
    }
  }

  if (numericColumnsCount >= 1) {
    positiveScore += 0.35;
  }
  if (numericColumnsCount >= 2) {
    positiveScore += 0.15;
  }

  // 3. Repeating row consistency
  if (rows.length >= 2) {
    positiveScore += 0.2;
  }

  // --- NEGATIVE SIGNALS (Anti-table filters) ---

  // A. Address Block check
  let addressHits = 0;
  for (const r of allRows) {
    for (const cell of r) {
      for (const pat of ADDRESS_PATTERNS) {
        if (pat.test(cell)) {
          addressHits++;
        }
      }
    }
  }

  if (addressHits >= 2) {
    negativeScore += 0.85;
  } else if (addressHits === 1) {
    negativeScore += 0.45;
  }

  // B. Contact Info check
  let contactHits = 0;
  for (const r of allRows) {
    for (const cell of r) {
      for (const pat of CONTACT_PATTERNS) {
        if (pat.test(cell)) {
          contactHits++;
        }
      }
    }
  }
  if (contactHits >= 1) {
    negativeScore += 0.6;
  }

  // C. Key-Value colon pairs check (e.g. "Date: 2026-08-23", "Due Date: Net 30")
  let colonLabelCount = 0;
  for (const r of allRows) {
    if (r[0] && r[0].trim().endsWith(":")) {
      colonLabelCount++;
    }
  }
  if (colonLabelCount / allRows.length >= 0.5) {
    negativeScore += 0.6;
  }

  // D. Prose sentences
  let proseHits = 0;
  for (const r of allRows) {
    for (const cell of r) {
      for (const pat of PROSE_PATTERNS) {
        if (pat.test(cell)) {
          proseHits++;
        }
      }
      if (cell.length > 70 && /[.?!]$/.test(cell.trim())) {
        proseHits++;
      }
    }
  }
  if (proseHits >= 1) {
    negativeScore += 0.6;
  }

  const baseScore = headerKeywordMatches > 0 ? 0.35 : 0.2;
  const finalScore = Math.max(0, Math.min(1, positiveScore - negativeScore + baseScore));
  const isTable = finalScore >= 0.65;

  return {
    isTable,
    confidenceScore: parseFloat(finalScore.toFixed(2)),
  };
}

export function parseTableFromText(rawText: string): ParsedTableData[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const validTables: ParsedTableData[] = [];

  // 1. Check for Markdown Pipe Tables (| Header 1 | Header 2 |)
  const pipeLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (pipeLines.length >= 2) {
    const parsedRows: string[][] = [];
    for (const line of pipeLines) {
      if (/^\|[-:\s|]+\|$/.test(line)) {
        continue;
      }
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      parsedRows.push(cells);
    }

    if (parsedRows.length >= 2) {
      const headers = parsedRows[0];
      const rows = parsedRows.slice(1);
      const evalResult = evaluateTableCandidate(headers, rows);
      if (evalResult.isTable || headers.length >= 2) {
        validTables.push({
          headers,
          rows,
          rowCount: rows.length,
          columnCount: headers.length,
          confidenceScore: Math.max(0.9, evalResult.confidenceScore),
          detectedDelimiter: "|",
        });
      }
    }
  }

  if (validTables.length > 0) {
    return validTables;
  }

  // 2. Check for Delimited Lines (CSV / TSV / Semicolon)
  const delimiters = [",", "\t", ";"];
  for (const delim of delimiters) {
    let expectedCols = -1;
    const matchingRows: string[][] = [];

    for (const line of lines) {
      const cols = line.split(delim).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length > 1) {
        if (expectedCols === -1) {
          expectedCols = cols.length;
          matchingRows.push(cols);
        } else if (cols.length === expectedCols) {
          matchingRows.push(cols);
        }
      }
    }

    if (matchingRows.length >= 2 && expectedCols > 1) {
      const headers = matchingRows[0];
      const rows = matchingRows.slice(1);
      const evalResult = evaluateTableCandidate(headers, rows);
      if (evalResult.isTable) {
        validTables.push({
          headers,
          rows,
          rowCount: rows.length,
          columnCount: headers.length,
          confidenceScore: evalResult.confidenceScore,
          detectedDelimiter: delim === "\t" ? "Tab (\\t)" : delim,
        });
        return validTables;
      }
    }
  }

  // 3. Whitespace-aligned Columns (e.g. 2 or more spaces separating fields)
  const candidateBlocks: string[][][] = [];
  let currentBlock: string[][] = [];

  for (const line of lines) {
    const parts = line.split(/\s{2,}/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      currentBlock.push(parts);
    } else {
      if (currentBlock.length >= 2) {
        candidateBlocks.push(currentBlock);
      }
      currentBlock = [];
    }
  }
  if (currentBlock.length >= 2) {
    candidateBlocks.push(currentBlock);
  }

  for (const block of candidateBlocks) {
    const maxCols = Math.max(...block.map((r) => r.length));
    const normalizedRows = block.map((r) => {
      const copy = [...r];
      while (copy.length < maxCols) copy.push("");
      return copy;
    });

    const headers = normalizedRows[0];
    const rows = normalizedRows.slice(1);
    const evalResult = evaluateTableCandidate(headers, rows);

    if (evalResult.isTable) {
      validTables.push({
        headers,
        rows,
        rowCount: rows.length,
        columnCount: headers.length,
        confidenceScore: evalResult.confidenceScore,
        detectedDelimiter: "Aligned Columns",
      });
    }
  }

  return validTables;
}

interface RawPdfItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

/**
 * Extracts tables from document with coordinate awareness for PDFs and text parsing for other formats
 */
export async function extractTablesFromDocument(
  file: File
): Promise<{ tables: ParsedTableData[]; rawText: string }> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const pdfjs = await getPdfjs();
    if (!pdfjs) throw new Error("Could not initialize PDF extraction engine.");

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const detectedTables: ParsedTableData[] = [];
    const allPageLines: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const rawItems: RawPdfItem[] = [];
      for (const item of textContent.items) {
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

      // Group into line buckets by Y coordinate (tolerance 4pt)
      const lineBuckets: { y: number; items: RawPdfItem[] }[] = [];
      for (const item of rawItems) {
        let bucket = lineBuckets.find((b) => Math.abs(b.y - item.y) <= 4);
        if (!bucket) {
          bucket = { y: item.y, items: [] };
          lineBuckets.push(bucket);
        }
        bucket.items.push(item);
      }

      // Sort descending Y (top to bottom)
      lineBuckets.sort((a, b) => b.y - a.y);
      // Sort ascending X (left to right)
      lineBuckets.forEach((b) => b.items.sort((a, b) => a.x - b.x));

      // Build page text lines
      lineBuckets.forEach((b) => {
        allPageLines.push(b.items.map((it) => it.str).join("  "));
      });

      // Group consecutive multi-column lines into candidate blocks
      let currentBlock: string[][] = [];
      let lastBlockY: number | null = null;
      let lastBlockColXs: number[] = [];

      const flushBlock = () => {
        if (currentBlock.length >= 2) {
          const maxCols = Math.max(...currentBlock.map((r) => r.length));
          if (maxCols >= 2) {
            const normalized = currentBlock.map((r) => {
              const copy = [...r];
              while (copy.length < maxCols) copy.push("");
              return copy;
            });
            const headers = normalized[0];
            const rows = normalized.slice(1);
            const evalResult = evaluateTableCandidate(headers, rows);
            if (evalResult.isTable) {
              detectedTables.push({
                headers,
                rows,
                rowCount: rows.length,
                columnCount: headers.length,
                confidenceScore: evalResult.confidenceScore,
                detectedDelimiter: "PDF Coordinate Grid",
              });
            }
          }
        }
        currentBlock = [];
        lastBlockY = null;
        lastBlockColXs = [];
      };

      for (let i = 0; i < lineBuckets.length; i++) {
        const line = lineBuckets[i];
        const { cells, colXs } = extractLineColumnsAndXs(line.items, 18);

        if (cells.length >= 2) {
          const verticalGap = lastBlockY !== null ? Math.abs(lastBlockY - line.y) : 0;
          const colCountDiff = lastBlockColXs.length > 0 ? Math.abs(lastBlockColXs.length - colXs.length) : 0;
          const isContinuous =
            lastBlockY === null ||
            (verticalGap <= 32 && (colCountDiff === 0 || (colXs.length >= 3 && lastBlockColXs.length >= 3)));

          if (!isContinuous) {
            flushBlock();
          }

          currentBlock.push(cells);
          lastBlockY = line.y;
          lastBlockColXs = colXs;
        } else {
          flushBlock();
        }
      }
      flushBlock();
    }

    const fullRawText = allPageLines.join("\n");

    // If coordinate detection found tables, return them; otherwise fallback to text parser
    if (detectedTables.length > 0) {
      return { tables: detectedTables, rawText: fullRawText };
    }

    const fallbackTables = parseTableFromText(fullRawText);
    return { tables: fallbackTables, rawText: fullRawText };
  } else {
    // Non-PDF (CSV / Markdown / Plain text)
    const rawText = await file.text();
    const tables = parseTableFromText(rawText);
    return { tables, rawText };
  }
}

export async function extractTextFromDocument(file: File): Promise<string> {
  const { rawText } = await extractTablesFromDocument(file);
  return rawText;
}

export function exportTableToBlob(table: ParsedTableData, format: TableExportFormat): Blob {
  if (format === "json") {
    const records = table.rows.map((row) => {
      const obj: Record<string, string> = {};
      table.headers.forEach((h, idx) => {
        obj[h || `Column_${idx + 1}`] = row[idx] || "";
      });
      return obj;
    });
    return new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  }

  if (format === "markdown") {
    const colWidths = table.headers.map((h, i) => {
      const rowMax = Math.max(...table.rows.map((r) => (r[i] || "").length), 0);
      return Math.max(h.length, rowMax, 3);
    });

    const headerLine = "| " + table.headers.map((h, i) => h.padEnd(colWidths[i])).join(" | ") + " |";
    const sepLine = "| " + colWidths.map((w) => "-".repeat(w)).join(" | ") + " |";
    const rowLines = table.rows.map(
      (r) => "| " + table.headers.map((_, i) => (r[i] || "").padEnd(colWidths[i])).join(" | ") + " |"
    );

    const mdContent = [headerLine, sepLine, ...rowLines].join("\n");
    return new Blob([mdContent], { type: "text/markdown" });
  }

  if (format === "tsv") {
    const allRows = [table.headers, ...table.rows];
    const tsvContent = allRows.map((r) => r.join("\t")).join("\n");
    return new Blob([tsvContent], { type: "text/tab-separated-values" });
  }

  if (format === "xlsx") {
    // Excel XML Spreadsheet schema
    const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Sheet1">
  <Table>`;

    const formatRow = (cells: string[]) => {
      const cellTags = cells
        .map(
          (c) =>
            `<Cell><Data ss:Type="String">${c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>`
        )
        .join("");
      return `   <Row>${cellTags}</Row>`;
    };

    const headerXml = formatRow(table.headers);
    const rowsXml = table.rows.map((r) => formatRow(r)).join("\n");
    const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

    const fullXml = `${xmlHeader}\n${headerXml}\n${rowsXml}\n${xmlFooter}`;
    return new Blob([fullXml], { type: "application/vnd.ms-excel" });
  }

  // Default: CSV
  const allRows = [table.headers, ...table.rows];
  const csvContent = allRows
    .map((r) =>
      r
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");

  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
}
