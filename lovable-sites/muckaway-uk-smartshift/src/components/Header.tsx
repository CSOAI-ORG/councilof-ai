import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import muckawayLogo from "@/assets/muckaway-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
import RegionSelector from "@/components/RegionSelector";
import { Menu, X, Download } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        setUserProfile(profile);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          supabase
            .from("profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single()
            .then(({ data }) => setUserProfile(data));
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { to: "/ai-tools", label: "AI Tools" },
    { to: "/software", label: "Software" },
    { to: "/use-cases", label: "Use Cases" },
    { to: "/pricing", label: "Pricing" },
    { to: "/waste-calculator", label: "Calculator" },
  ];

  return (
    <header className="bg-gradient-surface border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <img 
            src={muckawayLogo} 
            alt="MuckAway.ai Logo" 
            className="h-8 w-8 filter invert"
          />
          <div className="text-xl font-bold">
            <span className="text-accent">Muck</span>
            <span className="text-primary">Away.ai</span>
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center space-x-3">
          <RegionSelector />
          <LanguageSelector />
          {user ? (
            <>
              <Badge className="bg-primary/10 text-primary">
                {userProfile?.contact_name || user.email}
              </Badge>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="action" size="sm" asChild>
                <Link to="/auth">Get Quote</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle className="flex items-center space-x-2">
                <img 
                  src={muckawayLogo} 
                  alt="MuckAway.ai" 
                  className="h-6 w-6 filter invert"
                />
                <span>
                  <span className="text-accent">Muck</span>
                  <span className="text-primary">Away.ai</span>
                </span>
              </SheetTitle>
            </SheetHeader>
            
            <nav className="flex flex-col space-y-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg text-foreground hover:text-primary transition-colors py-2"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 mt-6 pt-6 border-t border-border">
              <RegionSelector />
              <LanguageSelector />
            </div>

            <div className="flex flex-col gap-3 mt-6">
              {user ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Signed in as: {userProfile?.contact_name || user.email}
                  </div>
                  <Button variant="default" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="outline" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/auth">Sign In</Link>
                  </Button>
                  <Button variant="action" asChild onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/auth">Get Quote</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};
