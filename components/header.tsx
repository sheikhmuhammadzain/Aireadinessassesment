"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Activity, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserAccountMenu } from "@/components/user-account-menu";
import { useAuth } from "@/lib/auth-context";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  
  const handleReset = () => {
    setShowResetConfirmation(true);
  };

  const confirmReset = () => {
    // Clear all localStorage data except user data
    const userData = localStorage.getItem('user');
    localStorage.clear();
    
    // Restore user data if it existed
    if (userData) {
      localStorage.setItem('user', userData);
    }
    
    toast({
      title: "Reset Complete",
      description: "All assessment data has been cleared.",
    });
    
    // Navigate to home page
    router.push("/");
    
    // Close the modal
    setShowResetConfirmation(false);
  };

  const cancelReset = () => {
    setShowResetConfirmation(false);
  };
  
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6" />
          <span className="font-bold text-xl">AI Readiness</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/about" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/about" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              About
            </Link>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            )}
          </nav>
          
          <div className="flex items-center gap-3">
            <ModeToggle />
            <UserAccountMenu />
          </div>
        </div>
      </div>
      
      {/* Reset confirmation dialog */}
      {showResetConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Reset Confirmation</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to reset? This will clear all assessment data and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelReset}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmReset}>
                Reset All Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}