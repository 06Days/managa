import type { NextConfig } from "next";

// When managa runs Taska it injects TASKA_API_URL with the allocated API port.
// The rewrites let the browser use same-origin /task-lists requests, so the
// browser never needs to know the internal API host or port. Without managa,
// fall back to the original local development port.
const apiTarget = (
  process.env.TASKA_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  // managa runs this app from its own directory, so pin the Turbopack root
  // instead of letting Next infer it from a lockfile further up the tree.
  turbopack: { root: process.cwd() },
  async rewrites() {
    return [
      {
        source: "/task-lists",
        destination: `${apiTarget}/task-lists`,
      },
      {
        source: "/task-lists/:path*",
        destination: `${apiTarget}/task-lists/:path*`,
      },
    ];
  },
};

export default nextConfig;
