import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";
import { MobileBottomNav } from "@/components/MobileBottomNav";

interface DashboardLayoutProps {
  children: ReactNode;
  onStartTour?: () => void;
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ai-tools": "AI Tools",
  "/ai-classification": "AI Classification",
  "/ai-insights": "AI Insights",
  "/ai-chatbot": "AI Chatbot",
  "/schedule": "Schedule",
  "/live-tracking": "Live Tracking",
  "/subcontractors": "Subcontractors",
  "/environmental": "Environmental",
  "/integrations": "Integrations",
  "/credit-management": "Credit Management",
  "/fleet": "Fleet Management",
  "/driver-checks": "Driver Checks",
  "/weighbridge": "Weighbridge OCR",
  "/maintenance-alerts": "Maintenance Alerts",
  "/hazardous": "Hazardous Notes",
  "/customer-portal": "Customer Portal",
  "/profile": "Profile & Settings",
  "/admin": "Admin Dashboard",
  "/stock": "Stock Overview",
  "/stock/depots": "Depots & Yards",
  "/stock/materials": "Materials Catalog",
  "/stock/movements": "Stock Movements",
  "/sales": "Aggregate Sales",
  "/purchases": "Purchase Orders",
  "/suppliers": "Suppliers",
  "/reports": "Reports",
  "/notifications": "Notifications",
  "/api-docs": "API Documentation",
  "/gdpr-compliance": "GDPR Compliance",
  "/data-anonymization": "Data Anonymization",
  "/weather": "Weather Operations",
  "/driver": "Driver App",
  "/quote-workflow": "Quote to Job",
  "/incident-runbook": "Incident Runbook",
};

export function DashboardLayout({ children, onStartTour }: DashboardLayoutProps) {
  const location = useLocation();
  const currentTitle = routeTitles[location.pathname] || "Dashboard";

  return (
    <SidebarProvider>
      <AppSidebar onStartTour={onStartTour} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {location.pathname !== "/dashboard" && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </SidebarInset>
      <MobileBottomNav />
    </SidebarProvider>
  );
}
