import Link from "next/link";

export const metadata = { title: "About — Sci-Fi Archive" };

// Write this in your own words: every REPLACE line is a placeholder.
export default function AboutPage() {
  return (
    <article className="about">
      <p className="label">About</p>

      <p>This project was inspired by this <Link href="https://twitter.com/AlexBlechman/status/1457842724128833538">tweet:</Link></p>
      <img src="/images/tweet.png" alt="Cover image" loading="lazy" />
      <p>So I've decided to collect all the examples of "Torment Nexuses" created, and their corresponding "Don't Create Torment Nexus" media.</p>

      <section>
        <h2>HOW TO </h2>
        {/* <p>
          The <Link href="/">archive</Link> pairs each source with the technology linked to it. Select either side to
          see its connections. The <Link href="/timeline">timeline</Link> shows the gap between the two.
        </p> */}
      </section>

      {/* <section>
        <h2>Sources and methods</h2>
        <p>REPLACE: how you chose sources, and how you checked each claim.</p>
      </section> */}

      {/* <section className="about-credits">
        <h2>Credits</h2>
        <dl>
          <div>
            <dt>Made by</dt>
            <dd>REPLACE: your name, Parsons School of Design</dd>
          </div>
          <div>
            <dt>Typefaces</dt>
            <dd>Lost, Even Mono, Geist</dd>
          </div>
          <div>
            <dt>Built with</dt>
            <dd>Next.js, Scrollama, hosted on Vercel</dd>
          </div>
          <div>
            <dt>Images</dt>
            <dd>Credited on each source page.</dd>
          </div>
        </dl>
      </section> */}
      <section className="about-contact">
        <h2>Contribute</h2>
        <p>
          Know a source I&apos;ve missed, or a story that doesn&apos;t sound quite right? Or if you just want to share something, drop me
          an email!
        </p>
        <a
          className="about-email"
          href="mailto:work.ruixyan@gmail.com?subject=Sci-Fi%20Archive%20submission"
        >
          work.ruixyan@gmail.com ↗
        </a>
      </section>
    </article>
  );
}