import type { NextConfig } from "next";
import path from "path";

const distDir = process.env.NEXT_DIST_DIR || (process.env.NODE_ENV !== "production" && (process.env.PORT === "3001" || process.env.NEXT_PUBLIC_APP_MODE === "admin") ? ".next-admin" : ".next");

const nextConfig: NextConfig = {
  distDir,
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
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;