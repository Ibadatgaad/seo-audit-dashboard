import { runChecks, AuditResult } from "@/lib/audit/checks";

const FETCH_TIMEOUT_MS = 10_000;

export type AuditOutcome =
  | { ok: true; data: AuditResult }
  | { ok: false; error: string; status: number };

export function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
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

  try {
    const data = runChecks(html, url);
    return { ok: true, data };
  } catch (err) {
    console.error("Audit check failed:", err);
    return {
      ok: false,
      error: "Something went wrong while analyzing the page.",
      status: 500,
    };
  }
}