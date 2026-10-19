"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BuiltTech, Connection, Source } from "@/lib/types";

type Side = "source" | "tech";
type Selection = { side: Side; slug: string } | null;

/**
 * Two archives side by side, each scrolling on its own: sources (fiction)
 * on the left, built tech on the right. Selecting an item moves it to the
 * top of its column; on the other side, the items it's connected to move
 * to the top, enlarged, and everything else is greyed out underneath.
 * Click the selected item again, or press Escape, to clear.
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
  const [mobileSide, setMobileSide] = useState<Side>("source");
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
    if (isSame) return;

    // The selected card and its connections move to the top: scroll both up
    sourceCol.current?.scrollTo({ top: 0, behavior: "smooth" });
    techCol.current?.scrollTo({ top: 0, behavior: "smooth" });

    // On phones only one column shows at a time, so jump to the results
    if (window.matchMedia("(max-width: 760px)").matches) {
      setMobileSide(side === "source" ? "tech" : "source");
    }
  }

  return (
    <div className="connect-page" data-mobile-side={mobileSide}>
      <div className="connect-tabs" role="tablist">
        <button role="tab" aria-selected={mobileSide === "source"} onClick={() => setMobileSide("source")}>
          Source
        </button>
        <button role="tab" aria-selected={mobileSide === "tech"} onClick={() => setMobileSide("tech")}>
          Built
        </button>
      </div>

      <div className="connect">
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
                    <LinkMeta count={bySource.get(e.slug)?.length ?? 0} unit="built" />
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
                      {t.url && (
                        <a href={t.url} target="_blank" rel="noreferrer" className="connect-open">
                          Source →
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

function LinkMeta({ count, unit }: { count: number; unit: "built" | "source" }) {
  return (
    <span className="connect-meta muted">
      {unit === "built" ? `${count} built` : `${count} ${count === 1 ? "source" : "sources"}`}
    </span>
  );
}

function group(list: Connection[], key: (c: Connection) => string) {
  const map = new Map<string, Connection[]>();
  for (const c of list) map.set(key(c), [...(map.get(key(c)) ?? []), c]);
  return map;
}