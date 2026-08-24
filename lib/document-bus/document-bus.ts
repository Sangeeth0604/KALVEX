import {
  ArtifactKind,
  ArtifactMetadata,
  BusListener,
  CompatibleDestination,
  DocumentArtifact,
} from "./types";

export function resolveArtifactKind(mimeType: string, filename = ""): ArtifactKind {
  const normMime = mimeType.toLowerCase();
  const normName = filename.toLowerCase();

  if (normMime.includes("pdf") || normName.endsWith(".pdf")) {
    return "pdf";
  }
  if (
    normMime.startsWith("image/") ||
    normName.endsWith(".png") ||
    normName.endsWith(".jpg") ||
    normName.endsWith(".jpeg") ||
    normName.endsWith(".webp") ||
    normName.endsWith(".svg")
  ) {
    return "image";
  }
  if (
    normMime.startsWith("text/") ||
    normName.endsWith(".txt") ||
    normName.endsWith(".md") ||
    normName.endsWith(".json")
  ) {
    return "text";
  }
  return "document";
}

export function sanitizeFilename(name: string): string {
  if (!name || typeof name !== "string") return "document";
  // Strip control chars, directory traversal sequences, and leading/trailing whitespace
  const cleaned = name
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[/\\]/g, "_")
    .replace(/\.\.+/g, ".")
    .trim();
  return cleaned.slice(0, 150) || "document";
}

const MAX_BUS_ARTIFACTS = 20;

class DocumentBusManager {
  private artifacts: Map<string, DocumentArtifact> = new Map();
  private listeners: Set<BusListener> = new Set();

  /**
   * Publish a new document artifact into the Document Bus with FIFO memory protection.
   */
  public publishArtifact(params: {
    name?: string;
    filename?: string; // backwards compatibility
    mimeType: string;
    sourceTool: string;
    kind?: ArtifactKind;
    file: File | Blob;
    previewUrl?: string;
    textPayload?: string; // backwards compatibility
    metadata?: ArtifactMetadata;
  }): DocumentArtifact {
    // 1. Enforce FIFO capacity limit (evict oldest artifacts to protect browser RAM)
    if (this.artifacts.size >= MAX_BUS_ARTIFACTS) {
      const keys = Array.from(this.artifacts.keys());
      const toEvictCount = this.artifacts.size - MAX_BUS_ARTIFACTS + 1;
      for (let i = 0; i < toEvictCount; i++) {
        const evictKey = keys[i];
        const oldArt = this.artifacts.get(evictKey);
        if (oldArt?.previewUrl && oldArt.previewUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(oldArt.previewUrl);
          } catch {
            // Ignore revocation failure
          }
        }
        this.artifacts.delete(evictKey);
      }
    }

    const id = `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const rawName = params.name || params.filename || "document";
    const artifactName = sanitizeFilename(rawName);
    const kind = params.kind || resolveArtifactKind(params.mimeType, artifactName);

    const mergedMetadata: ArtifactMetadata = {
      ...params.metadata,
    };

    if (params.textPayload && !mergedMetadata.text) {
      mergedMetadata.text = params.textPayload;
    }

    const artifact: DocumentArtifact = {
      id,
      name: artifactName,
      mimeType: params.mimeType || "application/octet-stream",
      size: params.file.size,
      sourceTool: params.sourceTool.slice(0, 50),
      createdAt: Date.now(),
      kind,
      file: params.file,
      previewUrl: params.previewUrl,
      metadata: mergedMetadata,
    };

    this.artifacts.set(id, artifact);
    this.notifyListeners();
    return artifact;
  }

  /**
   * Backwards compatible alias for publishArtifact.
   */
  public addDocument(params: {
    file: File | Blob;
    filename: string;
    mimeType: string;
    sourceTool: string;
    kind?: ArtifactKind;
    textPayload?: string;
    previewUrl?: string;
    metadata?: ArtifactMetadata;
  }): DocumentArtifact {
    return this.publishArtifact(params);
  }

  /**
   * Retrieve an artifact by its unique ID.
   */
  public getArtifact(id: string): DocumentArtifact | undefined {
    return this.artifacts.get(id);
  }

  /**
   * Backwards compatible alias for getArtifact.
   */
  public getDocument(id: string): DocumentArtifact | undefined {
    return this.getArtifact(id);
  }

  /**
   * Retrieve the most recently published artifact.
   */
  public getLatestArtifact(): DocumentArtifact | undefined {
    const list = Array.from(this.artifacts.values());
    return list[list.length - 1];
  }

  public getLatestDocument(): DocumentArtifact | undefined {
    return this.getLatestArtifact();
  }

  /**
   * List all published artifacts in the current session.
   */
  public listArtifacts(): DocumentArtifact[] {
    return Array.from(this.artifacts.values()).reverse();
  }

  public getDocuments(): DocumentArtifact[] {
    return this.listArtifacts();
  }

  /**
   * Remove an artifact and revoke any allocated object URLs.
   */
  public removeArtifact(id: string): boolean {
    const art = this.artifacts.get(id);
    if (!art) return false;

    if (art.previewUrl && art.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(art.previewUrl);
    }
    const deleted = this.artifacts.delete(id);
    this.notifyListeners();
    return deleted;
  }

  public removeDocument(id: string): void {
    this.removeArtifact(id);
  }

  /**
   * Clear all artifacts from the in-memory session.
   */
  public clearArtifacts(): void {
    this.artifacts.forEach((art) => {
      if (art.previewUrl && art.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(art.previewUrl);
      }
    });
    this.artifacts.clear();
    this.notifyListeners();
  }

  public clearAll(): void {
    this.clearArtifacts();
  }

  public clearDocuments(): void {
    this.clearArtifacts();
  }

  /**
   * Subscribe to Document Bus changes.
   */
  public subscribe(listener: BusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const list = this.listArtifacts();
    this.listeners.forEach((l) => l(list));
  }

  /**
   * Determine compatible KALVEX tools for a given MIME type.
   */
  public getCompatibleDestinations(
    mimeType: string,
    currentToolSlug?: string
  ): CompatibleDestination[] {
    const normalized = mimeType.toLowerCase();
    const destinations: CompatibleDestination[] = [];

    const isImage =
      normalized.includes("png") ||
      normalized.includes("jpeg") ||
      normalized.includes("jpg") ||
      normalized.includes("webp") ||
      normalized.startsWith("image/");

    const isPdf = normalized === "application/pdf" || normalized.includes("pdf");

    if (isImage) {
      if (currentToolSlug !== "format-converter") {
        destinations.push({
          slug: "format-converter",
          name: "Format Converter",
        });
      }
      if (currentToolSlug !== "image-compressor") {
        destinations.push({
          slug: "image-compressor",
          name: "Image Compressor",
        });
      }
      if (currentToolSlug !== "ocr-extractor") {
        destinations.push({
          slug: "ocr-extractor",
          name: "OCR Extractor",
        });
      }
    }

    if (isPdf) {
      if (currentToolSlug !== "pdf-optimizer") {
        destinations.push({
          slug: "pdf-optimizer",
          name: "PDF Optimizer",
        });
      }
      if (currentToolSlug !== "format-converter") {
        destinations.push({
          slug: "format-converter",
          name: "Format Converter",
        });
      }
      if (currentToolSlug !== "ocr-extractor") {
        destinations.push({
          slug: "ocr-extractor",
          name: "OCR Extractor",
        });
      }
      if (currentToolSlug !== "pdf-assembler") {
        destinations.push({
          slug: "pdf-assembler",
          name: "PDF Assembler",
        });
      }
    }

    // AI Workspace is always a valid destination
    if (currentToolSlug !== "ai-workspace") {
      destinations.push({
        slug: "ai-workspace",
        name: "AI Workspace",
      });
    }

    return destinations;
  }
}

// Global in-memory singleton for the current browser session
export const documentBus = new DocumentBusManager();
