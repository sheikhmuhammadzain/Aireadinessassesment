import Link from "next/link";
import { Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <span className="font-semibold">AI Readiness Assessment</span>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            About
          </Link>
        </div>
        
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} AI Readiness. All rights reserved.
        </div>
      </div>
    </footer>
  );
}