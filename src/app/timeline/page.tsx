import Link from "next/link";
import { getSources, getYearRange } from "@/lib/content";

export const metadata = { title: "Timeline — Futures Archive" };

/**
 * One row per source: a hollow dot for when it appeared, coloured dots for
 * the tech built from it, and a line showing the gap between.
 */
export default function TimelinePage() {
  const sources = getSources();
  const [start, end] = getYearRange(sources);
  const pos = (year: number) => ((year - start) / (end - start)) * 100;

  const ticks: number[] = [];
  for (let y = start; y <= end; y += 10) ticks.push(y);

  return (
    <>
      <section className="intro">
        <h1>From fiction to product.</h1>
        <p>
          The hollow dot is when the source appeared; coloured dots are the technology built from it,
          coloured by verdict.
        </p>
      </section>

      <div className="timeline">
        <div className="timeline-inner">
          <div className="axis">
            {ticks.map((y) => (
              <span key={y} className="tick" style={{ left: `${pos(y)}%` }}>
                {y}
              </span>
            ))}
          </div>

          {sources.map((s) => {
            const years = s.tech.map((t) => t.year);
            const first = Math.min(s.year, ...years);
            const last = Math.max(s.year, ...years);
            return (
              <div key={s.slug} className="row">
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
                  <span className="gap-line" style={{ left: `${pos(first)}%`, width: `${pos(last) - pos(first)}%` }} />
                  <span className="point fiction" style={{ left: `${pos(s.year)}%` }} title={`${s.year}: ${s.title}`} />
                  {s.tech.map((t) => (
                    <span
                      key={t.id}
                      className="point"
                      style={{ left: `${pos(t.year)}%`, background: "var(--pencil)" }}
                      title={`${t.year}: ${t.name}`}
                    />
                  ))}
                  <span className="point-tip" style={{ left: `${pos(s.year)}%` }}>{s.year}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
