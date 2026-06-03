import { Link, useLocation } from 'react-router-dom';
import { Home, Brain, Briefcase, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { hapticFeedback, isNative } from '@/lib/native';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/ai-tools', icon: Brain, label: 'AI Tools' },
  { href: '/schedule', icon: Briefcase, label: 'Jobs' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export function MobileBottomNav() {
  const location = useLocation();

  const handleNavClick = () => {
    if (isNative()) {
      hapticFeedback('light');
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.slice(0, 2).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] rounded-lg transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Center FAB for quick quote */}
        <div className="relative -top-4">
          <Link to="/ai-tools" onClick={handleNavClick}>
            <Button 
              size="lg" 
              className="h-14 w-14 rounded-full shadow-lg"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        {navItems.slice(2).map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] rounded-lg transition-colors',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
