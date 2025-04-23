"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="w-full overflow-auto">
        {children}
      </div>
    </div>
  );
} 