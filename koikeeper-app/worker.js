export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    
    // Handle SPA routing - serve index.html for all routes
    if (!path.includes('.')) {
      path = '/index.html';
    }
    
    // Serve from dist directory
    const filePath = `dist${path}`;
    
    try {
      const file = await import(`./${filePath}`);
      return new Response(file.default, {
        headers: {
          'Content-Type': getContentType(path),
          'Cache-Control': 'public, max-age=3600'
        }
      });
    } catch (e) {
      return new Response('Not Found', { status: 404 });
    }
  }
};

function getContentType(path) {
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return 'text/plain';
}
