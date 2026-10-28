import type { Metadata } from "next";
import Link from "next/link";
import { Michroma, Share_Tech_Mono } from "next/font/google";
import SiteNav from "@/components/SiteNav";
import HudToggle from "@/components/HudToggle";
import ImageLightbox from "@/components/ImageLightbox";
import "./tokens.css";
import "./globals.css";


export const metadata: Metadata = {
  title: "Sci-Fi Archive",
  description: "An archive of imagined futures and the technology built from them.",
};

// Fonts for the HUD mode. preload: false, so they're only fetched once HUD
// mode is switched on and the CSS actually uses them.
const michroma = Michroma({ subsets: ["latin"], weight: "400", variable: "--hud-display", preload: false });
const shareTech = Share_Tech_Mono({ subsets: ["latin"], weight: "400", variable: "--hud-mono", preload: false });

// Runs before the page paints, so a saved HUD choice doesn't flash
const hudScript = `try{if(localStorage.getItem("hud")==="1")document.documentElement.classList.add("hud")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${michroma.variable} ${shareTech.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: hudScript }} />
      </head>
      <body suppressHydrationWarning>
        {/* Both float over the page: the title inverts whatever is under it */}
        <Link href="/" className="site-title">Torment Nexus</Link>
        <SiteNav />
        <Link href="/about" className="site-about">About</Link>
        <HudToggle />
        <ImageLightbox />
        <main>{children}</main>
      </body>
    </html>
  );
}