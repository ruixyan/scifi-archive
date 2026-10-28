"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * The page title, with a hidden note about a typeface. Hovering the title
 * (or focusing it with the keyboard) re-sets it in that typeface and shows
 * the note as a small card underneath. Clicking or tapping the title keeps
 * it that way until clicked again, which is also how it works on phones.
 */
export default function FontEgg({
  family,
  label,
  note,
  url,
  children,
}: {
  family: string; // the font-family name from @font-face
  label: string; // the typeface's name, shown on the card
  note: string;
  url?: string;
  children: ReactNode; // the title (and its ↗ link)
}) {
  const [pinned, setPinned] = useState(false);

  // Escape lets go of a pinned card
  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPinned(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinned]);

  return (
    <div className={`egg ${pinned ? "is-pinned" : ""}`} style={{ ["--egg-font" as string]: `"${family}"` }}>
      <h1
        className="egg-title"
        tabIndex={0}
        aria-describedby="egg-card"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) return; // the ↗ link still just opens
          setPinned((p) => !p);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPinned((p) => !p);
          }
        }}
      >
        {children}
      </h1>
      <aside className="egg-card" id="egg-card">
        <p className="label">Fun Fact! · {label}</p>
        <p>
          {note}
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="ext-link" aria-label={`About ${label}`}>
              ↗
            </a>
          )}
        </p>
      </aside>
    </div>
  );
}