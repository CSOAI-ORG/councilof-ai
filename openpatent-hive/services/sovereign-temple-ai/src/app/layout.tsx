import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sovereign Substrate Power Pack — sovereign-temple.ai",
  description:
    "The sovereign stack. No cloud dependency. 100% owned. Run the openpatent.ai hive on your own sovereign VM. MIT core, BFT council, MEOK_KEYSTONE attested.",
  metadataBase: new URL("https://sovereign-temple.ai"),
  openGraph: {
    title: "sovereign-temple.ai — The sovereign stack. No cloud dependency. 100% owned.",
    description:
      "Governments, defense agencies, and regulated industries run sovereign-temple.ai on their own sovereign VMs. The 6-layer proof + BFT council = cryptographic sovereignty over your IP.",
    url: "https://sovereign-temple.ai",
    siteName: "sovereign-temple.ai",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", color: "#1a1a2e", background: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
