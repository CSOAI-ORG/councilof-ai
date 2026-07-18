module.exports = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  async rewrites() {
    return [{ source: '/', destination: '/defoneos' }];
  },
};
