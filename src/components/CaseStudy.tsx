"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a case study's HTML, then wires up any :::scrolly sections with
 * Scrollama: as each step's text reaches the middle of the screen, that step
 * is highlighted and the pinned image swaps to match.
 */
export default function CaseStudy({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const blocks = root ? Array.from(root.querySelectorAll<HTMLElement>(".scrolly")) : [];
    if (blocks.length === 0) return;

    let cancelled = false;
    const scrollers: { destroy: () => void }[] = [];

    // Scrollama only runs in the browser, so load it here rather than at the top
    import("scrollama").then(({ default: scrollama }) => {
      if (cancelled) return;

      for (const block of blocks) {
        const steps = Array.from(block.querySelectorAll<HTMLElement>(".scrolly-step"));
        const figures = Array.from(block.querySelectorAll<HTMLElement>(".scrolly-figure"));

        const scroller = scrollama();
        scroller.setup({ step: steps, offset: 0.6 }).onStepEnter(({ element, index }) => {
          steps.forEach((s) => s.classList.toggle("is-active", s === element));

          // Show the latest image that starts at or before this step
          let current = figures[0];
          for (const f of figures) if (Number(f.dataset.step) <= index) current = f;
          figures.forEach((f) => f.classList.toggle("is-active", f === current));
        });
        scrollers.push(scroller);
      }
    });

    return () => {
      cancelled = true;
      scrollers.forEach((s) => s.destroy());
    };
  }, [html]);

  return <div ref={ref} className="case-study-body" dangerouslySetInnerHTML={{ __html: html }} />;
}