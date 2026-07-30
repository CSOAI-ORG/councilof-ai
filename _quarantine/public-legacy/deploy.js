const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.VERCEL_TOKEN || ''; // Set VERCEL_TOKEN in your environment
const TEAM_ID = 'team_4IkNIyYl7TtEOi9aoz17SUO7';
const PROJECT_NAME = 'csoai-org';
const ROOT = __dirname;

function collectFiles(dir, base = '') {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'deploy.js') continue;
    if (entry.isDirectory()) files = files.concat(collectFiles(path.join(dir, entry.name), rel));
    else files.push({ file: rel, data: fs.readFileSync(path.join(dir, entry.name)) });
  }
  return files;
}

async function deploy() {
  const files = collectFiles(ROOT);
  console.log(`Found ${files.length} files to deploy`);

  const fileMap = {};
  for (const f of files) {
    const encoded = f.data.toString('base64');
    fileMap[f.file] = encoded;
    console.log(`[${Object.keys(fileMap).length}/${files.length}] ${f.file}... OK`);
  }

  const body = JSON.stringify({
    name: PROJECT_NAME,
    files: Object.entries(fileMap).map(([name, data]) => ({ file: name, data, encoding: 'base64' })),
    projectSettings: { framework: null },
    target: 'production'
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.vercel.com',
      path: `/v13/deployments?teamId=${TEAM_ID}`,
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const j = JSON.parse(data);
        if (j.url) { console.log(`\nSUCCESS! Deployed to: https://${j.url}`); resolve(); }
        else { console.error('Deploy failed:', data); reject(); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

deploy().catch(console.error);
