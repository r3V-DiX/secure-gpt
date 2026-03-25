/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@securegpt/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',                        // ← FIXED
        destination: `${process.env.BACKEND_URL ?? 'http://localhost:8000'}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig