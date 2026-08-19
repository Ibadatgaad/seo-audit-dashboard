import { auditUrl } from "@/lib/audit/run-audit";

type DashboardPageProps = {
  searchParams: Promise<{ url?: string }>;
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  return "text-red-600";
}

function relevanceColor(rating: string): string {
  if (rating === "strong") return "text-green-600";
  if (rating === "weak") return "text-yellow-600";
  return "text-red-600";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { url } = await searchParams;

  if (!url) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Results dashboard
        </h1>
        <p className="mt-1 text-sm text-foreground/70">
          No URL provided — run an audit first.
        </p>
      </div>
    );
  }

  const result = await auditUrl(url);

  if (!result.ok) {
    return (
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Results dashboard
        </h1>
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Audit failed</p>
          <p className="mt-1 text-sm text-red-700">{result.error}</p>
        </div>
      </div>
    );
  }

  const { overallScore, checks, aiInsights, aiUnavailableReason } = result.data;
  const allIssues = checks.flatMap((c) =>
    c.issues.map((issue) => ({ ...issue, category: c.label }))
  );

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Results dashboard
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        Results for <span className="font-mono">{url}</span>.
      </p>

      <div className="mt-6 rounded-lg border border-surface-border bg-surface p-6">
        <p className="text-xs font-medium text-foreground/60">Overall score</p>
        <p className={`mt-1 text-4xl font-semibold ${scoreColor(overallScore)}`}>
          {overallScore}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((check) => (
          <div
            key={check.id}
            className="rounded-lg border border-surface-border bg-surface p-4"
          >
            <p className="text-sm font-medium">{check.label}</p>
            <p className={`mt-1 text-xs font-semibold ${scoreColor(check.score)}`}>
              Score: {check.score}
            </p>
            <p className="mt-1 text-xs text-foreground/60">{check.value}</p>
          </div>
        ))}
      </div>

      {/* AI insights section */}
      <div className="mt-6 rounded-lg border border-surface-border bg-surface p-4">
        <p className="text-sm font-medium">AI content relevance</p>
        {aiInsights ? (
          <div className="mt-3 space-y-2">
            {(
              [
                ["Title", aiInsights.relevance.title_match, aiInsights.relevance.title_match_reason],
                ["Meta description", aiInsights.relevance.meta_match, aiInsights.relevance.meta_match_reason],
                ["H1", aiInsights.relevance.h1_match, aiInsights.relevance.h1_match_reason],
              ] as const
            ).map(([label, rating, reason]) => (
              <p key={label} className="text-xs">
                <span className="font-medium">{label}:</span>{" "}
                <span className={`font-semibold ${relevanceColor(rating)}`}>{rating}</span>
                {" — "}
                <span className="text-foreground/70">{reason}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-foreground/60">
            AI relevance check unavailable{aiUnavailableReason ? `: ${aiUnavailableReason}` : "."}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-surface-border bg-surface p-4">
        <p className="text-sm font-medium">
          {aiInsights ? "AI-prioritized fixes" : "Issues"}
        </p>
        {aiInsights ? (
          <ol className="mt-2 space-y-3">
            {aiInsights.prioritized_fixes
              .sort((a, b) => a.rank - b.rank)
              .map((fix) => (
                <li key={fix.rank} className="text-xs">
                  <span className="font-medium">{fix.rank}. {fix.issue}</span>
                  <p className="mt-0.5 text-foreground/60">{fix.why_it_matters}</p>
                </li>
              ))}
          </ol>
        ) : allIssues.length === 0 ? (
          <p className="mt-1 text-xs text-foreground/60">
            No issues found — this page passed every check.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {allIssues.map((issue, i) => (
              <li key={i} className="text-xs">
                <span
                  className={`font-medium ${
                    issue.severity === "high"
                      ? "text-red-600"
                      : issue.severity === "medium"
                      ? "text-yellow-600"
                      : "text-foreground/70"
                  }`}
                >
                  [{issue.category}]
                </span>{" "}
                <span className="text-foreground/80">{issue.message}</span>
                <p className="mt-0.5 text-foreground/60">Fix: {issue.fix}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}