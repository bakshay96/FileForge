/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;

    // Only enable the proxy rewrite in local development (no API URL set)
    // In production, NEXT_PUBLIC_API_URL is set to the deployed backend, so
    // the frontend calls it directly — no proxy needed.
    if (!backendUrl) {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*",
        },
      ];
    }

    // In production: no rewrites — api.ts uses NEXT_PUBLIC_API_URL directly
    return [];
  },
};

module.exports = nextConfig;
