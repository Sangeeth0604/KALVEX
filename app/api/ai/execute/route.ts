import { NextRequest, NextResponse } from "next/server";
import {
  AiOperationRequest,
  AiOperationResult,
  AiOperationType,
  SummaryResult,
  ExtractedDataResult,
  ExplanationResult,
  AnswerResult,
  OperationCitation,
} from "@/lib/ai-workspace/types";
import { OPERATION_REGISTRY } from "@/lib/ai-workspace/operation-registry";

export const dynamic = "force-dynamic";

// Validate structured response schema defensibly before UI presentation
function validateOperationResponse(
  operation: AiOperationType,
  data: unknown
): { isValid: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { isValid: false, error: "Response payload is not a JSON object." };
  }

  const obj = data as Record<string, unknown>;

  if (operation === "summarize") {
    if (typeof obj.title !== "string" || !obj.title.trim()) {
      return { isValid: false, error: "Missing or invalid title string." };
    }
    if (typeof obj.executiveSummary !== "string" || !obj.executiveSummary.trim()) {
      return { isValid: false, error: "Missing or invalid executiveSummary string." };
    }
    if (!Array.isArray(obj.keyTakeaways) || obj.keyTakeaways.length === 0) {
      return { isValid: false, error: "Missing or empty keyTakeaways array." };
    }
    if (!Array.isArray(obj.actionItems)) {
      return { isValid: false, error: "Missing actionItems array." };
    }
    return { isValid: true };
  }

  if (operation === "extract_key_info") {
    if (typeof obj.documentType !== "string") {
      return { isValid: false, error: "Missing or invalid documentType string." };
    }
    if (!Array.isArray(obj.parties)) {
      return { isValid: false, error: "Missing parties array." };
    }
    if (!Array.isArray(obj.keyDates)) {
      return { isValid: false, error: "Missing keyDates array." };
    }
    if (!Array.isArray(obj.financials)) {
      return { isValid: false, error: "Missing financials array." };
    }
    if (!Array.isArray(obj.coreObligations)) {
      return { isValid: false, error: "Missing coreObligations array." };
    }
    return { isValid: true };
  }

  if (operation === "explain_simply") {
    if (typeof obj.simplifiedOverview !== "string" || !obj.simplifiedOverview.trim()) {
      return { isValid: false, error: "Missing or invalid simplifiedOverview string." };
    }
    if (!Array.isArray(obj.coreConcepts) || obj.coreConcepts.length === 0) {
      return { isValid: false, error: "Missing coreConcepts array." };
    }
    if (!Array.isArray(obj.practicalImplications)) {
      return { isValid: false, error: "Missing practicalImplications array." };
    }
    if (!Array.isArray(obj.hiddenCaveats)) {
      return { isValid: false, error: "Missing hiddenCaveats array." };
    }
    return { isValid: true };
  }

  if (operation === "targeted_qa") {
    if (typeof obj.directAnswer !== "string" || !obj.directAnswer.trim()) {
      return { isValid: false, error: "Missing or invalid directAnswer string." };
    }
    const conf = obj.confidenceScore;
    if (conf !== "high" && conf !== "medium" && conf !== "low") {
      return { isValid: false, error: "Missing or invalid confidenceScore enum." };
    }
    if (!Array.isArray(obj.evidenceQuotes)) {
      return { isValid: false, error: "Missing evidenceQuotes array." };
    }
    return { isValid: true };
  }

  return { isValid: false, error: `Unrecognized operation type: ${operation}` };
}

// Convert structured data into readable markdown
function formatResultToMarkdown(operation: AiOperationType, data: unknown): string {
  if (!data || typeof data !== "object") return "";

  if (operation === "summarize") {
    const s = data as SummaryResult;
    const items = (s.actionItems || [])
      .map((a) => `- [${(a.priority || "medium").toUpperCase()}] **${a.task}**${a.owner ? ` (${a.owner})` : ""}`)
      .join("\n");
    const takeaways = (s.keyTakeaways || []).map((t) => `- ${t}`).join("\n");
    const alerts = (s.criticalRisksOrAlerts || []).map((r) => `> ⚠️ **Alert:** ${r}`).join("\n\n");

    return `# ${s.title || "Executive Summary"}\n\n## Overview\n${s.executiveSummary || ""}\n\n## Key Takeaways\n${takeaways}\n\n## Action Items\n${items}${alerts ? `\n\n## Critical Risks & Alerts\n${alerts}` : ""}`;
  }

  if (operation === "extract_key_info") {
    const d = data as ExtractedDataResult;
    const parties = (d.parties || []).map((p) => `- **${p.name}** — ${p.role}${p.jurisdiction ? ` (${p.jurisdiction})` : ""}`).join("\n");
    const dates = (d.keyDates || []).map((dt) => `- **${dt.label}:** ${dt.date} ${dt.isDeadline ? "(🚨 Deadline)" : ""}`).join("\n");
    const financials = (d.financials || []).map((f) => `- **${f.description}:** ${f.amount} ${f.currency}${f.paymentTerms ? ` (${f.paymentTerms})` : ""}`).join("\n");
    const obligations = (d.coreObligations || []).map((o) => `- **${o.party}:** ${o.obligation}${o.clauseReference ? ` [Clause ${o.clauseReference}]` : ""}`).join("\n");

    return `# Document Extraction: ${d.documentType || "Structured Entities"}\n\n### Parties\n${parties || "None identified."}\n\n### Key Dates & Deadlines\n${dates || "None identified."}\n\n### Financial Metrics\n${financials || "None identified."}\n\n### Core Obligations\n${obligations || "None identified."}${d.governingLaw ? `\n\n**Governing Law:** ${d.governingLaw}` : ""}`;
  }

  if (operation === "explain_simply") {
    const e = data as ExplanationResult;
    const concepts = (e.coreConcepts || []).map((c) => `### ${c.term}\n- **What it means:** ${c.plainEnglishMeaning}\n- **Why it matters:** ${c.whyItMatters}`).join("\n\n");
    const implications = (e.practicalImplications || []).map((i) => `- ${i}`).join("\n");
    const caveats = (e.hiddenCaveats || []).map((c) => `- ⚠️ ${c}`).join("\n");

    return `# Plain English Explanation\n\n${e.simplifiedOverview || ""}\n\n## Key Terminology\n${concepts}\n\n## Practical Implications\n${implications}\n\n## Hidden Caveats & Fine Print\n${caveats}`;
  }

  if (operation === "targeted_qa") {
    const a = data as AnswerResult;
    const quotes = (a.evidenceQuotes || []).map((q) => `> "${q.quote}"\n> — *Page ${q.pageNumber}${q.context ? ` (${q.context})` : ""}*`).join("\n\n");

    return `## Answer\n${a.directAnswer || ""}\n\n**Confidence Level:** ${(a.confidenceScore || "HIGH").toUpperCase()}\n\n### Grounded Evidence\n${quotes}${a.additionalContext ? `\n\n### Additional Context\n${a.additionalContext}` : ""}`;
  }

  return JSON.stringify(data, null, 2);
}

// Explicit test simulation (only when ENABLE_AI_SIMULATION="true")
function executeSimulatedOperation(
  operation: AiOperationType,
  extractedText: string,
  filename: string,
  options?: Record<string, unknown>
): { data: unknown; citations: OperationCitation[] } {
  const lines = extractedText.split("\n").filter((l) => l.trim().length > 0);
  const sampleExcerpts = lines.slice(0, Math.min(lines.length, 8)).join(" ");

  if (operation === "summarize") {
    const data: SummaryResult = {
      title: `${filename.replace(/\.[^/.]+$/, "")} Summary (Simulated)`,
      executiveSummary: `[SIMULATED TEST MODE] This document contains ${extractedText.length} characters across ${Math.ceil(extractedText.length / 1500)} virtual page sections. Test extraction confirms baseline structural adherence.`,
      keyTakeaways: [
        `[SIMULATED] Primary document scope analyzed under simulation mode.`,
        `[SIMULATED] Formal provisions establish compliance timelines and terms.`,
      ],
      actionItems: [
        {
          task: "Configure GEMINI_API_KEY for live production cloud reasoning.",
          owner: "System Administrator",
          priority: "high",
        },
      ],
      criticalRisksOrAlerts: [
        "SIMULATED OUTPUT: Result generated for development validation only.",
      ],
    };
    return {
      data,
      citations: [
        {
          pageNumber: 1,
          excerpt: sampleExcerpts.slice(0, 180) || "Document header excerpt.",
          relevanceExplanation: "Simulated document grounding citation.",
        },
      ],
    };
  }

  if (operation === "extract_key_info") {
    const data: ExtractedDataResult = {
      documentType: filename.toLowerCase().includes("invoice") ? "Commercial Invoice (Simulated)" : "Agreement (Simulated)",
      parties: [
        { name: "First Party (Simulated Entity)", role: "Disclosing Party" },
        { name: "Second Party (Simulated Entity)", role: "Receiving Party" },
      ],
      keyDates: [
        { label: "Document Date", date: new Date().toISOString().split("T")[0], isDeadline: false, pageNumber: 1 },
      ],
      financials: [
        { description: "Service Fee (Simulated)", amount: "10,000", currency: "USD", paymentTerms: "Net 30" },
      ],
      coreObligations: [
        { party: "All Parties", obligation: "Maintain data confidentiality.", clauseReference: "Section 1" },
      ],
      governingLaw: "Standard Jurisdiction (Simulated)",
    };
    return {
      data,
      citations: [
        {
          pageNumber: 1,
          excerpt: sampleExcerpts.slice(0, 150) || "Party and obligation excerpt.",
          relevanceExplanation: "Simulated extraction citation.",
        },
      ],
    };
  }

  if (operation === "explain_simply") {
    const data: ExplanationResult = {
      simplifiedOverview: `[SIMULATED TEST MODE] In simple terms, this document (${filename}) sets guidelines for party collaboration and operational responsibilities.`,
      coreConcepts: [
        {
          term: "Confidentiality (Simulated)",
          plainEnglishMeaning: "Keep private information secure.",
          whyItMatters: "Prevents unauthorized data disclosure.",
        },
      ],
      practicalImplications: ["Follow defined schedules.", "Maintain written records."],
      hiddenCaveats: ["Verify all dates and terms with real provider reasoning."],
    };
    return {
      data,
      citations: [
        {
          pageNumber: 1,
          excerpt: sampleExcerpts.slice(0, 160) || "Operational clause excerpt.",
          relevanceExplanation: "Simulated explanation citation.",
        },
      ],
    };
  }

  // Targeted Q&A
  const customQuery = options?.customQuery as string | undefined;
  const data: AnswerResult = {
    directAnswer: customQuery
      ? `[SIMULATED TEST MODE] Regarding "${customQuery}": The simulated engine notes that terms and obligations are governed by the loaded document text.`
      : "[SIMULATED TEST MODE] The document establishes mutual covenants and operational duties.",
    confidenceScore: "high",
    evidenceQuotes: [
      {
        quote: sampleExcerpts.slice(0, 140) || "Document excerpt citation.",
        pageNumber: 1,
        context: "Introductory section",
      },
    ],
    additionalContext: "Simulated output for development testing.",
  };
  return {
    data,
    citations: [
      {
        pageNumber: 1,
        excerpt: sampleExcerpts.slice(0, 140) || "Clause excerpt citation.",
        relevanceExplanation: "Simulated Q&A citation.",
      },
    ],
  };
}

// In-Memory Sliding-Window Rate Limiter for Public Beta Protection
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests/minute per client IP

interface RateLimitRecord {
  timestamps: number[];
}

const ipRateLimitMap = new Map<string, RateLimitRecord>();

function isRateLimited(ip: string): { limited: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  let record = ipRateLimitMap.get(ip);

  if (!record) {
    record = { timestamps: [] };
    ipRateLimitMap.set(ip, record);
  }

  // Filter timestamps within sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = record.timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000));
    return { limited: true, remaining: 0, retryAfterSeconds };
  }

  record.timestamps.push(now);

  // Periodic pruning if map grows large (> 1000 IPs)
  if (ipRateLimitMap.size > 1000) {
    for (const [key, val] of ipRateLimitMap.entries()) {
      val.timestamps = val.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
      if (val.timestamps.length === 0) {
        ipRateLimitMap.delete(key);
      }
    }
  }

  return {
    limited: false,
    remaining: MAX_REQUESTS_PER_WINDOW - record.timestamps.length,
    retryAfterSeconds: 0,
  };
}

const SECURE_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, private",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    // 1. IP-based sliding-window rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = (forwardedFor ? forwardedFor.split(",")[0] : req.headers.get("x-real-ip")) || "127.0.0.1";

    const rateStatus = isRateLimited(clientIp);
    if (rateStatus.limited) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Rate limit exceeded. Please wait a moment before sending another AI request.",
            retryable: true,
          },
        },
        {
          status: 429,
          headers: {
            ...SECURE_RESPONSE_HEADERS,
            "Retry-After": rateStatus.retryAfterSeconds.toString(),
          },
        }
      );
    }

    // 2. Request body parsing
    let body: AiOperationRequest;
    try {
      body = (await req.json()) as AiOperationRequest;
    } catch {
      return NextResponse.json(
        {
          error: {
            code: "UNSUPPORTED_DOCUMENT",
            message: "Malformed JSON request body.",
            retryable: false,
          },
        },
        { status: 400, headers: SECURE_RESPONSE_HEADERS }
      );
    }

    if (!body || !body.operation || !body.context) {
      return NextResponse.json(
        {
          error: {
            code: "UNSUPPORTED_DOCUMENT",
            message: "Missing required operation or document context payload.",
            retryable: false,
          },
        },
        { status: 400, headers: SECURE_RESPONSE_HEADERS }
      );
    }

    const { operation, context, options } = body;
    const opDef = OPERATION_REGISTRY[operation];

    if (!opDef) {
      return NextResponse.json(
        {
          error: {
            code: "UNSUPPORTED_DOCUMENT",
            message: `Unrecognized operation type: ${operation}`,
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    if (!context.extractedText || typeof context.extractedText !== "string" || context.extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "CONTEXT_UNAVAILABLE",
            message: "Document context contains no extractable text. Please ensure the document is parsed.",
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    // Configurable context ceiling with safe integer fallback (default: 500,000 chars)
    const rawMax = process.env.MAX_DOCUMENT_CONTEXT_CHARS;
    const maxContextChars =
      rawMax && !isNaN(parseInt(rawMax, 10)) && parseInt(rawMax, 10) > 0
        ? parseInt(rawMax, 10)
        : 500000;

    if (context.extractedText.length > maxContextChars) {
      return NextResponse.json(
        {
          error: {
            code: "CONTEXT_TOO_LARGE",
            message: `Document context exceeds the maximum allowed limit (${maxContextChars.toLocaleString()} characters). Please optimize or select a page range.`,
            retryable: false,
          },
        },
        { status: 413 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // =========================================================================
    // 1. LIVE GOOGLE GEMINI EXECUTION
    // =========================================================================
    if (apiKey) {
      const userPrompt = opDef.buildPrompt(context, options as Record<string, unknown>);
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const payload = {
        system_instruction: {
          parts: [{ text: opDef.systemInstruction }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: opDef.responseJsonSchema,
          temperature: 0.1,
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      let geminiRes: Response;
      try {
        geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch {
        clearTimeout(timeoutId);
        // Safe logging without leaking sensitive payloads
        console.error("Gemini API network/timeout failure");
        return NextResponse.json(
          {
            error: {
              code: "AI_PROVIDER_UNAVAILABLE",
              message: "Google Gemini service connection timed out or failed. Please retry.",
              retryable: true,
            },
          },
          { status: 503 }
        );
      }

      clearTimeout(timeoutId);

      if (!geminiRes.ok) {
        // Safe metadata-only logging (never log request payloads or response body)
        console.error("Gemini API request failed with status:", geminiRes.status);
        return NextResponse.json(
          {
            error: {
              code: "AI_PROVIDER_UNAVAILABLE",
              message: `Google Gemini service is temporarily unavailable (Status ${geminiRes.status}). Please retry shortly.`,
              retryable: true,
            },
          },
          { status: 503 }
        );
      }

      let resData: { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      try {
        resData = await geminiRes.json();
      } catch {
        return NextResponse.json(
          {
            error: {
              code: "AI_RESPONSE_INVALID",
              message: "Failed to parse JSON response from AI provider.",
              retryable: true,
            },
          },
          { status: 502 }
        );
      }

      const rawJsonText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawJsonText) {
        return NextResponse.json(
          {
            error: {
              code: "AI_RESPONSE_INVALID",
              message: "AI provider returned an empty content candidate.",
              retryable: true,
            },
          },
          { status: 502 }
        );
      }

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(rawJsonText);
      } catch {
        return NextResponse.json(
          {
            error: {
              code: "AI_RESPONSE_INVALID",
              message: "AI provider output was not valid JSON.",
              retryable: true,
            },
          },
          { status: 502 }
        );
      }

      // Defensive validation against expected schema
      const validation = validateOperationResponse(operation, parsedData);
      if (!validation.isValid) {
        console.error("AI response schema validation failed");
        return NextResponse.json(
          {
            error: {
              code: "AI_RESPONSE_INVALID",
              message: "AI provider returned an incomplete or invalid response structure.",
              retryable: true,
            },
          },
          { status: 502 }
        );
      }

      const durationMs = Math.max(1, Math.round(performance.now() - startTime));
      const markdown = formatResultToMarkdown(operation, parsedData);

      const citations: OperationCitation[] = [];
      if (operation === "targeted_qa") {
        const qaData = parsedData as AnswerResult;
        if (Array.isArray(qaData.evidenceQuotes)) {
          qaData.evidenceQuotes.forEach((q) => {
            citations.push({
              pageNumber: q.pageNumber || 1,
              excerpt: q.quote,
              relevanceExplanation: q.context || "Direct quote verifying answer",
            });
          });
        }
      }

      const resultPayload: AiOperationResult = {
        id: `op-res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        operation,
        status: "success",
        structuredData: parsedData,
        markdownContent: markdown,
        citations,
        metrics: {
          durationMs,
          inputTokensEstimated: Math.ceil(context.extractedText.length / 4),
          outputTokensEstimated: Math.ceil(rawJsonText.length / 4),
          providerName: "Google Gemini (2.5 Flash)",
          modelName: "gemini-2.5-flash",
          isSimulated: false,
        },
      };

      return NextResponse.json(resultPayload, { headers: SECURE_RESPONSE_HEADERS });
    }

    // =========================================================================
    // 2. EXPLICIT SIMULATION TEST MODE (Only when ENABLE_AI_SIMULATION="true")
    // =========================================================================
    const isSimulationExplicitlyEnabled =
      process.env.ENABLE_AI_SIMULATION === "true" ||
      process.env.NEXT_PUBLIC_ENABLE_AI_SIMULATION === "true";

    if (!isSimulationExplicitlyEnabled) {
      return NextResponse.json(
        {
          error: {
            code: "AI_PROVIDER_UNAVAILABLE",
            message: "AI reasoning service is not configured. GEMINI_API_KEY must be set in the server environment.",
            retryable: false,
          },
        },
        { status: 503, headers: SECURE_RESPONSE_HEADERS }
      );
    }

    // Simulation is explicitly enabled for development/testing
    const simulated = executeSimulatedOperation(
      operation,
      context.extractedText,
      context.filename,
      options as Record<string, unknown>
    );

    const durationMs = Math.max(1, Math.round(performance.now() - startTime));
    const markdown = formatResultToMarkdown(operation, simulated.data);

    const resultPayload: AiOperationResult = {
      id: `op-res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      operation,
      status: "success",
      structuredData: simulated.data,
      markdownContent: markdown,
      citations: simulated.citations,
      metrics: {
        durationMs,
        inputTokensEstimated: Math.ceil(context.extractedText.length / 4),
        outputTokensEstimated: Math.ceil(JSON.stringify(simulated.data).length / 4),
        providerName: "Simulated Test Mode",
        modelName: "local-simulation-v1",
        isSimulated: true,
      },
    };

    return NextResponse.json(resultPayload, { headers: SECURE_RESPONSE_HEADERS });
  } catch {
    console.error("AI execution failed unexpectedly");
    return NextResponse.json(
      {
        error: {
          code: "AI_REQUEST_FAILED",
          message: "An internal AI processing error occurred. Please retry.",
          retryable: true,
        },
      },
      { status: 500, headers: SECURE_RESPONSE_HEADERS }
    );
  }
}
