/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Gunakan URL dari .env jika ada (misal: Railway Node.js URL), jika tidak gunakan localhost
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
