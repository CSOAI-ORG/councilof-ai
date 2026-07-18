# MEOK App — Store-Ready Config

This folder contains the assets needed to publish the MEOK App
to the Apple App Store and Google Play Store.

## What this is

The MEOK App is a Progressive Web App (PWA) at meok.ai/app.
PWAs work on:
- iOS Safari 11.3+ (iPhone + iPad)
- Android Chrome 40+ (Pixel + Samsung + OnePlus + all Android OEMs)
- macOS Safari + Chrome + Edge + Firefox
- Windows 10/11 Chrome + Edge + Firefox
- Linux Chrome + Edge + Firefox

**Every browser, every OS, mobile, across board.** No app store needed.

## For users who prefer native app store download

Use PWABuilder (https://www.pwabuilder.com) to convert the PWA to:
- iOS App Store package (.ipa)
- Android Google Play package (.aab)
- Microsoft Store package (.msix)

Steps:
1. Visit https://www.pwabuilder.com
2. Enter URL: https://meok.ai/app
3. Click "Build" → iOS / Android / Windows
4. Download the .ipa / .aab / .msix
5. Submit to App Store / Play Store / Microsoft Store

Alternatively, use Capacitor (https://capacitorjs.com) to wrap the PWA:
```bash
npm install -g @capacitor/cli
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "MEOK App" "app@meok.ai" --web-dir=dist
npx cap add ios
npx cap add android
npx cap copy
npx cap open ios      # opens Xcode
npx cap open android  # opens Android Studio
```

## Files in this folder

- `manifest.json` — PWA manifest (name, icons, theme color, scope)
- `sw.js` — Service worker (offline support)
- `app.html` — the PWA shell (sign + verify + 60+ sub-domains as in-app routes)

## Why PWA over native

1. **No app store review delay** — the cliff is 48 days out. App Store review takes 2-4 weeks. PWA is instant.
2. **No 30% Apple tax** — direct install from meok.ai/app. The .ai brand absorbs every hive.
3. **One codebase, every platform** — same HTML+CSS+JS works on iOS + Android + macOS + Windows + Linux.
4. **Sovereign UK** — the PWA runs from Vercel (EU/UK infra), not from Apple's CDN.
5. **Live updates** — change a line, all users see it. No app store version bump.

## MEOK App install instructions for end users

### iOS Safari
1. Visit https://meok.ai/app on iPhone or iPad
2. Tap the Share button (square with up arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"
5. MEOK App now appears on your home screen

### Android Chrome
1. Visit https://meok.ai/app on Android
2. Chrome shows a banner "Install MEOK App" — tap Install
3. (Or: Menu → "Install App" → "Add to Home Screen")
4. MEOK App now appears on your home screen

### macOS / Windows / Linux
1. Visit https://meok.ai/app in Chrome / Edge
2. Look for the install icon in the URL bar (or Menu → "Install MEOK App")
3. Click "Install"
4. MEOK App now appears as a native app in your Applications

### Linux CLI (for SREs)
```bash
# Install Chrome's PWA
google-chrome --install-pwa=https://meok.ai/app
```

## For GRC partners (white-label)

The MEOK App is fully white-labelable. To deploy your own PWA:
1. Fork the MEOK App source at meok.ai/app
2. Replace the brand (logo, colors, name) with yours
3. Update the manifest.json scope to your own domain
4. Deploy to your own Vercel
5. Your customers install YOUR branded PWA, which routes to the MEOK keystone for the actual signing

---

**CSOAI Ltd · UK 16939677 · hello@meok.ai**
**Powered by the MEOK Sovereign AI OS · 32 MCP servers · 60+ sub-domains · 193 SOV3 agents**
