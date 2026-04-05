import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "3001",
      },
      {
        protocol: "https",
        hostname: "kaosrestaurant.com"
      },
      {
        protocol: "https",
        hostname: "www.kaosrestaurant.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      },
      {
        protocol: "https",
        hostname: "kaosrestaurant-backend.onrender.com"
      },
            {
        protocol: "https",
        hostname: "togo.kaosrestaurant.com"
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/to-go',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/images/:path*',
        destination: 'http://localhost:3001/:path*',
      },
    ];
  },
};

export default nextConfig;
