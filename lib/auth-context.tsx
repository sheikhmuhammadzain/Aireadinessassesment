"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from './api/client';

// Define user roles
export type UserRole = "admin" | "ai_governance" | "ai_culture" | "ai_infrastructure" | "ai_strategy" | "ai_data" | "ai_talent" | "ai_security";

// Define user type
export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole; // Legacy field, kept for backward compatibility
  roles: UserRole[]; // New field for multiple roles
}

// Predefined users for fallback (will be replaced with API data)
export const PREDEFINED_USERS: User[] = [
  {
    id: "1",
    email: "admin@cybergen.com",
    name: "Admin User",
    role: "admin",
    roles: ["admin"]
  },
  {
    id: "2",
    email: "governance@cybergen.com",
    name: "Governance Manager",
    role: "ai_governance",
    roles: ["ai_governance"]
  },
  {
    id: "3",
    email: "culture@cybergen.com",
    name: "Culture Director",
    role: "ai_culture",
    roles: ["ai_culture"]
  },
  {
    id: "4",
    email: "infrastructure@cybergen.com",
    name: "Infrastructure Lead",
    role: "ai_infrastructure",
    roles: ["ai_infrastructure"]
  },
  {
    id: "5",
    email: "strategy@cybergen.com",
    name: "Strategy Officer",
    role: "ai_strategy",
    roles: ["ai_strategy"]
  },
  {
    id: "6",
    email: "dataengineer@cybergen.com",
    name: "Data Engineer",
    role: "ai_data",
    roles: ["ai_data"]
  },
  {
    id: "7",
    email: "talent@cybergen.com",
    name: "Talent Manager",
    role: "ai_talent",
    roles: ["ai_talent"]
  },
  {
    id: "8",
    email: "security@cybergen.com",
    name: "Security Specialist",
    role: "ai_security",
    roles: ["ai_security"]
  },
  {
    id: "9",
    email: "multi@cybergen.com",
    name: "Multi-Role User",
    role: "ai_governance", // Legacy primary role is ai_governance
    roles: ["ai_governance", "ai_culture", "ai_security"] // But has access to multiple pillars
  }
];

// Map roles to pillars
export const ROLE_TO_PILLAR: Record<UserRole, string> = {
  admin: "All Pillars",
  ai_governance: "AI Governance",
  ai_culture: "AI Culture",
  ai_infrastructure: "AI Infrastructure",
  ai_strategy: "AI Strategy",
  ai_data: "AI Data",
  ai_talent: "AI Talent",
  ai_security: "AI Security"
};

// Context type definition
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, name: string, password: string, roles: UserRole[]) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
  canEditPillar: (pillar: string) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await api.auth.getCurrentUser();
        if (error || !data) {
          console.error("Failed to get current user:", error);
          localStorage.removeItem('token');
          setIsLoading(false);
          return;
        }

        // Ensure user has a roles array
        if (!data.roles && data.role) {
          data.roles = [data.role];
        } else if (!data.roles) {
          data.roles = [];
        }

        setUser(data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await api.auth.login(email, password);
      
      if (error || !data) {
        console.error("Login failed:", error);
        throw new Error(error || "Authentication failed");
      }
      
      // Save token and user info
      localStorage.setItem('token', data.access_token);
      
      // Ensure user has a roles array
      if (!data.user.roles && data.user.role) {
        data.user.roles = [data.user.role];
      } else if (!data.user.roles) {
        data.user.roles = [];
      }
      
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Log success for debugging
      console.log("Login successful, user roles:", data.user.roles);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      // Clear any previous auth data
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      throw error; // Re-throw to allow login page to handle it
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Signup function
  const signup = async (email: string, name: string, password: string, roles: UserRole[]): Promise<boolean> => {
    try {
      const { data, error } = await api.auth.signup(email, name, password, roles);
      
      if (error || !data) {
        console.error("Signup failed:", error);
        return false;
      }
      
      // Auto-login after signup
      return await login(email, password);
    } catch (error) {
      console.error("Signup error:", error);
      return false;
    }
  };

  // Function to check if user can edit a specific pillar
  const canEditPillar = (pillar: string): boolean => {
    if (!user) return false;
    
    // Admin can edit all pillars
    if (user.roles.includes("admin")) return true;
    
    // Check if any of the user's roles match the pillar
    return user.roles.some(role => ROLE_TO_PILLAR[role] === pillar);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        signup, 
        isAuthenticated,
        isLoading,
        canEditPillar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 