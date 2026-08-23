import JSZip from "jszip";
import { ExtractedDocument, ExtractedTable } from "./types";
import { sanitizeXmlString, validateXmlSyntax } from "./xml-utils";

function colName(n: number): string {
  let s = "";
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s;
    n = Math.floor(n / 26) - 1;
  }
  return s;
}

function buildWorksheetXml(rows: string[][]): string {
  let sheetDataXml = "";
  rows.forEach((row, rIdx) => {
    const rowNum = rIdx + 1;
    let cellsXml = "";
    row.forEach((val, cIdx) => {
      const cellRef = `${colName(cIdx)}${rowNum}`;
      const trimmed = val.trim();
      const numVal = parseFloat(trimmed);
      const isNum = !isNaN(numVal) && isFinite(numVal) && /^-?\d+(\.\d+)?$/.test(trimmed);

      if (isNum) {
        cellsXml += `<c r="${cellRef}"><v>${trimmed}</v></c>`;
      } else {
        cellsXml += `<c r="${cellRef}" t="inlineStr"><is><t>${sanitizeXmlString(trimmed)}</t></is></c>`;
      }
    });
    sheetDataXml += `    <row r="${rowNum}">${cellsXml}</row>\n`;
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
${sheetDataXml}  </sheetData>
</worksheet>`;
}

export async function buildXlsxBlob(docData: ExtractedDocument, title: string): Promise<Blob> {
  const zip = new JSZip();
  const nowIso = new Date().toISOString();

  // Prepare sheets list: Sheet 1 is "Extracted Data" (all rows), followed by each detected table
  const sheets: { name: string; rows: string[][] }[] = [];

  // 1. Master Sheet: Extracted Data
  const masterRows: string[][] = [];
  masterRows.push([title]);
  masterRows.push([]);

  docData.pages.forEach((page) => {
    if (docData.pageCount > 1) {
      masterRows.push([`--- Page ${page.pageNumber} ---`]);
    }
    page.paragraphs.forEach((p) => {
      masterRows.push([p.text]);
    });
    page.tables.forEach((t) => {
      if (t.title) masterRows.push([t.title]);
      masterRows.push(t.headers);
      t.rows.forEach((r) => masterRows.push(r));
      masterRows.push([]);
    });
  });

  sheets.push({ name: "Extracted Data", rows: masterRows });

  // 2. Individual sheets for each detected table
  docData.allTables.forEach((table: ExtractedTable, idx: number) => {
    const tableRows: string[][] = [];
    tableRows.push(table.headers);
    table.rows.forEach((r) => tableRows.push(r));
    const safeSheetName = (table.title || `Table ${idx + 1}`)
      .replace(/[\\/*?:[\]]/g, " ")
      .slice(0, 30);
    sheets.push({ name: safeSheetName, rows: tableRows });
  });

  // 1. [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>\n`;

  sheets.forEach((_, idx) => {
    contentTypesXml += `  <Override PartName="/xl/worksheets/sheet${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
  });
  contentTypesXml += `</Types>`;
  validateXmlSyntax(contentTypesXml, "[Content_Types].xml");
  zip.file("[Content_Types].xml", contentTypesXml);

  // 2. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
  validateXmlSyntax(rootRelsXml, "_rels/.rels");
  zip.file("_rels/.rels", rootRelsXml);

  // 3. docProps/core.xml
  const corePropsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
                   xmlns:dc="http://purl.org/dc/elements/1.1/"
                   xmlns:dcterms="http://purl.org/dc/terms/"
                   xmlns:dcmitype="http://purl.org/dc/dcmitype/"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${sanitizeXmlString(title)}</dc:title>
  <dc:creator>KALVEX Document Platform</dc:creator>
  <cp:lastModifiedBy>KALVEX Document Platform</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>
</cp:coreProperties>`;
  validateXmlSyntax(corePropsXml, "docProps/core.xml");
  zip.file("docProps/core.xml", corePropsXml);

  // 4. docProps/app.xml
  const appPropsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"
            xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>KALVEX Privacy-First Document Platform</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <Company>KALVEX</Company>
</Properties>`;
  validateXmlSyntax(appPropsXml, "docProps/app.xml");
  zip.file("docProps/app.xml", appPropsXml);

  // 5. xl/_rels/workbook.xml.rels
  let wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n`;
  sheets.forEach((_, idx) => {
    wbRelsXml += `  <Relationship Id="rId${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${idx + 1}.xml"/>\n`;
  });
  wbRelsXml += `  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  validateXmlSyntax(wbRelsXml, "xl/_rels/workbook.xml.rels");
  zip.file("xl/_rels/workbook.xml.rels", wbRelsXml);

  // 6. xl/styles.xml
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`;
  validateXmlSyntax(stylesXml, "xl/styles.xml");
  zip.file("xl/styles.xml", stylesXml);

  // 7. xl/workbook.xml
  let sheetsXml = "";
  sheets.forEach((sh, idx) => {
    sheetsXml += `    <sheet name="${sanitizeXmlString(sh.name)}" sheetId="${idx + 1}" r:id="rId${idx + 1}"/>\n`;
  });
  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheetsXml}  </sheets>
</workbook>`;
  validateXmlSyntax(wbXml, "xl/workbook.xml");
  zip.file("xl/workbook.xml", wbXml);

  // 8. xl/worksheets/sheet*.xml
  sheets.forEach((sh, idx) => {
    const sheetXml = buildWorksheetXml(sh.rows);
    validateXmlSyntax(sheetXml, `xl/worksheets/sheet${idx + 1}.xml`);
    zip.file(`xl/worksheets/sheet${idx + 1}.xml`, sheetXml);
  });

  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  // Round-trip verification: Unpack and check files
  const readBackZip = await JSZip.loadAsync(bytes);
  const requiredFiles = [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
    "docProps/core.xml",
    "docProps/app.xml",
    "xl/worksheets/sheet1.xml",
  ];

  for (const reqFile of requiredFiles) {
    const fileEntry = readBackZip.file(reqFile);
    if (!fileEntry) {
      throw new Error(`Round-trip XLSX package verification failed: Missing ${reqFile}`);
    }
    const text = await fileEntry.async("string");
    validateXmlSyntax(text, reqFile);
  }

  return new Blob([new Uint8Array(bytes)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
