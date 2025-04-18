"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { CompanyInfoForm } from "@/components/CompanyInfoForm";
import { CompanyInfo } from "@/types";
import { ProtectedRoute } from "@/components/protected-route";

export default function CompanyProfilePage() {
  return (
    <ProtectedRoute>
      <CompanyProfileContent />
    </ProtectedRoute>
  );
}

function CompanyProfileContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access the company profile page.",
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [user, router, toast]);

  // Load company info from localStorage
  useEffect(() => {
    const storedCompanyInfo = localStorage.getItem('company_info');
    if (storedCompanyInfo) {
      try {
        const parsedInfo = JSON.parse(storedCompanyInfo);
        setCompanyInfo(parsedInfo);
      } catch (error) {
        console.error("Error parsing stored company info:", error);
      }
    }
  }, []);

  // Show loading while checking authorization or prevent flickering of unauthorized content
  if (!user || user.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Checking permissions...</p>
        </div>
      </div>
    );
  }

  const handleCompanyInfoSubmit = (info: CompanyInfo) => {
    setLoading(true);
    
    try {
      // Store company info in localStorage
      localStorage.setItem('company_info', JSON.stringify(info));
      setCompanyInfo(info);
      
      toast({
        title: "Company Profile Updated",
        description: "Company profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error saving company info:", error);
      toast({
        title: "Error",
        description: "Failed to save company profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <Building className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-3xl font-bold">Company Profile</h1>
        </div>
        
        <p className="text-center text-muted-foreground mb-8">
          Manage your company profile information for AI readiness assessments.
        </p>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyInfoForm 
              onSubmit={handleCompanyInfoSubmit} 
              loading={loading} 
              initialData={companyInfo}
            />
          </CardContent>
        </Card>
        
        <div className="flex justify-center">
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
} 