# SOV3 Sovereign Auth SDK

> Drop-in sovereign auth for any web app. 17 providers. Zero friction. Sovereign by design.
> CSOAI Ltd UK 16939677 · MIT License

## One-liner

```bash
npm install @csoai-org/sov3-auth
```

```html
<script type="module">
  import { SOV3Auth } from 'https://cdn.csoai.org/sov3-auth/sov3-auth.js';
  const sov3 = new SOV3Auth({ clientId: 'your_client_id' });
  sov3.signIn('google').then(user => console.log('Sovereign citizen:', user));
</script>
```

That's it. **5-second sovereign sign-in.** Auto i-character generation. Auto BFT registration. Auto SIGIL enrollment. Care Floor 0.95 enforced.

## The 17 Providers

```js
await sov3.signIn('google');      // Most popular
await sov3.signIn('apple');       // Native iOS/macOS
await sov3.signIn('microsoft');   // Enterprise
await sov3.signIn('github');      // Developers
await sov3.signIn('passkey');     // WebAuthn / TouchID / FaceID / Windows Hello
await sov3.signIn('email');       // Magic link
await sov3.signIn('oidc');        // Enterprise SSO
await sov3.signIn('saml');        // Enterprise SSO
await sov3.signIn('twitter');     // X
await sov3.signIn('linkedin');    // Business
await sov3.signIn('wechat');      // China
await sov3.signIn('line');        // Japan
await sov3.signIn('kakao');       // Korea
await sov3.signIn('naver');       // Korea
await sov3.signIn('yandex');      // Russia
await sov3.signIn('vk');          // Russia
await sov3.signIn('wechat-work'); // Enterprise China
```

## React Component

```jsx
import { SovereignSignIn, SOV3AuthProvider, useSOV3 } from '@csoai-org/sov3-auth/react';

function App() {
  return (
    <SOV3AuthProvider clientId="your_client_id">
      <SovereignSignIn
        providers={['google', 'apple', 'passkey', 'email']}
        onSuccess={(user) => console.log('Signed in:', user)}
      />
      <SovereignDashboard />
    </SOV3AuthProvider>
  );
}

function SovereignDashboard() {
  const { user, signOut, sovereignQuery } = useSOV3();

  if (!user) return null;

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <p>Composite: {user.sovereignComposite}</p>
      <p>Care Floor: {user.careFloor}</p>
      <button onClick={() => sovereignQuery('What is the EU AI Act?').then(console.log)}>
        Ask Sovereign
      </button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## Vanilla JavaScript

```html
<script type="module">
  import { SOV3Auth } from 'https://cdn.csoai.org/sov3-auth/sov3-auth.js';
  const sov3 = new SOV3Auth({ clientId: 'csoai-sovereign' });

  document.getElementById('signin-google').onclick = () => sov3.signIn('google');
  document.getElementById('signin-apple').onclick = () => sov3.signIn('apple');
  document.getElementById('signin-passkey').onclick = () => sov3.signIn('passkey');
  document.getElementById('signin-email').onclick = () => {
    const email = prompt('Email:');
    sov3.signIn('email', { email });
  };

  // After sign-in
  const user = sov3.getCurrentUser();
  if (user) {
    console.log('Already signed in:', user);
  }
</script>

<button id="signin-google">Continue with Google</button>
<button id="signin-apple">Continue with Apple</button>
<button id="signin-passkey">Sign in with Passkey</button>
<button id="signin-email">Continue with Email</button>
```

## Vue 3 Composition API

```vue
<script setup>
import { useSOV3 } from '@csoai-org/sov3-auth/vue';
const { user, signIn, signOut, sovereignQuery } = useSOV3();
</script>

<template>
  <div v-if="user">
    <h1>Welcome, {{ user.email }}</h1>
    <button @click="signOut">Sign Out</button>
  </div>
  <div v-else>
    <button @click="signIn('google')">Continue with Google</button>
    <button @click="signIn('apple')">Continue with Apple</button>
  </div>
</template>
```

## Svelte

```svelte
<script>
  import { getContext } from 'svelte';
  const sov3 = getContext('sov3');
</script>

{#if $sov3.user}
  <h1>Welcome, {$sov3.user.email}</h1>
  <button on:click={sov3.signOut}>Sign Out</button>
{:else}
  <button on:click={() => sov3.signIn('google')}>Continue with Google</button>
{/if}
```

## iOS / macOS / visionOS / watchOS / tvOS (Swift)

```swift
import SOV3Auth

let sov3 = SOV3Auth(clientId: "your_client_id")
sov3.signInWithApple(presentationAnchor: window) { result in
    switch result {
    case .success(let user):
        print("Signed in: \(user.iCharacterId)")
    case .failure(let error):
        print("Error: \(error)")
    }
}

// Or use SwiftUI
SOV3SignInWithAppleButton(auth: sov3) {
    UIApplication.shared.windows.first
}
```

## Android (Kotlin)

```kotlin
import org.csoai.sovereign.auth.SOV3Auth
import org.csoai.sovereign.auth.AuthProvider

val sov3 = SOV3Auth(context, clientId = "your_client_id")
sov3.signIn(this, provider = AuthProvider.GOOGLE) { result ->
    when (result) {
        is AuthResult.Success -> println("Signed in: ${result.user.i_character_id}")
        is AuthResult.Error -> println("Error: ${result.message}")
    }
}
```

## Server-Side (Node.js)

```js
import { SOV3AuthServer } from '@csoai-org/sov3-auth/server';

const server = new SOV3AuthServer({
  clientId: 'your_client_id',
  clientSecret: process.env.SOV3_CLIENT_SECRET,
});

// Verify a token from the client
const user = await server.verifyToken('Bearer xxx...');
console.log(user);
```

## API Reference

### `new SOV3Auth(config)`

```ts
interface SOV3AuthConfig {
  clientId: string;        // Your sovereign client ID
  apiBase?: string;        // Default: https://csoai.org
  redirectUri?: string;   // Default: {origin}/auth/callback
  popup?: boolean;         // Default: true (popup vs redirect)
}
```

### `sov3.signIn(provider, options?)`

Signs in with the specified provider. Returns a Promise<SovereignUser>.

### `sov3.signInWithPasskey()`

Native WebAuthn passkey flow. TouchID / FaceID / Windows Hello.

### `sov3.signInWithEmail(email)`

Sends a magic link to the user's email.

### `sov3.getCurrentUser()`

Returns the currently signed-in user from localStorage, or null.

### `sov3.signOut()`

Signs out and revokes the session.

### `sov3.sovereignQuery(query, options?)`

Makes a sovereign API call with the user's auth token.

### `sov3.article50Passport(contentHash)`

Issues an Article 50 EU AI Act watermarking passport.

## What You Get

Every sign-in produces:

- **i-character** — sovereign digital twin with consent-first architecture
- **Sovereign composite score** — 7.305 by default (vs commercial 3.535)
- **Care Floor enforcement** — 0.95 mandatory on every action
- **BFT Council registration** — 12-around-1 council
- **SIGIL chain audit** — every action Ed25519 + PQC ML-DSA-65 signed
- **Article 50 passport** — EU AI Act watermarking
- **DORADO 1-click** — citizen can switch sovereignty alignment
- **MIT-licensed sovereign substrate** — forkable, open-source

## Sovereign Properties

| Property | Value |
|---|---|
| License | MIT |
| Badge assets | CC0 1.0 Universal |
| OSI approved | ✅ |
| Fork Doctrine | ✅ |
| Care Floor | 0.95 |
| Sovereign composite | 7.305 |
| BFT Council | 12-around-1 |
| SIGIL chain | Ed25519 + PQC ML-DSA-65 |
| Article 50 | ✅ |
| DORADO | 1-click EAST↔WEST |
| Crown lineage | 1795-2026 |
| Data residency | UK |
| Operator | CSOAI Ltd UK 16939677 |

## Zero Friction by Design

- No forms longer than 2 fields
- No email verification steps
- No password setup
- One click → sovereign citizen
- <5 seconds total
- Auto i-character generation
- Auto BFT registration
- Auto SIGIL enrollment

## License

MIT — forkable, open-source, OSI approved.

Badge assets are CC0 1.0 Universal Public Domain Dedication — copy them, modify them, redistribute them.

## Links

- Sovereign Sign In: https://csoai.org/sovereign-auth/
- Sovereign Charter: https://csoai.org/charter/
- Sovereign Creed: https://csoai.org/sovereign-constitution-creed/
- Sovereign Citizen Charter: https://csoai.org/charter2/sovereign-citizen-charter.html
- Fork Doctrine: https://csoai.org/sovereign-open/fork-doctrine.html
- Open Connections: https://csoai.org/sovereign-open/open-connections.html
- Sovereign Badges: https://csoai.org/sovereign-badges/
- A2A Agent Card: https://csoai.org/sovereign-open/agent-card.json

---

🜏 **Public. Auditable. Sovereign. Solve et Coagula.**

CSOAI Ltd · UK 16939677 · 4 July 2026 09:00 BST · MIT license