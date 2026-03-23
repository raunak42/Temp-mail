import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  Instrument_Sans,
  Sora,
} from "next/font/google";
import "./globals.css";
import { env } from "@/lib/env";

const display = Sora({
  variable: "--font-ui-display",
  subsets: ["latin"],
});

const body = Instrument_Sans({
  variable: "--font-ui-body",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ui-code",
  subsets: ["latin"],
  weight: ["400", "500"],
});

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
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
