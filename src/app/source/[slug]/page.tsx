import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseStudy from "@/components/CaseStudy";
import SourceStage from "@/components/SourceStage";
import { compareShifts, getCaseStudy, getCompare, getSource, getSources, getTropes } from "@/lib/content";

type Params = { params: Promise<{ slug: string }> };

const MEDIUM_LABELS: Record<string, string> = {
  film: "Film",
  tv: "TV",
  book: "Book",
  comic: "Comic",
  magazine: "Magazine",
  advertising: "Advertising",
  other: "Other",
};

// One static page per file in content/sources.
export function generateStaticParams() {
  return getSources().map((s) => ({ slug: s.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const source = getSource(slug);
  return { title: source ? `${source.title} — Futures Archive` : "Futures Archive" };
}

export default async function SourcePage({ params }: Params) {
  const { slug } = await params;
  const sources = getSources();
  const source = sources.find((s) => s.slug === slug);
  if (!source) notFound();

  const tropes = getTropes().filter((t) => source.tropes.includes(t.slug));
  const caseStudy = getCaseStudy(slug);
  const compare = getCompare(slug);

  return (
    <article>
      <SourceStage
        image={{
          src: source.caseImage ?? source.image,
          alt: source.caseImage ? source.caseImageAlt ?? "" : source.imageAlt,
          caption: source.caseImage ? source.caseCredit : source.credit,
        }}
        steps={compare}
        shift={compareShifts(slug)}
        info={
          <div className="source-info">
            <h1>{source.title}</h1>

            <dl className="source-meta">
              <div>
                <dt>Date:</dt>
                <dd>{source.year}</dd>
              </div>
              <div>
                <dt>Media:</dt>
                <dd>{MEDIUM_LABELS[source.medium] ?? source.medium}</dd>
              </div>
              {source.creator && (
                <div>
                  <dt>Creator:</dt>
                  <dd>{source.creator}</dd>
                </div>
              )}
              {tropes.length > 0 && (
                <div>
                  <dt>Tropes:</dt>
                  <dd>{tropes.map((t) => t.name).join(", ")}</dd>
                </div>
              )}
              {source.tech.length > 0 && (
                <div>
                  <dt>Built:</dt>
                  <dd>
                    {source.tech.map((t, i) => (
                      <span key={t.id}>
                        {i > 0 && ", "}
                        <a href={`#tech-${t.id}`}>{t.name}</a>
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <p className="source-summary">{source.summary}</p>
          </div>
        }
      />

      {caseStudy && (
        <section className="case-study" aria-label="Case study">
          <p className="label">Case study</p>
          <CaseStudy html={caseStudy} />
        </section>
      )}

      <section className="built" aria-labelledby="built-heading">
        <h2 id="built-heading" className="label">
          Built from {source.title} · {source.tech.length}
        </h2>
        {source.tech.length === 0 ? (
          <p className="empty">No technology linked yet.</p>
        ) : (
          <ol className="built-list">
            {source.tech
              .slice()
              .sort((a, b) => a.year - b.year)
              .map((t) => (
                <li key={t.id} id={`tech-${t.id}`} className="built-item">
                  <span className="built-year">{t.year}</span>
                  <div>
                    <span className="label">
                      {t.kind}
                      {t.maker && <> · {t.maker}</>}
                    </span>
                    <h3>{t.url ? <a href={t.url} target="_blank" rel="noreferrer">{t.name}</a> : t.name}</h3>
                    <p>{t.description}</p>
                    <p className="mono muted built-gap">
                      {t.year - source.year >= 0
                        ? `${t.year - source.year} years after ${source.title}`
                        : `${source.year - t.year} years before ${source.title}`}
                    </p>
                    {t.references && t.references.length > 0 && (
                      <ul className="evidence">
                        {t.references.map((r) => (
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
                    )}
                  </div>
                </li>
              ))}
          </ol>
        )}
      </section>

      <p style={{ marginTop: 32 }}>
        <Link href="/" className="mono">← Back to the archive</Link>
      </p>
    </article>
  );
}