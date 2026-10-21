"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TechItem } from "@/lib/types";

/**
 * The small "Built" cards on a source page. Clicking one slides in a panel
 * from the right with the full details. On wide screens the page moves over
 * to make room; on narrow ones the panel covers it. Escape, the × or the
 * shaded page closes it; ← and → step through the items. A link ending in
 * #tech-<id> (e.g. from the timeline) opens that item's panel directly.
 */
export default function TechPanel({
  tech,
  sourceTitle,
  sourceYear,
}: {
  tech: TechItem[];
  sourceTitle: string;
  sourceYear: number;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const index = tech.findIndex((t) => t.id === openId);
  const item = index >= 0 ? tech[index] : null;

  const open = useCallback((id: string | null) => {
    setOpenId(id);
    history.replaceState(null, "", id ? `#tech-${id}` : location.pathname + location.search);
  }, []);

  // Open from the URL, e.g. /source/star-trek#tech-motorola-startac
  useEffect(() => {
    const fromHash = () => {
      const id = location.hash.replace("#tech-", "");
      if (id && tech.some((t) => t.id === id)) setOpenId(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tech]);

  // While open, the page makes room for the panel (see .tech-panel-open in CSS)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("tech-panel-open", !!item);
    return () => root.classList.remove("tech-panel-open");
  }, [item]);

  // Keyboard: Escape closes, arrows step through
  useEffect(() => {
    if (!item) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") open(null);
      if (e.key === "ArrowRight" && index < tech.length - 1) open(tech[index + 1].id);
      if (e.key === "ArrowLeft" && index > 0) open(tech[index - 1].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, index, tech, open]);

  return (
    <>
      <ul className="mini-cards">
        {tech.map((t) => (
          <li key={t.id}>
            <button className={`mini-card ${t.id === openId ? "is-open" : ""}`} onClick={() => open(t.id)}>
              <Thumb tech={t} className="mini-thumb" />
              <span className="mini-year">{t.year}</span>
              <span className="mini-name">{t.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className={`tech-panel-shade ${item ? "is-open" : ""}`} onClick={() => open(null)} aria-hidden="true" />

      <aside
        className={`tech-panel ${item ? "is-open" : ""}`}
        role="dialog"
        aria-hidden={!item}
        aria-label={item?.name ?? "Technology"}
      >
        {item && (
          <div className="tech-panel-inner" key={item.id}>
            <div className="tech-panel-top">
              <span className="label">
                Built from {sourceTitle} · {index + 1} of {tech.length}
              </span>
              <button ref={closeRef} className="tech-panel-close" onClick={() => open(null)} aria-label="Close">
                ×
              </button>
            </div>

            <Thumb tech={item} className="tech-panel-thumb" />

            <span className="built-meta">
              {item.year} · {item.kind}
            </span>
            <h3>
              {item.name}
              {item.url && (
                <a href={item.url} target="_blank" rel="noreferrer" className="ext-link" aria-label={`About ${item.name}`}>
                  ↗
                </a>
              )}
            </h3>
            {item.maker && <p className="muted built-maker">{item.maker}</p>}
            <p className="built-desc">{item.description}</p>
            <p className="mono muted built-gap">
              {item.year - sourceYear >= 0
                ? `${item.year - sourceYear} years after ${sourceTitle}`
                : `${sourceYear - item.year} years before ${sourceTitle}`}
            </p>

            {item.references && item.references.length > 0 && (
              <>
                <p className="label tech-panel-sources">Sources</p>
                <ul className="evidence">
                  {item.references.map((r) => (
                    <li key={r.title}>
                      {r.year && <span className="year">{r.year}</span>}
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer">
                          {r.title}
                        </a>
                      ) : (
                        r.title
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="tech-panel-nav">
              <button disabled={index === 0} onClick={() => open(tech[index - 1].id)}>
                ← Previous
              </button>
              <button disabled={index === tech.length - 1} onClick={() => open(tech[index + 1].id)}>
                Next →
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function Thumb({ tech, className }: { tech: TechItem; className: string }) {
  return (
    <span className={`${className} ${tech.image ? "" : "is-empty"}`}>
      {tech.image && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={tech.image} alt={tech.imageAlt ?? tech.name} loading="lazy" />
      )}
    </span>
  );
}