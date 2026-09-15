import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  // Lets the dev server accept requests from a phone on the same LAN
  // (e.g. http://192.168.1.64:3000) instead of only localhost — needed to
  // test flows like Fonepay's bank deep-links that only work on a real
  // phone. Update this IP if your machine's LAN address changes.
  allowedDevOrigins: ['192.168.1.64'],
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
};

export default nextConfig;
