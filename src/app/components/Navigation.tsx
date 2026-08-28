"use client";

import { Search, Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export function Navigation() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 shadow-sm backdrop-blur-md">
      <nav id="navigation" className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label="Council of AI">
                <path d="M50 4 L91 19 V49 C91 74 50 96 50 96 C50 96 9 74 9 49 V19 Z" fill="#04624a"></path>
                <path d="M50 12 L84 24 V49 C84 69 50 88 50 88 C50 88 16 69 16 49 V24 Z" fill="#ffffff"></path>
                <rect x="26" y="66" width="48" height="6" fill="#04624a"></rect>
                <rect x="30" y="61" width="40" height="4" fill="#04624a"></rect>
                <rect x="33" y="38" width="6" height="22" fill="#04624a"></rect>
                <rect x="44" y="38" width="6" height="22" fill="#04624a"></rect>
                <rect x="55" y="38" width="6" height="22" fill="#04624a"></rect>
                <rect x="66" y="38" width="6" height="22" fill="#04624a"></rect>
                <rect x="28" y="33" width="44" height="5" fill="#04624a"></rect>
                <path d="M50 20 L75 32 H25 Z" fill="#04624a"></path>
              </svg>
            </div>
            <span className="text-xl 2xl:text-2xl font-bold text-emerald-700 tracking-tight whitespace-nowrap">CSOAI</span>
          </Link>

          <div className="hidden xl:flex items-center">
            <div className="flex items-center gap-1 2xl:gap-3">
              <Link href="/" className="px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-emerald-700 bg-emerald-50">Home</Link>
              
              <button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">
                Measure <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">
                Products <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">
                Regulation <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <Link href="/os" className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">
                Council OS <ChevronDown className="h-3.5 w-3.5" />
              </Link>
              <button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">
                Evidence <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button className="px-2 2xl:px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 whitespace-nowrap text-muted-foreground hover:text-emerald-700 hover:bg-muted">
                Company <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="hidden xl:flex flex-nowrap items-center gap-2 2xl:gap-3">
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground/80 hover:bg-muted transition-colors" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/os" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800" title="Chat is Council OS — the AG UI">Chat</Link>
            {user ? (
              <Link href="/dashboard" className="inline-flex max-w-full items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs text-muted-foreground font-medium">Dashboard</Link>
            ) : (
              <>
                <Link href="/pricing" className="inline-flex max-w-full items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 rounded-md px-3 text-xs text-muted-foreground font-medium">Sign In</Link>
                <Link href="/pricing" className="inline-flex max-w-full items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 rounded-md px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm">Start free</Link>
              </>
            )}
          </div>

          <div className="xl:hidden flex items-center gap-2">
            <button className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted" aria-label="Open menu">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-border bg-background">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <Link href="/" className="block px-3 py-3 rounded-md text-base font-semibold text-emerald-700 hover:bg-muted">Home</Link>
            <Link href="/leaderboard" className="block px-3 py-3 rounded-md text-base font-semibold text-muted-foreground hover:bg-muted">Measure</Link>
            <Link href="/catalogue" className="block px-3 py-3 rounded-md text-base font-semibold text-muted-foreground hover:bg-muted">Products</Link>
            <Link href="/os" className="block px-3 py-3 rounded-md text-base font-semibold text-muted-foreground hover:bg-muted">Council OS</Link>
            <Link href="/pricing" className="block px-3 py-3 rounded-md text-base font-medium text-emerald-600 hover:bg-muted">Start free</Link>
          </div>
        </div>
      )}
    </header>
  );
}
