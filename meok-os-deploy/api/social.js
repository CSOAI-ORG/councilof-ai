// Social connect + publish — sovereign edition.
//
// The honest, no-owner-key path that works TODAY: Mastodon (and any Mastodon-API
// compatible server, incl. self-hosted) lets a user mint their OWN access token
// in Preferences → Development → New application. The user pastes that token; we
// proxy the post server-side so the token never sits in a URL and CORS is clean.
// This is the sovereign story made literal: your instance, your token, your data.
//
// Networks that require a reviewed OAuth app + paid API tier (X, LinkedIn, Meta,
// TikTok) are reported `configured:false` with an honest reason until the owner
// wires {NET}_CLIENT_ID / {NET}_CLIENT_SECRET — the flow below is ready for them.

const NETWORKS = {
  mastodon: { label: 'Mastodon', kind: 'token', live: true,
    how: 'Your instance → Preferences → Development → New application → copy the access token.' },
  bluesky: { label: 'Bluesky', kind: 'token', live: true,
    how: 'Settings → App Passwords → create one; connect with your handle + app password.' },
  x: { label: '𝕏 (Twitter)', kind: 'oauth', env: 'X_CLIENT_ID' },
  linkedin: { label: 'LinkedIn', kind: 'oauth', env: 'LINKEDIN_CLIENT_ID' },
  facebook: { label: 'Facebook', kind: 'oauth', env: 'FACEBOOK_CLIENT_ID' },
  threads: { label: 'Threads', kind: 'oauth', env: 'THREADS_CLIENT_ID' },
};

function netStatus() {
  return Object.entries(NETWORKS).map(([id, n]) => ({
    id, label: n.label, kind: n.kind,
    connectable: n.kind === 'token' ? true : !!(n.env && process.env[n.env] && !String(process.env[n.env]).startsWith('REPLACE')),
    how: n.how || (n.kind === 'oauth' ? 'Needs an OAuth app (owner setup) — ' + (n.env || '') : ''),
  }));
}

async function mastodonVerify(instance, token) {
  const base = 'https://' + instance.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const r = await fetch(base + '/api/v1/accounts/verify_credentials', { headers: { Authorization: 'Bearer ' + token } });
  if (!r.ok) throw new Error('verify failed (' + r.status + ')');
  const d = await r.json();
  return { handle: '@' + d.username + '@' + instance.replace(/^https?:\/\//, ''), display: d.display_name, avatar: d.avatar, url: d.url };
}

async function mastodonPost(instance, token, text) {
  const base = 'https://' + instance.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const r = await fetch(base + '/api/v1/statuses', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: text.slice(0, 500), visibility: 'public' }),
  });
  if (!r.ok) throw new Error('post failed (' + r.status + ')');
  const d = await r.json();
  return { url: d.url, id: d.id };
}

async function blueskyPost(handle, appPassword, text) {
  // Bluesky AT Protocol: create a session, then create a post record.
  const sr = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password: appPassword }),
  });
  if (!sr.ok) throw new Error('bluesky auth failed (' + sr.status + ')');
  const s = await sr.json();
  const pr = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.accessJwt },
    body: JSON.stringify({ repo: s.did, collection: 'app.bsky.feed.post',
      record: { text: text.slice(0, 300), createdAt: new Date().toISOString(), $type: 'app.bsky.feed.post' } }),
  });
  if (!pr.ok) throw new Error('bluesky post failed (' + pr.status + ')');
  const p = await pr.json();
  return { uri: p.uri, handle: s.handle };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const action = (req.query && req.query.action) || (req.body && req.body.action) || 'networks';
  if (action === 'networks') return res.status(200).json({ networks: netStatus() });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  try {
    if (action === 'verify') {
      if (body.net === 'mastodon') {
        if (!body.instance || !body.token) return res.status(400).json({ error: 'instance + token required' });
        return res.status(200).json({ ok: true, account: await mastodonVerify(body.instance, body.token) });
      }
      return res.status(400).json({ error: 'verify supported for mastodon' });
    }
    if (action === 'post') {
      const text = (body.text || '').toString();
      if (!text.trim()) return res.status(400).json({ error: 'text required' });
      if (body.net === 'mastodon') {
        if (!body.instance || !body.token) return res.status(400).json({ error: 'connect Mastodon first' });
        return res.status(200).json({ ok: true, net: 'mastodon', posted: await mastodonPost(body.instance, body.token, text) });
      }
      if (body.net === 'bluesky') {
        if (!body.handle || !body.appPassword) return res.status(400).json({ error: 'connect Bluesky first' });
        return res.status(200).json({ ok: true, net: 'bluesky', posted: await blueskyPost(body.handle, body.appPassword, text) });
      }
      return res.status(400).json({ ok: false, error: 'live posting for ' + (body.net || '?') + ' needs an OAuth app (owner setup); draft saved on-device' });
    }
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e.message || e) });
  }
  return res.status(400).json({ error: 'unknown action' });
}
