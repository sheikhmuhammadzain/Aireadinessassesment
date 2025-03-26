"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Define user roles
export type UserRole = "admin" | "ai_governance" | "ai_culture" | "ai_infrastructure" | "ai_strategy" | "ai_data" | "ai_talent" | "ai_security";

// Define user type
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Predefined users
export const PREDEFINED_USERS: User[] = [
  {
    id: "1",
    email: "admin@cybergen.com",
    name: "Admin User",
    role: "admin"
  },
  {
    id: "2",
    email: "governance@cybergen.com",
    name: "Governance Manager",
    role: "ai_governance"
  },
  {
    id: "3",
    email: "culture@cybergen.com",
    name: "Culture Director",
    role: "ai_culture"
  },
  {
    id: "4",
    email: "infrastructure@cybergen.com",
    name: "Infrastructure Lead",
    role: "ai_infrastructure"
  },
  {
    id: "5",
    email: "strategy@cybergen.com",
    name: "Strategy Officer",
    role: "ai_strategy"
  },
  {
    id: "6",
    email: "dataengineer@cybergen.com",
    name: "Data Engineer",
    role: "ai_data"
  },
  {
    id: "7",
    email: "talent@cybergen.com",
    name: "Talent Manager",
    role: "ai_talent"
  },
  {
    id: "8",
    email: "security@cybergen.com",
    name: "Security Specialist",
    role: "ai_security"
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
  signup: (email: string, name: string, password: string, role: UserRole) => Promise<boolean>;
  isAuthenticated: boolean;
  canEditPillar: (pillar: string) => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    // Get users from localStorage or use predefined users
    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : PREDEFINED_USERS;
    
    // Find user by email (case-insensitive)
    const foundUser = users.find((u: User) => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      setUser(foundUser);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(foundUser));
      return true;
    }
    
    return false;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  // Signup function
  const signup = async (email: string, name: string, password: string, role: UserRole): Promise<boolean> => {
    // Get existing users
    const storedUsers = localStorage.getItem('users');
    const users = storedUsers ? JSON.parse(storedUsers) : PREDEFINED_USERS;
    
    // Check if email already exists
    const emailExists = users.some((u: User) => u.email.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      return false;
    }
    
    // Create new user
    const newUser: User = {
      id: `custom_${Date.now()}`,
      email,
      name,
      role
    };
    
    // Add to users list and save
    const updatedUsers = [...users, newUser];
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Set as current user
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    return true;
  };

  // Function to check if user can edit a specific pillar
  const canEditPillar = (pillar: string): boolean => {
    if (!user) return false;
    
    // Admin can edit all pillars
    if (user.role === "admin") return true;
    
    // Other users can only edit their assigned pillar
    return ROLE_TO_PILLAR[user.role] === pillar;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        logout, 
        signup, 
        isAuthenticated,
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