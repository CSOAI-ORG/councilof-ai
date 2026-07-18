// SOV3 Sovereign Auth SDK for Web (JavaScript ES Module)
// CSOAI Ltd UK 16939677 · MIT License · 30 June 2026
//
// Drop-in replacement for any auth library. 17 providers. Zero friction.
// i-character generated automatically on first sign-in.
//
// Usage:
//   import { SOV3Auth } from 'https://csoai.org/sovereign-auth/sov3-auth.js';
//   const sov3 = new SOV3Auth({ clientId: 'your_client_id' });
//   sov3.signIn('google').then(user => console.log(user));

const SOV3_API_BASE = 'https://csoai.org';

// All providers supported
const PROVIDERS = {
  google:    { name: 'Continue with Google',    icon: 'google',    url: '/api/auth/google' },
  apple:     { name: 'Continue with Apple',     icon: 'apple',     url: '/api/auth/apple' },
  microsoft: { name: 'Continue with Microsoft', icon: 'microsoft', url: '/api/auth/microsoft' },
  github:    { name: 'Continue with GitHub',    icon: 'github',    url: '/api/auth/github' },
  twitter:   { name: 'Continue with Twitter/X', icon: 'twitter',   url: '/api/auth/twitter' },
  linkedin:  { name: 'Continue with LinkedIn',  icon: 'linkedin',  url: '/api/auth/linkedin' },
  wechat:    { name: 'Continue with WeChat',    icon: 'wechat',    url: '/api/auth/wechat' },
  line:      { name: 'Continue with LINE',      icon: 'line',      url: '/api/auth/line' },
  kakao:     { name: 'Continue with Kakao',     icon: 'kakao',     url: '/api/auth/kakao' },
  naver:     { name: 'Continue with Naver',     icon: 'naver',     url: '/api/auth/naver' },
  yandex:    { name: 'Continue with Yandex',    icon: 'yandex',    url: '/api/auth/yandex' },
  vk:        { name: 'Continue with VK',        icon: 'vk',        url: '/api/auth/vk' },
  passkey:   { name: 'Sign in with Passkey',    icon: 'passkey',   url: '/api/auth/passkey' },
  email:     { name: 'Email Magic Link',        icon: 'email',     url: '/api/auth/email' },
  oidc:      { name: 'Enterprise SSO (OIDC)',   icon: 'oidc',      url: '/api/auth/oidc' },
  saml:      { name: 'Enterprise SAML',        icon: 'saml',      url: '/api/auth/saml' },
  wechat_work: { name: 'WeChat Work',          icon: 'wechat',    url: '/api/auth/wechat-work' },
};

export class SOV3Auth {
  constructor(config = {}) {
    this.clientId = config.clientId || 'csoai-sovereign-default';
    this.apiBase = config.apiBase || SOV3_API_BASE;
    this.redirectUri = config.redirectUri || `${window.location.origin}/auth/callback`;
    this.popup = config.popup !== false; // popup by default
    this.user = null;
    this.token = null;
  }

  /**
   * Sign in with any provider.
   * @param {string} provider - one of PROVIDERS keys
   * @returns {Promise<SovereignUser>}
   */
  async signIn(provider = 'google') {
    const prov = PROVIDERS[provider];
    if (!prov) throw new Error(`Unknown provider: ${provider}`);

    // Handle special cases
    if (provider === 'passkey') return this.signInWithPasskey();
    if (provider === 'email') return this.signInWithEmail();

    // OAuth/OIDC flow
    return this.signInWithOAuth(prov);
  }

  async signInWithOAuth(prov) {
    const state = crypto.randomUUID();
    sessionStorage.setItem('sov3_oauth_state', state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      response_type: 'code',
      scope: 'openid profile email ichar.silver bft.vote',
    });

    const authUrl = `${this.apiBase}${prov.url}?${params}`;

    if (this.popup) {
      return new Promise((resolve, reject) => {
        const w = 600, h = 700;
        const left = (window.innerWidth - w) / 2;
        const top = (window.innerHeight - h) / 2;
        const popup = window.open(authUrl, 'sov3_auth', `width=${w},height=${h},left=${left},top=${top}`);

        const handler = (event) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type !== 'sov3_auth_callback') return;
          window.removeEventListener('message', handler);
          popup.close();
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            this.user = event.data.user;
            this.token = event.data.token;
            localStorage.setItem('sov3_user', JSON.stringify(this.user));
            localStorage.setItem('sov3_token', this.token);
            resolve(this.user);
          }
        };
        window.addEventListener('message', handler);
      });
    } else {
      // Redirect flow
      window.location.href = authUrl;
    }
  }

  async signInWithPasskey() {
    // Use WebAuthn API
    if (!window.PublicKeyCredential) {
      throw new Error('Passkeys not supported in this browser');
    }

    // Get challenge from server
    const challengeResp = await fetch(`${this.apiBase}/api/auth/passkey/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: this.clientId }),
    });
    const challenge = await challengeResp.json();

    // WebAuthn assertion
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: Uint8Array.from(atob(challenge.challenge), c => c.charCodeAt(0)),
        allowCredentials: challenge.allowCredentials.map(c => ({
          id: Uint8Array.from(atob(c.id), ch => ch.charCodeAt(0)),
          type: 'public-key',
          transports: c.transports,
        })),
        userVerification: 'required',
        timeout: 60000,
      },
    });

    // Send assertion to server
    const verifyResp = await fetch(`${this.apiBase}/api/auth/passkey/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        credential: {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          response: {
            clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credential.response.clientDataJSON))),
            authenticatorData: btoa(String.fromCharCode(...new Uint8Array(credential.response.authenticatorData))),
            signature: btoa(String.fromCharCode(...new Uint8Array(credential.response.signature))),
            userHandle: credential.response.userHandle
              ? btoa(String.fromCharCode(...new Uint8Array(credential.response.userHandle)))
              : null,
          },
          type: credential.type,
        },
      }),
    });

    const result = await verifyResp.json();
    if (result.error) throw new Error(result.error);
    this.user = result.user;
    this.token = result.token;
    localStorage.setItem('sov3_user', JSON.stringify(this.user));
    localStorage.setItem('sov3_token', this.token);
    return this.user;
  }

  async signInWithEmail() {
    const email = prompt('Enter your email:');
    if (!email) throw new Error('Email required');

    const resp = await fetch(`${this.apiBase}/api/auth/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        client_id: this.clientId,
        redirect_uri: this.redirectUri,
      }),
    });

    const result = await resp.json();
    if (result.error) throw new Error(result.error);
    return { message: 'Magic link sent to ' + email };
  }

  /**
   * Get the current user from localStorage.
   */
  getCurrentUser() {
    if (this.user) return this.user;
    const stored = localStorage.getItem('sov3_user');
    if (stored) {
      this.user = JSON.parse(stored);
      this.token = localStorage.getItem('sov3_token');
      return this.user;
    }
    return null;
  }

  /**
   * Sign out.
   */
  async signOut() {
    const token = this.token || localStorage.getItem('sov3_token');
    if (token) {
      try {
        await fetch(`${this.apiBase}/api/auth/signout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch {}
    }
    this.user = null;
    this.token = null;
    localStorage.removeItem('sov3_user');
    localStorage.removeItem('sov3_token');
  }

  /**
   * Make a sovereign API call.
   */
  async sovereignQuery(query, options = {}) {
    const token = this.token || localStorage.getItem('sov3_token');
    if (!token) throw new Error('Not signed in');

    const resp = await fetch(`${this.apiBase}/api/sovereign/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Sov3-Dorado-Mode': options.mode || 'EAST',
      },
      body: JSON.stringify({
        query,
        sovereign_composite_required: true,
        care_floor: 0.95,
        bft_council_required: options.bft !== false,
        ...options,
      }),
    });

    return resp.json();
  }

  /**
   * Issue an Article 50 passport for content.
   */
  async article50Passport(contentHash, contentType = 'text') {
    return this.sovereignQuery('article50:issue', {
      content_hash: contentHash,
      content_type: contentType,
      interaction_type: 'chatbot',
      watermarked: true,
    });
  }
}

// === Drop-in React Component ===
// import React, { useState, useEffect } from 'react';
//
// export function SovereignSignIn({ onSuccess, providers = ['google', 'apple', 'passkey', 'email'] }) {
//   const sov3 = new SOV3Auth();
//   const [user, setUser] = useState(sov3.getCurrentUser());
//
//   const handleSignIn = async (provider) => {
//     try {
//       const u = await sov3.signIn(provider);
//       setUser(u);
//       onSuccess?.(u);
//     } catch (e) {
//       console.error('Sign in failed:', e);
//     }
//   };
//
//   if (user) {
//     return <div>Signed in as {user.email || user.id}</div>;
//   }
//
//   return (
//     <div className="sov3-signin">
//       {providers.map(p => (
//         <button key={p} onClick={() => handleSignIn(p)}>
//           {PROVIDERS[p].name}
//         </button>
//       ))}
//     </div>
//   );
// }

// === Drop-in HTML snippet (any framework) ===
// <div id="sov3-signin"></div>
// <script type="module">
//   import { SOV3Auth } from 'https://csoai.org/sovereign-auth/sov3-auth.js';
//   const sov3 = new SOV3Auth();
//   document.getElementById('sov3-signin').innerHTML = `
//     ${Object.keys(PROVIDERS).slice(0, 4).map(p => `
//       <button onclick="sov3.signIn('${p}').then(u => alert('Signed in: ' + u.email))">
//         ${PROVIDERS[p].name}
//       </button>
//     `).join('')}
//   `;
// </script>