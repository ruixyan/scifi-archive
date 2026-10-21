"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

/**
 * A small note about a typeface, with a button that re-sets the whole page
 * in it. Leaving the page puts everything back.
 */
export default function FontEgg({
  family,
  label,
  note,
  url,
}: {
  family: string; // the font-family name from @font-face
  label: string; // the name shown on the button
  note: string;
  url?: string;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--egg-font", `"${family}"`);
    root.classList.toggle("font-egg", on);
    return () => root.classList.remove("font-egg");
  }, [on, family]);

  function toggle() {
    const flip = () => flushSync(() => setOn((v) => !v));
    // Cross-fade the switch where the browser supports it
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition) doc.startViewTransition(flip);
    else flip();
  }

  return (
    <aside className="font-egg-note">
      <p className="label">A note on type</p>
      <p>
        {note}
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="ext-link" aria-label={`About ${label}`}>
            ↗
          </a>
        )}
      </p>
      <button onClick={toggle} aria-pressed={on}>
        {on ? "Back to normal" : `Set this page in ${label}`}
      </button>
    </aside>
  );
}