import { headers } from "next/headers";

type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
};

async function getHealth(): Promise<HealthResponse> {
  // Build an absolute URL to our own API route from the incoming request headers.
  // This works in local dev, preview deployments, and production without
  // needing a hardcoded/env-configured base URL.
  const h = await headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/health`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status}`);
  }

  return res.json();
}

export default async function HealthPage() {
  const health = await getHealth();

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Health check
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        Confirms the deployed app can reach its own API route and render live
        fetched data.
      </p>

      <dl className="mt-6 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-3 rounded-lg border border-surface-border bg-surface p-4 text-sm">
        <dt className="text-foreground/60">Status</dt>
        <dd className="font-medium text-score-good">{health.status}</dd>

        <dt className="text-foreground/60">Service</dt>
        <dd className="font-mono">{health.service}</dd>

        <dt className="text-foreground/60">Server timestamp</dt>
        <dd className="font-mono">{health.timestamp}</dd>

        <dt className="text-foreground/60">Uptime (seconds)</dt>
        <dd className="font-mono">{health.uptimeSeconds}</dd>
      </dl>
    </div>
  );
}
