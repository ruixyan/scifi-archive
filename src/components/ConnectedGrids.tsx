"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BuiltTech, Connection, Source } from "@/lib/types";

type Side = "source" | "tech";
type Selection = { side: Side; slug: string } | null;

/**
 * Two archives side by side, each scrolling on its own: sources (fiction)
 * on the left, built tech on the right. On phones they stack, and each
 * scrolls sideways. Selecting an item moves it to the start of its column;
 * on the other side, the items it's connected to move to the start,
 * enlarged, and everything else is greyed out.
 * Click the selected item again, or press Escape, to clear.
 * The divider between the two sides can be dragged to resize them.
 */
export default function ConnectedGrids({
  sources,
  tech,
  connections,
}: {
  sources: Source[];
  tech: BuiltTech[];
  connections: Connection[];
}) {
  const [selected, setSelected] = useState<Selection>(null);
  // Where the middle divider sits, as a % of the width (50 = even split)
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);
  const connectRef = useRef<HTMLDivElement>(null);
  const sourceCol = useRef<HTMLDivElement>(null);
  const techCol = useRef<HTMLDivElement>(null);

  // Lookups: slug → connections, for both directions
  const bySource = useMemo(() => group(connections, (c) => c.source), [connections]);
  const byTech = useMemo(() => group(connections, (c) => c.tech), [connections]);

  // The connections that apply to the opposite side of the selection
  const links: Connection[] = selected
    ? (selected.side === "source" ? bySource : byTech).get(selected.slug) ?? []
    : [];

  const isLinkedSource = (slug: string) => selected?.side === "tech" && links.some((l) => l.source === slug);
  const isLinkedTech = (id: string) => selected?.side === "source" && links.some((l) => l.tech === id);

  // Escape clears the selection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function select(side: Side, slug: string) {
    const isSame = selected?.side === side && selected.slug === slug;
    setSelected(isSame ? null : { side, slug });
    setSplit(50); // selecting anything evens the two sides out again
  }

  // Dragging the divider: the split follows the pointer, kept between 20%
  // and 80% so neither side disappears. Double-click puts it back to 50/50.
  const MIN = 20;
  const MAX = 80;
  const TICKS = [20, 30, 40, 50, 60, 70, 80];
  const SNAP = 1.5; // how close (in %) the divider has to get before it snaps to a tick
  function onDividerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }
  function onDividerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const rect = connectRef.current?.getBoundingClientRect();
    if (!rect) return;
    let pct = ((e.clientX - rect.left) / rect.width) * 100;
    pct = Math.min(Math.max(pct, MIN), MAX);
    // snap to the nearest tick when close enough
    const near = TICKS.find((t) => Math.abs(t - pct) <= SNAP);
    setSplit(near ?? pct);
  }
  function onDividerKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === "ArrowLeft") setSplit((v) => Math.max(v - step, MIN));
    if (e.key === "ArrowRight") setSplit((v) => Math.min(v + step, MAX));
    if (e.key === "Home" || e.key === "Enter") setSplit(50);
  }

  // The selected card moves to the start of its column, and the other
  // column shows its connections first: scroll both back to the start.
  // This runs after the cards have re-ordered, so the scroll lands on them.
  // (left: 0 is for phones, where each side is a sideways strip)
  useEffect(() => {
    if (!selected) return;
    sourceCol.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    techCol.current?.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [selected]);

  // Phones only, first visit only: a short intro that shows each strip
  // scrolls sideways. Both strips nudge right and back, and a label sits on
  // each for a few seconds. A real swipe, or the timer, ends it for good.
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    try {
      if (localStorage.getItem("swipe-hint")) return;
    } catch {}
    setHint(true);
    const cols = [sourceCol.current, techCol.current].filter((c): c is HTMLDivElement => !!c);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const done = () => {
      setHint(false);
      try {
        localStorage.setItem("swipe-hint", "1");
      } catch {}
    };
    const timers = [
      setTimeout(() => !still && cols.forEach((c) => c.scrollTo({ left: 90, behavior: "smooth" })), 800),
      setTimeout(() => !still && cols.forEach((c) => c.scrollTo({ left: 0, behavior: "smooth" })), 1500),
      // listen for a real swipe only after the nudge has finished
      setTimeout(() => cols.forEach((c) => c.addEventListener("scroll", done, { once: true, passive: true })), 2300),
      setTimeout(done, 6000),
    ];
    return () => {
      timers.forEach(clearTimeout);
      cols.forEach((c) => c.removeEventListener("scroll", done));
    };
  }, []);

  return (
    <div className="connect-page">
      {hint && (
        <>
          <span className="swipe-hint swipe-hint--top" aria-hidden="true">Swipe for sources <i>→</i></span>
          <span className="swipe-hint swipe-hint--bottom" aria-hidden="true">Swipe for inventions <i>→</i></span>
        </>
      )}
      <div
        className={`connect ${dragging ? "is-resizing" : ""}`}
        ref={connectRef}
        style={{ ["--split" as string]: split }}
      >
        {/* Tick marks along the top that the divider snaps to (hidden on phones) */}
        <div className="connect-ticks" aria-hidden="true">
          {TICKS.map((t) => (
            <span
              key={t}
              className={`${t === 50 ? "is-mid" : ""} ${split === t ? "is-on" : ""}`}
              style={{ left: `${t}%` }}
            />
          ))}
        </div>

        {/* The draggable middle divider (hidden on phones) */}
        <div
          className="connect-divider"
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize the two sides"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={Math.round(split)}
          tabIndex={0}
          onPointerDown={onDividerDown}
          onPointerMove={onDividerMove}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onDoubleClick={() => setSplit(50)}
          onKeyDown={onDividerKey}
        />

        {/* ---------- Sources ---------- */}
        <section className="connect-col connect-col--source" ref={sourceCol} aria-label="Sources">
          <div className="connect-grid">
            {sources.map((e) => {
              const isSelected = selected?.side === "source" && selected.slug === e.slug;
              return (
                <article
                  key={e.slug}
                  className={`connect-card ${isSelected ? "is-selected" : ""} ${isLinkedSource(e.slug) ? "is-linked" : ""}`}
                >
                  <button className="connect-hit" onClick={() => select("source", e.slug)} aria-pressed={isSelected}>
                    <div className="connect-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={e.image} alt={e.imageAlt} loading="lazy" />
                    </div>
                    <span className="connect-year">{e.year}</span>
                    <h3>{e.title}</h3>
                    {e.creator && <p className="muted">{e.creator}</p>}
                    {e.invention && <p className="muted">{e.invention}</p>}
                    <LinkMeta count={bySource.get(e.slug)?.length ?? 0} unit="inspired" />
                  </button>
                  {isSelected && (
                    <Link href={`/source/${e.slug}`} className="connect-open">
                      Open the source →
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* ---------- Built tech ---------- */}
        <section className="connect-col connect-col--tech" ref={techCol} aria-label="Built technology">
          <div className="connect-grid">
            {tech.map((t) => {
              const isSelected = selected?.side === "tech" && selected.slug === t.id;
              return (
                <article
                  key={t.id}
                  className={`connect-card ${isSelected ? "is-selected" : ""} ${isLinkedTech(t.id) ? "is-linked" : ""}`}
                >
                  <button className="connect-hit" onClick={() => select("tech", t.id)} aria-pressed={isSelected}>
                    <div className={`connect-thumb ${t.image ? "" : "connect-thumb--type"}`}>
                      {t.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={t.image} alt={t.imageAlt ?? t.name} loading="lazy" />
                      ) : (
                        <span className="connect-bigyear">{t.year}</span>
                      )}
                    </div>
                    <span className="connect-year">
                      {t.year} · {t.kind}
                    </span>
                    <h3>{t.name}</h3>
                    {t.maker && <p className="muted">{t.maker}</p>}
                    <LinkMeta count={byTech.get(t.id)?.length ?? 0} unit="source" />
                  </button>
                  {isSelected && (
                    <div className="connect-detail">
                      <p>{t.description}</p>
                      {/* One link per source this tech is linked to; each opens
                          that source's page with this tech's panel already open */}
                      {(byTech.get(t.id) ?? []).map((c) => {
                        const src = sources.find((s) => s.slug === c.source);
                        return (
                          src && (
                            <Link key={c.source} href={`/source/${c.source}#tech-${t.id}`} className="connect-open">
                              Open in {src.title} →
                            </Link>
                          )
                        );
                      })}
                      {t.url && (
                        <a href={t.url} target="_blank" rel="noreferrer" className="connect-open">
                          External source ↗
                        </a>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function LinkMeta({ count, unit }: { count: number; unit: "inspired" | "source" }) {
  return (
    <span className="connect-meta muted">
      {unit === "inspired" ? `${count} inspired` : `${count} ${count === 1 ? "source" : "sources"}`}
    </span>
  );
}

function group(list: Connection[], key: (c: Connection) => string) {
  const map = new Map<string, Connection[]>();
  for (const c of list) map.set(key(c), [...(map.get(key(c)) ?? []), c]);
  return map;
}