"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { Activity, RefreshCw, Shield, User, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserAccountMenu } from "@/components/user-account-menu";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user, logout } = useAuth();
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
  
  // Check if the current user is admin
  const isAdmin = isAuthenticated && user?.role === "admin";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleResetAssessments = () => {
    // Set a flag to indicate that weights should be reset
    localStorage.setItem('reset_weights', 'true');
    
    // Clear all assessment-related data
    localStorage.removeItem('subcategory_weights');
    localStorage.removeItem('assessment_weights');
    localStorage.removeItem('locked_categories');
    localStorage.removeItem('company_info');
    
    toast({
      title: "Assessment weights reset",
      description: "Your assessment weights and data have been reset to default values.",
    });
    
    // Refresh the current page to apply changes
    window.location.reload();
  };
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between max-w-6xl mx-auto px-4">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              AI Readiness
            </span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link 
              href="/" 
              className={cn(
                "flex items-center text-sm font-medium text-muted-foreground",
                pathname === "/" && "text-foreground"
              )}
            >
              Home
            </Link>
            <Link 
              href="/dashboard" 
              className={cn(
                "flex items-center text-sm font-medium text-muted-foreground",
                pathname === "/dashboard" && "text-foreground"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/assessment"
              className={cn(
                "flex items-center text-sm font-medium text-muted-foreground",
                pathname?.startsWith("/assessment") && "text-foreground"
              )}
            >
              Assessment
            </Link>
            <Link 
              href="/about" 
              className={cn(
                "flex items-center text-sm font-medium text-muted-foreground",
                pathname === "/about" && "text-foreground"
              )}
            >
              About
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center text-sm font-medium text-muted-foreground",
                  pathname?.startsWith("/admin") && "text-foreground"
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
          <div className="flex items-center gap-3">
            <ModeToggle />
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                      <span className="sr-only">User menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                 
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer">
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild size="sm">
                  <Link href="/login">Login</Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="block md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/">Home</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/assessment">Assessment</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/about">About</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin</Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
          </nav>
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