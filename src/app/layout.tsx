import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";

const sans = Geist({
  variable: "--font-ui-body",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-ui-code",
  subsets: ["latin"],
});

const themeBootScript = `
(() => {
  const storageKey = "mailroom-theme";
  const root = document.documentElement;
  const saved = window.localStorage.getItem(storageKey);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved === "light" || saved === "dark" ? saved : prefersDark ? "dark" : "light";
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: env.appName,
    template: `%s · ${env.appName}`,
  },
  description:
    "Private temporary mail dashboard with one-click mailbox creation, per-address inboxes, and Vercel-friendly inbound email architecture.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
      </body>
    </html>
  );
}
