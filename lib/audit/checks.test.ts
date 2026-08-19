import { describe, it, expect } from "vitest";
import { runChecks } from "./checks";

describe("runChecks", () => {
  describe("title tag", () => {
    it("scores 0 and flags a missing title", () => {
      const result = runChecks("<html><head></head><body></body></html>", "https://x.com");
      const title = result.checks.find((c) => c.id === "title")!;
      expect(title.score).toBe(0);
      expect(title.issues).toHaveLength(1);
      expect(title.issues[0].severity).toBe("high");
    });

    it("scores 50 and flags a short title", () => {
      const html = "<html><head><title>Home</title></head><body></body></html>";
      const result = runChecks(html, "https://x.com");
      const title = result.checks.find((c) => c.id === "title")!;
      expect(title.score).toBe(50);
      expect(title.issues[0].severity).toBe("medium");
    });

    it("scores 100 for a well-sized title", () => {
      const html = `<html><head><title>${"A".repeat(55)}</title></head><body></body></html>`;
      const result = runChecks(html, "https://x.com");
      const title = result.checks.find((c) => c.id === "title")!;
      expect(title.score).toBe(100);
      expect(title.issues).toHaveLength(0);
    });
  });

  describe("meta description", () => {
    it("scores 0 when missing", () => {
      const result = runChecks("<html><head></head><body></body></html>", "https://x.com");
      const meta = result.checks.find((c) => c.id === "meta_description")!;
      expect(meta.score).toBe(0);
      expect(meta.issues[0].severity).toBe("high");
    });

    it("scores 100 for a well-sized description", () => {
      const html = `<html><head><meta name="description" content="${"A".repeat(
        140
      )}"></head><body></body></html>`;
      const result = runChecks(html, "https://x.com");
      const meta = result.checks.find((c) => c.id === "meta_description")!;
      expect(meta.score).toBe(100);
    });
  });

  describe("h1 usage", () => {
    it("scores 0 when no h1 is present", () => {
      const result = runChecks("<html><body><h2>Not an h1</h2></body></html>", "https://x.com");
      const h1 = result.checks.find((c) => c.id === "h1")!;
      expect(h1.score).toBe(0);
    });

    it("scores 50 when multiple h1s are present", () => {
      const result = runChecks(
        "<html><body><h1>One</h1><h1>Two</h1></body></html>",
        "https://x.com"
      );
      const h1 = result.checks.find((c) => c.id === "h1")!;
      expect(h1.score).toBe(50);
      expect(h1.issues[0].message).toContain("2");
    });

    it("scores 100 for exactly one h1", () => {
      const result = runChecks("<html><body><h1>Only One</h1></body></html>", "https://x.com");
      const h1 = result.checks.find((c) => c.id === "h1")!;
      expect(h1.score).toBe(100);
      expect(h1.issues).toHaveLength(0);
    });
  });

  describe("image alt text", () => {
    it("scores 100 when there are no images", () => {
      const result = runChecks("<html><body><p>No images here</p></body></html>", "https://x.com");
      const alt = result.checks.find((c) => c.id === "alt_text")!;
      expect(alt.score).toBe(100);
    });

    it("scores partially when some images are missing alt text", () => {
      const html = `<html><body>
        <img src="a.jpg" alt="Described">
        <img src="b.jpg">
      </body></html>`;
      const result = runChecks(html, "https://x.com");
      const alt = result.checks.find((c) => c.id === "alt_text")!;
      expect(alt.score).toBe(50);
      expect(alt.issues[0].message).toContain("1 of 2");
    });

    it("scores 100 when all images have alt text", () => {
      const html = `<html><body><img src="a.jpg" alt="Described"></body></html>`;
      const result = runChecks(html, "https://x.com");
      const alt = result.checks.find((c) => c.id === "alt_text")!;
      expect(alt.score).toBe(100);
      expect(alt.issues).toHaveLength(0);
    });
  });

  describe("mobile viewport", () => {
    it("scores 0 when the viewport tag is missing", () => {
      const result = runChecks("<html><head></head><body></body></html>", "https://x.com");
      const viewport = result.checks.find((c) => c.id === "viewport")!;
      expect(viewport.score).toBe(0);
    });

    it("scores 100 for a correct viewport tag", () => {
      const html =
        '<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>';
      const result = runChecks(html, "https://x.com");
      const viewport = result.checks.find((c) => c.id === "viewport")!;
      expect(viewport.score).toBe(100);
    });
  });

  describe("links", () => {
    it("scores 100 when there are no links", () => {
      const result = runChecks("<html><body><p>No links</p></body></html>", "https://x.com");
      const links = result.checks.find((c) => c.id === "links")!;
      expect(links.score).toBe(100);
    });

    it("penalizes empty or # hrefs", () => {
      const html = `<html><body>
        <a href="/real-page">Real</a>
        <a href="#">Placeholder</a>
      </body></html>`;
      const result = runChecks(html, "https://x.com");
      const links = result.checks.find((c) => c.id === "links")!;
      expect(links.score).toBe(50);
      expect(links.issues[0].message).toContain("1 of 2");
    });
  });

  describe("overall score", () => {
    it("computes a weighted average across all checks", () => {
      const goodHtml = `<html><head>
        <title>${"A".repeat(55)}</title>
        <meta name="description" content="${"A".repeat(140)}">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head><body>
        <h1>Main heading</h1>
        <img src="a.jpg" alt="Described image">
      </body></html>`;
      const result = runChecks(goodHtml, "https://x.com");
      expect(result.overallScore).toBe(100);
    });

    it("returns a lower score for a poorly optimized page", () => {
      const badHtml = "<html><head><title></title></head><body></body></html>";
      const result = runChecks(badHtml, "https://x.com");
      expect(result.overallScore).toBeLessThan(50);
    });
  });
});