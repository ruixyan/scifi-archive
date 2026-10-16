import Link from "next/link";
import type { Source } from "@/lib/types";

/** The archive of sources. Images keep their own proportions; each row
 *  lines its images up along the bottom so the captions start level. */
export default function ArchiveGrid({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return <p className="empty">No sources yet.</p>;

  return (
    <div className="grid">
      {sources.map((s) => (
        <Link key={s.slug} href={`/source/${s.slug}`} className="card">
          <div className="card-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt={s.imageAlt} loading="lazy" />
          </div>
          <div className="card-text">
            <h2>{s.title}</h2>
            <p className="muted">
              <span className="mono">{s.year}</span>
              {s.creator && <> · {s.creator}</>}
            </p>
            {s.tech.length > 0 && <p className="card-built mono">→ {s.tech.map((t) => t.name).join(", ")}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}