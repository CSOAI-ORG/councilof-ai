import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Calendar,
  MapPin,
  Building2,
  Leaf,
  Link2,
  CreditCard,
  Truck,
  FileCheck,
  ClipboardCheck,
  Scale,
  Users,
  Brain,
  Wrench,
  Settings,
  Shield,
  LogOut,
  Package,
  Warehouse,
  ShoppingCart,
  ClipboardList,
  TrendingUp,
  HelpCircle,
  FileText,
  Bell,
  Code,
  ShieldCheck,
  EyeOff,
  CloudSun,
  Download,
} from "lucide-react";
import muckawayLogo from "@/assets/muckaway-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppSidebarProps {
  onStartTour?: () => void;
}

const mainNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "AI Tools", url: "/ai-tools", icon: Bot },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Download App", url: "/download", icon: Download },
];

const stockItems = [
  { title: "Stock Overview", url: "/stock", icon: Package },
  { title: "Depots & Yards", url: "/stock/depots", icon: Warehouse },
  { title: "Materials Catalog", url: "/stock/materials", icon: Package },
  { title: "Stock Movements", url: "/stock/movements", icon: TrendingUp },
  { title: "Aggregate Sales", url: "/sales", icon: ShoppingCart },
  { title: "Purchase Orders", url: "/purchases", icon: ClipboardList },
  { title: "Suppliers", url: "/suppliers", icon: Building2 },
];

const operationsItems = [
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Live Tracking", url: "/live-tracking", icon: MapPin },
  { title: "Weather", url: "/weather", icon: CloudSun },
  { title: "Subcontractors", url: "/subcontractors", icon: Building2 },
  { title: "Environmental", url: "/environmental", icon: Leaf },
  { title: "Integrations", url: "/integrations", icon: Link2 },
  { title: "Credit Management", url: "/credit-management", icon: CreditCard },
  { title: "Reports", url: "/reports", icon: FileText },
];

const fleetItems = [
  { title: "Fleet Management", url: "/fleet", icon: Truck },
  { title: "Driver Checks", url: "/driver-checks", icon: ClipboardCheck },
  { title: "Weighbridge OCR", url: "/weighbridge", icon: Scale },
];

const aiItems = [
  { title: "AI Classification", url: "/ai-classification", icon: Brain },
  { title: "AI Insights", url: "/ai-insights", icon: Brain },
  { title: "AI Chatbot", url: "/ai-chatbot", icon: Bot },
  { title: "Maintenance Alerts", url: "/maintenance-alerts", icon: Wrench },
];

const complianceItems = [
  { title: "Hazardous Notes", url: "/hazardous", icon: FileCheck },
  { title: "Customer Portal", url: "/customer-portal", icon: Users },
  { title: "GDPR Compliance", url: "/gdpr-compliance", icon: ShieldCheck },
  { title: "Data Anonymization", url: "/data-anonymization", icon: EyeOff },
];

const developerItems = [
  { title: "API Documentation", url: "/api-docs", icon: Code },
];

export function AppSidebar({ onStartTour }: AppSidebarProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const NavItem = ({ item }: { item: { title: string; url: string; icon: any } }) => {
    const isActive = location.pathname === item.url;
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          tooltip={collapsed ? item.title : undefined}
        >
          <Link to={item.url}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2 px-2 py-1">
          <img
            src={muckawayLogo}
            alt="MuckAway.ai"
            className="h-8 w-8 filter invert shrink-0"
          />
          {!collapsed && (
            <div className="text-lg font-bold">
              <span className="text-accent">Muck</span>
              <span className="text-primary">Away.ai</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Stock & Sales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {stockItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Fleet</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fleetItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>AI Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {aiItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Compliance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {complianceItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Developer</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {developerItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1">
              {!collapsed && <span className="text-xs text-muted-foreground">Theme</span>}
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
          {onStartTour && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={onStartTour}
                tooltip={collapsed ? "Start Tour" : undefined}
              >
                <HelpCircle className="h-4 w-4" />
                <span>Start Tour</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Profile" : undefined}>
              <Link to="/profile">
                <Settings className="h-4 w-4" />
                <span>Profile & Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Admin" : undefined}>
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={collapsed ? "Sign Out" : undefined}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
