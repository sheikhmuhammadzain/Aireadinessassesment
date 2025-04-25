"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { CompanyInfoForm } from "@/components/CompanyInfoForm";
import { WeightAdjustment } from "@/components/WeightAdjustment";
import { CompanyInfo, CategoryWeights } from "@/types";
import { getRecommendedWeights } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import api from '@/lib/api/client';

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
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);

  useEffect(() => {
    // Load company info from localStorage
    const loadCompanyData = async () => {
      try {
        console.log("Loading company data for ID:", companyId);
        // First try to get from company_info (if this is right after company creation)
        const storedCompanyInfo = localStorage.getItem('company_info');
        if (storedCompanyInfo) {
          const parsedInfo = JSON.parse(storedCompanyInfo);
          console.log("Found stored company info:", parsedInfo);
          
          // Only use if the ID matches
          if (parsedInfo.id === companyId) {
            setCompanyInfo(parsedInfo);
            
            // Set progress to indicate search will happen
            setProgress(40);
            
            // If company has verified info from the add company page, auto-progress to weight adjustment
            if (parsedInfo.verifiedInfo) {
              console.log("Company has verified info:", parsedInfo.verifiedInfo);
              try {
                // Use verified info to get recommended weights
                const suggestedWeights = await getRecommendedWeights(parsedInfo);
                console.log("Received suggested weights:", suggestedWeights);
                setRecommendedWeights(suggestedWeights);
                setWeights(suggestedWeights);
                setProgress(80);
                
                // Auto-progress to weight adjustment if verified
                if (parsedInfo.verifiedInfo.isVerified) {
                  setStep('weight-adjustment');
                  toast({
                    title: "Company Verified",
                    description: "We've loaded your verified company details and suggested weights based on the company profile.",
                  });
                }
              } catch (weightError) {
                console.warn("Could not get recommended weights:", weightError);
              }
            } else {
              // Try to get saved weights from database
              try {
                const { data: savedWeights, error } = await api.weights.getCompanyWeights(companyId);
                if (!error && savedWeights && savedWeights.weights) {
                  // If we have saved weights, use those
                  console.log("Found saved weights in database:", savedWeights.weights);
                  setRecommendedWeights(savedWeights.weights);
                  setWeights(savedWeights.weights);
                }
              } catch (weightError) {
                console.warn("Could not fetch saved weights from database:", weightError);
                // Will continue with default weights
              }
            }
            
            setProgress(100);
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
            
            // Try to get saved weights from database
            try {
              const { data: savedWeights, error } = await api.weights.getCompanyWeights(companyId);
              if (!error && savedWeights && savedWeights.weights) {
                // If we have saved weights, use those
                console.log("Found saved weights in database:", savedWeights.weights);
                setRecommendedWeights(savedWeights.weights);
                setWeights(savedWeights.weights);
              }
            } catch (weightError) {
              console.warn("Could not fetch saved weights from database:", weightError);
              // Will continue with default weights
            }
            
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
        // Use weights suggested by web search - this is the preferred source
        console.log("Using web search suggested weights:", suggestedWeights);
        setRecommendedWeights(suggestedWeights);
        setWeights(suggestedWeights);
        
        // Store the weights in localStorage to preserve them
        const companyWeightsKey = `company_weights_${companyId}`;
        localStorage.setItem(companyWeightsKey, JSON.stringify(suggestedWeights));
        
        // Save weights to backend database
        try {
          const weightsData = {
            weights: suggestedWeights
          };
          
          // Save weights to backend
          const weightResponse = await api.weights.updateCompanyWeights(companyId, weightsData);
          
          if (!weightResponse.error) {
            console.log("Successfully saved suggested weights to backend database:", weightResponse.data);
          } else {
            console.warn("Failed to save weights to backend:", weightResponse.error);
          }
          
          // Also update company info in the database
          const updatedCompanyInfo = {
            ...info,
            id: companyId
          };
          
          const companyResponse = await api.companies.updateCompany(companyId, updatedCompanyInfo);
          
          if (!companyResponse.error) {
            console.log("Successfully saved company data to backend database:", companyResponse.data);
          } else {
            console.warn("Failed to save company data to backend:", companyResponse.error);
          }
          
        } catch (dbError) {
          console.warn("Error saving to backend database:", dbError);
        }
        
        toast({
          title: "Web-suggested weights applied",
          description: "We've applied the weights suggested based on your company's web profile.",
        });
      } else {
        // If no web search weights, use equal distribution for all assessment types
        console.log("No web-suggested weights, using equal distribution");
        const categories = assessmentTypes.map(type => type.id);
        const defaultWeight = 100 / categories.length;
        
        const fallbackWeights: CategoryWeights = {};
        categories.forEach(category => {
          fallbackWeights[category] = defaultWeight;
        });
        
        setRecommendedWeights(fallbackWeights);
        setWeights(fallbackWeights);
        
        // Save default weights to backend
        try {
          const weightsData = {
            weights: fallbackWeights
          };
          
          const weightResponse = await api.weights.updateCompanyWeights(companyId, weightsData);
          
          if (!weightResponse.error) {
            console.log("Successfully saved default weights to backend database:", weightResponse.data);
          } else {
            console.warn("Failed to save default weights to backend:", weightResponse.error);
          }
        } catch (dbError) {
          console.warn("Error saving default weights to backend:", dbError);
        }
        
        toast({
          title: "Default weights applied",
          description: "Using equal weights for all assessment types.",
        });
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
      // First try to fetch weights from database since these may be the previously recommended and saved weights
      if (info.id) {
        console.log("Attempting to fetch previously saved weights from the database for company:", info.id);
        try {
          const { data: savedWeights, error } = await api.weights.getCompanyWeights(info.id);
          
          if (!error && savedWeights && Object.keys(savedWeights).length > 0) {
            // If we have saved weights in the database, use those as the recommended weights
            console.log("Found saved weights in database:", savedWeights);
            setRecommendedWeights(savedWeights);
            setWeights(savedWeights);
            
            toast({
              title: "Weights Loaded",
              description: "Using previously saved recommended weights for this company.",
            });
            return;
          }
        } catch (dbError) {
          console.warn("Could not fetch weights from database, falling back to recommendations:", dbError);
        }
      }
      
      // If no weights in database, fall back to AI recommendations or equal distribution
      const aiRecommendedWeights = await getRecommendedWeights(info);
      setRecommendedWeights(aiRecommendedWeights);
      setWeights(aiRecommendedWeights);
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

  const handleWeightsSubmit = async () => {
    // Show loading toast
    toast({
      title: "Saving weights",
      description: "Saving assessment weights to the backend...",
    });

    try {
      // Store weights for this company
      const companyWeightsKey = `company_weights_${companyId}`;
      localStorage.setItem(companyWeightsKey, JSON.stringify(weights));
      
      // Also set as the default weights for assessments
      localStorage.setItem('assessment_weights', JSON.stringify(weights));
      
      // Save to backend database
      const weightsData = {
        weights: weights
      };
      
      const response = await api.weights.updateCompanyWeights(companyId, weightsData);
      
      if (!response.error) {
        console.log("Successfully saved final weights to backend database:", response.data);
        
        // Also update company info in the database if available
        if (companyInfo) {
          const updatedCompanyInfo = {
            ...companyInfo,
            id: companyId
          };
          
          const companyResponse = await api.companies.updateCompany(companyId, updatedCompanyInfo);
          
          if (!companyResponse.error) {
            console.log("Successfully saved company data to backend database:", companyResponse.data);
          } else {
            console.warn("Failed to save company data to backend:", companyResponse.error);
          }
        }
        
        // Save success toast
        toast({
          title: "Company Profile Complete",
          description: "The company profile and assessment weights have been saved to the database.",
        });
      } else {
        console.warn("Error saving weights to backend:", response.error);
        toast({
          title: "Partial Save",
          description: "Weights saved locally but couldn't be saved to the backend database.",
          variant: "default"
        });
      }
      
      // Navigate to the company assessments page
      router.push(`/admin/companies/${companyId}/assessments`);
    } catch (error) {
      console.error("Error saving weights:", error);
      toast({
        title: "Error",
        description: "An error occurred while saving weights. Local data has been preserved.",
        variant: "destructive"
      });
      
      // Continue to the next page anyway since we've saved locally
      router.push(`/admin/companies/${companyId}/assessments`);
    }
  };

  const saveRecommendedWeights = async () => {
    // Use the companyId from the URL params instead of companyInfo.id
    if (!companyId) {
      toast({
        title: "Error",
        description: "Company ID is required to save weights.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save the current weights to localStorage
      const companyWeightsKey = `company_weights_${companyId}`;
      localStorage.setItem(companyWeightsKey, JSON.stringify(weights));
      
      // Also set as the default weights for assessments
      localStorage.setItem('assessment_weights', JSON.stringify(weights));
      
      // Save to the backend with improved error handling and logging
      try {
        const weightsData = {
          weights: weights
        };
        
        const response = await api.weights.updateCompanyWeights(companyId, weightsData);
        
        if (!response.error) {
          console.log("Successfully saved weights to backend database:", response.data);
          
          // Also update company info in the database if available
          if (companyInfo) {
            const updatedCompanyInfo = {
              ...companyInfo,
              id: companyId
            };
            
            const companyResponse = await api.companies.updateCompany(companyId, updatedCompanyInfo);
            
            if (!companyResponse.error) {
              console.log("Successfully saved company data to backend database:", companyResponse.data);
            } else {
              console.warn("Failed to save company data to backend:", companyResponse.error);
            }
          }
          
          toast({
            title: "Weights Saved",
            description: "The weights have been saved to the backend database.",
          });
        } else {
          console.warn("Error from backend API:", response.error);
          toast({
            title: "Partial Save",
            description: "Weights saved locally but couldn't be saved to the backend database.",
            variant: "default"
          });
        }
      } catch (apiError) {
        console.error("Error saving to backend:", apiError);
        toast({
          title: "Partial Save",
          description: "Weights saved locally but couldn't be saved to the backend database.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error saving weights:", error);
      toast({
        title: "Error",
        description: "Failed to save weights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading...</p>
          {companyInfo?.verifiedInfo?.isVerified ? (
            <>
              <p className="text-sm text-green-700 font-medium mt-2">
                <CheckCircle className="h-4 w-4 inline-block mr-1" />
                Verified Company Detected
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Automatically searching for company details and optimal weights
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">Preparing company profile.</p>
          )}
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

      {step === 'company-info' && companyInfo?.verifiedInfo?.isVerified && searchResults && (
        <div className="max-w-3xl mx-auto mb-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Verified Company: {companyInfo.name}</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>We've automatically searched for optimal AI readiness weights based on your verified company information.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {companyInfo?.verifiedInfo?.isVerified ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Company Verified: {companyInfo.name}</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your company information has been verified with external sources.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center p-6 border border-amber-200 bg-amber-50 rounded-md">
                    <div className="flex justify-center mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                    <h3 className="text-lg font-medium text-amber-800 mb-2">Optimizing AI Readiness Weights</h3>
                    <p className="text-amber-700">We're automatically calculating the optimal weights for your verified company based on industry benchmarks and best practices.</p>
                    <div className="mt-4">
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-amber-600 mt-2">This may take a moment...</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    <Button 
                      onClick={() => setStep('weight-adjustment')}
                      className="w-full max-w-md bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Continue with Verified Company
                    </Button>
                  </div>
                </div>
              ) : (
                <CompanyInfoForm onSubmit={handleCompanyInfoSubmit} loading={loading} initialData={companyInfo} />
              )}
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