"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, UserRound, LogOut, Shield, Building } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ROLE_TO_PILLAR } from "@/lib/auth-context";
import { useState } from "react";

export function UserAccountMenu() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  // Add state to control the dropdown open state
  const [open, setOpen] = useState(false);

  // Don't show anything while loading auth state
  if (isLoading) {
    return null; // Or return a loading spinner if preferred
  }

  if (!isAuthenticated || !user) {
    return (
      <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
        <User className="mr-2 h-4 w-4" />
        Log in
      </Button>
    );
  }

  // Check if user is admin
  const isAdmin = user.role === "admin";

  // Handle navigation with dropdown control
  const handleNavigation = (path: string) => {
    setOpen(false); // Close dropdown first
    router.push(path);
  };

  // Handle logout with dropdown control
  const handleLogout = () => {
    setOpen(false); // Close dropdown first
    logout();
    router.push("/");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full">
          <UserRound className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => handleNavigation("/profile")}
          >
            <UserRound className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <Shield className="mr-2 h-4 w-4" />
            <span>Role: {user.role === "admin" ? "Administrator" : ROLE_TO_PILLAR[user.role]}</span>
          </DropdownMenuItem>
          
          {/* Company Profile link - Admin only */}
          {isAdmin && (
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => handleNavigation("/company-profile")}
            >
              <Building className="mr-2 h-4 w-4 text-primary" />
              <span>Company Profile</span>
            </DropdownMenuItem>
          )}
          
          {/* Admin panel link */}
          {isAdmin && (
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => handleNavigation("/admin")}
            >
              <Shield className="mr-2 h-4 w-4 text-primary" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 