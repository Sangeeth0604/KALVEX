import {
  CompressionError,
  CompressionOutcome,
  CompressionResult,
  CompressionSettings,
  ImageMetadata,
  OutputFormatOption,
  QualityPreset,
} from "./types";

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_FILE_SIZE_LABEL = "50 MB";

export const SUPPORTED_MIME_TYPES: string[] = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/webp",
];

export const QUALITY_PRESETS: Record<QualityPreset, number> = {
  low: 0.5,
  balanced: 0.75,
  high: 0.9,
  custom: 0.75,
};

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

export interface ImageFormatInfo {
  mimeType: string;
  extension: string;
  label: string;
}

/**
 * Robust format detection: Magic Bytes > File Extension > MIME property
 */
export async function detectImageFormat(file: File | Blob, filename = ""): Promise<ImageFormatInfo> {
  const name = (file instanceof File ? file.name : filename).toLowerCase();

  try {
    const slice = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(slice);

    // JPEG: FF D8 FF
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { mimeType: "image/jpeg", extension: "jpg", label: "JPEG" };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return { mimeType: "image/png", extension: "png", label: "PNG" };
    }

    // WEBP: RIFF .... WEBP
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return { mimeType: "image/webp", extension: "webp", label: "WEBP" };
    }
  } catch {
    // Fallback to name and type properties
  }

  // Extension Check
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return { mimeType: "image/jpeg", extension: "jpg", label: "JPEG" };
  }
  if (name.endsWith(".png")) {
    return { mimeType: "image/png", extension: "png", label: "PNG" };
  }
  if (name.endsWith(".webp")) {
    return { mimeType: "image/webp", extension: "webp", label: "WEBP" };
  }

  // Type Property Check
  const normType = (file.type || "").toLowerCase();
  if (normType.includes("png")) {
    return { mimeType: "image/png", extension: "png", label: "PNG" };
  }
  if (normType.includes("webp")) {
    return { mimeType: "image/webp", extension: "webp", label: "WEBP" };
  }
  if (normType.includes("jpeg") || normType.includes("jpg")) {
    return { mimeType: "image/jpeg", extension: "jpg", label: "JPEG" };
  }

  // Default safe fallback
  return { mimeType: "image/jpeg", extension: "jpg", label: "JPEG" };
}

export function resolveTargetFormat(
  inputFormat: ImageFormatInfo,
  userSelectedOption: OutputFormatOption
): ImageFormatInfo {
  if (userSelectedOption === "image/png") {
    return { mimeType: "image/png", extension: "png", label: "PNG" };
  }
  if (userSelectedOption === "image/webp") {
    return { mimeType: "image/webp", extension: "webp", label: "WEBP" };
  }
  if (userSelectedOption === "image/jpeg") {
    return { mimeType: "image/jpeg", extension: "jpg", label: "JPEG" };
  }
  // Default: strictly preserve detected input format
  return inputFormat;
}

export function validateImageFile(file: File): { valid: boolean; error?: CompressionError } {
  if (!file) {
    return {
      valid: false,
      error: { code: "UNKNOWN", message: "No file provided." },
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: {
        code: "EMPTY_FILE",
        message: "The selected file is empty (0 bytes). Please choose a valid image.",
      },
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File size (${formatBytes(file.size)}) exceeds the maximum client-side limit of ${MAX_FILE_SIZE_LABEL}.`,
      },
    };
  }

  const normalizedType = file.type.toLowerCase();
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  const isSupportedMime = SUPPORTED_MIME_TYPES.includes(normalizedType);
  const isSupportedExt = ["png", "jpg", "jpeg", "webp"].includes(fileExt || "");

  if (!isSupportedMime && !isSupportedExt) {
    return {
      valid: false,
      error: {
        code: "UNSUPPORTED_TYPE",
        message: "This file type isn't supported. Please select PNG, JPG, JPEG, or WEBP.",
      },
    };
  }

  return { valid: true };
}

export async function readImageMetadata(file: File): Promise<ImageMetadata> {
  const objectUrl = URL.createObjectURL(file);
  const formatInfo = await detectImageFormat(file, file.name);

  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && "createImageBitmap" in window) {
      createImageBitmap(file)
        .then((bitmap) => {
          const width = bitmap.width;
          const height = bitmap.height;
          bitmap.close();
          const aspectRatio = calculateAspectRatio(width, height);
          resolve({
            name: file.name,
            size: file.size,
            type: formatInfo.mimeType,
            width,
            height,
            aspectRatio,
            objectUrl,
          });
        })
        .catch(() => {
          fallbackImageLoad(file, formatInfo.mimeType, objectUrl, resolve, reject);
        });
    } else {
      fallbackImageLoad(file, formatInfo.mimeType, objectUrl, resolve, reject);
    }
  });
}

function fallbackImageLoad(
  file: File,
  detectedType: string,
  objectUrl: string,
  resolve: (meta: ImageMetadata) => void,
  reject: (err: CompressionError) => void
) {
  const img = new Image();
  img.onload = () => {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    const aspectRatio = calculateAspectRatio(width, height);
    resolve({
      name: file.name,
      size: file.size,
      type: detectedType,
      width,
      height,
      aspectRatio,
      objectUrl,
    });
  };
  img.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject({
      code: "DECODE_FAILED",
      message: "Could not decode image. The file may be corrupted or unreadable.",
    });
  };
  img.src = objectUrl;
}

function calculateAspectRatio(width: number, height: number): string {
  if (!width || !height) return "1:1";
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  if (w <= 16 && h <= 16) {
    return `${w}:${h}`;
  }
  return `${(width / height).toFixed(2)}:1`;
}

// Backward compatibility alias for resolveOutputMimeType
export function resolveOutputMimeType(
  originalType: string,
  option: OutputFormatOption
): ImageFormatInfo {
  const inputInfo: ImageFormatInfo = originalType.includes("png")
    ? { mimeType: "image/png", extension: "png", label: "PNG" }
    : originalType.includes("webp")
    ? { mimeType: "image/webp", extension: "webp", label: "WEBP" }
    : { mimeType: "image/jpeg", extension: "jpg", label: "JPEG" };

  return resolveTargetFormat(inputInfo, option);
}

/**
 * Validates that generated Blob binary header matches the claimed MIME type
 */
export async function validateBlobMimeHeader(blob: Blob, claimedMime: string): Promise<boolean> {
  try {
    const slice = await blob.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(slice);

    if (claimedMime === "image/jpeg") {
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    }
    if (claimedMime === "image/png") {
      return (
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47
      );
    }
    if (claimedMime === "image/webp") {
      return (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    }
    return true;
  } catch {
    return false;
  }
}

export async function compressImage(
  file: File,
  settings: CompressionSettings,
  metadata: ImageMetadata
): Promise<CompressionResult> {
  const startTime = performance.now();

  // 1. Detect authoritative input format
  const inputFormat = await detectImageFormat(file, metadata.name);

  // 2. Resolve target format (Default: strictly preserve input format)
  const targetFormat = resolveTargetFormat(inputFormat, settings.outputFormat);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      try {
        const width = metadata.width || img.naturalWidth || img.width;
        const height = metadata.height || img.naturalHeight || img.height;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject({
            code: "DECODE_FAILED",
            message: "Unable to create 2D canvas context for compression.",
          });
          return;
        }

        // If target is JPEG, draw white background behind transparent pixels
        if (targetFormat.mimeType === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        // Draw image at native resolution
        ctx.drawImage(img, 0, 0, width, height);

        // Helper to encode canvas at quality
        const encodeCanvas = (quality?: number): Promise<Blob | null> =>
          new Promise((res) => {
            canvas.toBlob((b) => res(b), targetFormat.mimeType, quality);
          });

        let candidateBlob: Blob | null = null;

        if (targetFormat.mimeType === "image/png") {
          // PNG lossless encoding
          candidateBlob = await encodeCanvas();
        } else {
          // JPEG / WEBP Multi-pass quality search
          const requestedQ = Math.max(0.1, Math.min(1.0, settings.quality));
          candidateBlob = await encodeCanvas(requestedQ);

          // If candidate is not smaller, try lower quality steps
          if (candidateBlob && candidateBlob.size >= metadata.size && requestedQ > 0.4) {
            const stepQ1 = Math.max(0.3, requestedQ * 0.8);
            const candidate1 = await encodeCanvas(stepQ1);
            if (candidate1 && candidate1.size < metadata.size) {
              candidateBlob = candidate1;
            } else {
              const stepQ2 = Math.max(0.2, requestedQ * 0.6);
              const candidate2 = await encodeCanvas(stepQ2);
              if (candidate2 && candidate2.size < metadata.size) {
                candidateBlob = candidate2;
              }
            }
          }
        }

        if (!candidateBlob) {
          reject({
            code: "ENCODE_FAILED",
            message: "Browser failed to generate compressed image blob.",
          });
          return;
        }

        // Validate candidate magic bytes match target MIME
        const isValidCandidate = await validateBlobMimeHeader(candidateBlob, targetFormat.mimeType);
        if (!isValidCandidate) {
          reject({
            code: "VALIDATION_FAILED",
            message: `Candidate encoding produced invalid header for ${targetFormat.label}.`,
          });
          return;
        }

        const originalSize = metadata.size;
        const candidateSize = candidateBlob.size;
        const baseName = metadata.name.substring(0, metadata.name.lastIndexOf(".")) || metadata.name;
        const durationMs = Math.max(1, Math.round(performance.now() - startTime));

        // Decision: Absolute No-Bloat Rule
        const wasCompressed = candidateSize < originalSize;
        const retainedOriginal = !wasCompressed;

        let outputBlob: Blob;
        let outputObjectUrl: string;
        let outputFilename: string;
        let outputFormat: string;
        let outputMimeType: string;
        let outputExtension: string;
        let outputSize: number;
        let reductionBytes: number;
        let savingsPercentage: number;
        let outcome: CompressionOutcome;
        let reason: string;

        if (wasCompressed) {
          outcome = "reduced";
          outputBlob = candidateBlob;
          outputObjectUrl = URL.createObjectURL(candidateBlob);
          outputMimeType = targetFormat.mimeType;
          outputExtension = targetFormat.extension;
          outputFormat = targetFormat.label;
          outputFilename = `${baseName}-compressed.${targetFormat.extension}`;
          outputSize = candidateSize;
          reductionBytes = originalSize - candidateSize;
          savingsPercentage = ((originalSize - candidateSize) / originalSize) * 100;
          reason = `Compressed using ${targetFormat.label} optimization (-${savingsPercentage.toFixed(1)}%)`;
        } else {
          outcome = candidateSize === originalSize ? "equal" : "larger";
          outputBlob = file;
          outputObjectUrl = metadata.objectUrl;
          outputMimeType = inputFormat.mimeType;
          outputExtension = inputFormat.extension;
          outputFormat = inputFormat.label;
          outputFilename = file.name;
          outputSize = originalSize;
          reductionBytes = 0;
          savingsPercentage = 0;
          reason = `Original retained — no smaller ${targetFormat.label} encoding was found.`;
        }

        // Strict final validation: outputBlob MUST match outputMimeType
        const isOutputValid = await validateBlobMimeHeader(outputBlob, outputMimeType);
        if (!isOutputValid) {
          reject({
            code: "VALIDATION_FAILED",
            message: `Final output blob does not match expected format ${outputFormat}.`,
          });
          return;
        }

        const resultObj: CompressionResult = {
          outputBlob,
          outputObjectUrl,
          outputFilename,
          outputFormat,
          outputMimeType,
          outputExtension,
          originalSize,
          outputSize,
          reductionBytes,
          savingsPercentage,
          wasCompressed,
          retainedOriginal,
          reason,
          width,
          height,
          durationMs,
          candidateSize,
          candidateMimeType: targetFormat.mimeType,
          candidateFormat: targetFormat.label,

          // Backward compatibility aliases
          blob: candidateBlob,
          objectUrl: outputObjectUrl,
          effectiveBlob: outputBlob,
          effectiveObjectUrl: outputObjectUrl,
          effectiveFileName: outputFilename,
          fileName: outputFilename,
          outcome,
          compressedSize: outputSize,
        };

        resolve(resultObj);
      } catch (err) {
        reject({
          code: "ENCODE_FAILED",
          message: err instanceof Error ? err.message : "Compression error occurred in browser.",
        });
      }
    };

    img.onerror = () => {
      reject({
        code: "DECODE_FAILED",
        message: "Failed to load image into canvas renderer.",
      });
    };

    img.src = metadata.objectUrl;
  });
}
