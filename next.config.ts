import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  // Disable TypeScript and ESLint checks during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    // Allow all remote image sources (wildcard pattern)
    remotePatterns: [
      {
      protocol: 'https',
      hostname: '**',
      },
      {
      protocol: 'http',
      hostname: '**',
      },
    ],
  },
  // Turbopack configuration (stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Webpack configuration for development hot reload
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    // Exclude server-only modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        cluster: false,
        fs: false,
        net: false,
        tls: false,
        v8: false,
        crypto: false,
        stream: false,
        path: false,
        os: false,
        util: false,
        events: false,
        worker_threads: false,
        child_process: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;

