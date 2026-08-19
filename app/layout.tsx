import type { Metadata } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEO Audit Dashboard",
  description: "Audit any URL for on-page SEO issues and get an actionable score.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-surface-border px-4 py-4 text-center text-xs text-foreground/70 sm:px-6">
          SEO Audit Dashboard — capstone project
        </footer>
      </body>
    </html>
  );
}
