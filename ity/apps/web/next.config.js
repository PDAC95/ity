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
  async headers() {
    return [
      {
        // CSP scoped to templates page only — restricts iframe sources (SEC-02)
        source: '/dashboard/landing/templates',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://templates.12ity.com https://preview.12ity.com;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
