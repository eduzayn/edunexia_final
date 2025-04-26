import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { PoloSidebar } from "@/components/layout/polo-sidebar";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { PartnerSidebar } from "@/components/layout/partner-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  noMargin?: boolean;
}

export default function DashboardShell({
  children,
  className,
  fullWidth = false,
  noMargin = false,
}: DashboardShellProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  // Determinar qual sidebar usar com base no tipo de portal
  const renderSidebar = () => {
    if (!user) return null;

    switch (user.portalType) {
      case "admin":
        return <AdminSidebar />;
      case "polo":
        return <PoloSidebar />;
      case "student":
        return <StudentSidebar />;
      case "partner":
        return <PartnerSidebar />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex flex-1">
        {renderSidebar()}
        <main
          className={cn(
            "flex flex-1 flex-col",
            fullWidth ? "max-w-full" : "max-w-6xl",
            !noMargin && "p-4 md:p-8",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}