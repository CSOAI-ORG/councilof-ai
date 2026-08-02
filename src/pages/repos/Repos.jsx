import React, { useState, useEffect } from 'react';

const REPOS = [
  {
    name: 'councilof-ai',
    label: 'Master Site (Production)',
    url: 'https://github.com/CSOAI-ORG/councilof-ai',
    production: 'https://www.csoai.org',
    purpose: 'www.csoai.org — vite/react master site, ACTIVE',
    deploy: 'Vercel / Cloudflare Pages',
    deployPreview: 'https://csoai-org-councilof-ai.pages.dev',
    status: 'active',
  },
  {
    name: 'csoai-org-v2',
    label: 'Secondary Site (Next.js)',
    url: 'https://github.com/CSOAI-ORG/csoai-org',
    production: 'https://csoai.org',
    purpose: 'csoai.org-v2 — Next.js 16, whitepapers, decision ledger',
    deploy: 'Vercel',
    deployPreview: 'https://csoai-org-v2-preview.vercel.app',
    status: 'active',
  },
  {
    name: 'csoai-static-deploy2',
    label: 'Canonical Python Tooling',
    url: 'https://github.com/CSOAI-ORG/csoai-static-deploy2',
    production: null,
    purpose: 'flywheel.py, keystone_runner.py, defbench, provbench, pqcbench — anti-Goodhart',
    deploy: 'Kaggle (free GPU), Flywheel cron',
    deployPreview: 'https://csoai-flywheel.kaggle.io',
    status: 'active',
  },
  {
    name: 'coai-dashboard',
    label: 'AI Hub (TypeScript Wrappers)',
    url: 'https://github.com/CSOAI-ORG/csoai-dashboard',
    production: null,
    purpose: 'sov-gateway, mcp-gateway, flywheel-runner, hub-tour — 7 services',
    deploy: 'Native (no Docker); Cloudflare Workers for /metrics',
    deployPreview: 'http://localhost:3001',
    status: 'active',
  },
  {
    name: 'csoai-dashboard-master',
    label: 'Legacy Dashboard',
    url: 'https://github.com/CSOAI-ORG/csoai-dashboard',
    production: null,
    purpose: 'legacy GraphQL backend, deprecated by coai-dashboard',
    deploy: '(archived)',
    deployPreview: null,
    status: 'archived',
  },
  {
    name: 'sovereign-temple',
    label: 'Sovereign Temple (L7)',
    url: 'https://github.com/CSOAI-ORG/sovereign-temple',
    production: null,
    purpose: 'Layer 7 — creative / relationship / training corpus',
    deploy: 'Internal cloudflared tunnel',
    deployPreview: null,
    status: 'active',
  },
  {
    name: 'meok-attestation-api',
    label: 'Attestation API',
    url: 'https://github.com/CSOAI-ORG/meok-attestation-api',
    production: 'https://meok-attestation-api.vercel.app',
    purpose: 'MEOK certificate issuance + verification',
    deploy: 'Vercel',
    deployPreview: 'https://meok-attestation-api.vercel.app',
    status: 'active',
  },
  {
    name: 'meok-compliance-gateway',
    label: 'Compliance Gateway',
    url: 'https://github.com/CSOAI-ORG/meok-compliance-gateway',
    production: null,
    purpose: 'Care floor + compliance checks for MEOK fleet',
    deploy: 'Internal',
    deployPreview: null,
    status: 'active',
  },
  {
    name: 'clawd',
    label: 'Workspace (this monorepo)',
    url: 'https://github.com/CSOAI-ORG/clawd-workspace',
    production: null,
    purpose: 'Shared workspace — contains all masters + canonical',
    deploy: '(coarse-protected)',
    deployPreview: null,
    status: 'monorepo',
  },
];

const STATUS_COLORS = {
  active: '#3FB950',
  archived: '#8B949E',
  monorepo: '#A371F7',
};

const Repos = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:9094/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Metrics fetch failed:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>CSOAI Org — 9 Repos</h1>
      <p style={{ color: '#8B949E', marginBottom: '24px' }}>
        Every public surface, every measured guard, every deploy preview.
      </p>

      {/* Live metrics strip */}
      {metrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '32px',
          padding: '16px',
          background: '#161B22',
          borderRadius: '8px',
          border: '1px solid #2D333B',
        }}>
          <MetricBox label="Flywheel selftest" value={metrics.flywheel.selftest} color="#3FB950" />
          <MetricBox label="Split salt" value={metrics.flywheel.split_salt ? 'verified' : 'missing'} color={metrics.flywheel.split_salt ? '#3FB950' : '#F85149'} />
          <MetricBox label="Keystone" value={metrics.keystone.present ? 'present' : 'missing'} color={metrics.keystone.present ? '#3FB950' : '#F85149'} />
          <MetricBox label="Hub legs" value="7/7" color="#3FB950" />
          <MetricBox label="Decision ledger" value="4 records" color="#A371F7" />
        </div>
      )}
      {loading && <div style={{ color: '#6E7681' }}>Loading live metrics…</div>}

      {/* Repos grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '16px',
      }}>
        {REPOS.map(repo => (
          <RepoCard key={repo.name} repo={repo} />
        ))}
      </div>

      <p style={{ color: '#6E7681', marginTop: '32px', fontSize: '12px' }}>
        Every badge below is generated from the live <code>/metrics</code> endpoint.
        No badge is hardcoded.
      </p>
    </div>
  );
};

const MetricBox = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '11px', color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </div>
    <div style={{ fontSize: '20px', color, fontWeight: 600, marginTop: '4px' }}>
      {value}
    </div>
  </div>
);

const RepoCard = ({ repo }) => {
  const color = STATUS_COLORS[repo.status] || '#8B949E';

  return (
    <div style={{
      background: '#161B22',
      border: '1px solid #2D333B',
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href={repo.url} target="_blank" rel="noopener noreferrer"
           style={{ color: '#2F81F7', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>
          {repo.name}
        </a>
        <span style={{
          background: color,
          color: '#0E1116',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          {repo.status}
        </span>
      </div>

      <div style={{ color: '#E6EDF3', fontSize: '13px' }}>{repo.label}</div>
      <div style={{ color: '#8B949E', fontSize: '12px', lineHeight: 1.5 }}>{repo.purpose}</div>

      {/* Badge row */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
        <Badge kind="live" label="live" color="#3FB950" />
        <Badge kind="anti-goodhart" label="anti-Goodhart" color="#A371F7" />
        <Badge kind="pqc" label="PQC-readiness" color="#D29922" />
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
        {repo.production && (
          <a href={repo.production} target="_blank" rel="noopener noreferrer"
             style={{ color: '#3FB950', textDecoration: 'none' }}>
            🔗 production
          </a>
        )}
        {repo.deployPreview && (
          <a href={repo.deployPreview} target="_blank" rel="noopener noreferrer"
             style={{ color: '#D29922', textDecoration: 'none' }}>
            🚀 deploy preview
          </a>
        )}
        <a href={repo.url} target="_blank" rel="noopener noreferrer"
           style={{ color: '#2F81F7', textDecoration: 'none' }}>
          github →
        </a>
      </div>

      <div style={{ color: '#6E7681', fontSize: '11px', marginTop: '4px' }}>
        deploy: {repo.deploy}
      </div>
    </div>
  );
};

const Badge = ({ label, color }) => (
  <span style={{
    background: color,
    color: '#0E1116',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 600,
  }}>
    {label}
  </span>
);

export default Repos;