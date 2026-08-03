type DashboardPageProps = {
  searchParams: Promise<{ url?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { url } = await searchParams;

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Results dashboard
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        {url ? (
          <>
            Placeholder results for <span className="font-mono">{url}</span>.
            Scoring logic lands in a later task.
          </>
        ) : (
          "No URL provided — run an audit first."
        )}
      </p>

      {/* ScoreSummary placeholder */}
      <div className="mt-6 rounded-lg border border-surface-border bg-surface p-6">
        <p className="text-xs font-medium text-foreground/60">Overall score</p>
        <p className="mt-1 text-4xl font-semibold">—</p>
      </div>

      {/* CategoryBreakdown placeholder */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          "Title tag",
          "Meta description",
          "H1 usage",
          "Image alt text",
          "Mobile viewport",
          "Links",
        ].map((category) => (
          <div
            key={category}
            className="rounded-lg border border-surface-border bg-surface p-4"
          >
            <p className="text-sm font-medium">{category}</p>
            <p className="mt-1 text-xs text-foreground/60">Score: —</p>
          </div>
        ))}
      </div>

      {/* IssueList placeholder */}
      <div className="mt-6 rounded-lg border border-surface-border bg-surface p-4">
        <p className="text-sm font-medium">Issues</p>
        <p className="mt-1 text-xs text-foreground/60">
          No issues yet — this list populates once the scoring engine is connected.
        </p>
      </div>
    </div>
  );
}
