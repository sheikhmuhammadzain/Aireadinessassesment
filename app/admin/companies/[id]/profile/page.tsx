"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { CompanyInfoForm } from "@/components/CompanyInfoForm";
import { WeightAdjustment } from "@/components/WeightAdjustment";
import { CompanyInfo, CategoryWeights } from "@/types";
import { getRecommendedWeights } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// Assessment types (same as used in assessment page)
const assessmentTypes = [
  {
    id: "AI Governance",
    title: "AI Governance",
    description: "Evaluate your organization's AI policies, accountability, and risk management frameworks.",
  },
  {
    id: "AI Culture",
    title: "AI Culture",
    description: "Assess your organization's AI adoption culture, leadership support, and collaborative practices.",
  },
  {
    id: "AI Infrastructure",
    title: "AI Infrastructure",
    description: "Evaluate your technical infrastructure's readiness to support AI initiatives.",
  },
  {
    id: "AI Strategy",
    title: "AI Strategy",
    description: "Assess your organization's AI strategy, security measures, and deployment approaches.",
  },
  {
    id: "AI Data",
    title: "AI Data",
    description: "Evaluate your data management practices, quality, and governance for AI readiness.",
  },
  {
    id: "AI Talent",
    title: "AI Talent",
    description: "Assess your organization's AI talent acquisition, training, and development strategies.",
  },
  {
    id: "AI Security",
    title: "AI Security",
    description: "Assess your organization's AI Security acquisition, training, and development strategies.",
  },
];

export default function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const unwrappedParams = use(params);
  const companyId = unwrappedParams.id;
  
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'company-info' | 'weight-adjustment'>('company-info');
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [weights, setWeights] = useState<CategoryWeights>({});
  const [recommendedWeights, setRecommendedWeights] = useState<CategoryWeights | undefined>(undefined);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Load company info from localStorage
    const loadCompanyData = () => {
      try {
        // First try to get from company_info (if this is right after company creation)
        const storedCompanyInfo = localStorage.getItem('company_info');
        if (storedCompanyInfo) {
          const parsedInfo = JSON.parse(storedCompanyInfo);
          
          // Only use if the ID matches
          if (parsedInfo.id === companyId) {
            setCompanyInfo(parsedInfo);
            setLoading(false);
            return;
          }
        }
        
        // Otherwise try to get from all companies
        const storedCompanies = localStorage.getItem('companies');
        if (storedCompanies) {
          const companies = JSON.parse(storedCompanies);
          const foundCompany = companies.find((c: any) => c.id === companyId);
          if (foundCompany) {
            setCompanyInfo(foundCompany);
            setLoading(false);
            return;
          }
        }
        
        // If we get here, company wasn't found
        toast({
          title: "Company Not Found",
          description: "The requested company could not be found.",
          variant: "destructive",
        });
        router.push("/admin/companies");
      } catch (error) {
        console.error("Error loading company data:", error);
        toast({
          title: "Error",
          description: "Failed to load company data. Please try again.",
          variant: "destructive",
        });
        router.push("/admin/companies");
      }
    };
    
    loadCompanyData();
  }, [companyId, router, toast]);

  const handleCompanyInfoSubmit = async (info: CompanyInfo, suggestedWeights?: Record<string, number>) => {
    setCompanyInfo(info);
    setLoading(true);
    setProgress(50);
    
    try {
      // Update company info in localStorage
      localStorage.setItem('company_info', JSON.stringify(info));
      
      // Also update in the companies list
      const storedCompanies = localStorage.getItem('companies');
      if (storedCompanies) {
        const companies = JSON.parse(storedCompanies);
        const updatedCompanies = companies.map((c: any) => 
          c.id === companyId ? { ...info, id: companyId } : c
        );
        localStorage.setItem('companies', JSON.stringify(updatedCompanies));
      }
      
      if (suggestedWeights) {
        // Use weights suggested by web search
        setRecommendedWeights(suggestedWeights);
        setWeights(suggestedWeights);
        toast({
          title: "Web-suggested weights applied",
          description: "We've applied the weights suggested based on your company's web profile.",
        });
      } else {
        // Fetch recommended weights based on company info
        await fetchRecommendedWeights(info);
      }
      
      setStep('weight-adjustment');
    } catch (error) {
      console.error("Error processing company info:", error);
      toast({
        title: "Error",
        description: "Failed to analyze company profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedWeights = async (info: CompanyInfo) => {
    try {
      const recommendedWeights = await getRecommendedWeights(info);
      setRecommendedWeights(recommendedWeights);
      setWeights(recommendedWeights);
    } catch (error) {
      console.error("Error fetching recommended weights:", error);
      // Fall back to equal distribution
      const categories = assessmentTypes.map(type => type.id);
      const defaultWeight = 100 / categories.length;
      
      const fallbackWeights: CategoryWeights = {};
      categories.forEach(category => {
        fallbackWeights[category] = defaultWeight;
      });
      
      setWeights(fallbackWeights);
    }
  };

  const handleWeightsChange = (newWeights: CategoryWeights) => {
    setWeights(newWeights);
  };

  const handleWeightsSubmit = () => {
    // Store weights for this company
    const companyWeightsKey = `company_weights_${companyId}`;
    localStorage.setItem(companyWeightsKey, JSON.stringify(weights));
    
    // Also set as the default weights for assessments
    localStorage.setItem('assessment_weights', JSON.stringify(weights));
    
    // Don't remove company_info here, preserve it for the assessments page
    // Ensure companyInfo has the correct ID
    if (companyInfo && companyId) {
      const updatedCompanyInfo = {
        ...companyInfo,
        id: companyId
      };
      localStorage.setItem('company_info', JSON.stringify(updatedCompanyInfo));
    }
    
    toast({
      title: "Company Profile Complete",
      description: "The company profile and assessment weights have been configured.",
    });
    
    // Navigate to the company assessments page
    router.push(`/admin/companies/${companyId}/assessments`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading...</p>
          <p className="text-sm text-muted-foreground mt-2">Preparing company profile.</p>
          <Progress value={progress} className="w-[300px] mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.push("/admin/companies")} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Company Assessment Profile</h1>
          <p className="text-muted-foreground">Configure how assessments will be weighted for this company</p>
        </div>
      </div>

      {step === 'company-info' && (
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile Configuration</CardTitle>
              <CardDescription>
                Verify or update the company information to help determine the appropriate assessment focus.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyInfoForm onSubmit={handleCompanyInfoSubmit} loading={loading} initialData={companyInfo} />
            </CardContent>
          </Card>
        </div>
      )}
      
      {step === 'weight-adjustment' && (
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Weight Configuration</CardTitle>
              <CardDescription>
                {companyInfo?.name ? `Based on ${companyInfo.name}'s profile, we recommend the following weights. Adjust them as needed.` : 'Customize the importance of each assessment category'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeightAdjustment 
                weights={weights}
                recommendedWeights={recommendedWeights}
                onWeightsChange={handleWeightsChange}
                onSubmit={handleWeightsSubmit}
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleWeightsSubmit}>
                Save and Continue 
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
} 