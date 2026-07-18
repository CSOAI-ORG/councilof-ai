// sovereign-citation-mcp Vercel wrapper
// This is the same server as the local package, exposed as Vercel serverless function
// at /api/sovereign-citations — the production endpoint

const path = require('path');
const fs = require('fs');

// We re-export the same logic as the local package
let local;
try {
  local = require(path.join(process.cwd(), 'sovereign-citation-mcp', 'server.js'));
} catch (e) {
  // Fall back to self-loading if not resolvable
  local = require('./local-server.js');
}

module.exports = local;
