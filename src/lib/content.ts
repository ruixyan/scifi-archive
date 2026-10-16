import fs from "node:fs";
import path from "node:path";
import { Marked } from "marked";
import markedFootnote from "marked-footnote";
import type { BuiltTech, Connection, Source, Trope } from "./types";

// Markdown converter for case studies, with footnotes: text[^1] … [^1]: note
const markdown = new Marked(markedFootnote());

// Reads the archive from /content at build time. Server-only.
const CONTENT_DIR = path.join(process.cwd(), "content");

export function getTropes(): Trope[] {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, "tropes.json"), "utf8");
  return JSON.parse(raw) as Trope[];
}

/** Every file in /content/sources. The file name is the slug, so renaming
 *  a file renames its page. Checks each file and stops the build with a
 *  readable message if something doesn't line up. */
export function getSources(): Source[] {
  const dir = path.join(CONTENT_DIR, "sources");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const file = `content/sources/${f}`;
      let data: Omit<Source, "slug">;
      try {
        data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      } catch (err) {
        throw new Error(`${file} isn't valid JSON: ${(err as Error).message}`);
      }
      const source: Source = {
        ...data,
        slug: f.replace(/\.json$/, ""),
        tech: data.tech ?? [],
      };
      validate(source, file);
      return source;
    })
    .sort((a, b) => a.year - b.year);
}

function validate(s: Source, file: string) {
  const ids = new Set<string>();
  for (const t of s.tech) {
    if (!t.id) throw new Error(`${file}: every item in "tech" needs an "id".`);
    if (ids.has(t.id)) throw new Error(`${file}: the tech id "${t.id}" is listed twice.`);
    ids.add(t.id);
  }
}

export function getSource(slug: string): Source | undefined {
  return getSources().find((s) => s.slug === slug);
}

/** Every technology across all sources, merged by id and sorted by year. */
export function getBuiltTech(sources = getSources()): BuiltTech[] {
  const byId = new Map<string, BuiltTech>();
  for (const s of sources) {
    for (const { references = [], ...t } of s.tech) {
      const existing = byId.get(t.id);
      if (existing) {
        existing.references.push(...references);
        // fill any fields the first source left out
        for (const k of Object.keys(t) as (keyof typeof t)[]) {
          if (existing[k] === undefined) (existing as unknown as Record<string, unknown>)[k] = t[k];
        }
      } else {
        byId.set(t.id, { ...t, references: [...references] });
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.year - b.year);
}

/** Every source ↔ tech link. */
export function getConnections(sources = getSources()): Connection[] {
  return sources.flatMap((s) => s.tech.map((t) => ({ source: s.slug, tech: t.id })));
}

/** Earliest and latest year across sources and their tech. */
export function getYearRange(sources: Source[]): [number, number] {
  const years = sources.flatMap((s) => [s.year, ...s.tech.map((t) => t.year)]);
  if (years.length === 0) return [1900, 2030];
  const min = Math.floor(Math.min(...years) / 10) * 10;
  const max = Math.ceil((Math.max(...years) + 1) / 10) * 10;
  return [min, max];
}

/**
 * The case study for a source: an optional Markdown file next to its JSON,
 * e.g. content/sources/star-trek.md. Returns HTML, or null if there's none.
 *
 * An image on its own line becomes a figure, and its title becomes the
 * caption:  ![Alt text](/images/still.jpg "Caption shown under the image")
 */
export function getCaseStudy(slug: string): string | null {
  const file = path.join(CONTENT_DIR, "sources", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const html = markdown.parse(expandScrolly(fs.readFileSync(file, "utf8")), { async: false });
  return html.replace(
    /<p>(<img src="([^"]*)" alt="([^"]*)"(?: title="([^"]*)")?>)<\/p>/g,
    (_m, _img, src, alt, title) =>
      `<figure><img src="${src}" alt="${alt}" loading="lazy">${title ? `<figcaption>${title}</figcaption>` : ""}</figure>`,
  );
}

const escapeAttr = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Scrolling sections for case studies (wired up with Scrollama in
 * CaseStudy.tsx). Write them in the .md file like this:
 *
 *   :::scrolly
 *   ![Alt text](/images/one.jpg "Optional caption")
 *   Text for the first step. Any Markdown, any length.
 *
 *   ---
 *   More text over the same image.
 *
 *   ![Alt text](/images/two.jpg)
 *   Text for the next step; the image swaps when it scrolls in.
 *   :::
 *
 * An image line starts a new step with a new image; a line with just ---
 * starts a new step that keeps the current image.
 */
function expandScrolly(md: string): string {
  const imageLine = /^!\[([^\]]*)\]\(\s*(\S+?)(?:\s+"([^"]*)")?\s*\)\s*$/;

  return md.replace(/^:::scrolly[ \t]*\r?\n([\s\S]*?)^:::[ \t]*$/gm, (_m, body: string) => {
    type Step = { image?: { alt: string; src: string; caption?: string }; lines: string[] };
    const steps: Step[] = [];

    for (const line of body.split(/\r?\n/)) {
      const img = line.match(imageLine);
      if (img) steps.push({ image: { alt: img[1], src: img[2], caption: img[3] }, lines: [] });
      else if (line.trim() === "---") steps.push({ lines: [] });
      else if (steps.length === 0 && line.trim()) steps.push({ lines: [line] });
      else steps.at(-1)?.lines.push(line);
    }

    const figures = steps
      .map((s, i) =>
        s.image
          ? `<figure class="scrolly-figure${i === 0 ? " is-active" : ""}" data-step="${i}">` +
            `<img src="${escapeAttr(s.image.src)}" alt="${escapeAttr(s.image.alt)}" loading="lazy">` +
            (s.image.caption ? `<figcaption>${escapeAttr(s.image.caption)}</figcaption>` : "") +
            `</figure>`
          : "",
      )
      .filter(Boolean)
      .join("\n");

    // Blank lines around each step's text let Markdown (and footnotes) work inside it
    const stepHtml = steps
      .map(
        (s, i) =>
          `<div class="scrolly-step${i === 0 ? " is-active" : ""}" data-step="${i}">\n\n${s.lines.join("\n").trim()}\n\n</div>`,
      )
      .join("\n");

    return `<div class="scrolly">\n<div class="scrolly-graphic">\n${figures}\n</div>\n<div class="scrolly-steps">\n${stepHtml}\n</div>\n</div>\n`;
  });
}