"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import CompanyInfoForm from '@/components/CompanyInfoForm';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyInfo } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { ArrowUpRightIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { getCompanyInfo, updateCompanyInfo } from '@/lib/companyApi';
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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserAndCompany() {
      try {
        setLoading(true);
        // Check user session
        const session = await getSession();
        if (!session?.user) {
          // Redirect to login if not logged in
          console.log("No user session, redirecting to login");
          router.push('/login');
          return;
        }

        // Get company info from API
        const userCompany = await getCompanyInfo(session.user.id);
        if (userCompany) {
          console.log("Company info loaded:", userCompany);
          setCompanyInfo(userCompany);
        } else {
          console.log("No company info found");
          // Initialize with empty company info
          setCompanyInfo({
            id: null,
            name: '',
            industry: '',
            size: '',
            description: '',
            userId: session.user.id,
          });
        }
      } catch (err) {
        console.error("Error loading company info:", err);
        setError("Failed to load company information. Please try again later.");
        toast({
          title: "Error loading data",
          description: "Could not load company information. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadUserAndCompany();
  }, [router, toast]);

  const handleSubmit = async (data: CompanyInfo) => {
    try {
      setSaving(true);
      
      // Update data through API
      const updated = await updateCompanyInfo(data);
      
      // Update local state with response
      setCompanyInfo(updated);
      
      toast({
        title: "Company profile updated",
        description: "Your company information has been successfully saved.",
      });
    } catch (err) {
      console.error("Error saving company info:", err);
      setError("Failed to save company information. Please try again later.");
      toast({
        title: "Error saving data",
        description: "Could not save company information. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Company Profile</h1>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Company Profile</h1>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle>Error Loading Company Profile</CardTitle>
            <CardDescription>
              We encountered an error loading your company information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">Company Profile</h1>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <Button
            variant="ghost"
            className="text-primary"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Button
            variant="outline"
            className="text-primary"
            onClick={() => router.push('/assessments')}
          >
            Go to Assessments
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Provide information about your company to help us customize your assessment experience.
            This information will be used to suggest appropriate weights for different assessment categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyInfoForm
            initialData={companyInfo}
            onSubmit={handleSubmit}
            isSaving={saving}
          />
        </CardContent>
      </Card>
      
      <div className="bg-muted/50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Why is this information important?</h2>
        <p className="mb-4">
          The information you provide about your company helps us customize the assessment process
          to better match your organization's unique characteristics and priorities.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <CheckIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Customized Category Weights</h3>
              <p className="text-sm text-muted-foreground">
                Different industries and company sizes may prioritize aspects of AI readiness differently.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <CheckIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Relevant Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                We provide tailored recommendations based on your company's specific context.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <CheckIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Benchmark Comparisons</h3>
              <p className="text-sm text-muted-foreground">
                Compare your results against similar companies in your industry.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <CheckIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Improved Accuracy</h3>
              <p className="text-sm text-muted-foreground">
                More accurate assessment results based on your specific company context.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowLeftIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
} 