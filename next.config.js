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
          destination: 'http://127.0.0.1:8000/questionnaire/:slug*'
        },
        {
          source: '/api/calculate-results',
          destination: 'http://127.0.0.1:8000/calculate-results'
        }
      ];
    }
  };

  module.exports = nextConfig;
