import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Database, Menu, X, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1923]/90 backdrop-blur-md border-b border-[#00788830]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Database className="h-6 w-6 text-[#00bca8]" />
            <span className="text-xl font-bold text-[#e2e8f0]">MEOK <span className="text-[#00bca8]">DATA</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#sources" className="text-sm text-[#a0b0c0] hover:text-[#00bca8] transition-colors">Data Sources</a>
            <a href="#pricing" className="text-sm text-[#a0b0c0] hover:text-[#00bca8] transition-colors">Pricing</a>
            <a href="#ecosystem" className="text-sm text-[#a0b0c0] hover:text-[#00bca8] transition-colors">Ecosystem</a>
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="text-[#a0b0c0] hover:text-[#00bca8]">
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout} className="border-[#00788860] text-[#a0b0c0] hover:text-[#00bca8]">
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="bg-[#00bca8] text-[#0f1923] hover:bg-[#00d4be]">
                  Get Started
                </Button>
              </Link>
            )}
          </div>

          <button className="md:hidden text-[#a0b0c0]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#0f1923] border-t border-[#00788830] px-4 py-4 space-y-3">
          <a href="#sources" onClick={() => setMobileOpen(false)} className="block text-sm text-[#a0b0c0]">Data Sources</a>
          <a href="#pricing" onClick={() => setMobileOpen(false)} className="block text-sm text-[#a0b0c0]">Pricing</a>
          <a href="#ecosystem" onClick={() => setMobileOpen(false)} className="block text-sm text-[#a0b0c0]">Ecosystem</a>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-sm text-[#00bca8]">Dashboard</Link>
              <button onClick={() => { logout(); setMobileOpen(false); }} className="block text-sm text-[#a0b0c0]">Sign Out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm text-[#00bca8]">Get Started</Link>
          )}
        </div>
      )}
    </nav>
  );
}
