import type { NextConfig } from "next";

// The MCP server lives in managa-server. Proxy it through the dashboard origin
// so MCP clients can use http://<host>:3000/mcp and keep using the same host
// they already use for the UI. MANAGA_SERVER_URL is server-side only.
const managaServerUrl = (
  process.env.MANAGA_SERVER_URL || "http://127.0.0.1:5100"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/mcp",
        destination: `${managaServerUrl}/mcp`,
      },
      {
        source: "/mcp/:path*",
        destination: `${managaServerUrl}/mcp/:path*`,
      },
    ];
  },
};

export default nextConfig;
