import type { NextConfig } from "next";

// managa builds this client with NEXT_PUBLIC_API_URL pointing at the allocated
// Quita server. The fallback keeps a standalone `npm run dev` working on 4200.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // managa runs this app from its own directory, so pin the Turbopack root
  // instead of letting Next infer it from a lockfile further up the tree.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
