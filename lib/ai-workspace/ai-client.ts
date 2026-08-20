import {
  AiOperationError,
  AiOperationRequest,
  AiOperationResult,
} from "./types";

/**
 * Dispatches an AI operation request to the secure server boundary at /api/ai/execute.
 * Never passes API keys to the browser.
 */
export async function executeAiOperation<T = unknown>(
  request: AiOperationRequest,
  signal?: AbortSignal
): Promise<AiOperationResult<T>> {
  if (!request.context || !request.context.extractedText || request.context.extractedText.trim().length === 0) {
    const error: AiOperationError = {
      code: "CONTEXT_UNAVAILABLE",
      message: "No document text available. Please ensure a valid document is loaded and parsed.",
      retryable: false,
    };
    throw error;
  }

  try {
    const res = await fetch("/api/ai/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal,
    });

    if (!res.ok) {
      let errPayload: { error?: AiOperationError } = {};
      try {
        errPayload = await res.json();
      } catch {
        // non-JSON error response
      }

      const error: AiOperationError = errPayload.error || {
        code: res.status === 413 ? "CONTEXT_TOO_LARGE" : "AI_REQUEST_FAILED",
        message: `AI request failed with status ${res.status}: ${res.statusText}`,
        retryable: res.status >= 500,
      };
      throw error;
    }

    const result = (await res.json()) as AiOperationResult<T>;

    if (result.error) {
      throw result.error;
    }

    return result;
  } catch (err: unknown) {
    if ((err as AiOperationError).code) {
      throw err;
    }

    if (err instanceof DOMException && err.name === "AbortError") {
      const abortErr: AiOperationError = {
        code: "PRIVACY_ABORT",
        message: "Operation was cancelled.",
        retryable: true,
      };
      throw abortErr;
    }

    const networkErr: AiOperationError = {
      code: "AI_PROVIDER_UNAVAILABLE",
      message: err instanceof Error ? err.message : "Unable to communicate with AI execution service.",
      retryable: true,
    };
    throw networkErr;
  }
}
