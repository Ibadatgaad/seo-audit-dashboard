import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-start gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Audit any page&apos;s on-page SEO in seconds
        </h1>
        <p className="mt-2 max-w-xl text-sm text-foreground/70 sm:text-base">
          Enter a URL, get a weighted score across six on-page SEO checks, and
          see exactly what to fix — in plain English.
        </p>
      </div>

      <Link
        href="/audit"
        className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90"
      >
        Start an audit
      </Link>

      <div className="grid w-full gap-4 sm:grid-cols-3">
        {[
          {
            title: "Title & meta checks",
            body: "Length and presence checks for title tags and meta descriptions.",
          },
          {
            title: "Structure checks",
            body: "H1 usage, image alt text coverage, and viewport meta tag.",
          },
          {
            title: "Actionable issues",
            body: "Every flagged issue comes with a plain-English fix suggestion.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-surface-border bg-surface p-4"
          >
            <h2 className="text-sm font-medium">{card.title}</h2>
            <p className="mt-1 text-xs text-foreground/70">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
