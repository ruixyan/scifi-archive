import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseStudy from "@/components/CaseStudy";
import FontEgg from "@/components/FontEgg";
import SourceStage from "@/components/SourceStage";
import TechPanel from "@/components/TechPanel";
import { compareShifts, getCaseStudy, getCompare, getSource, getSources, getTropes } from "@/lib/content";

type Params = { params: Promise<{ slug: string }> };

const MEDIUM_LABELS: Record<string, string> = {
  film: "Film",
  tv: "TV",
  book: "Book",
  play: "Play",
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
  return { title: source ? `${source.title} — Sci-Fi Archive` : "Sci-Fi Archive" };
}

export default async function SourcePage({ params }: Params) {
  const { slug } = await params;
  const sources = getSources();
  const source = sources.find((s) => s.slug === slug);
  if (!source) notFound();

  const tropes = getTropes().filter((t) => source.tropes.includes(t.slug));
  const caseStudy = getCaseStudy(slug);
  const compare = getCompare(slug);
  const tech = source.tech.slice().sort((a, b) => a.year - b.year);

  return (
    <article>
      <SourceStage
        image={{
          src: source.caseImage || source.image,
          alt: source.caseImage ? source.caseImageAlt ?? "" : source.imageAlt,
          caption: source.caseImage ? source.caseCredit : source.credit,
        }}
        steps={compare}
        shift={compareShifts(slug)}
        info={
          <div className="source-info">
            {source.fontEgg ? (
              <FontEgg {...source.fontEgg}>
                {source.title}
                {source.url && <ExternalLink href={source.url} label={`About ${source.title}`} />}
              </FontEgg>
            ) : (
              <h1>
                {source.title}
                {source.url && <ExternalLink href={source.url} label={`About ${source.title}`} />}
              </h1>
            )}

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
                  <dd>
                    {source.creator}
                    {source.creatorUrl && <ExternalLink href={source.creatorUrl} label={`About ${source.creator}`} />}
                  </dd>
                </div>
              )}
              {tropes.length > 0 && (
                <div>
                  <dt>Tropes:</dt>
                  <dd>{tropes.map((t) => t.name).join(", ")}</dd>
                </div>
              )}
              {tech.length > 0 && (
                <div>
                  <dt>Built:</dt>
                  <dd>
                    {/* Small cards; each opens a panel from the right */}
                    <TechPanel tech={tech} sourceTitle={source.title} sourceYear={source.year} />
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

      <p style={{ marginTop: 32 }}>
        <Link href="/" className="mono">← Back to the archive</Link>
      </p>
    </article>
  );
}

/** A small ↗ after a name that opens an outside page in a new tab. */
function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="ext-link" aria-label={label} title={href}>
      ↗
    </a>
  );
}