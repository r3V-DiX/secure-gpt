import type { NextConfig } from "next";
import path from "path";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const normalizedBackendUrl = (/^https?:\/\//.test(backendUrl)
  ? backendUrl
  : `https://${backendUrl}`).replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@securegpt/shared"],
  turbopack: {
    root: path.resolve(__dirname, "../.."), // ✅ secure-gpt/ monorepo root
    resolveAlias: {
      tailwindcss: path.join(__dirname, "node_modules", "tailwindcss"),
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${normalizedBackendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
