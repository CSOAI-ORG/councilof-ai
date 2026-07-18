import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LoopFactory — Universal AI Agent + Character Marketplace",
  description:
    "Discover, audit, and deploy MCP servers, A2A agents, ACP policies, and MEOK characters. POAI verified.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container flex h-14 items-center">
            <a href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl tracking-tight">
                LoopFactory
              </span>
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                AI
              </span>
            </a>
            <div className="flex flex-1 items-center space-x-6 text-sm font-medium">
              <a
                href="/browse"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Browse
              </a>
              <a
                href="/audit"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Audit
              </a>
              <a
                href="/dashboard"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Dashboard
              </a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} LoopFactory.ai. All agents
              verified.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>POAI Certified</span>
              <span>MEOK Compatible</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
