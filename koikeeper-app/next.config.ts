import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  reactStrictMode: true,
  poweredByHeader: false,
  
  webpack: (config: any, { isServer }: any) => {
    const webpack = require('webpack');
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /p2p/ }));
    if (!isServer) {
      config.resolve.fallback = config.resolve.fallback || {};
      config.resolve.fallback['@libp2p/noise'] = false;
      config.resolve.fallback['@libp2p/mplex'] = false;
      config.resolve.fallback['@libp2p/webrtc'] = false;
      config.resolve.fallback['@libp2p/websockets'] = false;
      config.resolve.fallback['libp2p'] = false;
      config.resolve.fallback['it-length-prefixed'] = false;
      config.resolve.fallback['it-pipe'] = false;
      config.resolve.fallback['uint8arrays'] = false;
      config.resolve.fallback['worker_threads'] = false;
      config.resolve.fallback['child_process'] = false;
      config.resolve.fallback['tls'] = false;
      config.resolve.fallback['net'] = false;
      config.resolve.fallback['stream'] = false;
      config.resolve.fallback['crypto'] = false;
      config.resolve.fallback['os'] = false;
      config.resolve.fallback['path'] = false;
      config.resolve.fallback['fs'] = false;
      config.resolve.fallback['onnxruntime-node'] = false;
    }
    return config;
  },
    async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com; frame-src https://js.stripe.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;