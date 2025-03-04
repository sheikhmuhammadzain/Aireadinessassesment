/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/api/questionnaire/:slug*',
        destination: 'http://103.18.20.205:8080/questionnaire/:slug*'
      },
      {
        source: '/api/calculate-results',
        destination: 'http://103.18.20.205:8080/calculate-results'
      }
    ];
  }
};

module.exports = nextConfig;
