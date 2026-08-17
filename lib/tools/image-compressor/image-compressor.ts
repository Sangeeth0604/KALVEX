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

  return new Promise((resolve, reject) => {
    // Try modern createImageBitmap first
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
            type: file.type || "image/jpeg",
            width,
            height,
            aspectRatio,
            objectUrl,
          });
        })
        .catch(() => {
          // Fallback to HTMLImageElement
          fallbackImageLoad(file, objectUrl, resolve, reject);
        });
    } else {
      fallbackImageLoad(file, objectUrl, resolve, reject);
    }
  });
}

function fallbackImageLoad(
  file: File,
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
      type: file.type || "image/jpeg",
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

export function resolveOutputMimeType(
  originalType: string,
  option: OutputFormatOption
): { mimeType: string; extension: string; label: string } {
  if (option === "image/png") {
    return { mimeType: "image/png", extension: "png", label: "PNG" };
  }
  if (option === "image/webp") {
    return { mimeType: "image/webp", extension: "webp", label: "WEBP" };
  }
  if (option === "image/jpeg") {
    return { mimeType: "image/jpeg", extension: "jpg", label: "JPG" };
  }

  // Original format resolution
  const norm = originalType.toLowerCase();
  if (norm.includes("png")) {
    return { mimeType: "image/png", extension: "png", label: "PNG" };
  }
  if (norm.includes("webp")) {
    return { mimeType: "image/webp", extension: "webp", label: "WEBP" };
  }
  return { mimeType: "image/jpeg", extension: "jpg", label: "JPG" };
}

export async function compressImage(
  file: File,
  settings: CompressionSettings,
  metadata: ImageMetadata
): Promise<CompressionResult> {
  const startTime = performance.now();

  const { mimeType, extension, label } = resolveOutputMimeType(
    metadata.type,
    settings.outputFormat
  );

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
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

        // If converting to JPEG, fill canvas with white background so transparent areas don't render black
        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        // Draw image at native resolution
        ctx.drawImage(img, 0, 0, width, height);

        // Quality setting: only applicable for JPEG and WEBP
        const qualityParam =
          mimeType === "image/png" ? undefined : Math.max(0.05, Math.min(1.0, settings.quality));

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject({
                code: "ENCODE_FAILED",
                message: "Browser failed to generate compressed image blob.",
              });
              return;
            }

            const endTime = performance.now();
            const durationMs = Math.max(1, Math.round(endTime - startTime));
            const originalSize = metadata.size;
            const compressedSize = blob.size;

            // Correct mathematical savings calculation
            const reductionBytes = originalSize - compressedSize;
            const savingsPercentage =
              originalSize > 0 ? (1 - compressedSize / originalSize) * 100 : 0;

            let outcome: CompressionOutcome = "reduced";
            if (compressedSize > originalSize) {
              outcome = "larger";
            } else if (compressedSize === originalSize) {
              outcome = "equal";
            }

            const baseName =
              metadata.name.substring(0, metadata.name.lastIndexOf(".")) || metadata.name;
            const generatedFileName = `${baseName}-compressed.${extension}`;
            const generatedObjectUrl = URL.createObjectURL(blob);

            // Effective output determination:
            // When reduced, effective file is the compressed blob.
            // When equal or larger, effective file is the original file.
            const effectiveBlob = outcome === "reduced" ? blob : file;
            const effectiveObjectUrl =
              outcome === "reduced" ? generatedObjectUrl : metadata.objectUrl;
            const effectiveFileName =
              outcome === "reduced" ? generatedFileName : metadata.name;

            resolve({
              originalSize,
              compressedSize,
              reductionBytes,
              savingsPercentage,
              outcome,
              outputFormat: label,
              outputMimeType: mimeType,
              outputExtension: extension,
              width,
              height,
              blob,
              objectUrl: generatedObjectUrl,
              effectiveBlob,
              effectiveObjectUrl,
              effectiveFileName,
              fileName: generatedFileName,
              durationMs,
            });
          },
          mimeType,
          qualityParam
        );
      } catch {
        reject({
          code: "ENCODE_FAILED",
          message: "An unexpected error occurred during canvas compression.",
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
