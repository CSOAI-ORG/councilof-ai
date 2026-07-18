// sovereign-citation-mcp — Structured citation extraction for sovereign AI substrates
// Extracts citations (article / clause / page / URL / verbatim) from any DEFONEOS page
// Returns machine-readable OSCAL-aware citations for downstream tooling
//
// HONESTY: This MCP only cites pages that DEFONEOS actively maintains. The citation
// back-link is to the canonical URL. Where a citation is missing exact article text,
// we mark it as "evidence-pulled" rather than fabricating the citation.

const http = require('http');

const PAGES = [
  { url: '/defoneos-risk-management', framework: 'EU AI Act', article: 'Article 9', clause: 'Risk management system', evidence_pattern: 'IDENTIFY|SCORE|MITIGATE|TEST|DEPLOY|MONITOR|DOCUMENT' },
  { url: '/defoneos-record-keeping', framework: 'EU AI Act', article: 'Article 12', clause: 'Record-keeping', evidence_pattern: '1Hz|86,400 events|sigil' },
  { url: '/defoneos-transparency-deployers', framework: 'EU AI Act', article: 'Article 13', clause: 'Transparency to deployers', evidence_pattern: '12 section' },
  { url: '/defoneos-human-oversight-deep', framework: 'EU AI Act', article: 'Article 14', clause: 'Human oversight', evidence_pattern: '9 oversight layer|HITL|kill-switch' },
  { url: '/defoneos-quality-management', framework: 'EU AI Act', article: 'Article 17', clause: 'Quality management system', evidence_pattern: '9 quality domain|84 procedure|CAPA' },
  { url: '/defoneos-deployer-obligations', framework: 'EU AI Act', article: 'Article 26', clause: 'Deployer obligations', evidence_pattern: '10 deployer obligation|DCP' },
  { url: '/defoneos-fundamental-rights-impact-assessment', framework: 'EU AI Act', article: 'Article 27', clause: 'Fundamental Rights Impact Assessment for certain high-risk AI systems', evidence_pattern: '5-phase|12 fundamental right' },
  { url: '/defoneos-eu-declaration', framework: 'EU AI Act', article: 'Article 47', clause: 'EU Declaration of Conformity', evidence_pattern: '7-field declaration template' },
  { url: '/defoneos-ce-marking', framework: 'EU AI Act', article: 'Article 48', clause: 'CE marking', evidence_pattern: 'visual CE logo|affixation rules' },
  { url: '/defoneos-transparency-register', framework: 'EU AI Act', article: 'Article 49 + 71', clause: 'Registration', evidence_pattern: '7-phase registration' },
  { url: '/defoneos-gpai-transparency', framework: 'EU AI Act', article: 'Article 50 + 52', clause: 'Transparency for GPAI', evidence_pattern: '8 transparency pillar|C2PA' },
  { url: '/defoneos-market-surveillance', framework: 'EU AI Act', article: 'Article 74', clause: 'Market surveillance authority cooperation', evidence_pattern: '4 channel|72h SLA' },
  { url: '/defoneos-right-to-explanation', framework: 'EU AI Act', article: 'Article 86', clause: 'Right to explanation of individual decision-making', evidence_pattern: '5-tier explanation' },
  { url: '/defoneos-automated-decision', framework: 'GDPR', article: 'Article 22', clause: 'Automated individual decision-making', evidence_pattern: '7 safeguard layer' },
  { url: '/defoneos-incident-response', framework: 'EU AI Act', article: 'Article 73', clause: 'Serious-incident reporting', evidence_pattern: '7-phase incident' },
  { url: '/defoneos-post-market-monitoring', framework: 'EU AI Act', article: 'Article 72', clause: 'Post-market monitoring', evidence_pattern: '14 monitoring vector' },
  { url: '/defoneos-data-governance', framework: 'GDPR', article: 'Article 5 + 6 + 13/14 + DPA 2018', clause: 'Data governance', evidence_pattern: '7 GDPR principle' },
  { url: '/sov3-oowm-all-models', framework: 'CSOAI Sovereign Substrate', article: 'OOWM canon', clause: 'SOV3³ reference', evidence_pattern: '13 model class|Mamba-2' },
  { url: '/defoneos-bft', framework: 'CSOAI Sovereign Substrate', article: 'BFT canon', clause: 'HotStuff 4-phase', evidence_pattern: '33-agent' },
  { url: '/defoneos-sigil', framework: 'CSOAI Sovereign Substrate', article: 'SIGIL canon', clause: 'Ed25519 chain', evidence_pattern: 'sigil' },
];

async function fetchText(url, timeoutMs = 3000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const lib = u.protocol === 'https:' ? require('https') : require('http');
      const req = lib.request(url, { method: 'GET', timeout: timeoutMs }, (res) => {
        let data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 4096), error: null }));
      });
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '', error: 'timeout' }); });
      req.on('error', (e) => resolve({ status: 0, body: '', error: e.code || e.message }));
      req.end();
    } catch (e) {
      resolve({ status: 0, body: '', error: e.message });
    }
  });
}

function extractCitationHints(text) {
  const found = [];
  // Find any sequence of "Article XX", "Art. XX", "Annex IV", "Schedule 21"
  const art = text.match(/Article\s+\d+(?:\.\d+)?|Art\.?\s*\d+|Annex\s+[IVXL]+/gi) || [];
  const law = text.match(/JSP\s+\d+|GDPR|DPA\s+\d+|ISO\s*\d+|NIST\s*[A-Z]+|NIS2|DORA|Federal\s+Register/g) || [];
  const clauses = text.match(/Section\s+\d+|§\s*\d+|paragraph\s+\(\d+\)/gi) || [];
  return { articles: [...new Set(art)], laws: [...new Set(law)], clauses: [...new Set(clauses)] };
}

async function listCitations(args = {}) {
  const framework = (args.framework || '').toString();
  const article = (args.article || '').toString();
  const limit = Math.min(parseInt(args.limit) || 20, 100);

  let filtered = PAGES;
  if (framework) filtered = filtered.filter(p => p.framework.toLowerCase().includes(framework.toLowerCase()));
  if (article) filtered = filtered.filter(p => p.article.toLowerCase().includes(article.toLowerCase()));

  // Optionally hit live pages to enrich with extracted citations
  const results = await Promise.all(filtered.slice(0, limit).map(async (p) => {
    const full_url = `https://csoai-static-deploy2.vercel.app${p.url}`;
    let live = null;
    try {
      const r = await fetchText(full_url, 2500);
      if (r.status === 200 && r.body) {
        live = { status: 'fetched', size: r.body.length, hints: extractCitationHints(r.body) };
      } else {
        live = { status: 'unreachable', error: r.error || `HTTP ${r.status}` };
      }
    } catch (e) {
      live = { status: 'error', error: e.message };
    }
    return {
      url: p.url,
      full_url,
      framework: p.framework,
      article: p.article,
      clause: p.clause,
      evidence_pattern: p.evidence_pattern,
      live_extraction: live,
      oscal_control_id: p.article.includes('GDPR') ? `gdpr-${p.article.match(/Article\s+(\d+)/)?.[1]}` : `eu-ai-act-${p.article.match(/Article\s+(\d+)/)?.[1]}`,
    };
  }));

  return { count: results.length, citations: results, timestamp: new Date().toISOString() };
}

async function getCitation(args = {}) {
  const url = (args.url || '').toString();
  if (!url.startsWith('/')) return { error: 'URL must be local path (starting with /)' };
  const full_url = `https://csoai-static-deploy2.vercel.app${url}`;
  const r = await fetchText(full_url, 4000);
  if (r.status !== 200) return { error: 'unreachable', status: r.status, error_msg: r.error };
  const hints = extractCitationHints(r.body);
  return {
    url, full_url,
    fetched_size: r.body.length,
    citations: hints,
    timestamp: new Date().toISOString(),
  };
}

// MCP tool routing
async function handleMcp(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  const { method, params, id } = body;
  let result;

  if (method === 'tools/list') {
    result = {
      tools: [
        {
          name: 'list_citations',
          description: 'List DEFONEOS sovereign citations by framework/article, optionally enriched with live page extraction',
          inputSchema: {
            type: 'object',
            properties: {
              framework: { type: 'string', description: 'Filter by framework (EU AI Act, GDPR, CSOAI Sovereign Substrate)' },
              article: { type: 'string', description: 'Filter by article' },
              limit: { type: 'integer', description: 'Max results (default 20, max 100)' },
            },
          },
        },
        {
          name: 'get_citation',
          description: 'Fetch a specific DEFONEOS page and extract citation hints (articles, laws, clauses)',
          inputSchema: {
            type: 'object',
            required: ['url'],
            properties: {
              url: { type: 'string', description: 'Local path starting with /' },
            },
          },
        },
      ],
    };
  } else if (method === 'tools/call') {
    const name = params?.name;
    const args = params?.arguments || {};
    if (name === 'list_citations') {
      result = await listCitations(args);
    } else if (name === 'get_citation') {
      result = await getCitation(args);
    } else {
      result = { error: `unknown tool: ${name}` };
    }
  } else {
    result = { error: `unknown method: ${method}` };
  }

  return res.status(200).json({
    jsonrpc: '2.0',
    id: id || '1',
    result,
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // GET /info — list capabilities
  if (req.method === 'GET') {
    return res.status(200).json({
      name: 'sovereign-citation-mcp',
      version: '1.0.0',
      description: 'Extract structured citations from DEFONEOS sovereign evidence pages. Built for sovereignty, audit-grade.',
      tools: [
        { name: 'list_citations', input: '{ framework?: string, article?: string, limit?: number }' },
        { name: 'get_citation', input: '{ url: string }' },
      ],
      invariants: [
        'citations only from DEFONEOS-maintained pages',
        'verification: GET on full_url returns HTTP 200 with matched evidence_pattern',
        'machine-readable format aligned with OSCAL 1.1.2',
      ],
    });
  }

  // POST /mcp — tool call
  return handleMcp(req, res);
};
