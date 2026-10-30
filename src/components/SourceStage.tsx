"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CompareStep } from "@/lib/types";
import AudioClip from "./AudioClip";
import StageVideo from "./StageVideo";

/**
 * The top of a source page: info and the opening steps of the case study on
 * the left, the source's image pinned on the right. When a step with an
 * image, video or excerpt scrolls in, it slides in beside the main image.
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
              {second?.kind === "video" && (
                <>
                  <StageVideo key={second.src} src={second.src} title={second.caption} />
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
                  {second.audio && <AudioClip key={second.audio} src={second.audio} />}
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
 * ":::compare shift" mode. The main image and every image, video or excerpt
 * sit on one strip; two are visible at a time. Each new item slides in on
 * the right and pushes the others left, so the previous one takes the left
 * spot. A swap doesn't add a cell: it replaces an item already on screen.
 * When one of the two visible items is a video, it gets the wider share.
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
  type Item = NonNullable<CompareStep["item"]>;
  // Each cell holds one or more versions; a swap adds a version to a cell
  const cells: { step: number; item: Item }[][] = [[{ step: -1, item: { kind: "image", ...image } }]];
  // How many cells have arrived, and whether the latest fills the space
  // alone, after each step (index 0 = before any step)
  const state = [{ shown: 1, solo: false }];
  let shown = 1;
  let solo = false;
  steps.forEach((s, i) => {
    if (s.item) {
      // the cells on screen right now
      const firstVisible = solo || shown === 1 ? shown - 1 : shown - 2;
      let target = -1;
      if (s.swap === "left") target = firstVisible;
      else if (s.swap === "right") target = shown - 1;
      else if (s.swap) {
        for (let c = shown - 1; c >= firstVisible; c--) {
          if (cells[c][0].item.kind === s.item.kind) { target = c; break; }
        }
      }
      if (target >= 0) cells[target].push({ step: i, item: s.item });
      else {
        cells.splice(shown, 0, [{ step: i, item: s.item }]);
        shown++;
        solo = false;
      }
    }
    if (s.solo) solo = true;
    state.push({ shown, solo });
  });

  const now = state[active + 1] ?? state[0];
  const single = now.shown === 1 || now.solo;
  const first = single ? now.shown - 1 : now.shown - 2; // index of the leftmost visible cell

  // The latest version of a cell that has scrolled in (or the first, before then)
  const currentOf = (versions: { step: number; item: Item }[]) =>
    [...versions].reverse().find((v) => v.step <= active) ?? versions[0];
  // When exactly one of the two visible items is a video, it gets the wider share
  const videosOnScreen = single
    ? 0
    : cells.slice(first, now.shown).filter((v) => currentOf(v).item.kind === "video").length;
  const widen = videosOnScreen === 1;

  return (
    <div className={`shift ${single ? "" : "is-pair"}`}>
      <div className="shift-track" style={{ ["--offset" as string]: first, ["--last" as string]: now.shown - 1 }}>
        {cells.map((versions, i) => {
          const current = currentOf(versions);
          const item = current.item;
          const swapped = current !== versions[0];
          const visible = i < now.shown && i >= first;
          const size = visible && widen ? (item.kind === "video" ? "is-wide" : "is-narrow") : "";
          return (
            <figure key={i} className={`shift-cell ${visible ? "is-visible" : ""} ${size}`}>
              {item.kind === "image" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img key={current.step} src={item.src} alt={item.alt} className={swapped ? "is-swap" : ""} />
                  {item.caption && (
                    <figcaption key={`c${current.step}`} className={`credit ${swapped ? "is-swap" : ""}`}>
                      {item.caption}
                    </figcaption>
                  )}
                </>
              ) : item.kind === "video" ? (
                <>
                  {/* only loaded while on screen, so it starts when it slides in and stops when it slides away */}
                  <StageVideo key={current.step} src={item.src} title={item.caption} active={visible} />
                  {item.caption && <figcaption className="credit">{item.caption}</figcaption>}
                </>
              ) : (
                <>
                  <blockquote
                    key={current.step}
                    className={`stage-excerpt ${swapped ? "is-swap" : ""}`}
                    dangerouslySetInnerHTML={{ __html: item.html }}
                  />
                  {item.audio && <AudioClip key={`a${current.step}`} src={item.audio} />}
                  {item.cite && (
                    <figcaption key={`c${current.step}`} className={`credit ${swapped ? "is-swap" : ""}`}>
                      {item.cite}
                    </figcaption>
                  )}
                </>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}