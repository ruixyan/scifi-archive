import type { Metadata } from "next";
import Link from "next/link";
import { Barlow_Condensed, Share_Tech_Mono, Shippori_Mincho_B1 } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import HudToggle from "@/components/HudToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sci-Fi Archive",
  description: "An archive of imagined futures and the technology built from them.",
};

// Fonts for the HUD mode. preload: false, so they're only fetched once HUD
// mode is switched on and the CSS actually uses them.
const mincho = Shippori_Mincho_B1({ subsets: ["latin"], weight: "800", variable: "--hud-display", preload: false });
const shareTech = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--hud-mono", preload: false });
const condensed = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "700"], variable: "--hud-label", preload: false });

// Runs before the page paints, so a saved HUD choice doesn't flash
const hudScript = `try{if(localStorage.getItem("hud")==="1")document.documentElement.classList.add("hud")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${mincho.variable} ${shareTech.variable} ${condensed.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: hudScript }} />
      </head>
      <body suppressHydrationWarning>
        {/* Both float over the page: the title inverts whatever is under it */}
        <Link href="/" className="site-title">Sci-Fi Archive</Link>
        <SiteNav />
        <Link href="/about" className="site-about">About</Link>
        <HudToggle />
        <main>{children}</main>
      </body>
    </html>
  );
}