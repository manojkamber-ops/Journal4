import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` is for self-hosting only; Vercel packages the app itself.
  output: process.env.VERCEL ? undefined : "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
