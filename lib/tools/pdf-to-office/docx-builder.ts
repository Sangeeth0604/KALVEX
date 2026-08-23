import JSZip from "jszip";
import { ExtractedDocument } from "./types";
import { sanitizeXmlString, validateXmlSyntax } from "./xml-utils";

export async function buildDocxBlob(docData: ExtractedDocument, title: string): Promise<Blob> {
  const zip = new JSZip();
  const nowIso = new Date().toISOString();

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
  validateXmlSyntax(contentTypesXml, "[Content_Types].xml");
  zip.file("[Content_Types].xml", contentTypesXml);

  // 2. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
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

  // 5. word/_rels/document.xml.rels
  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  validateXmlSyntax(docRelsXml, "word/_rels/document.xml.rels");
  zip.file("word/_rels/document.xml.rels", docRelsXml);

  // 6. word/styles.xml
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="260" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`;
  validateXmlSyntax(stylesXml, "word/styles.xml");
  zip.file("word/styles.xml", stylesXml);

  // 7. word/document.xml
  let bodyXml = "";

  // Main Title
  bodyXml += `
    <w:p>
      <w:pPr>
        <w:spacing w:before="0" w:after="240"/>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>${sanitizeXmlString(title)}</w:t>
      </w:r>
    </w:p>`;

  docData.pages.forEach((page, pIdx) => {
    // Page Header if multi-page
    if (docData.pageCount > 1) {
      bodyXml += `
        <w:p>
          <w:pPr>
            <w:spacing w:before="240" w:after="120"/>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:b/>
              <w:sz w:val="24"/>
              <w:color w:val="0D9488"/>
            </w:rPr>
            <w:t>Page ${page.pageNumber}</w:t>
          </w:r>
        </w:p>`;
    }

    // Paragraphs
    page.paragraphs.forEach((p) => {
      if (p.type === "heading") {
        bodyXml += `
          <w:p>
            <w:pPr>
              <w:spacing w:before="200" w:after="100"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:sz w:val="26"/>
                <w:color w:val="0F172A"/>
              </w:rPr>
              <w:t>${sanitizeXmlString(p.text)}</w:t>
            </w:r>
          </w:p>`;
      } else {
        bodyXml += `
          <w:p>
            <w:r>
              <w:t>${sanitizeXmlString(p.text)}</w:t>
            </w:r>
          </w:p>`;
      }
    });

    // Tables
    page.tables.forEach((table) => {
      if (table.title) {
        bodyXml += `
          <w:p>
            <w:pPr>
              <w:spacing w:before="200" w:after="80"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:b/>
                <w:sz w:val="24"/>
                <w:color w:val="0F172A"/>
              </w:rPr>
              <w:t>${sanitizeXmlString(table.title)}</w:t>
            </w:r>
          </w:p>`;
      }

      bodyXml += `
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
              <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            </w:tblBorders>
          </w:tblPr>`;

      // Header Row
      bodyXml += `
          <w:tr>
            ${table.headers
              .map(
                (h) => `
            <w:tc>
              <w:tcPr>
                <w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>
                <w:tcMar>
                  <w:top w:w="120" w:type="dxa"/>
                  <w:left w:w="160" w:type="dxa"/>
                  <w:bottom w:w="120" w:type="dxa"/>
                  <w:right w:w="160" w:type="dxa"/>
                </w:tcMar>
              </w:tcPr>
              <w:p>
                <w:pPr><w:spacing w:after="0"/></w:pPr>
                <w:r>
                  <w:rPr><w:b/><w:sz w:val="20"/><w:color w:val="0F172A"/></w:rPr>
                  <w:t>${sanitizeXmlString(h)}</w:t>
                </w:r>
              </w:p>
            </w:tc>`
              )
              .join("")}
          </w:tr>`;

      // Data Rows
      table.rows.forEach((row, rIdx) => {
        const bgFill = rIdx % 2 === 1 ? ' w:fill="F8FAFC"' : ' w:fill="FFFFFF"';
        bodyXml += `
          <w:tr>
            ${row
              .map(
                (c) => `
            <w:tc>
              <w:tcPr>
                <w:shd w:val="clear" w:color="auto"${bgFill}/>
                <w:tcMar>
                  <w:top w:w="100" w:type="dxa"/>
                  <w:left w:w="160" w:type="dxa"/>
                  <w:bottom w:w="100" w:type="dxa"/>
                  <w:right w:w="160" w:type="dxa"/>
                </w:tcMar>
              </w:tcPr>
              <w:p>
                <w:pPr><w:spacing w:after="0"/></w:pPr>
                <w:r>
                  <w:rPr><w:sz w:val="20"/><w:color w:val="1E293B"/></w:rPr>
                  <w:t>${sanitizeXmlString(c)}</w:t>
                </w:r>
              </w:p>
            </w:tc>`
              )
              .join("")}
          </w:tr>`;
      });

      bodyXml += `
        </w:tbl>
        <w:p><w:pPr><w:spacing w:after="160"/></w:pPr></w:p>`;
    });

    // Page Break between pages
    if (pIdx < docData.pages.length - 1) {
      bodyXml += `
        <w:p>
          <w:r>
            <w:br w:type="page"/>
          </w:r>
        </w:p>`;
    }
  });

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  validateXmlSyntax(docXml, "word/document.xml");
  zip.file("word/document.xml", docXml);

  // Generate binary package with DEFLATE compression
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
    "word/document.xml",
    "word/_rels/document.xml.rels",
    "word/styles.xml",
    "docProps/core.xml",
    "docProps/app.xml",
  ];

  for (const reqFile of requiredFiles) {
    const fileEntry = readBackZip.file(reqFile);
    if (!fileEntry) {
      throw new Error(`Round-trip DOCX package verification failed: Missing ${reqFile}`);
    }
    const text = await fileEntry.async("string");
    validateXmlSyntax(text, reqFile);
  }

  return new Blob([new Uint8Array(bytes)], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}
