import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Cloudflare virtual modules are supplied by Vite in the Sites build.
  // Next.js runs on Node and needs an explicit replacement for that module.
  webpack(config, { webpack }) {
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(
      /^cloudflare:workers$/,
      path.resolve(process.cwd(), "lib/vercel-cloudflare-env.ts"),
    ));
    return config;
  },
};

export default nextConfig;
