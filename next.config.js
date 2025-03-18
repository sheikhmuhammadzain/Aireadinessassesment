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
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    console.log('Using API URL for rewrites:', apiUrl);
    
    return [
      {
        source: '/api/questionnaire/:slug*',
        destination: `${apiUrl}/questionnaire/:slug*`
      },
      {
        source: '/api/calculate-results',
        destination: `${apiUrl}/calculate-results`
      }
    ];
  }
};

module.exports = nextConfig;