import type { Metadata } from "next";
import { Playfair_Display, Inter, Outfit } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  style: ["normal", "italic"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const PITCH =
  "Surfacing thousands of real health-insurance plans for a fraction of the price, matched to millions of providers and your medications, in seconds. Built with Claude and Opus 4.8.";

export const metadata: Metadata = {
  metadataBase: new URL("https://florence-claude-hackathon.vercel.app"),
  title: "Florence — your real, subsidized health-insurance price",
  description: PITCH,
  openGraph: {
    title: "Florence — Healthcare.gov showed me $960/mo. I'm paying $7.",
    description: PITCH,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Florence", description: PITCH },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} ${outfit.variable}`}
      >
        <div className="af-root">{children}</div>
      </body>
    </html>
  );
}
