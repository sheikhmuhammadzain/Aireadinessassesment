/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore ESLint errors during build
  eslint: {
    dirs: ['app', 'components', 'lib', 'types'],
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable image optimization
  images: { 
    unoptimized: true,
    domains: ['avatars.githubusercontent.com'],
  },
  // Enable React Fast Refresh
  reactStrictMode: true,
  // Improve compilation times
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Add webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Only apply optimizations for client-side builds in production
    if (!dev && !isServer) {
      // Use TerserPlugin default settings
      config.optimization.minimize = true;
      
      // Use persistent caching
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename]
        }
      };
      
      // Split chunks more aggressively
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000
      };
    }
    
    return config;
  },
  // Handle API rewrites - Using the new working API URL
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://103.18.20.205:8090';
    
    console.log(`Using API URL: ${apiUrl} for rewrites configuration`);
    
    return [
      // Proxy all backend API requests through Next.js server to avoid CORS issues
      {
        source: '/api/backend/:path*',
        destination: `${apiUrl}/:path*`,
      }
    ];
  }
};

module.exports = nextConfig;
