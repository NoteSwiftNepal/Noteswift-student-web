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
      {
        // Course/profile thumbnails — backend uploads to Cloudinary (blueprint §5).
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        // Auto-generated avatar images (student avatarEmoji field).
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
