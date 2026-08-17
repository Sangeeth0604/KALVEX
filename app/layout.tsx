import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KALVEX — Privacy-First File & Document Productivity",
  description:
    "Convert, compress, create, and understand documents with zero server file retention. The technical privacy-first file platform.",
  keywords: [
    "KALVEX",
    "privacy-first",
    "document converter",
    "PDF tools",
    "file compression",
    "private OCR",
    "document AI",
  ],
  authors: [{ name: "KALVEX" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('kalvex_theme') || 'dark';
                  var root = document.documentElement;
                  if (theme === 'system') {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    theme = prefersDark ? 'dark' : 'light';
                  }
                  root.classList.remove('light', 'dark');
                  root.classList.add(theme);
                  root.setAttribute('data-theme', theme);
                  root.style.colorScheme = theme;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text-primary selection:bg-accent-subtle selection:text-accent">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
