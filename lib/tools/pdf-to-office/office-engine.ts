import { OfficeConversionResult, OfficeConversionSettings } from "./types";
import { parseTableFromText } from "@/lib/tools/table-parser/table-engine";

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

export async function convertPdfToOffice(
  file: File,
  settings: OfficeConversionSettings
): Promise<OfficeConversionResult> {
  const startTime = performance.now();
  const pdfjs = await getPdfjs();
  if (!pdfjs) throw new Error("Could not initialize PDF rendering engine.");

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  const pageTexts: string[] = [];
  let totalWords = 0;

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const lines: string[] = [];
    let currentLine = "";
    let lastY: number | null = null;

    for (const item of textContent.items) {
      if ("str" in item) {
        const y = item.transform ? item.transform[5] : 0;
        if (lastY !== null && Math.abs(y - lastY) > 6) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = item.str;
        } else {
          currentLine += (currentLine ? " " : "") + item.str;
        }
        lastY = y;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    const pageJoined = lines.join("\n");
    pageTexts.push(pageJoined);
    totalWords += pageJoined.split(/\s+/).filter(Boolean).length;
  }

  const fullPdfText = pageTexts.join("\n\n");
  const detectedTables = parseTableFromText(fullPdfText);

  let outputBlob: Blob;
  let outputName: string;
  const baseName = file.name.replace(/\.[^/.]+$/, "");

  if (settings.targetFormat === "docx") {
    // Generate Word Document (OpenXML HTML/DOCX formatted wrapper)
    const docHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${baseName}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; margin: 40pt; }
          h1 { font-size: 18pt; color: #0f172a; font-weight: bold; margin-bottom: 12pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 4pt; }
          h2 { font-size: 14pt; color: #334155; font-weight: bold; margin-top: 16pt; margin-bottom: 8pt; }
          p { margin-bottom: 8pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 12pt; margin-bottom: 16pt; }
          th, td { border: 1pt solid #cbd5e1; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
          th { background-color: #f1f5f9; font-weight: bold; color: #0f172a; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        <h1>${baseName}</h1>
        ${pageTexts
          .map((pText, pIdx) => {
            const paragraphs = pText
              .split(/\n{2,}/)
              .map((p) => `<p>${p.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</p>`)
              .join("");
            const breakTag = pIdx < pageTexts.length - 1 ? '<div class="page-break"></div>' : "";
            return `<div><h2>Page ${pIdx + 1}</h2>${paragraphs}</div>${breakTag}`;
          })
          .join("")}
      </body>
      </html>
    `;

    outputBlob = new Blob([docHtml], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    outputName = `${baseName}.docx`;
  } else {
    // Generate Excel Spreadsheet (SpreadsheetML XML Workbook)
    const xmlHeader = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Extracted Data">
  <Table>`;

    let rowsXml = "";
    if (detectedTables.length > 0) {
      const mainTable = detectedTables[0];
      const headerRow = mainTable.headers
        .map((h) => `<Cell><Data ss:Type="String">${h.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>`)
        .join("");
      rowsXml += `   <Row>${headerRow}</Row>\n`;

      for (const row of mainTable.rows) {
        const cells = row
          .map((c) => `<Cell><Data ss:Type="String">${c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>`)
          .join("");
        rowsXml += `   <Row>${cells}</Row>\n`;
      }
    } else {
      // Line by line
      for (const line of fullPdfText.split("\n")) {
        if (line.trim()) {
          rowsXml += `   <Row><Cell><Data ss:Type="String">${line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell></Row>\n`;
        }
      }
    }

    const xmlFooter = `  </Table>
 </Worksheet>
</Workbook>`;

    outputBlob = new Blob([`${xmlHeader}\n${rowsXml}${xmlFooter}`], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    outputName = `${baseName}.xlsx`;
  }

  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    fileName: file.name,
    originalSize: file.size,
    outputSize: outputBlob.size,
    outputName,
    outputBlob,
    targetFormat: settings.targetFormat,
    pageCount,
    wordCount: totalWords,
    tableCount: detectedTables.length,
    durationMs,
  };
}
