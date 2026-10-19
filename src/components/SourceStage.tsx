"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CompareStep } from "@/lib/types";

/**
 * The top of a source page: info and the opening steps of the case study on
 * the left, the source's image pinned on the right. When a step with an image
 * or excerpt scrolls in, it slides in beside the main image to compare.
 */
export default function SourceStage({
    info,
    image,
    steps,
    shift = false,
  }: {
    info: ReactNode;
    image: { src: string; alt: string; caption?: string };
    steps: CompareStep[];
    shift?: boolean;
  }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const els = ref.current ? Array.from(ref.current.querySelectorAll<HTMLElement>(".stage-step")) : [];
    if (els.length === 0) return;
    let scroller: { destroy: () => void } | undefined;
    let cancelled = false;

    import("scrollama").then(({ default: scrollama }) => {
      if (cancelled) return;
      const s = scrollama();
      s.setup({ step: els, offset: 0.6 })
        .onStepEnter(({ index }) => setActive(index))
        .onStepExit(({ index, direction }) => {
          if (index === 0 && direction === "up") setActive(-1);
        });
      scroller = s;
    });
    return () => {
      cancelled = true;
      scroller?.destroy();
    };
  }, [steps]);

  // What sits beside the main image: the latest item at or before the active step
  let second: CompareStep["item"];
  for (let i = 0; i <= active; i++) if (steps[i]?.item) second = steps[i].item;

  return (
    <section className="stage" ref={ref}>
      <div className="stage-text">
        {info}
        {steps.length > 0 && (
          <div className="stage-steps">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`stage-step ${i === active ? "is-active" : ""}`}
                dangerouslySetInnerHTML={{ __html: s.html }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="stage-visual">
        {shift ? (
          <ShiftStrip image={image} steps={steps} active={active} />
        ) : (
        <div className={`stage-pair ${second ? "is-compare" : ""}`}>
          {/* The main image: always visible */}
          <figure className="stage-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt={image.alt} />
            {image.caption && <figcaption className="credit">{image.caption}</figcaption>}
          </figure>

          {/* What slides in beside it */}
          <figure className="stage-figure stage-second" aria-hidden={!second}>
            {second?.kind === "image" && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={second.src} src={second.src} alt={second.alt} />
                {second.caption && <figcaption className="credit">{second.caption}</figcaption>}
              </>
            )}
            {second?.kind === "excerpt" && (
              <>
                <blockquote
                  key={second.html}
                  className="stage-excerpt"
                  dangerouslySetInnerHTML={{ __html: second.html }}
                />
                {second.cite && <figcaption className="credit">{second.cite}</figcaption>}
              </>
            )}
          </figure>
        </div>
        )}
      </div>
    </section>
  );
}

/**
 * ":::compare shift" mode. The main image and every image or excerpt sit
 * on one strip; two are visible at a time. Each new item slides in on the
 * right and pushes the others left, so the previous one takes the left spot.
 */
function ShiftStrip({
    image,
    steps,
    active,
  }: {
    image: { src: string; alt: string; caption?: string };
    steps: CompareStep[];
    active: number;
  }) {
    const items: NonNullable<CompareStep["item"]>[] = [
      { kind: "image", ...image },
      ...steps.flatMap((s) => (s.item ? [s.item] : [])),
    ];
    // How many items have arrived so far (the main image is always there),
    // and whether a [solo] step has made the latest one fill the space alone
    let shown = 1;
    let solo = false;
    for (let i = 0; i <= active; i++) {
      if (steps[i]?.item) {
        shown++;
        solo = false;
      }
      if (steps[i]?.solo) solo = true;
    }
    const single = shown === 1 || solo;
    const first = single ? shown - 1 : shown - 2; // index of the leftmost visible item
  
    return (
      <div className={`shift ${single ? "" : "is-pair"}`}>
        <div className="shift-track" style={{ ["--offset" as string]: first }}>
          {items.map((item, i) => (
            <figure key={i} className={`shift-cell ${i < shown && i >= first ? "is-visible" : ""}`}>
              {item.kind === "image" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt={item.alt} />
                  {item.caption && <figcaption className="credit">{item.caption}</figcaption>}
                </>
              ) : (
                <>
                  <blockquote className="stage-excerpt" dangerouslySetInnerHTML={{ __html: item.html }} />
                  {item.cite && <figcaption className="credit">{item.cite}</figcaption>}
                </>
              )}
            </figure>
          ))}
        </div>
      </div>
    );
  }