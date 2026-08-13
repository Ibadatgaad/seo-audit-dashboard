import * as cheerio from "cheerio";

export type Severity = "low" | "medium" | "high";

export interface Issue {
  severity: Severity;
  message: string;
  fix: string;
}

export interface CheckResult {
  id: string;
  label: string;
  score: number; // 0-100
  weight: number;
  value: string;
  issues: Issue[];
}

export interface AuditResult {
  url: string;
  overallScore: number;
  checks: CheckResult[];
}

export function runChecks(html: string, pageUrl: string): AuditResult {
  const $ = cheerio.load(html);
  const results: CheckResult[] = [];

  const title = $("title").first().text().trim();
  results.push(scoreTitle(title));

  const metaDesc = $('meta[name="description"]').attr("content")?.trim() ?? "";
  results.push(scoreMetaDescription(metaDesc));

  const h1s = $("h1");
  results.push(scoreH1(h1s.length, h1s.first().text().trim()));

  const images = $("img");
  const totalImages = images.length;
  let withAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt && alt.trim().length > 0) withAlt++;
  });
  results.push(scoreAltText(totalImages, withAlt));

  const viewport = $('meta[name="viewport"]').attr("content");
  results.push(scoreViewport(viewport));

  const links = $("a[href]");
  const totalLinks = links.length;
  let emptyLinks = 0;
  links.each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href || href === "" || href === "#") emptyLinks++;
  });
  results.push(scoreLinks(totalLinks, emptyLinks));

  const weightedSum = results.reduce((sum, r) => sum + r.score * r.weight, 0);
  const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
  const overallScore = Math.round(weightedSum / totalWeight);

  return { url: pageUrl, overallScore, checks: results };
}

function scoreTitle(title: string): CheckResult {
  const len = title.length;
  let score = 100;
  const issues: Issue[] = [];
  if (len === 0) {
    score = 0;
    issues.push({
      severity: "high",
      message: "Missing <title> tag.",
      fix: "Add a descriptive <title> tag, ideally 50-60 characters, summarizing the page content.",
    });
  } else if (len < 30) {
    score = 50;
    issues.push({
      severity: "medium",
      message: `Title is short (${len} chars).`,
      fix: "Expand the title to 50-60 characters so it fully describes the page in search results.",
    });
  } else if (len > 60) {
    score = 60;
    issues.push({
      severity: "low",
      message: `Title is long (${len} chars) and may be truncated in search results.`,
      fix: "Shorten the title to under 60 characters.",
    });
  }
  return { id: "title", label: "Title tag", score, weight: 1, value: title, issues };
}

function scoreMetaDescription(desc: string): CheckResult {
  const len = desc.length;
  let score = 100;
  const issues: Issue[] = [];
  if (len === 0) {
    score = 0;
    issues.push({
      severity: "high",
      message: "Missing meta description.",
      fix: "Add a meta description between 120-160 characters summarizing the page.",
    });
  } else if (len < 120) {
    score = 60;
    issues.push({
      severity: "medium",
      message: `Meta description is short (${len} chars).`,
      fix: "Expand to 120-160 characters for better search snippet quality.",
    });
  } else if (len > 160) {
    score = 60;
    issues.push({
      severity: "low",
      message: `Meta description is long (${len} chars) and may be truncated.`,
      fix: "Trim to under 160 characters.",
    });
  }
  return { id: "meta_description", label: "Meta description", score, weight: 1, value: desc, issues };
}

function scoreH1(count: number, text: string): CheckResult {
  let score = 100;
  const issues: Issue[] = [];
  if (count === 0) {
    score = 0;
    issues.push({
      severity: "high",
      message: "No <h1> found on the page.",
      fix: "Add a single <h1> that clearly describes the page topic.",
    });
  } else if (count > 1) {
    score = 50;
    issues.push({
      severity: "medium",
      message: `Found ${count} <h1> tags; should be exactly one.`,
      fix: "Use only one <h1> per page; convert extras to <h2> or lower.",
    });
  }
  return { id: "h1", label: "H1 usage", score, weight: 1, value: text, issues };
}

function scoreAltText(total: number, withAlt: number): CheckResult {
  const issues: Issue[] = [];
  if (total === 0) {
    return { id: "alt_text", label: "Image alt text", score: 100, weight: 1, value: "No images found", issues };
  }
  const pct = Math.round((withAlt / total) * 100);
  const score = pct;
  if (pct < 100) {
    issues.push({
      severity: pct < 50 ? "high" : "medium",
      message: `${total - withAlt} of ${total} images are missing alt text (${pct}% coverage).`,
      fix: 'Add descriptive alt attributes to every meaningful image; use alt="" for purely decorative images.',
    });
  }
  return {
    id: "alt_text",
    label: "Image alt text",
    score,
    weight: 1,
    value: `${withAlt}/${total} images have alt text`,
    issues,
  };
}

function scoreViewport(content: string | undefined): CheckResult {
  let score = 100;
  const issues: Issue[] = [];
  if (!content) {
    score = 0;
    issues.push({
      severity: "high",
      message: "Missing viewport meta tag.",
      fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness.',
    });
  } else if (!content.includes("width=device-width")) {
    score = 50;
    issues.push({
      severity: "medium",
      message: "Viewport tag present but missing width=device-width.",
      fix: 'Set content to "width=device-width, initial-scale=1".',
    });
  }
  return { id: "viewport", label: "Mobile viewport", score, weight: 1, value: content ?? "missing", issues };
}

function scoreLinks(total: number, empty: number): CheckResult {
  const issues: Issue[] = [];
  let score = 100;
  if (total === 0) {
    return { id: "links", label: "Links", score: 100, weight: 0.5, value: "No links found", issues };
  }
  if (empty > 0) {
    score = Math.max(0, 100 - Math.round((empty / total) * 100));
    issues.push({
      severity: empty / total > 0.3 ? "medium" : "low",
      message: `${empty} of ${total} links have empty or "#" hrefs.`,
      fix: "Replace placeholder hrefs with real destinations or remove the link.",
    });
  }
  return { id: "links", label: "Links", score, weight: 0.5, value: `${total - empty}/${total} links valid`, issues };
}