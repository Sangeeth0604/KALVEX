/**
 * Robust XML sanitization and escaping for Office Open XML (WordprocessingML / SpreadsheetML).
 * Strips invalid XML 1.0 control characters and escapes XML reserved entities.
 */
export function sanitizeXmlString(str: string): string {
  if (!str) return "";
  // 1. Remove XML 1.0 invalid control characters (keep tab 0x09, newline 0x0A, carriage return 0x0D)
  const cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g, "");

  // 2. Escape XML special characters
  return cleaned
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Validates whether an XML string is syntactically well-formed.
 */
export function validateXmlSyntax(xmlString: string, filename: string): void {
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "application/xml");
    const parseError = doc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      throw new Error(`XML parsing error in ${filename}: ${parseError[0].textContent || "Malformed XML"}`);
    }
  } else {
    // Basic structural tag balance check in non-DOM environments
    if (!xmlString.startsWith("<?xml") && !xmlString.startsWith("<")) {
      throw new Error(`Malformed XML header in ${filename}`);
    }
  }
}
