import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is generated at build time from the files in /content,
  // so the site deploys to Vercel as a fast, fully static archive.

  // Old links from before the archive was organised by source
  async redirects() {
    return [
      { source: "/entry/:slug", destination: "/source/:slug", permanent: true },
      { source: "/split", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;

