import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Disable strict mode to reduce dev warnings
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Production server configuration
  serverExternalPackages: ['mongoose'],

  // Disable development indicators
  devIndicators: false,

  // IMPORTANT: Trust proxy headers from reverse proxy (IIS/Nginx/Caddy)
  // This ensures correct client IP and protocol detection
  // assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // Allow cross-origin requests from network devices
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Configure development options
  experimental: {
    // Future experimental features can be configured here
  },

  // Fix: Cross-origin warning for dev server (Next.js 15+)
  allowedDevOrigins: ['timewise.cmis.ac.in'],
};

export default nextConfig;
