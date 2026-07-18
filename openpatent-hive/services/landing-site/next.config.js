/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      // Proxy the public API through the same origin (avoids CORS)
      { source: '/api/v1/:path*', destination: `${process.env.PATENTMCP_API || 'http://api.openpatent.ai'}/v1/:path*` },
    ];
  },
  // Hardened security headers (ported from openpatent-ai-deploy/vercel.json).
  // CSP is Report-Only so it cannot break the Next app on rollout; tighten to
  // enforcing CSP once the report stream is clean.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy-Report-Only',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://va.vercel-scripts.com https://buy.stripe.com https://js.stripe.com https://checkout.stripe.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https://buy.stripe.com https://js.stripe.com https://checkout.stripe.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com; upgrade-insecure-requests",
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(self "https://buy.stripe.com" "https://checkout.stripe.com"), usb=(), accelerometer=(), gyroscope=(), magnetometer=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          { key: 'X-Robots-Tag', value: 'index, follow, max-image-preview:large' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
