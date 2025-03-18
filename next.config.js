/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable image optimization
  images: { 
    unoptimized: true 
  },
  // Handle API rewrites - Note: for production deployment these URLs should be updated
  async rewrites() {
    return [
      {
        source: '/api/questionnaire/:slug*',
        destination: process.env.NODE_ENV === 'production' 
          ? process.env.API_URL + '/questionnaire/:slug*' 
          : 'http://127.0.0.1:8000/questionnaire/:slug*'
      },
      {
        source: '/api/calculate-results',
        destination: process.env.NODE_ENV === 'production'
          ? process.env.API_URL + '/calculate-results'
          : 'http://127.0.0.1:8000/calculate-results'
      }
    ];
  }
};

module.exports = nextConfig;