import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000', // Assuming your local dev server runs on port 3000
        pathname: '/api/badge-images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/trust-badges/**', // Also allow direct /trust-badges if used
      },
      {
        protocol: 'https',
        hostname: 'graphite-rouge.vercel.app',
        pathname: '/api/badge-images/**',
      },
      {
        protocol: 'https',
        hostname: 'graphite-rouge.vercel.app',
        pathname: '/trust-badges/**', // Allow trust badges from production
      },
      {
        protocol: 'https',
        hostname: 'effigy.im',
        pathname: '/a/**', // For effigy.im URLs like /a/0x...svg
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**', // For picsum.photos URLs
      },
    ],
  },
};

export default nextConfig;
