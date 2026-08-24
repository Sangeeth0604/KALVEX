import { DiffLine, DiffSummary, WordDiffToken } from "./types";
import { normalizeDocument } from "./document-extractor";

export { normalizeDocument, detectDocumentFormat, extractDocxText } from "./document-extractor";

/**
 * Splits text into words while preserving punctuation, emails, URLs, numbers, and symbols
 */
export function tokenizeWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Computes deterministic word-level diff between two lines/phrases using LCS
 */
export function computeWordDiff(textA: string, textB: string): WordDiffToken[] {
  const tokensA = tokenizeWords(textA);
  const tokensB = tokenizeWords(textB);
  const n = tokensA.length;
  const m = tokensB.length;

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (tokensA[i - 1].toLowerCase() === tokensB[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = n;
  let j = m;
  const rawTokens: WordDiffToken[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensA[i - 1].toLowerCase() === tokensB[j - 1].toLowerCase()) {
      rawTokens.unshift({ type: "unchanged", text: tokensB[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawTokens.unshift({ type: "added", text: tokensB[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawTokens.unshift({ type: "removed", text: tokensA[i - 1] });
      i--;
    }
  }

  // Merge adjacent tokens of same type
  return mergeAdjacentTokens(rawTokens);
}

/**
 * Merges contiguous word tokens of the same diff type
 */
export function mergeAdjacentTokens(tokens: WordDiffToken[]): WordDiffToken[] {
  if (tokens.length === 0) return [];
  const merged: WordDiffToken[] = [];
  let current = { ...tokens[0] };

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === current.type) {
      current.text += " " + t.text;
    } else {
      merged.push(current);
      current = { ...t };
    }
  }
  merged.push(current);
  return merged;
}

/**
 * Calculates token similarity between two text lines (0 to 1)
 */
export function calculateLineSimilarity(textA: string, textB: string): number {
  const tokensA = tokenizeWords(textA.toLowerCase());
  const tokensB = tokenizeWords(textB.toLowerCase());
  if (tokensA.length === 0 && tokensB.length === 0) return 1.0;
  if (tokensA.length === 0 || tokensB.length === 0) return 0.0;

  const bagA = new Map<string, number>();
  for (const t of tokensA) bagA.set(t, (bagA.get(t) || 0) + 1);

  let shared = 0;
  for (const t of tokensB) {
    const count = bagA.get(t) || 0;
    if (count > 0) {
      shared++;
      bagA.set(t, count - 1);
    }
  }

  return (2 * shared) / (tokensA.length + tokensB.length);
}

/**
 * Hierarchical line alignment with word-level diffing for modified lines
 */
const SECTION_HEADINGS = new Set([
  "career objective",
  "education",
  "technical skills",
  "skills",
  "internships",
  "experience",
  "projects",
  "certifications",
  "coding profiles",
  "achievements",
  "summary",
  "objective",
]);

function normalizeAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[•·|:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSectionHeading(text: string): boolean {
  const normalized = normalizeAnchor(text);
  return SECTION_HEADINGS.has(normalized);
}

export function isProjectTitle(text: string): boolean {
  const value = text
    .replace(/\s+/g, " ")
    .trim();

  if (!value) return false;

  if (/^[•●▪\-*]/.test(value)) {
    return false;
  }

  if (isSectionHeading(value)) {
    return false;
  }

  // Resume project titles commonly contain a year.
  if (/\b(?:19|20)\d{2}\b/.test(value)) {
    return value.length <= 180;
  }

  return false;
}

export function getSectionForLine(lines: string[], index: number): string {
  let currentSection = "__header__";

  for (let i = 0; i <= index; i++) {
    if (isSectionHeading(lines[i])) {
      currentSection = normalizeAnchor(lines[i]);
    }
  }

  return currentSection;
}

const SECTION_HEADERS = new Set([
  "education",
  "technical skills",
  "internships",
  "projects",
  "certifications",
  "coding profiles",
  "achievements",
]);

function normalizeSectionHeader(line: string): string | null {
  const normalized = line
    .trim()
    .toLowerCase()
    .replace(/[:\-–—]+$/, "")
    .replace(/\s+/g, " ");

  return SECTION_HEADERS.has(normalized) ? normalized : null;
}

function looksLikeProjectHeading(line: string): boolean {
  const text = line.trim();
  if (!text || text.startsWith("•") || text.startsWith("-")) return false;

  return /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/i.test(
    text
  );
}

function buildStructureMap(lines: string[]) {
  let section = "__root__";
  let project = "__none__";

  return lines.map((line) => {
    const sectionHeader = normalizeSectionHeader(line);

    if (sectionHeader) {
      section = sectionHeader;
      project = "__none__";
    }

    if (section === "projects" && looksLikeProjectHeading(line)) {
      project = line
        .replace(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/i, "")
        .trim()
        .toLowerCase();
    }

    return { section, project };
  });
}

export function computeDiffLines(
  linesA: string[],
  linesB: string[]
): DiffLine[] {
  const n = linesA.length;
  const m = linesB.length;

  const structureA = buildStructureMap(linesA);
  const structureB = buildStructureMap(linesB);

  const SIMILARITY_THRESHOLD = 0.35;
  const ALIGNMENT_BONUS = 0.15;
  const GAP_PENALTY = -0.35;

  const dp: number[][] = Array.from(
    { length: n + 1 },
    () => new Array(m + 1).fill(0)
  );

  const action: ("match" | "remove" | "add" | null)[][] = Array.from(
    { length: n + 1 },
    () => new Array(m + 1).fill(null)
  );

  for (let i = 1; i <= n; i++) {
    dp[i][0] = i * GAP_PENALTY;
    action[i][0] = "remove";
  }

  for (let j = 1; j <= m; j++) {
    dp[0][j] = j * GAP_PENALTY;
    action[0][j] = "add";
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sameSection = structureA[i - 1].section === structureB[j - 1].section;
      const projectA = structureA[i - 1].project;
      const projectB = structureB[j - 1].project;
      const sameProject =
        structureA[i - 1].section !== "projects" ||
        projectA === projectB ||
        projectA === "__none__" ||
        projectB === "__none__";

      const sim =
        sameSection && sameProject
          ? calculateLineSimilarity(linesA[i - 1], linesB[j - 1])
          : 0;

      const canAlign = sim >= SIMILARITY_THRESHOLD;

      const diagonal = canAlign
        ? dp[i - 1][j - 1] + sim + ALIGNMENT_BONUS
        : Number.NEGATIVE_INFINITY;

      const remove = dp[i - 1][j] + GAP_PENALTY;
      const add = dp[i][j - 1] + GAP_PENALTY;

      if (diagonal >= remove && diagonal >= add) {
        dp[i][j] = diagonal;
        action[i][j] = "match";
      } else if (remove >= add) {
        dp[i][j] = remove;
        action[i][j] = "remove";
      } else {
        dp[i][j] = add;
        action[i][j] = "add";
      }
    }
  }

  const operations: Array<{
    type: "match" | "remove" | "add";
    a?: number;
    b?: number;
  }> = [];

  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    const currentAction = action[i][j];

    if (
      currentAction === "match" &&
      i > 0 &&
      j > 0
    ) {
      operations.unshift({
        type: "match",
        a: i - 1,
        b: j - 1,
      });

      i--;
      j--;
    } else if (
      currentAction === "remove" &&
      i > 0
    ) {
      operations.unshift({
        type: "remove",
        a: i - 1,
      });

      i--;
    } else {
      operations.unshift({
        type: "add",
        b: j - 1,
      });

      j--;
    }
  }

  const diffLines: DiffLine[] = [];

  for (let k = 0; k < operations.length; k++) {
    const op = operations[k];

    if (op.type === "match") {
      const textA = linesA[op.a!];
      const textB = linesB[op.b!];

      const sameSection = structureA[op.a!].section === structureB[op.b!].section;
      const projectA = structureA[op.a!].project;
      const projectB = structureB[op.b!].project;
      const sameProject =
        structureA[op.a!].section !== "projects" ||
        projectA === projectB ||
        projectA === "__none__" ||
        projectB === "__none__";

      const sim =
        sameSection && sameProject
          ? calculateLineSimilarity(textA, textB)
          : 0;

      if (
        sim >= 0.99 &&
        textA.trim().toLowerCase() === textB.trim().toLowerCase()
      ) {
        diffLines.push({
          type: "unchanged",
          text: textA,
          lineNumA: op.a! + 1,
          lineNumB: op.b! + 1,
        });
      } else {
        diffLines.push({
          type: "modified",
          text: textB,
          textA,
          textB,
          lineNumA: op.a! + 1,
          lineNumB: op.b! + 1,
          wordTokens: computeWordDiff(textA, textB),
        });
      }

      continue;
    }

    if (op.type === "remove") {
      const next = operations[k + 1];

      if (next?.type === "add") {
        const textA = linesA[op.a!];
        const textB = linesB[next.b!];

        const sameSection = structureA[op.a!].section === structureB[next.b!].section;
        const projectA = structureA[op.a!].project;
        const projectB = structureB[next.b!].project;
        const sameProject =
          structureA[op.a!].section !== "projects" ||
          projectA === projectB ||
          projectA === "__none__" ||
          projectB === "__none__";

        const sim =
          sameSection && sameProject
            ? calculateLineSimilarity(textA, textB)
            : 0;

        if (sim >= SIMILARITY_THRESHOLD) {
          diffLines.push({
            type: "modified",
            text: textB,
            textA,
            textB,
            lineNumA: op.a! + 1,
            lineNumB: next.b! + 1,
            wordTokens: computeWordDiff(textA, textB),
          });

          k++;
          continue;
        }
      }

      diffLines.push({
        type: "removed",
        text: linesA[op.a!],
        lineNumA: op.a! + 1,
      });

      continue;
    }

    if (op.type === "add") {
      diffLines.push({
        type: "added",
        text: linesB[op.b!],
        lineNumB: op.b! + 1,
      });
    }
  }

  return diffLines;
}

/**
 * Extracts normalized, human-readable text from PDF, DOCX, Markdown, HTML, or Plain Text
 */
export async function extractDocumentText(file: File): Promise<string> {
  const doc = await normalizeDocument(file);
  return doc.text;
}

/**
 * Compares two extracted document texts and calculates additions, deletions, and similarity
 */
export function compareDocumentTexts(
  textA: string,
  textB: string,
  fileA: File,
  fileB: File,
  formatA = "txt",
  formatB = "txt"
): DiffSummary {
  const startTime = performance.now();
  const linesA = textA.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const linesB = textB.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const diffLines = computeDiffLines(linesA, linesB);

  let additionsCount = 0;
  let deletionsCount = 0;
  let unchangedCount = 0;
  let modifiedCount = 0;

  for (const line of diffLines) {
    if (line.type === "added") {
      additionsCount++;
    } else if (line.type === "removed") {
      deletionsCount++;
    } else if (line.type === "unchanged") {
      unchangedCount++;
    } else if (line.type === "modified") {
      modifiedCount++;
      if (line.wordTokens) {
        for (const wt of line.wordTokens) {
          if (wt.type === "added") additionsCount++;
          if (wt.type === "removed") deletionsCount++;
        }
      } else {
        additionsCount++;
        deletionsCount++;
      }
    }
  }

  // Deterministic token-level similarity
  const tokensA = tokenizeWords(textA.toLowerCase());
  const tokensB = tokenizeWords(textB.toLowerCase());

  const bagA = new Map<string, number>();
  for (const t of tokensA) bagA.set(t, (bagA.get(t) || 0) + 1);

  let sharedTokens = 0;
  for (const t of tokensB) {
    const count = bagA.get(t) || 0;
    if (count > 0) {
      sharedTokens++;
      bagA.set(t, count - 1);
    }
  }

  const tokenSim =
    tokensA.length + tokensB.length > 0
      ? (2 * sharedTokens) / (tokensA.length + tokensB.length)
      : 1.0;

  const similarityScore = Math.round(tokenSim * 1000) / 1000;
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    fileAName: fileA.name,
    fileBName: fileB.name,
    fileASize: fileA.size,
    fileBSize: fileB.size,
    formatA: formatA.toUpperCase(),
    formatB: formatB.toUpperCase(),
    wordCountA: tokensA.length,
    wordCountB: tokensB.length,
    additionsCount,
    deletionsCount,
    unchangedCount,
    modifiedCount,
    totalLines: diffLines.length,
    similarityScore,
    durationMs,
    diffLines,
  };
}

/**
 * High-level comparison of two Document files with automatic normalization
 */
export async function compareDocuments(fileA: File, fileB: File): Promise<DiffSummary> {
  const [docA, docB] = await Promise.all([
    normalizeDocument(fileA),
    normalizeDocument(fileB),
  ]);

  return compareDocumentTexts(docA.text, docB.text, fileA, fileB, docA.format, docB.format);
}

/**
 * Generates a clean Markdown report with extracted textual differences
 */
export function generateDiffReportBlob(summary: DiffSummary): Blob {
  const header = `# KALVEX Document Difference Report

| Metric | Version A (Original) | Version B (Revised) |
| :--- | :--- | :--- |
| **File Name** | ${summary.fileAName} | ${summary.fileBName} |
| **Format** | ${summary.formatA || "Unknown"} | ${summary.formatB || "Unknown"} |
| **File Size** | ${(summary.fileASize / 1024).toFixed(1)} KB | ${(summary.fileBSize / 1024).toFixed(1)} KB |
| **Words** | ${summary.wordCountA ?? "-"} | ${summary.wordCountB ?? "-"} |

**Similarity Score:** ${(summary.similarityScore * 100).toFixed(1)}%
**Additions (+):** ${summary.additionsCount} segments
**Deletions (-):** ${summary.deletionsCount} segments
**Unchanged:** ${summary.unchangedCount} lines
**Modified:** ${summary.modifiedCount || 0} lines
**Generated:** ${new Date().toISOString()}

---

## Detailed Diff Line Analysis

\`\`\`diff
`;

  const body = summary.diffLines
    .map((line) => {
      if (line.type === "added") return `+ [B:${line.lineNumB || "-"}] ${line.text}`;
      if (line.type === "removed") return `- [A:${line.lineNumA || "-"}] ${line.text}`;
      if (line.type === "modified") {
        return `- [A:${line.lineNumA || "-"}] ${line.textA || line.text}\n+ [B:${line.lineNumB || "-"}] ${line.textB || line.text}`;
      }
      return `  [A:${line.lineNumA || "-"} | B:${line.lineNumB || "-"}] ${line.text}`;
    })
    .join("\n");

  const footer = `\n\`\`\`\n`;

  return new Blob([header + body + footer], { type: "text/markdown" });
}
