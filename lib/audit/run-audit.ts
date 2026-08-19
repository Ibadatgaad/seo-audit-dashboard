import * as cheerio from "cheerio";
import { runChecks, AuditResult } from "@/lib/audit/checks";
import { getAiInsights, AiInsights } from "@/lib/audit/ai-insights";

const FETCH_TIMEOUT_MS = 10_000;

export type AuditOutcome =
  | { ok: true; data: AuditResult & { aiInsights: AiInsights | null; aiUnavailableReason: string | null } }
  | { ok: false; error: string; status: number };

export function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function extractVisibleText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

export async function auditUrl(rawUrl: string): Promise<AuditOutcome> {
  const url = rawUrl.trim();

  if (!url) {
    return { ok: false, error: "Missing required field: url.", status: 400 };
  }

  if (!isValidUrl(url)) {
    return {
      ok: false,
      error: "Invalid URL. Include the protocol, e.g. https://example.com.",
      status: 400,
    };
  }

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SEOAuditDashboard/1.0 (+https://seo-audit-dashboard-beige.vercel.app)",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        ok: false,
        error: `Target page responded with status ${res.status}.`,
        status: 502,
      };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return {
        ok: false,
        error: `Target page is not HTML (content-type: ${contentType || "unknown"}).`,
        status: 415,
      };
    }

    html = await res.text();
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Timed out fetching the target page."
        : "Could not reach the target page. It may be blocking automated requests or be offline.";
    return { ok: false, error: message, status: 502 };
  }

  let checkResult: AuditResult;
  try {
    checkResult = runChecks(html, url);
  } catch (err) {
    console.error("Audit check failed:", err);
    return {
      ok: false,
      error: "Something went wrong while analyzing the page.",
      status: 500,
    };
  }

  // AI insights are additive: if they fail for any reason, we still return
  // the full rule-based audit rather than failing the whole request.
  const bodyText = extractVisibleText(html);
  const aiOutcome = await getAiInsights(checkResult, bodyText);

  return {
    ok: true,
    data: {
      ...checkResult,
      aiInsights: aiOutcome.available ? aiOutcome.insights : null,
      aiUnavailableReason: aiOutcome.available ? null : aiOutcome.reason,
    },
  };
}