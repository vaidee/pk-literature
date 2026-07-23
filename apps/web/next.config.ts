import path from "node:path";
import type { NextConfig } from "next";

// CDN_HOST matches terraform/modules/cloudfront's `cdn.${var.domain_name}`
// alias — every MediaAsset.url returned by the backend (SPEC-02) is an
// absolute CloudFront URL on that host, which next/image requires an
// explicit remotePattern for.
const cdnHost = process.env.NEXT_PUBLIC_CDN_HOST ?? "cdn.dev.pk-literature.example";

const nextConfig: NextConfig = {
  // packages/ui ships raw .tsx (no build step of its own — see its
  // README) — Next transpiles it itself rather than requiring every
  // component change to go through a separate `tsc` build first.
  transpilePackages: ["@pk-literature/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: cdnHost,
      },
    ],
  },
  webpack: (config) => {
    // pnpm's virtual store keeps one hoisted "phantom" copy per bare
    // package name at node_modules/.pnpm/node_modules, used as a
    // resolution fallback by packages (like next itself) that don't
    // declare react as a real dependency edge. This workspace has two
    // React majors installed (apps/medusa needs 18.x, apps/web/
    // packages/ui need 19.x) and that phantom slot can only hold one —
    // apps/medusa's much larger dependency count wins it, so anything
    // falling back to it pulls in a second, incompatible React
    // instance and crashes with "createContext is not a function".
    // Force both to resolve to this app's own local copy instead.
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    };
    return config;
  },
};

export default nextConfig;
