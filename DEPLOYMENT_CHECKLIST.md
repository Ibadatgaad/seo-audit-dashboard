# Deployment Checklist — SEO Audit Dashboard

**Production URL:** https://seo-audit-dashboard-beige.vercel.app
**Hosting:** Vercel, connected to `main` branch (auto-deploy on push)
**Signed off by:** Ibadatgaad
**Date:** August 2026

## Pre-deployment

- [x] **Environment variables set in Vercel**, separately from local `.env.local`: `GEMINI_API_KEY`, `GEMINI_MODEL`. Verified by confirming AI insights render correctly on the live site, not just locally.
- [x] **`.env.local` is gitignored**; `.env.example` is committed as a template with no real values, so a new developer knows exactly which variables to set.
- [x] **Production build passes locally** (`npm run build`) before every push, catching build-only errors before they reach Vercel.
- [x] **Custom domain:** not added — using the default Vercel-provided domain. Considered optional for a capstone project; the default URL is stable and shareable.

## Cross-browser & device pass

- [x] Chrome (desktop) — full flow tested: submit audit, view Dashboard, AI insights render.
- [x] Edge (desktop) — same flow tested, works identically (expected, same rendering engine as Chrome).
- [x] Mobile (Android browser) — tested, layout is usable and readable at phone width.
- [ ] Safari (desktop) — **not tested**, no Mac available.
- [ ] Safari (iOS) — **not tested**, no iPhone available.
- Notes: the app uses standard CSS/Flexbox and no browser-specific APIs, so Safari compatibility is expected but genuinely unverified. This gap is also disclosed in the README rather than hidden.

## Production hygiene

- [x] **Rate limiting**: both `/api/audit` and the Dashboard page limit each IP to 10 requests per 10 minutes (`lib/rate-limit.ts`), returning HTTP 429 with a `Retry-After` header when exceeded. Manually verified by sending 11 rapid requests locally and confirming the 11th was rejected.
- [x] **`maxDuration` set to 30s** on both AI-calling routes, giving headroom above Vercel's 10s default for the worst-case path (10s page fetch + 15s AI call).
- [x] **Input validation**: submitted URLs are validated (must be http/https) before any fetch is attempted; malformed JSON bodies are rejected with a clean 400 rather than crashing.

## Failure handling — how the app fails safely

- [x] **Target page unreachable or times out** → clean error message shown on Dashboard ("Could not reach the target page..."), not a crash or blank screen.
- [x] **Target page returns non-HTML or a non-200 status** → specific, readable error shown instead of attempting to parse garbage.
- [x] **AI service fails, times out, or returns malformed data** → audit does not fail. The rule-based results still render in full, with a visible note that AI insights are unavailable and why (e.g. "AI service returned status 429"). This was observed for real during development when the free-tier Gemini quota was briefly exceeded during testing.
- [x] **Rate limit exceeded** → clean 429 response with a specific wait time, not a silent failure or generic 500.

## Rollback plan

- **Method:** Vercel's built-in **Instant Rollback** feature (visible on the project's Overview page). Every push to `main` creates a new deployment while keeping prior deployments available; rolling back is a single click on the specific commit to restore, with no rebuild required.
- **Monitoring:** Vercel's Observability panel (Edge Requests, Function Invocations, Error Rate) is available on the project dashboard for spotting problems after a deploy.
- **In practice:** if a deploy introduces a bug, the plan is: (1) check the Observability panel for an error spike, (2) use Instant Rollback to the last known-good deployment, (3) fix locally, test with `npm run build` and `npm run test`, then push again.
