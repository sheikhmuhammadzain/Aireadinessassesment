import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Globe, AlertCircle, Shield, Users, Layers, BarChart4, Database, Brain, ExternalLink, CheckCircle } from "lucide-react";
import { CompanyInfo, CompanyVerificationInfo } from "@/types";
import { searchCompanyAndSuggestWeights } from "@/lib/openai";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// Form validation schema - only requires company name now
const formSchema = z.object({
  name: z.string().min(2, { message: "Company name must be at least 2 characters" }),
});

export interface CompanyInfoFormProps {
  onSubmit: (info: CompanyInfo, suggestedWeights?: Record<string, number>) => void;
  loading?: boolean;
  initialData?: CompanyInfo | null;
}

// Source reference interface
interface SourceReference {
  title: string;
  link: string;
}

export function CompanyInfoForm({ onSubmit, loading = false, initialData }: CompanyInfoFormProps) {
  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  const [searchingWeb, setSearchingWeb] = useState(false);
  const [autoSearching, setAutoSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    companyDetails: {
      name: string;
      industry: string;
      size: string;
      description: string;
      sources: SourceReference[];
    };
    weights: Record<string, number>;
    explanation: string;
    companyInsights: string;
  } | null>(null);
  const { toast } = useToast();

  // Define handleWebSearch before it's referenced in useEffect
  const handleWebSearch = async () => {
    const companyName = form.getValues("name");
    if (!companyName) {
      toast({
        title: "Missing information",
        description: "Please enter a company name before searching.",
        variant: "destructive"
      });
      return;
    }

    console.log("Starting web search for company:", companyName);
    setSearchingWeb(true);
    try {
      const result = await searchCompanyAndSuggestWeights({ name: companyName });
      console.log("Search results received:", result);
      
      // Handle potential missing sources field in the result
      const resultWithSources = {
        ...result,
        companyDetails: {
          ...result.companyDetails,
          sources: result.companyDetails.sources || []
        }
      };
      setSearchResults(resultWithSources);
      toast({
        title: "Web search complete",
        description: "We've found information about your company and suggested optimal weights.",
      });
    } catch (error) {
      console.error("Error searching web:", error);
      toast({
        title: "Search failed",
        description: "Could not search for company information. Please try again or continue with default weights.",
        variant: "destructive"
      });
    } finally {
      setSearchingWeb(false);
    }
  };

  // Check if company has verified info from previous step
  useEffect(() => {
    const autoSearchCompany = async () => {
      console.log("Checking for verified company info:", initialData?.verifiedInfo);
      
      // Check if form name is filled but no search has been performed yet
      const companyName = form.getValues("name");
      if (companyName && !searchResults && !searchingWeb) {
        console.log("Company name exists but no search performed yet, auto-triggering search for:", companyName);
        handleWebSearch();
        return;
      }
      
      if (initialData?.verifiedInfo && !searchResults) {
        const verifiedInfo = initialData.verifiedInfo;
        console.log("Found verified info, isVerified status:", verifiedInfo.isVerified);
        
        // If company already has verified info, use it directly - even if not marked as verified
        if (verifiedInfo) {
          console.log("Using verified company information:", verifiedInfo);
          
          // Show auto-searching status
          setAutoSearching(true);
          setSearchingWeb(true);
          
          try {
            const result = await searchCompanyAndSuggestWeights({ 
              name: verifiedInfo.name || initialData.name,
              industry: verifiedInfo.industry,
              size: verifiedInfo.size,
              description: verifiedInfo.description
            });
            
            // Set search results using the verified info
            setSearchResults({
              companyDetails: {
                name: verifiedInfo.name || initialData.name,
                industry: verifiedInfo.industry,
                size: verifiedInfo.size,
                description: verifiedInfo.description,
                sources: verifiedInfo.sources || []
              },
              weights: result.weights,
              explanation: result.explanation,
              companyInsights: result.companyInsights || verifiedInfo.description
            });
            
            toast({
              title: "Company verified",
              description: "We've loaded your verified company information and suggested optimal weights.",
            });
          } catch (error) {
            console.error("Error using verified company info:", error);
            // Still display verified info even if weights failed
            setSearchResults({
              companyDetails: {
                name: verifiedInfo.name || initialData.name,
                industry: verifiedInfo.industry,
                size: verifiedInfo.size,
                description: verifiedInfo.description,
                sources: verifiedInfo.sources || []
              },
              weights: getDefaultEqualWeights(),
              explanation: "Using default weights due to an error in the API call.",
              companyInsights: verifiedInfo.description
            });
          } finally {
            setSearchingWeb(false);
            setAutoSearching(false);
          }
        }
      }
    };
    
    // Run immediately when component mounts
    autoSearchCompany();
  }, [initialData, toast, form]);

  // Trigger the auto-search if the form is manually filled out and component is mounted
  useEffect(() => {
    // Add a slight delay to ensure the form is fully rendered
    const timer = setTimeout(() => {
      const companyName = form.getValues("name");
      if (companyName && !searchResults && !searchingWeb) {
        console.log("Auto-triggering search on initial load for:", companyName);
        handleWebSearch();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [form, searchResults, searchingWeb, handleWebSearch]);

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (searchResults) {
      // If we have search results, use those enriched details and pass the weights
      onSubmit({
        name: searchResults.companyDetails.name || values.name,
        industry: searchResults.companyDetails.industry || "Technology", // Default fallback
        size: searchResults.companyDetails.size || "Mid-size (100-999 employees)", // Default fallback
        region: DEFAULT_REGION,
        aiMaturity: DEFAULT_AI_MATURITY,
        notes: searchResults.companyInsights || "",
        verifiedInfo: initialData?.verifiedInfo // Pass along verified info if it exists
      }, searchResults.weights);
    } else {
      // Use defaults if no search was performed
      onSubmit({
        name: values.name,
        industry: "Technology", // Default
        size: "Mid-size (100-999 employees)", // Default
        region: DEFAULT_REGION,
        aiMaturity: DEFAULT_AI_MATURITY,
        notes: "",
        verifiedInfo: initialData?.verifiedInfo // Pass along verified info if it exists
      });
    }
  };

  // Default values for required fields
  const DEFAULT_REGION = "North America";
  const DEFAULT_AI_MATURITY = "AI Dormant";
  
  // AI Maturity scores mapping
  const AI_MATURITY_SCORES = {
    "AI Dormant": "0-30",  // Unprepared
    "AI Aware": "30-60",   // Somewhat Ready
    "AI Rise": "60-85",    // Moderately Prepared
    "AI Ready": "85+"      // Fully Prepared
  };

  // Helper function to get default equal weights
  const getDefaultEqualWeights = () => {
    const categories = ["AI Governance", "AI Culture", "AI Infrastructure", "AI Strategy", "AI Data", "AI Talent", "AI Security"];
    const defaultWeight = 100 / categories.length;
    
    const weights: Record<string, number> = {};
    categories.forEach(category => {
      weights[category] = parseFloat(defaultWeight.toFixed(1));
    });
    
    // Adjust the last one to make sure it sums to 100
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(total - 100) > 0.1) {
      weights[categories[categories.length - 1]] = parseFloat((weights[categories[categories.length - 1]] + (100 - total)).toFixed(1));
    }
    
    return weights;
  };

  // Map of pillar names to their icons
  const pillarIcons: Record<string, React.ElementType> = {
    "AI Governance": Shield,
    "AI Culture": Users,
    "AI Infrastructure": Layers,
    "AI Strategy": BarChart4,
    "AI Data": Database,
    "AI Talent": Brain,
    "AI Security": Shield
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {initialData?.verifiedInfo && initialData.verifiedInfo.isVerified && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Company Successfully Verified</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                <span className="font-medium">Verification complete:</span> Company information has been confirmed using external sources.
              </p>
              {autoSearching ? (
                <div className="flex items-center text-amber-700 bg-amber-50 p-2 rounded">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin text-amber-600" />
                  <span>Automatically searching web for optimal AI readiness weights...</span>
                </div>
              ) : searchResults ? (
                <div className="flex items-center text-green-700 bg-green-50 p-2 rounded">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span>Found optimal AI readiness weights based on company profile</span>
                </div>
              ) : null}
            </AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter company name" {...field} />
              </FormControl>
              <FormDescription>Enter the name of the organization to be assessed. We'll search for details automatically.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-center">
          <Button 
            type="button" 
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleWebSearch}
            disabled={!form.getValues("name") || searchingWeb || loading}
          >
            {searchingWeb ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {autoSearching ? "Automatically Searching Web for Verified Company..." : "Searching Web..."}
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                Search Web for Company Details & Optimal Weights
              </>
            )}
          </Button>
        </div>

        {searchResults && (
          <div className="space-y-4 mt-4">
            <Alert className={initialData?.verifiedInfo?.isVerified ? "mb-4 bg-green-50 border-green-200" : "mb-4"}>
              {initialData?.verifiedInfo?.isVerified ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {initialData?.verifiedInfo?.isVerified ? "Verified Company Results" : "Web Search Results"}
              </AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  {initialData?.verifiedInfo?.isVerified 
                    ? `We've confirmed the following information about ${searchResults.companyDetails.name}:`
                    : `We found the following information about ${searchResults.companyDetails.name}:`}
                </p>
                <ul className="list-disc pl-5 mb-2">
                  <li><strong>Industry:</strong> {searchResults.companyDetails.industry}</li>
                  <li><strong>Size:</strong> {searchResults.companyDetails.size}</li>
                </ul>
                <p>{searchResults.explanation}</p>
              </AlertDescription>
            </Alert>
            
            <div className={initialData?.verifiedInfo?.isVerified 
              ? "bg-green-50 p-4 rounded-lg border border-green-200" 
              : "bg-muted/30 p-4 rounded-lg border"
            }>
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-medium flex-1">
                  {initialData?.verifiedInfo?.isVerified 
                    ? "Optimized AI Readiness Weights" 
                    : "Recommended Weights"}
                </h3>
                {initialData?.verifiedInfo?.isVerified && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" /> Verified
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {Object.entries(searchResults.weights)
                  .sort(([, a], [, b]) => b - a) // Sort by weight (highest first)
                  .map(([pillar, weight]) => {
                    const Icon = pillarIcons[pillar] || AlertCircle;
                    return (
                      <div key={pillar} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <span className="font-medium">{pillar}</span>
                          </div>
                          <span className="text-primary font-bold">{weight.toFixed(1)}%</span>
                        </div>
                        <Progress value={weight} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </div>
            
            <div className={initialData?.verifiedInfo?.isVerified 
              ? "bg-green-50 p-4 rounded-lg border border-green-200" 
              : "bg-muted/30 p-4 rounded-lg border"
            }>
              <h3 className="text-lg font-medium mb-2">
                {initialData?.verifiedInfo?.isVerified 
                  ? "Verified Company Insights" 
                  : "Company Insights"}
              </h3>
              <p className="text-sm text-muted-foreground">{searchResults.companyInsights}</p>
            </div>
            
            {searchResults.companyDetails.sources && searchResults.companyDetails.sources.length > 0 && (
              <div className={initialData?.verifiedInfo?.isVerified 
                ? "bg-green-50 p-4 rounded-lg border border-green-200" 
                : "bg-muted/30 p-4 rounded-lg border"
              }>
                <h3 className="text-lg font-medium mb-2">
                  {initialData?.verifiedInfo?.isVerified 
                    ? "Verification Sources" 
                    : "References"}
                </h3>
                <ul className="space-y-2">
                  {searchResults.companyDetails.sources.map((source, index) => (
                    <li key={index} className="text-sm flex items-center">
                      <ExternalLink className="h-3 w-3 mr-2 text-muted-foreground" />
                      <a 
                        href={source.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  {initialData?.verifiedInfo?.isVerified 
                    ? "Information has been verified against these trusted sources."
                    : "Information has been automatically extracted from these sources."}
                </p>
              </div>
            )}
          </div>
        )}

        <Button 
          type="submit" 
          className={initialData?.verifiedInfo?.isVerified 
            ? "w-full bg-green-600 hover:bg-green-700"
            : "w-full"
          }
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : initialData?.verifiedInfo?.isVerified ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Continue with Verified Company
            </>
          ) : (
            "Continue to Assessment"
          )}
        </Button>
      </form>
    </Form>
  );
} 