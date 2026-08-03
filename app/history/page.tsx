export default function HistoryPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Audit history
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        Past audits will appear here once history persistence is added. (Optional feature.)
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-surface-border p-8 text-center text-sm text-foreground/50">
        No saved audits yet
      </div>
    </div>
  );
}
