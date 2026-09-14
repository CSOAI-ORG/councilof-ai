#!/usr/bin/env node
// Publishes the gspc MCP server to the MCP Registry.
// Inputs: VER (version string), TOKEN (Registry JWT).
// Fail-closed: exit 1 if TOKEN/VER missing or null-like. Do not publish without a real JWT.
// CommonJS (.cjs) — root package.json has "type":"module".

const fs = require('fs');
const https = require('https');

const VER = process.env.VER;
const TOKEN = process.env.TOKEN;

function bad(msg) {
  console.error('FAIL-CLOSED:', msg);
  process.exit(1);
}

if (!VER || String(VER).trim() === '' || String(VER) === 'null' || String(VER) === 'undefined') {
  bad('VER missing or null-like');
}
if (!TOKEN || String(TOKEN).trim() === '' || String(TOKEN) === 'null' || String(TOKEN) === 'undefined') {
  bad('TOKEN missing or null-like (OIDC→Registry JWT exchange failed or empty)');
}

const server = JSON.parse(fs.readFileSync('server.json', 'utf8'));

function get(path) {
  return new Promise((resolve, reject) => {
    https.get('https://registry.modelcontextprotocol.io' + path, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject);
  });
}

function post(path, body, headers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      {
        hostname: 'registry.modelcontextprotocol.io',
        path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const existing = await get('/v0/servers/io.github.CSOAI-ORG%2Fgspc/versions');
  if (existing.status === 200) {
    const d = JSON.parse(existing.body);
    if (d.versions && d.versions.some((v) => v.version === VER)) {
      console.log('Version ' + VER + ' already published — skipping');
      return;
    }
  }

  const resp = await post('/v0/publish', server, { Authorization: 'Bearer ' + TOKEN });
  console.log('Response status:', resp.status);
  console.log('Response body (first 1000 chars):');
  console.log(resp.body.substring(0, 1000));
  if (resp.status >= 200 && resp.status < 300) {
    console.log('PUBLISH OK');
  } else {
    process.exit(1);
  }
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
