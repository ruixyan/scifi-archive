import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Futures Archive",
  description: "An annotated archive of imagined futures and the technology built from them.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="site-title">Sci-Fi Archive</Link>
          <nav className="site-nav">
            {/* <Link href="/">Archive</Link>*/}
            <Link href="/">Split View</Link>
            {/* <Link href="/timeline">Timeline</Link> */}
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
