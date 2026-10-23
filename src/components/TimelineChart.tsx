"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Source, TechItem } from "@/lib/types";

type Pin = { slug: string; techId: string } | null;

const MIN_SPAN = 10; // never zoom in closer than 10 years across

/**
 * One row per source: a hollow dot for when it appeared, coloured dots for
 * the tech built from it, and a line for the gap between.
 *
 * - Scroll up/down (or pinch) to zoom around the mouse; double-click to
 *   zoom in; 0 resets. Drag sideways (or scroll sideways) to pan.
 * - Hover a row to focus it; hover a dot for a card, click to pin it.
 * - A year cursor follows the mouse across the chart.
 */
export default function TimelineChart({ sources, start, end }: { sources: Source[]; start: number; end: number }) {
  const full = end - start;
  const [view, setView] = useState<[number, number]>([start, end]);
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [hoverTech, setHoverTech] = useState<{ slug: string; techId: string } | null>(null);
  const [pinned, setPinned] = useState<Pin>(null);
  const [cursor, setCursor] = useState<{ x: number; year: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const axisRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; view: [number, number]; moved: boolean } | null>(null);

  const span = view[1] - view[0];
  const zoomed = span < full - 0.01;
  const pos = (year: number) => ((year - view[0]) / span) * 100;
  const inView = (year: number) => year >= view[0] && year <= view[1];
  const clamp = (pct: number) => Math.min(Math.max(pct, 0), 100);

  // Keep a window of `newSpan` years inside the full range
  const place = useCallback(
    (from: number, newSpan: number): [number, number] => {
      const s = Math.min(Math.max(newSpan, MIN_SPAN), full);
      const f = Math.min(Math.max(from, start), end - s);
      return [f, f + s];
    },
    [start, end, full],
  );

  // Zoom by `factor` (<1 zooms in) around a point `frac` (0–1) across the chart
  const zoomAt = useCallback(
    (factor: number, frac = 0.5) =>
      setView(([a, b]) => {
        const s = b - a;
        const center = a + frac * s;
        const ns = Math.min(Math.max(s * factor, MIN_SPAN), full);
        return place(center - frac * ns, ns);
      }),
    [place, full],
  );

  const fracAt = (clientX: number) => {
    const rect = axisRef.current?.getBoundingClientRect();
    return rect ? (clientX - rect.left) / rect.width : 0.5;
  };

  // Ticks: pick a step that keeps them readable at any zoom
  const step = span > 120 ? 20 : span > 60 ? 10 : span > 25 ? 5 : span > 12 ? 2 : 1;
  const ticks: number[] = [];
  for (let y = Math.ceil(view[0] / step) * step; y <= view[1]; y += step) ticks.push(y);

  const rows = [...sources].sort((a, b) => a.year - b.year);
  const focusTech = pinned?.techId ?? hoverTech?.techId ?? null;

  // Scrolling up/down zooms around the mouse (pinch too); scrolling
  // sideways pans. Needs a non-passive listener to stop the page scrolling.
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = axisRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        setView(([a, b]) => place(a + (e.deltaX / rect.width) * (b - a), b - a));
      } else {
        const frac = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        // pinch sends small deltas, so it gets a stronger factor
        zoomAt(Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), frac);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, place]);

  // Keyboard: Escape unpins; + / − zoom; 0 resets
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPinned(null);
      if (e.key === "+" || e.key === "=") zoomAt(0.7);
      if (e.key === "-" || e.key === "_") zoomAt(1 / 0.7);
      if (e.key === "0") setView([start, end]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomAt, start, end]);

  // Drag to pan
  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button, a, .tl-card")) return;
    drag.current = { x: e.clientX, view, moved: false };
  }
  function onPointerMove(e: React.PointerEvent) {
    const rect = axisRef.current?.getBoundingClientRect();
    if (rect) {
      const frac = (e.clientX - rect.left) / rect.width;
      setCursor(frac < 0 || frac > 1 ? null : { x: frac * 100, year: Math.round(view[0] + frac * span) });
    }
    const d = drag.current;
    if (!d || !rect) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 4) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    const s = d.view[1] - d.view[0];
    setView(place(d.view[0] - (dx / rect.width) * s, s));
  }
  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  return (
    <div className="tl" onClick={() => setPinned(null)}>
      <div className="timeline">
        <div
          ref={innerRef}
          className={`timeline-inner ${zoomed ? "is-zoomed" : ""} ${dragging ? "is-dragging" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onMouseLeave={() => setCursor(null)}
          onDoubleClick={(e) => {
            if ((e.target as HTMLElement).closest("button, a, .tl-card")) return;
            zoomAt(0.5, Math.min(Math.max(fracAt(e.clientX), 0), 1));
          }}
        >
          <div className="axis" ref={axisRef}>
            {ticks.map((y) => (
              <span key={y} className="tick" style={{ left: `${pos(y)}%` }}>
                {y}
              </span>
            ))}
          </div>

          {/* Year cursor over the whole chart */}
          {cursor && (
            <div className="tl-cursor-layer" aria-hidden="true">
              <span className="tl-cursor" style={{ left: `${cursor.x}%` }} />
              <span className="tl-cursor-year" style={{ left: `${cursor.x}%` }}>{cursor.year}</span>
            </div>
          )}

          {rows.map((s, rowIndex) => {
            const years = s.tech.map((t) => t.year);
            const first = Math.min(s.year, ...years);
            const last = Math.max(s.year, ...years);
            const hasFocus = focusTech ? s.tech.some((t) => t.id === focusTech) : hoverRow === s.slug;
            const dim = focusTech ? !hasFocus : hoverRow !== null && hoverRow !== s.slug;
            return (
              <div
                key={s.slug}
                className={`row ${dim ? "is-dim" : ""} ${hasFocus ? "is-focus" : ""}`}
                onMouseEnter={() => setHoverRow(s.slug)}
                onMouseLeave={() => setHoverRow(null)}
              >
                <Link href={`/source/${s.slug}`} className="row-label">
                  {s.title}
                  {s.creator && (
                    <>
                      <br />
                      <span className="muted mono" style={{ fontSize: 11 }}>{s.creator}</span>
                    </>
                  )}
                </Link>
                <div className="track">
                  <span
                    className="gap-line"
                    style={{ left: `${clamp(pos(first))}%`, width: `${clamp(pos(last)) - clamp(pos(first))}%` }}
                  />
                  {inView(s.year) && (
                    <>
                      <span className="point fiction" style={{ left: `${pos(s.year)}%` }} />
                      <span className="point-tip" style={{ left: `${pos(s.year)}%` }}>{s.year}</span>
                    </>
                  )}

                  {s.tech.map((t) => {
                    if (!inView(t.year)) return null;
                    const isPinned = pinned?.slug === s.slug && pinned.techId === t.id;
                    const isHovered = hoverTech?.slug === s.slug && hoverTech.techId === t.id;
                    return (
                      <span key={t.id}>
                        <button
                          className={`point tech ${focusTech === t.id ? "is-hot" : ""}`}
                          style={{ left: `${pos(t.year)}%` }}
                          aria-label={`${t.year}: ${t.name}`}
                          onMouseEnter={() => setHoverTech({ slug: s.slug, techId: t.id })}
                          onMouseLeave={() => setHoverTech(null)}
                          onFocus={() => setHoverTech({ slug: s.slug, techId: t.id })}
                          onBlur={() => setHoverTech(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPinned(isPinned ? null : { slug: s.slug, techId: t.id });
                          }}
                        />
                        {hoverRow === s.slug && !isPinned && !isHovered && (
                          <span className="point-tip is-tech" style={{ left: `${pos(t.year)}%` }}>{t.year}</span>
                        )}
                        {(isPinned || (isHovered && !pinned)) && (
                          <TechCard tech={t} source={s} left={pos(t.year)} full={isPinned} below={rowIndex < 2} />
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="tl-hint mono muted">Scroll to zoom · drag to pan · double-click to zoom in · 0 to reset</p>
    </div>
  );
}

function TechCard({
  tech,
  source,
  left,
  full,
  below,
}: {
  tech: TechItem;
  source: Source;
  left: number;
  full: boolean;
  below: boolean; // the top rows open their card downwards so it isn't cut off
}) {
  const diff = tech.year - source.year;
  // Keep the card on screen near the edges
  const align = left > 75 ? "right" : left < 15 ? "left" : "center";
  return (
    <div className={`tl-card tl-card--${align} ${below ? "is-below" : ""}`} style={{ left: `${left}%` }} onClick={(e) => e.stopPropagation()}>
      <span className="tl-card-year">{tech.year}{tech.maker && <> · {tech.maker}</>}</span>
      <strong>{tech.name}</strong>
      <span className="muted">
        {diff >= 0 ? `${diff} years after` : `${-diff} years before`} {source.title}
      </span>
      {full && tech.description && <p>{tech.description}</p>}
      {full && (
        <Link href={`/source/${source.slug}#tech-${tech.id}`} className="connect-open">
          Open the source →
        </Link>
      )}
      {!full && <span className="tl-card-hint">Click to pin</span>}
    </div>
  );
}