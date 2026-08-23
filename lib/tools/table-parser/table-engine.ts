import { ParsedTableData, TableExportFormat } from "./types";

export const MAX_TABLE_FILE_SIZE = 50 * 1024 * 1024; // 50MB

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

export function parseTableFromText(rawText: string): ParsedTableData[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return [];
  }

  // 1. Check for Markdown Pipe Tables (| Header 1 | Header 2 |)
  const pipeLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (pipeLines.length >= 2) {
    const parsedRows: string[][] = [];
    for (const line of pipeLines) {
      if (/^\|[-:\s|]+\|$/.test(line)) {
        // Skip separator line (|---|---|)
        continue;
      }
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      parsedRows.push(cells);
    }

    if (parsedRows.length >= 1) {
      const headers = parsedRows[0];
      const rows = parsedRows.slice(1);
      return [
        {
          headers,
          rows,
          rowCount: rows.length,
          columnCount: headers.length,
          confidenceScore: 0.95,
          detectedDelimiter: "|",
        },
      ];
    }
  }

  // 2. Check for Delimited Lines (CSV / TSV / Semicolon)
  const delimiters = [",", "\t", ";"];
  let bestDelimiter = ",";
  let maxConsistentRows = 0;
  let detectedCols = 0;

  for (const delim of delimiters) {
    let consistentCount = 0;
    let expectedCols = -1;
    for (const line of lines) {
      const cols = line.split(delim).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length > 1) {
        if (expectedCols === -1) {
          expectedCols = cols.length;
          consistentCount++;
        } else if (cols.length === expectedCols) {
          consistentCount++;
        }
      }
    }
    if (consistentCount > maxConsistentRows) {
      maxConsistentRows = consistentCount;
      bestDelimiter = delim;
      detectedCols = expectedCols;
    }
  }

  if (maxConsistentRows >= 2 && detectedCols > 1) {
    const tableRows: string[][] = [];
    for (const line of lines) {
      const cols = line.split(bestDelimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length === detectedCols) {
        tableRows.push(cols);
      }
    }

    if (tableRows.length > 0) {
      const headers = tableRows[0];
      const rows = tableRows.slice(1);
      return [
        {
          headers,
          rows,
          rowCount: rows.length,
          columnCount: headers.length,
          confidenceScore: 0.9,
          detectedDelimiter: bestDelimiter === "\t" ? "Tab (\\t)" : bestDelimiter,
        },
      ];
    }
  }

  // 3. Fallback: Whitespace-aligned Columns (e.g. 2 or more spaces separating fields)
  const spaceRows: string[][] = [];
  for (const line of lines) {
    const parts = line.split(/\s{2,}/).map((p) => p.trim());
    if (parts.length > 1) {
      spaceRows.push(parts);
    }
  }

  if (spaceRows.length >= 2) {
    const maxCols = Math.max(...spaceRows.map((r) => r.length));
    const normalizedRows = spaceRows.map((r) => {
      while (r.length < maxCols) r.push("");
      return r;
    });

    const headers = normalizedRows[0];
    const rows = normalizedRows.slice(1);
    return [
      {
        headers,
        rows,
        rowCount: rows.length,
        columnCount: headers.length,
        confidenceScore: 0.75,
        detectedDelimiter: "Multiple Spaces",
      },
    ];
  }

  // 4. If single column of text, treat as simple 1-column list
  const headers = ["Value"];
  const rows = lines.map((l) => [l]);
  return [
    {
      headers,
      rows,
      rowCount: rows.length,
      columnCount: 1,
      confidenceScore: 0.5,
      detectedDelimiter: "Newline",
    },
  ];
}

export async function extractTextFromDocument(file: File): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const pdfjs = await getPdfjs();
    if (!pdfjs) throw new Error("Could not load PDF extraction engine.");

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageLines: string[] = [];
      let currentLine = "";
      let lastY: number | null = null;

      for (const item of textContent.items) {
        if ("str" in item) {
          const y = item.transform ? item.transform[5] : 0;
          if (lastY !== null && Math.abs(y - lastY) > 5) {
            if (currentLine.trim()) pageLines.push(currentLine.trim());
            currentLine = item.str;
          } else {
            currentLine += (currentLine ? " " : "") + item.str;
          }
          lastY = y;
        }
      }
      if (currentLine.trim()) pageLines.push(currentLine.trim());
      fullText += pageLines.join("\n") + "\n\n";
    }

    return fullText;
  } else {
    // Text / CSV / MD
    return await file.text();
  }
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
    // Excel XML Spreadsheet 2003 schema (Opens natively in Microsoft Excel & LibreOffice Calc with full columns)
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
