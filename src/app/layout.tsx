import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sci-Fi Archive",
  description: "An archive of imagined futures and the technology built from them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
    <body suppressHydrationWarning>
        {/* Both float over the page: the title inverts whatever is under it */}
        <Link href="/" className="site-title">Sci-Fi Archive</Link>
        <SiteNav />
        <Link href="/about" className="site-about">About</Link>
        <main>{children}</main>
      </body>
    </html>
  );
}