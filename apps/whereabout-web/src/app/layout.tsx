import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const fraunces = localFont({
  src: "../fonts/Fraunces-Variable.ttf",
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = localFont({
  src: "../fonts/DMSans-Variable.ttf",
  variable: "--font-dm-sans",
  display: "swap",
});

const dmMono = localFont({
  src: [
    { path: "../fonts/DMMono-Regular.ttf", weight: "400" },
    { path: "../fonts/DMMono-Medium.ttf", weight: "500" },
  ],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "whereabout",
  description: "Hand-curated travel facts, country by country.",
};

// Umami Cloud; unset outside prod builds.
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body>
        {children}
        {umamiWebsiteId && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id={umamiWebsiteId}
            data-domains="www.whereabout.world"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
