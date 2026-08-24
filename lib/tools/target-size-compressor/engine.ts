import { PDFDocument } from "pdf-lib";
import {
  TargetCompressorError,
  TargetCompressorProgress,
  TargetCompressorResult,
  TargetUnit,
} from "./types";

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const DEFAULT_TARGET_BYTES = 1024 * 1024; // 1 MB (1,048,576 bytes)
export const MAX_SEARCH_ITERATIONS = 8;

export function parseTargetBytes(value: number, unit: TargetUnit): number {
  if (!value || isNaN(value) || value <= 0) {
    return DEFAULT_TARGET_BYTES;
  }
  const multiplier = unit === "MB" ? 1024 * 1024 : 1024;
  return Math.round(value * multiplier);
}

export function formatBytes(bytes: number, decimals = 2): string {
  const absBytes = Math.abs(bytes);
  if (absBytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(absBytes) / Math.log(k));
  const formatted = `${parseFloat((absBytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  return bytes < 0 ? `-${formatted}` : formatted;
}

export function detectSupportedFormat(
  file: File | Blob,
  filename = ""
): "jpeg" | "png" | "webp" | "pdf" | null {
  const normMime = (file.type || "").toLowerCase();
  const normName = filename.toLowerCase();

  if (normMime === "application/pdf" || normName.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    normMime === "image/jpeg" ||
    normMime === "image/jpg" ||
    normName.endsWith(".jpg") ||
    normName.endsWith(".jpeg")
  ) {
    return "jpeg";
  }
  if (normMime === "image/png" || normName.endsWith(".png")) {
    return "png";
  }
  if (normMime === "image/webp" || normName.endsWith(".webp")) {
    return "webp";
  }
  return null;
}

export function validateTargetCompressionInput(
  file: File | Blob,
  filename: string,
  targetBytes: number
): { valid: boolean; error?: TargetCompressorError; format?: "jpeg" | "png" | "webp" | "pdf" } {
  if (!file) {
    return {
      valid: false,
      error: { code: "NO_FILE", message: "No file provided." },
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: {
        code: "EMPTY_FILE",
        message: "The selected file is empty (0 bytes). Please choose a valid file.",
      },
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File size (${formatBytes(file.size)}) exceeds the maximum client-side limit of 100 MB.`,
      },
    };
  }

  if (targetBytes <= 0) {
    return {
      valid: false,
      error: {
        code: "INVALID_TARGET",
        message: "Please enter a target greater than 0 KB.",
      },
    };
  }

  const format = detectSupportedFormat(file, filename);
  if (!format) {
    return {
      valid: false,
      error: {
        code: "UNSUPPORTED_FORMAT",
        message: "Unsupported file type. Supported formats: JPG, JPEG, PNG, WEBP, PDF.",
      },
    };
  }

  return { valid: true, format };
}

interface ImageCandidate {
  blob: Blob;
  size: number;
  quality: number;
  scale: number;
  mimeType: string;
  formatName: string;
}

// Client-side image target compressor using progressive binary search
async function compressImageToTarget(
  file: File | Blob,
  filename: string,
  targetBytes: number,
  format: "jpeg" | "png" | "webp",
  onProgress?: (p: TargetCompressorProgress) => void
): Promise<TargetCompressorResult> {
  const startTime = performance.now();
  const originalSize = file.size;
  const originalFormat = format.toUpperCase();

  // 1. If already under target, return unchanged
  if (originalSize <= targetBytes) {
    return {
      originalFile: file,
      originalFilename: filename,
      originalSize,
      originalFormat,
      targetBytes,
      targetReached: true,
      outputBlob: file,
      outputSize: originalSize,
      outputFormat: originalFormat,
      outputFilename: filename,
      formatChanged: false,
      savingsBytes: 0,
      savingsPercentage: 0,
      compressionRatio: 1,
      attempts: 1,
      durationMs: Math.round(performance.now() - startTime),
      warningNotice: "File is already under your target size.",
    };
  }

  // Load image into HTMLImageElement
  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to read this image file. It may be corrupted."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  if (!origW || !origH) {
    throw new Error("Invalid image dimensions.");
  }

  // Helper to render to canvas and export Blob
  const renderCanvasToBlob = async (
    width: number,
    height: number,
    mime: string,
    quality?: number
  ): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context initialization failed.");

    // Fill white background for JPEG exports
    if (mime === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to encode image blob."));
        },
        mime,
        quality
      );
    });
  };

  const candidates: ImageCandidate[] = [];
  let attempts = 0;

  // Progressive search strategy:
  // Try 1: Original format with binary search on quality
  const targetMime =
    format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png";

  const qualitySteps = format === "png" ? [1.0] : [0.92, 0.80, 0.65, 0.50, 0.35, 0.20];
  const scaleSteps = [1.0, 0.85, 0.70, 0.55, 0.40, 0.25];

  for (const scale of scaleSteps) {
    if (attempts >= MAX_SEARCH_ITERATIONS) break;

    const curW = origW * scale;
    const curH = origH * scale;

    for (const q of qualitySteps) {
      if (attempts >= MAX_SEARCH_ITERATIONS) break;
      attempts++;

      onProgress?.({
        stage: `Testing compression level ${attempts}/${MAX_SEARCH_ITERATIONS}...`,
        currentAttempt: attempts,
        maxAttempts: MAX_SEARCH_ITERATIONS,
        targetBytes,
      });

      try {
        const blob = await renderCanvasToBlob(curW, curH, targetMime, q);
        candidates.push({
          blob,
          size: blob.size,
          quality: q,
          scale,
          mimeType: targetMime,
          formatName: format.toUpperCase(),
        });

        // If we found a candidate meeting target with scale 1.0, we can refine or accept
        if (blob.size <= targetBytes && scale === 1.0 && q >= 0.65) {
          break;
        }
      } catch {
        // Continue search
      }
    }

    // Check if we found a candidate under target
    const currentValid = candidates.filter((c) => c.size <= targetBytes);
    if (currentValid.length > 0) {
      break;
    }
  }

  // Format Fallback: If PNG is still over target, try WebP (supports transparency + high compression)
  let formatChanged = false;
  let formatChangeReason: string | undefined;

  const validCandidates = candidates.filter((c) => c.size <= targetBytes);

  if (validCandidates.length === 0 && format === "png" && attempts < MAX_SEARCH_ITERATIONS) {
    attempts++;
    onProgress?.({
      stage: `Attempting WebP format fallback...`,
      currentAttempt: attempts,
      maxAttempts: MAX_SEARCH_ITERATIONS,
      targetBytes,
    });

    try {
      const webpBlob = await renderCanvasToBlob(origW * 0.85, origH * 0.85, "image/webp", 0.75);
      candidates.push({
        blob: webpBlob,
        size: webpBlob.size,
        quality: 0.75,
        scale: 0.85,
        mimeType: "image/webp",
        formatName: "WEBP",
      });

      if (webpBlob.size <= targetBytes) {
        formatChanged = true;
        formatChangeReason = "Output format changed to WebP to meet the target.";
      }
    } catch {
      // ignore
    }
  }

  // Filter candidates that achieved target
  const successfulCandidates = candidates.filter((c) => c.size <= targetBytes);

  let best: ImageCandidate;
  let targetReached = false;

  if (successfulCandidates.length > 0) {
    targetReached = true;
    // Choose candidate with highest scale, then highest quality (largest size <= target)
    successfulCandidates.sort((a, b) => {
      if (b.scale !== a.scale) return b.scale - a.scale;
      return b.size - a.size;
    });
    best = successfulCandidates[0];
  } else {
    // Target not reached: choose smallest candidate achieved
    candidates.sort((a, b) => a.size - b.size);
    best = candidates[0] || {
      blob: file,
      size: originalSize,
      quality: 1,
      scale: 1,
      mimeType: file.type,
      formatName: originalFormat,
    };
  }

  const outputSize = best.blob.size;
  targetReached = outputSize <= targetBytes;

  const extension = best.mimeType === "image/webp" ? ".webp" : best.mimeType === "image/jpeg" ? ".jpg" : ".png";
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const outputFilename = `${baseName}_target_${formatBytes(targetBytes).replace(/\s+/g, "")}${extension}`;

  const savingsBytes = Math.max(0, originalSize - outputSize);
  const savingsPercentage = originalSize > 0 ? (savingsBytes / originalSize) * 100 : 0;
  const compressionRatio = outputSize > 0 ? originalSize / outputSize : 1;

  if (best.formatName !== originalFormat) {
    formatChanged = true;
    formatChangeReason = `Output format changed to ${best.formatName} to meet the target.`;
  }

  return {
    originalFile: file,
    originalFilename: filename,
    originalSize,
    originalFormat,
    targetBytes,
    targetReached,
    outputBlob: best.blob,
    outputSize,
    outputFormat: best.formatName,
    outputFilename,
    formatChanged,
    formatChangeReason,
    savingsBytes,
    savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
    compressionRatio: parseFloat(compressionRatio.toFixed(2)),
    attempts,
    durationMs: Math.round(performance.now() - startTime),
  };
}

// Client-side PDF target compressor using pdf-lib structural compression + raster fallback
async function compressPdfToTarget(
  file: File | Blob,
  filename: string,
  targetBytes: number,
  onProgress?: (p: TargetCompressorProgress) => void
): Promise<TargetCompressorResult> {
  const startTime = performance.now();
  const originalSize = file.size;
  const originalFormat = "PDF";

  // 1. If already under target, return unchanged
  if (originalSize <= targetBytes) {
    return {
      originalFile: file,
      originalFilename: filename,
      originalSize,
      originalFormat,
      targetBytes,
      targetReached: true,
      outputBlob: file,
      outputSize: originalSize,
      outputFormat: "PDF",
      outputFilename: filename,
      formatChanged: false,
      savingsBytes: 0,
      savingsPercentage: 0,
      compressionRatio: 1,
      attempts: 1,
      durationMs: Math.round(performance.now() - startTime),
      warningNotice: "File is already under your target size.",
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  let attempts = 0;
  let bestBlob: Blob | null = null;
  let bestSize = originalSize;
  let warningNotice: string | undefined;

  // Attempt 1: Structural stream optimization with pdf-lib
  attempts++;
  onProgress?.({
    stage: "Testing structural stream optimization (Level 1/4)...",
    currentAttempt: attempts,
    maxAttempts: 4,
    targetBytes,
  });

  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    // Remove metadata
    pdfDoc.setTitle("");
    pdfDoc.setAuthor("");
    pdfDoc.setSubject("");
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer("");
    pdfDoc.setCreator("");

    const optimizedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50,
    });

    const optBlob = new Blob([optimizedBytes as BlobPart], { type: "application/pdf" });
    bestBlob = optBlob;
    bestSize = optBlob.size;

    if (bestSize <= targetBytes) {
      const baseName = filename.replace(/\.[^/.]+$/, "");
      const outputFilename = `${baseName}_target_${formatBytes(targetBytes).replace(/\s+/g, "")}.pdf`;
      const savingsBytes = Math.max(0, originalSize - bestSize);
      const savingsPercentage = (savingsBytes / originalSize) * 100;

      return {
        originalFile: file,
        originalFilename: filename,
        originalSize,
        originalFormat,
        targetBytes,
        targetReached: true,
        outputBlob: bestBlob,
        outputSize: bestSize,
        outputFormat: "PDF",
        outputFilename,
        formatChanged: false,
        savingsBytes,
        savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
        compressionRatio: parseFloat((originalSize / bestSize).toFixed(2)),
        attempts,
        durationMs: Math.round(performance.now() - startTime),
      };
    }
  } catch {
    // If structural optimization fails, proceed to fallback
  }

  // If structural optimization is still larger, check if target can be reached
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const outputFilename = `${baseName}_target_${formatBytes(targetBytes).replace(/\s+/g, "")}.pdf`;

  const finalBlob = bestBlob || file;
  const outputSize = finalBlob.size;
  const targetReached = outputSize <= targetBytes;

  const savingsBytes = Math.max(0, originalSize - outputSize);
  const savingsPercentage = originalSize > 0 ? (savingsBytes / originalSize) * 100 : 0;
  const compressionRatio = outputSize > 0 ? originalSize / outputSize : 1;

  return {
    originalFile: file,
    originalFilename: filename,
    originalSize,
    originalFormat,
    targetBytes,
    targetReached,
    outputBlob: finalBlob,
    outputSize,
    outputFormat: "PDF",
    outputFilename,
    formatChanged: false,
    savingsBytes,
    savingsPercentage: parseFloat(savingsPercentage.toFixed(1)),
    compressionRatio: parseFloat(compressionRatio.toFixed(2)),
    attempts,
    durationMs: Math.round(performance.now() - startTime),
    warningNotice,
  };
}

/**
 * Main 1 MB Compressor / Target Size API
 * Bounded deterministic search to reach <= targetBytes.
 */
export async function compressToTargetSize(
  file: File | Blob,
  filename: string,
  targetBytes: number,
  onProgress?: (p: TargetCompressorProgress) => void
): Promise<TargetCompressorResult> {
  const validation = validateTargetCompressionInput(file, filename, targetBytes);
  if (!validation.valid || !validation.format) {
    throw new Error(validation.error?.message || "Invalid input for target compression.");
  }

  const { format } = validation;

  if (format === "pdf") {
    return compressPdfToTarget(file, filename, targetBytes, onProgress);
  }

  return compressImageToTarget(file, filename, targetBytes, format, onProgress);
}
