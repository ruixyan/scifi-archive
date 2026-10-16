# Futures Archive

An annotated archive of imagined futures and the technology built from them.
Next.js (App Router) + TypeScript, fully static, deployed on Vercel. No database:
all content lives in `/content` as JSON files.

## Run it locally

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:3000` — the archive of sources (filter by trope and verdict)
- `http://localhost:3000/source/star-trek` — a source: annotated image + what was built from it
- `http://localhost:3000/split` — Imagined / Built: sources and tech, linked
- `http://localhost:3000/timeline` — each source and its tech on one timeline
- `http://localhost:3000/dev/annotate` — local-only tool for placing hotspots

## How the archive is organised

Everything is built around **source material**: one JSON file per book,
film, comic or show in `content/sources/`. The file name is the page
address (`star-trek.json` → `/source/star-trek`). Each source file holds:

- the work itself: `title`, `creator`, `invention`, `medium`, `year`,
  `image`, `imageAlt`, `credit`, `summary`, `tropes`
- `tech`: everything built from it. Each item has an `id`, `name`, `year`,
  `maker`, `kind`, `verdict` (how it relates to *this* source),
  `description`, and optional `image`, `url`, `references`
- `annotations`: hotspots on the image. `"tech": ["motorola-startac"]`
  says what that detail became, and the hotspot takes that tech's colour

If two sources list a tech with the same `id`, the site treats it as one
technology with two origins. The DynaTAC is listed under both Star Trek
(disputed) and Dick Tracy (direct inspiration), so selecting it on the
Imagined / Built page shows both.

```
content/
  tropes.json
  sources/*.json         one file per source; file name = URL
public/images/           source and tech images
src/
  app/
    page.tsx             archive grid of sources
    source/[slug]/       source page
    split/               Imagined / Built linked grids
    timeline/            timeline
    dev/annotate/        annotation tool (404s in production)
    globals.css          all styles; colours and fonts are tokens at the top
  components/            ArchiveGrid, AnnotatedImage, AnnotateTool, ConnectedGrids
  lib/                   types.ts (data model), content.ts (reads /content), verdicts.ts
```

## Adding a source

1. Put the image in `public/images/`.
2. Copy a file in `content/sources/`, rename it, and update the fields.
3. Add what was built from it to its `tech` array.
4. Run `npm run dev`, open `/dev/annotate`, pick the source, and click
   (circle) or drag (rectangle) to place hotspots. Tick the tech each one
   became, copy the JSON, and paste it into the file's `annotations` array.
5. Commit and push. Vercel rebuilds the site.

If something doesn't line up (an annotation pointing to a tech id that
isn't in the file, a duplicate id, broken JSON), the build stops and names
the file.

## Deploy to Vercel

1. Create a GitHub repo and push this folder to it.
2. In Vercel: **Add New → Project**, import the repo. The defaults
   (framework: Next.js, build: `next build`) are correct. No environment
   variables are needed.
3. Every push to `main` deploys to production; other branches get
   preview URLs, which are useful for sharing work in progress at critique.

## Next steps

- Replace the placeholder images with credited sources (see `credit` field).
- Swap the fonts in `globals.css` (or use `next/font`) for the final visual system.
- Add a trope page (`/trope/[slug]`) or a visual-similarity view later.
- If the project grows, the same data model maps directly onto Sanity or a
  database.
