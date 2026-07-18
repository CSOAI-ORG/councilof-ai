export const metadata = {
  title: 'CSOAI — Sovereign AI Infrastructure | Next-Level 3D',
  description: 'CSOAI Ltd (UK 16939677) — Layer 0 Trust Infrastructure for the AI Economy. Cesium 3D + Three.js 22 Arcana + WebGL particles + holographic HUD.',
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="https://csoai.org/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
