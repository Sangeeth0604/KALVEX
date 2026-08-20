import { WorkflowCapabilityHandler } from "./types";
import { compressImage, readImageMetadata } from "@/lib/tools/image-compressor/image-compressor";
import { optimizePdf, analyzePdfDocument, DEFAULT_OPTIMIZATION_SETTINGS } from "@/lib/tools/pdf-optimizer/pdf-engine";
import { loadDocumentInfo, runOcrExtraction } from "@/lib/tools/ocr-extractor/ocr-engine";
import { analyzeSourceDocument, convertDocument } from "@/lib/tools/format-converter/format-converter-engine";
import { buildDocumentContext } from "@/lib/ai-workspace/context-builder";
import { executeAiOperation } from "@/lib/ai-workspace/ai-client";
import { AiOperationType } from "@/lib/ai-workspace/types";
import { ImageOutputFormat } from "@/lib/tools/format-converter/types";

class CapabilityRegistry {
  private handlers: Map<string, WorkflowCapabilityHandler> = new Map();

  constructor() {
    this.registerBuiltInCapabilities();
  }

  public register(handler: WorkflowCapabilityHandler): void {
    this.handlers.set(handler.capabilityId, handler);
  }

  public get(capabilityId: string): WorkflowCapabilityHandler | undefined {
    return this.handlers.get(capabilityId);
  }

  public list(): WorkflowCapabilityHandler[] {
    return Array.from(this.handlers.values());
  }

  private registerBuiltInCapabilities(): void {
    // 1. Lossless Image Compressor
    this.register({
      capabilityId: "tool:image-compressor",
      title: "Lossless Image Compressor",
      description: "Compresses raster images directly in browser memory.",
      sourceTool: "image-compressor",
      acceptedInputKinds: ["image"],
      outputKind: "image",
      execute: async (artifact, params, onProgress) => {
        onProgress?.({ stage: "Compressing image..." });
        const fileObj =
          artifact.file instanceof File
            ? artifact.file
            : new File([artifact.file], artifact.name, { type: artifact.mimeType });

        const metadata = await readImageMetadata(fileObj);
        const quality = typeof params?.quality === "number" ? params.quality / 100 : 0.85;

        const result = await compressImage(
          fileObj,
          {
            outputFormat: "original",
            quality,
            qualityPreset: "custom",
          },
          metadata
        );

        return {
          file: result.effectiveBlob,
          name: result.effectiveFileName,
          mimeType: result.outputMimeType,
          kind: "image",
          metadata: {
            savingsPercentage: result.savingsPercentage,
            reductionBytes: result.reductionBytes,
            durationMs: result.durationMs,
          },
        };
      },
    });

    // 2. Format Converter (Raster Image Transcoding)
    this.register({
      capabilityId: "tool:format-converter-image",
      title: "Image Format Transcoder",
      description: "Converts images between PNG, JPG, and WEBP.",
      sourceTool: "format-converter",
      acceptedInputKinds: ["image"],
      outputKind: "image",
      execute: async (artifact, params, onProgress) => {
        const targetFormatStr = (params?.targetFormat as string) || "image/webp";
        const targetFormat: ImageOutputFormat =
          targetFormatStr === "PNG" || targetFormatStr === "image/png"
            ? "image/png"
            : targetFormatStr === "JPG" || targetFormatStr === "image/jpeg"
            ? "image/jpeg"
            : "image/webp";

        onProgress?.({ stage: `Transcoding image to ${targetFormat}...` });
        const fileObj =
          artifact.file instanceof File
            ? artifact.file
            : new File([artifact.file], artifact.name, { type: artifact.mimeType });

        const sourceInfo = await analyzeSourceDocument(fileObj, artifact.name);
        const result = await convertDocument(sourceInfo, {
          targetFormat,
          quality: 0.9,
          pageSelection: "all",
          pageRangeStart: 1,
          pageRangeEnd: 1,
        });

        const firstPage = result.pages[0];
        if (!firstPage) {
          throw new Error("Image conversion produced zero output pages.");
        }

        return {
          file: firstPage.blob,
          name: firstPage.fileName,
          mimeType: firstPage.mimeType,
          kind: "image",
          metadata: {
            durationMs: result.durationMs,
            targetFormat,
          },
        };
      },
    });

    // 3. Format Converter (PDF Pages to Images)
    this.register({
      capabilityId: "tool:format-converter-pdf-images",
      title: "PDF Page Image Renderer",
      description: "Renders PDF document pages into high-resolution images.",
      sourceTool: "format-converter",
      acceptedInputKinds: ["pdf"],
      outputKind: "image",
      execute: async (artifact, params, onProgress) => {
        onProgress?.({ stage: "Rendering PDF pages into images..." });
        const fileObj =
          artifact.file instanceof File
            ? artifact.file
            : new File([artifact.file], artifact.name, { type: "application/pdf" });

        const targetFormatStr = (params?.targetFormat as string) || "image/png";
        const targetFormat: ImageOutputFormat =
          targetFormatStr === "JPG" || targetFormatStr === "image/jpeg" ? "image/jpeg" : "image/png";

        const sourceInfo = await analyzeSourceDocument(fileObj, artifact.name);
        const result = await convertDocument(sourceInfo, {
          targetFormat,
          quality: 0.9,
          pageSelection: "all",
          pageRangeStart: 1,
          pageRangeEnd: sourceInfo.pageCount,
        });

        if (!result.pages || result.pages.length === 0) {
          throw new Error("PDF page rendering produced zero image output.");
        }

        const firstPage = result.pages[0];
        return {
          file: firstPage.blob,
          name: firstPage.fileName,
          mimeType: firstPage.mimeType,
          kind: "image",
          metadata: {
            totalPagesRendered: result.pages.length,
            durationMs: result.durationMs,
          },
        };
      },
    });

    // 4. PDF Stream & Structure Optimizer
    this.register({
      capabilityId: "tool:pdf-optimizer",
      title: "PDF Stream Optimizer",
      description: "Structural stream deduplication and lossless PDF compression.",
      sourceTool: "pdf-optimizer",
      acceptedInputKinds: ["pdf"],
      outputKind: "pdf",
      execute: async (artifact, _params, onProgress) => {
        onProgress?.({ stage: "Analyzing and optimizing PDF streams..." });
        const fileObj =
          artifact.file instanceof File
            ? artifact.file
            : new File([artifact.file], artifact.name, { type: "application/pdf" });

        await analyzePdfDocument(fileObj);
        const result = await optimizePdf(fileObj, DEFAULT_OPTIMIZATION_SETTINGS);

        return {
          file: result.effectiveBlob,
          name: result.effectiveFileName,
          mimeType: "application/pdf",
          kind: "pdf",
          metadata: {
            savingsPercentage: result.savingsPercentage,
            reductionBytes: result.reductionBytes,
            durationMs: result.durationMs,
            pageCount: result.pageCount,
          },
        };
      },
    });

    // 5. Private WASM OCR Extractor
    this.register({
      capabilityId: "tool:ocr-extractor",
      title: "Local WASM OCR Extractor",
      description: "Extracts machine-readable text from scanned PDFs and images in browser RAM.",
      sourceTool: "ocr-extractor",
      acceptedInputKinds: ["image", "pdf"],
      outputKind: "text",
      execute: async (artifact, _params, onProgress) => {
        onProgress?.({ stage: "Initializing Tesseract WASM..." });
        const fileObj =
          artifact.file instanceof File
            ? artifact.file
            : new File([artifact.file], artifact.name, { type: artifact.mimeType });

        const docInfo = await loadDocumentInfo(fileObj);
        const result = await runOcrExtraction(docInfo, (progress) => {
          onProgress?.({
            stage: `WASM OCR (${progress.stage})`,
            percent: Math.round(progress.progress * 100),
          });
        });

        const textBlob = new Blob([result.fullText], { type: "text/plain" });
        return {
          file: textBlob,
          name: `${artifact.name.replace(/\.[^/.]+$/, "")}-extracted.txt`,
          mimeType: "text/plain",
          kind: "text",
          metadata: {
            text: result.fullText,
            wordCount: result.totalWords,
            pageCount: result.totalPages,
            durationMs: result.durationMs,
          },
        };
      },
    });

    // 6. AI Workspace: Summarize
    this.registerAiCapability("summarize", "AI Document Summarization", "Generates high-density executive summary and action items.");

    // 7. AI Workspace: Extract Key Information
    this.registerAiCapability("extract_key_info", "AI Key Information Extraction", "Extracts parties, dates, financials, and core obligations.");

    // 8. AI Workspace: Explain Simply
    this.registerAiCapability("explain_simply", "AI Plain-English Explainer", "Demystifies technical/legal jargon into plain English.");

    // 9. AI Workspace: Targeted Q&A
    this.registerAiCapability("targeted_qa", "AI Grounded Q&A", "Answers specific inquiries with verbatim clause citations.");
  }

  private registerAiCapability(
    operation: AiOperationType,
    title: string,
    description: string
  ): void {
    this.register({
      capabilityId: `ai:${operation}`,
      title,
      description,
      sourceTool: "ai-workspace",
      acceptedInputKinds: ["pdf", "image", "text", "document"],
      outputKind: "text",
      execute: async (artifact, params, onProgress) => {
        onProgress?.({ stage: "Preparing in-browser document context..." });
        const context = await buildDocumentContext(
          artifact.file,
          artifact.name,
          artifact.mimeType,
          artifact.id,
          artifact.metadata?.text as string | undefined,
          (status) => onProgress?.({ stage: status })
        );

        onProgress?.({ stage: "Transmitting context to AI reasoning service..." });
        const result = await executeAiOperation({
          operation,
          context,
          options: {
            detailLevel: params?.detailLevel as "brief" | "standard" | "detailed" | undefined,
            customQuery: params?.customQuery as string | undefined,
            focusArea: params?.focusArea as string | undefined,
          },
        });

        const jsonString = JSON.stringify(result.structuredData, null, 2);
        const resultBlob = new Blob([jsonString], { type: "application/json" });

        return {
          file: resultBlob,
          name: `${artifact.name.replace(/\.[^/.]+$/, "")}-${operation}-result.json`,
          mimeType: "application/json",
          kind: "text",
          metadata: {
            operation,
            structuredData: result.structuredData,
            markdownContent: result.markdownContent,
            citations: result.citations,
            durationMs: result.metrics.durationMs,
            providerName: result.metrics.providerName,
            isSimulated: result.metrics.isSimulated,
          },
        };
      },
    });
  }
}

export const capabilityRegistry = new CapabilityRegistry();
export const registerWorkflowCapability = (handler: WorkflowCapabilityHandler) =>
  capabilityRegistry.register(handler);
export const getWorkflowCapability = (id: string) => capabilityRegistry.get(id);
export const listWorkflowCapabilities = () => capabilityRegistry.list();
