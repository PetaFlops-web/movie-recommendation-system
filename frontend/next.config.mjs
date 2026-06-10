/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized production builds
  output: 'standalone',

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  // Disable x-powered-by header for security
  poweredByHeader: false,
};

export default nextConfig;
