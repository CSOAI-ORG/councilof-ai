/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'https://api.openpatent.ai',
    NEXT_PUBLIC_WHITE_LABEL: 'sovereign-temple',
  },
};
module.exports = nextConfig;
