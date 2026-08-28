"use client";

import { Shield, Cpu, ExternalLink, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function Navigation() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white shadow-md">
              <Shield className="w-5 h-5" />
            </div>
            <a href="/" className="text-lg font-bold">
              <span className="text-brand-400">Council</span>
              <span className="text-foreground">Of</span>
              <span className="text-brand-300">.AI</span>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="/leaderboard" className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 font-bold tracking-wider">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live Leaderboards
            </a>
            <a href="/os" className="text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1.5 font-semibold">
              <Cpu className="w-4 h-4" /> Council OS
            </a>
            <a href="/simulator" className="text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1.5 font-semibold">
              <Shield className="w-4 h-4" /> Simulator
            </a>
            <a href="/catalogue" className="text-muted-foreground hover:text-foreground transition-colors">Agent Catalogue</a>
            <a href="/verify" className="text-muted-foreground hover:text-foreground transition-colors">Verify</a>
            <a href="/assess" className="text-muted-foreground hover:text-foreground transition-colors">Assessment</a>
            <a href="/developers" className="text-muted-foreground hover:text-foreground transition-colors">Developers</a>
            <a href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            {user && (
              <a href="/dashboard" className="text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </a>
            )}
            <a href="https://csoai.org" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 ml-2 border-l border-border pl-4">
              csoai.org <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user?.tier === 'pro' || user?.tier === 'enterprise' ? (
               <a href="/dashboard" className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors shadow-sm">
                 PRO ACTIVE
               </a>
            ) : (
               <a href="/pricing" className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg gradient-brand text-white hover:opacity-90 transition-opacity shadow-sm">
                 Upgrade to Pro
               </a>
            )}
          </div>
        
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-foreground p-2">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 pt-2 pb-6 space-y-1">
            <a href="/leaderboard" className="block px-3 py-3 rounded-md text-base font-bold text-red-500 hover:bg-muted">Live Leaderboards</a>
            <a href="/os" className="block px-3 py-3 rounded-md text-base font-semibold text-brand-500 hover:bg-muted">Council OS</a>
            <a href="/simulator" className="block px-3 py-3 rounded-md text-base font-semibold text-brand-500 hover:bg-muted">Simulator</a>
            <a href="/catalogue" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Agent Catalogue</a>
            <a href="/verify" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Verify</a>
            <a href="/assess" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Assessment</a>
            <a href="/developers" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Developers</a>
            <a href="/pricing" className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-muted">Pricing</a>
          </div>
        </div>
      )}
    </header>
  );
}
