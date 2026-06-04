/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized production builds
  output: 'standalone',

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Allow images from external domains if needed
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
