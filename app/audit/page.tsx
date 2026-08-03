"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    // Placeholder navigation — real fetch/scoring logic lands in a later task.
    router.push(`/dashboard?url=${encodeURIComponent(url.trim())}`);
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
        Run an audit
      </h1>
      <p className="mt-1 text-sm text-foreground/70">
        Enter the full URL of the page you want to audit.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <label htmlFor="url" className="text-sm font-medium">
          Page URL
        </label>
        <input
          id="url"
          type="url"
          required
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-md border border-surface-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="mt-2 self-start rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          Run audit
        </button>
      </form>
    </div>
  );
}
