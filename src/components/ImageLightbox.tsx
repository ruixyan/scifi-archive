"use client";

import { useEffect, useState } from "react";

// The images that can be expanded: the pinned images at the top of a source
// page, and the figures inside case studies. Add selectors here to include more.
const SELECTOR = ".stage-figure img, .shift-cell img, .case-study-body figure img, .scrolly-figure img";

type Shown = { src: string; alt: string; caption: string };

/**
 * Hover an image: a "Click to expand" label follows the cursor.
 * Click it: the image opens full size in an overlay. Escape, the ×, or a
 * click on the backdrop closes it. One instance in layout.tsx covers every page.
 */
export default function ImageLightbox() {
  const [hint, setHint] = useState<{ x: number; y: number } | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);

  useEffect(() => {
    // The image under the pointer, if it's one that can be expanded and is
    // actually on screen (hidden cells of the sliding strip don't count)
    const target = (el: EventTarget | null) => {
      const img = (el as HTMLElement | null)?.closest?.("img");
      if (!img || !img.matches(SELECTOR)) return null;
      if (img.closest(".shift-cell:not(.is-visible), .stage-second[aria-hidden='true']")) return null;
      return img as HTMLImageElement;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      setHint(target(e.target) ? { x: e.clientX, y: e.clientY } : null);
    };
    const onClick = (e: MouseEvent) => {
      const img = target(e.target);
      if (!img) return;
      e.preventDefault();
      const caption = img.closest("figure")?.querySelector("figcaption")?.textContent ?? "";
      setShown({ src: img.currentSrc || img.src, alt: img.alt, caption });
      setHint(null);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("click", onClick);
    };
  }, []);

  // While open: Escape closes, and the page behind doesn't scroll
  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShown(null);
    window.addEventListener("keydown", onKey);
    document.documentElement.classList.add("lightbox-open");
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("lightbox-open");
    };
  }, [shown]);

  return (
    <>
      {hint && !shown && (
        <span className="lightbox-hint" style={{ left: hint.x, top: hint.y }} aria-hidden="true">
          Click to expand
        </span>
      )}
      {shown && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={shown.alt} onClick={() => setShown(null)}>
          <button className="lightbox-close" aria-label="Close" onClick={() => setShown(null)}>
            ×
          </button>
          <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown.src} alt={shown.alt} />
            {shown.caption && <figcaption>{shown.caption}</figcaption>}
          </figure>
        </div>
      )}
    </>
  );
}