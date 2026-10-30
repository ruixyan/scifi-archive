// The shape of everything in /content.

export type ReferenceType =
  | "article" | "quote" | "interview" | "patent" | "book"
  | "video" | "product" | "event" | "other";

/** A citation backing up a claim: an article, interview, patent… */
export interface Reference {
  title: string;
  year?: number;
  type: ReferenceType;
  url?: string;
  note?: string;
}

/** A real-world technology built from a source. If two sources list the
 *  same `id`, the site treats it as one technology with two origins. */
export interface TechItem {
  id: string;
  name: string;
  year: number;
  maker?: string;
  kind: "product" | "patent" | "event" | "platform" | "other";
  description: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  references?: Reference[];
}

/** One piece of source material. Its file name is its slug and URL. */
export interface Source {
  slug: string;
  title: string;
  creator?: string;
  creatorUrl?: string; // optional: a page about the creator (opens in a new tab)
  url?: string; // optional: a page about the work itself
  invention?: string;
  medium: "film" | "tv" | "book" | "play" | "comic" | "magazine" | "advertising" | "other";
  year: number;
  image: string;
  imageAlt: string;
  credit: string;
  caseImage?: string;
  caseImageAlt?: string;
  caseCredit?: string;
  summary: string;
  tropes: string[];
    /** Optional easter egg: a note about a typeface, and a button that sets the page in it */
    fontEgg?: { family: string; label: string; note: string; url?: string };
  tech: TechItem[];
}

export interface Trope {
  slug: string;
  name: string;
  description: string;
}

/** One link between a source and a technology. */
export interface Connection {
  source: string;
  tech: string;
}

/** A technology merged across every source that lists it. */
export interface BuiltTech extends Omit<TechItem, "references"> {
  references: Reference[];
}

export type CompareItem =
  | { kind: "image"; src: string; alt: string; caption?: string }
  | { kind: "excerpt"; html: string; cite?: string; audio?: string }
  | { kind: "video"; src: string; caption?: string };

  export interface CompareStep {
    html: string;
    item?: CompareItem; // what slides in beside the main image from this step
    solo?: boolean; // [solo]: from this step, the latest item fills the space alone
    swap?: boolean | "left" | "right";
  }