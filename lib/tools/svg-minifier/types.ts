export interface SvgMinifySettings {
  precision: number; // e.g. 2
  removeMetadata: boolean;
  removeComments: boolean;
  removeEmptyContainers: boolean;
  collapseWhitespace: boolean;
}

export interface SvgMinifyResult {
  fileName: string;
  originalSize: number;
  minifiedSize: number;
  reductionPercentage: number;
  minifiedSvgText: string;
  outputBlob: Blob;
  durationMs: number;
  busDocumentId?: string;
}
