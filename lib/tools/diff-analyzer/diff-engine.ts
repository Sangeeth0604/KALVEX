import { DiffLine, DiffSummary } from "./types";

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

export async function extractDocumentText(file: File): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const pdfjs = await getPdfjs();
    if (!pdfjs) throw new Error("Could not load PDF text extraction engine.");

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
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }

    return fullText.trim();
  }

  // Plain text
  return await file.text();
}

/**
 * Standard Longest Common Subsequence (LCS) line diff algorithm
 */
export function computeDiffLines(linesA: string[], linesB: string[]): DiffLine[] {
  const n = linesA.length;
  const m = linesB.length;

  // Build DP table for LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (linesA[i - 1] === linesB[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  let i = n;
  let j = m;
  const result: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      result.unshift({
        type: "unchanged",
        text: linesA[i - 1],
        lineNumA: i,
        lineNumB: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: "added",
        text: linesB[j - 1],
        lineNumB: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: "removed",
        text: linesA[i - 1],
        lineNumA: i,
      });
      i--;
    }
  }

  return result;
}

export function compareDocumentTexts(
  textA: string,
  textB: string,
  fileA: File,
  fileB: File
): DiffSummary {
  const startTime = performance.now();
  const linesA = textA.split(/\r?\n/);
  const linesB = textB.split(/\r?\n/);

  const diffLines = computeDiffLines(linesA, linesB);

  let additionsCount = 0;
  let deletionsCount = 0;
  let unchangedCount = 0;

  for (const line of diffLines) {
    if (line.type === "added") additionsCount++;
    else if (line.type === "removed") deletionsCount++;
    else unchangedCount++;
  }

  const totalLines = diffLines.length;
  const similarityScore =
    linesA.length + linesB.length > 0
      ? (2 * unchangedCount) / (linesA.length + linesB.length)
      : 1;

  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    fileAName: fileA.name,
    fileBName: fileB.name,
    fileASize: fileA.size,
    fileBSize: fileB.size,
    additionsCount,
    deletionsCount,
    unchangedCount,
    totalLines,
    similarityScore: Math.round(similarityScore * 100) / 100,
    durationMs,
    diffLines,
  };
}

export function generateDiffReportBlob(summary: DiffSummary): Blob {
  const header = `# KALVEX Document Difference Report
**Original (A):** ${summary.fileAName}
**Revised (B):** ${summary.fileBName}
**Similarity Score:** ${(summary.similarityScore * 100).toFixed(1)}%
**Additions (+):** ${summary.additionsCount} lines
**Deletions (-):** ${summary.deletionsCount} lines
**Unchanged:** ${summary.unchangedCount} lines
**Generated:** ${new Date().toISOString()}

---

## Detailed Diff Line Analysis

`;

  const body = summary.diffLines
    .map((line) => {
      if (line.type === "added") return `+ [B:${line.lineNumB || "-"}] ${line.text}`;
      if (line.type === "removed") return `- [A:${line.lineNumA || "-"}] ${line.text}`;
      return `  [A:${line.lineNumA || "-"} | B:${line.lineNumB || "-"}] ${line.text}`;
    })
    .join("\n");

  return new Blob([header + body], { type: "text/markdown" });
}
