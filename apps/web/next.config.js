/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ity/ui', '@ity/api', '@ity/db', '@ity/config'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },
};

module.exports = nextConfig;
