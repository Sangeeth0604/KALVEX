import { SvgMinifyResult, SvgMinifySettings } from "./types";

export function minifySvg(
  svgString: string,
  settings: SvgMinifySettings,
  fileName = "image.svg"
): SvgMinifyResult {
  const startTime = performance.now();
  const originalSize = new Blob([svgString]).size;

  let processed = svgString;

  // 1. Remove XML declarations and DOCTYPE if present
  processed = processed.replace(/<\?xml[^>]*\?>/gi, "");
  processed = processed.replace(/<!DOCTYPE[^>]*>/gi, "");

  // 2. Remove comments (<!-- ... -->)
  if (settings.removeComments) {
    processed = processed.replace(/<!--[\s\S]*?-->/g, "");
  }

  // 3. Remove <metadata>, <desc>, and <title> tags
  if (settings.removeMetadata) {
    processed = processed.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
    processed = processed.replace(/<desc[\s\S]*?<\/desc>/gi, "");
    processed = processed.replace(/<title[\s\S]*?<\/title>/gi, "");
    processed = processed.replace(/\s*(sodipodi|inkscape|sketch|adobe):[a-z0-9_-]+="[^"]*"/gi, "");
  }

  // 4. Remove empty <g> groups
  if (settings.removeEmptyContainers) {
    processed = processed.replace(/<g\s*>\s*<\/g>/gi, "");
    processed = processed.replace(/<g\s+id="[^"]*"\s*>\s*<\/g>/gi, "");
  }

  // 5. Minify numeric precision in path data (d="...")
  if (settings.precision >= 0) {
    processed = processed.replace(/d="([^"]+)"/g, (_, pathData) => {
      const minifiedPath = pathData.replace(/-?\d+\.\d+/g, (numStr: string) => {
        const num = parseFloat(numStr);
        return Number(num.toFixed(settings.precision)).toString();
      });
      return `d="${minifiedPath.replace(/\s+/g, " ").trim()}"`;
    });
  }

  // 6. Collapse redundant whitespace
  if (settings.collapseWhitespace) {
    processed = processed
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  const outputBlob = new Blob([processed], { type: "image/svg+xml" });
  const minifiedSize = outputBlob.size;
  const reductionPercentage =
    originalSize > 0 ? Math.max(0, ((originalSize - minifiedSize) / originalSize) * 100) : 0;
  const durationMs = Math.max(1, Math.round(performance.now() - startTime));

  return {
    fileName,
    originalSize,
    minifiedSize,
    reductionPercentage: Math.round(reductionPercentage * 10) / 10,
    minifiedSvgText: processed,
    outputBlob,
    durationMs,
  };
}
