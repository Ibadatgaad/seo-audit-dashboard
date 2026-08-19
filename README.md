# SEO Audit Dashboard

A small web app that audits any public page's on-page SEO in seconds, combining deterministic rule-based checks with AI-powered content relevance analysis.

**Live app:** https://seo-audit-dashboard-beige.vercel.app
**Repo:** https://github.com/Ibadatgaad/seo-audit-dashboard

## Project brief

Most free SEO tools either give a vague pass/fail with no explanation, or bury real signal under a wall of jargon. This app takes a URL, runs six concrete on-page SEO checks (title, meta description, H1 usage, image alt text, mobile viewport, links), and then uses an LLM to judge something rules alone can't: whether the title, meta description, and H1 actually match what the page is *about* — not just whether they exist or are the "right" length. It's built for anyone who wants a fast, plain-English audit of a single page — students, freelancers, or small site owners — without signing up for a full SEO suite.

## Setup & run instructions

Requires Node.js 18+.

```bash
git clone https://github.com/Ibadatgaad/seo-audit-dashboard.git
cd seo-audit-dashboard
npm install
```

Copy `.env.example` to `.env.local` and fill in a free Gemini API key (see [AI integration](#ai-integration) below for where to get one):

```bash
cp .env.example .env.local
```

```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.6-flash
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Go to **Audit**, enter a URL, and view results on **Dashboard**.

To run the test suite:

```bash
npm run test
```

## Architecture overview

```
app/
├── audit/page.tsx        Form to submit a URL; client component, navigates to /dashboard?url=...
├── dashboard/page.tsx     Server component; runs the audit and renders results
├── api/audit/route.ts     POST endpoint; same audit logic, used for programmatic access
├── history/, settings/, health/   Placeholder pages (see Known limitations)
lib/audit/
├── checks.ts              Pure functions: 6 rule-based SEO checks, weighted scoring
├── run-audit.ts            Shared orchestration: fetch page → run checks → get AI insights
├── checks.test.ts          Unit tests for checks.ts (Vitest)
└── ai-insights.ts           Gemini API call: content relevance + prioritized fixes
```

**Why this split:** `dashboard/page.tsx` is a Next.js Server Component, so it can call `auditUrl()` directly on the server without an extra network hop to its own API route. The API route (`app/api/audit/route.ts`) exists separately for anyone who wants to call the audit programmatically (e.g. a script or another tool), and both share the same `run-audit.ts` logic so there's no duplicated code between them.

**Rule-based checks (`checks.ts`):** fetches the target page's HTML server-side, parses it with `cheerio`, and scores six things: title length, meta description length, H1 count, image alt-text coverage, viewport meta tag, and broken/placeholder links. Each check returns a 0–100 score, the actual extracted value, and specific issues with fixes. These run entirely offline from any AI service — deterministic, fast, and free.

## AI integration

**Provider:** Google Gemini API (`gemini-3.6-flash` by default), chosen because it has a genuinely free tier (no credit card, daily quota) suitable for a project like this — see [Google AI Studio](https://aistudio.google.com/apikey) to get a key.

**What it adds beyond the rule-based checks:** the six rule-based checks can tell you *whether* a title exists and is the right length, but not whether it's actually *about* the page. `lib/audit/ai-insights.ts` sends the check results plus a sample of the page's visible text to Gemini and asks it to:

1. Judge whether the title, meta description, and H1 are semantically relevant to the page content — rated `strong` / `weak` / `mismatched` with a one-sentence reason each.
2. Produce a prioritized list (not just a flat list) of the 3–5 fixes that matter most, with a reason for each — including issues the rule-based checks don't catch at all, like thin overall content.

**Prompt design:** the prompt explicitly requests JSON-only output matching a fixed schema (`generationConfig.responseMimeType: "application/json"`), which keeps parsing reliable. The page content sent to the model is capped at ~4,000 characters to keep requests small and fast.

**Resilience:** every failure mode is handled without breaking the whole audit — missing API key, non-200 response, timeout (15s), malformed JSON, or a response that doesn't match the expected shape. In any of these cases, `run-audit.ts` still returns the full rule-based results, with `aiUnavailableReason` explaining what happened. The dashboard falls back to the plain rule-based issues list automatically when this happens — the AI layer is additive, never a hard dependency.

## Known limitations & future improvements

- **History, Settings, and Health pages are placeholders.** They're intentionally left as visible, labeled stubs rather than hidden, so the app is honest about its current scope. History persistence (saving past audits) is the most natural next feature.
- **Single-page audits only.** No crawling, sitemap discovery, or multi-page comparison.
- **No authentication or per-user data.** Every audit is anonymous and stateless.
- **Gemini model names are volatile.** Google has retired several Gemini model IDs in 2026 on short notice. The model name is an environment variable (`GEMINI_MODEL`) rather than hardcoded specifically so a retirement can be fixed with a one-line config change instead of a code change.
- **No rate limiting on `/api/audit`.** For a real production tool, this endpoint should be rate-limited to prevent abuse of both the target-site fetch and the Gemini API quota.
- **AI relevance judgments aren't cached.** Repeated audits of the same URL re-call Gemini every time; caching by URL + content hash would reduce cost and latency.
- **Lighthouse Performance scores ~77 on mobile** (Accessibility, Best Practices, and SEO all score 100). This is primarily React hydration cost plus the dashboard intentionally avoiding caching so it always shows fresh audit results rather than a stale cached page — a deliberate trade-off, not an oversight.

## Testing

Unit tests cover `lib/audit/checks.ts` — all 6 checks (pass and fail cases) plus the overall weighted score calculation, using [Vitest](https://vitest.dev). Run with `npm run test`.

## Deployment

Deployed on Vercel, connected to the `main` branch — every push to `main` triggers an automatic production deployment. Environment variables (`GEMINI_API_KEY`, `GEMINI_MODEL`) are configured in the Vercel project settings, separately from local `.env.local`.
