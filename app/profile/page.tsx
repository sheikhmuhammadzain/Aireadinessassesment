"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, ROLE_TO_PILLAR } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRound, Mail, Shield, Building, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfileContent />
    </ProtectedRoute>
  );
}

function UserProfileContent() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return null; // Should not happen due to ProtectedRoute
  }

  // Use the first role from roles array, or fallback to the legacy role field
  const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : (user.role || 'admin');
  const isAdmin = primaryRole === 'admin';
  
  // Get the pillar name from the role
  const pillarName = isAdmin ? "Administrator (All Pillars)" : ROLE_TO_PILLAR[primaryRole];

  // Check for multi-role user
  const hasMultipleRoles = user.roles && user.roles.length > 1;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            View your account information
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <UserRound className="h-12 w-12 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-1" />
                  {user.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Primary Role</h3>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Badge variant="outline" className="capitalize">
                    {isAdmin ? "Admin" : primaryRole.replace('ai_', '')}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Primary Pillar</h3>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Badge variant="secondary">
                    {pillarName}
                  </Badge>
                </div>
              </div>
            </div>
            
            {hasMultipleRoles && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">All Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map(role => (
                    <Badge key={role} variant="outline" className="capitalize">
                      {role === "admin" ? "Admin" : role.replace('ai_', '')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Information</h3>
              <div className="bg-muted/30 p-4 rounded-md">
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="font-medium">User ID:</dt>
                    <dd className="text-muted-foreground">{user.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Access Level:</dt>
                    <dd className="text-muted-foreground">
                      {isAdmin ? "Full Access" : (hasMultipleRoles ? "Multi-Pillar Access" : "Pillar-specific Access")}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>

        {/* Access & Permissions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Access & Permissions</CardTitle>
            <CardDescription>Assessments you can manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin ? (
              <>
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-green-800 mb-1">Administrator Access</p>
                  <p className="text-sm text-green-700">
                    You have full access to all system features and assessments.
                  </p>
                </div>
                
                <div className="space-y-2">
                  {Object.values(ROLE_TO_PILLAR)
                    .filter(pillar => pillar !== "All Pillars")
                    .map(pillar => (
                      <div key={pillar} className="flex items-center">
                        <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">
                          ✓
                        </Badge>
                        <span>{pillar} Assessment</span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <>
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    {hasMultipleRoles ? "Multi-Pillar Access" : "Pillar-specific Access"}
                  </p>
                  <p className="text-sm text-blue-700">
                    You can manage assessments for your assigned {hasMultipleRoles ? "pillars" : "pillar"}.
                  </p>
                </div>
                
                <div className="space-y-2">
                  {Object.entries(ROLE_TO_PILLAR)
                    .filter(([role]) => role !== "admin")
                    .map(([role, pillar]) => {
                      const hasAccess = user.roles && user.roles.includes(role as any);
                      return (
                        <div key={pillar} className="flex items-center">
                          {hasAccess ? (
                            <Badge className="mr-2 bg-green-100 text-green-800 hover:bg-green-100">
                              ✓
                            </Badge>
                          ) : (
                            <Badge className="mr-2 bg-gray-100 text-gray-500 hover:bg-gray-100">
                              ✗
                            </Badge>
                          )}
                          <span className={hasAccess ? "" : "text-muted-foreground"}>
                            {pillar} Assessment
                          </span>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 