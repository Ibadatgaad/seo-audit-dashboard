import { AuditResult } from "@/lib/audit/checks";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const GEMINI_TIMEOUT_MS = 15_000;
const MAX_CONTENT_CHARS = 4_000; // keep prompt small and cheap

export type RelevanceRating = "strong" | "weak" | "mismatched";

export interface RelevanceJudgment {
  title_match: RelevanceRating;
  title_match_reason: string;
  meta_match: RelevanceRating;
  meta_match_reason: string;
  h1_match: RelevanceRating;
  h1_match_reason: string;
}

export interface PrioritizedFix {
  rank: number;
  issue: string;
  why_it_matters: string;
}

export interface AiInsights {
  relevance: RelevanceJudgment;
  prioritized_fixes: PrioritizedFix[];
}

export type AiInsightsOutcome =
  | { available: true; insights: AiInsights }
  | { available: false; reason: string };

function buildPrompt(audit: AuditResult, bodyText: string): string {
  const checksSummary = audit.checks
    .map((c) => `- ${c.label}: score ${c.score}/100, value: "${c.value}"`)
    .join("\n");

  const truncatedBody = bodyText.slice(0, MAX_CONTENT_CHARS);

  return `You are an SEO analyst. You will be given a page's rule-based SEO check results, plus a sample of the page's visible text content. Do two things:

1. Judge whether the title, meta description, and H1 are actually semantically relevant to what the page content is about (not just whether they exist or have the "right" length). Rate each as "strong", "weak", or "mismatched", with a one-sentence reason.
2. Given the check results, produce a prioritized list (most important first) of the top 3-5 fixes this page needs, with a short reason why each matters for SEO.

Rule-based check results:
${checksSummary}

Sample of page text content (may be truncated):
"""
${truncatedBody}
"""

Respond with ONLY valid JSON, no markdown fences, no commentary, matching exactly this shape:
{
  "relevance": {
    "title_match": "strong" | "weak" | "mismatched",
    "title_match_reason": string,
    "meta_match": "strong" | "weak" | "mismatched",
    "meta_match_reason": string,
    "h1_match": "strong" | "weak" | "mismatched",
    "h1_match_reason": string
  },
  "prioritized_fixes": [
    { "rank": number, "issue": string, "why_it_matters": string }
  ]
}`;
}

function isValidInsights(value: unknown): value is AiInsights {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!v.relevance || typeof v.relevance !== "object") return false;
  if (!Array.isArray(v.prioritized_fixes)) return false;

  const r = v.relevance as Record<string, unknown>;
  const validRatings = ["strong", "weak", "mismatched"];
  const fields = ["title_match", "meta_match", "h1_match"];
  for (const f of fields) {
    if (!validRatings.includes(r[f] as string)) return false;
    if (typeof r[`${f}_reason`] !== "string") return false;
  }

  return v.prioritized_fixes.every(
    (fix) =>
      fix &&
      typeof fix === "object" &&
      typeof (fix as Record<string, unknown>).rank === "number" &&
      typeof (fix as Record<string, unknown>).issue === "string" &&
      typeof (fix as Record<string, unknown>).why_it_matters === "string"
  );
}

export async function getAiInsights(
  audit: AuditResult,
  bodyText: string
): Promise<AiInsightsOutcome> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { available: false, reason: "AI insights are not configured (missing API key)." };
  }

  const prompt = buildPrompt(audit, bodyText);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const res = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Gemini API error:", res.status, errText);
      return { available: false, reason: `AI service returned status ${res.status}.` };
    }

    const data = await res.json();
    const rawText: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return { available: false, reason: "AI service returned an empty response." };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error("Gemini returned non-JSON:", rawText.slice(0, 500));
      return { available: false, reason: "AI service returned malformed JSON." };
    }

    if (!isValidInsights(parsed)) {
      console.error("Gemini JSON did not match expected shape:", parsed);
      return { available: false, reason: "AI response did not match the expected format." };
    }

    return { available: true, insights: parsed };
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? "AI request timed out."
        : "Could not reach the AI service.";
    console.error("Gemini request failed:", err);
    return { available: false, reason };
  }
}