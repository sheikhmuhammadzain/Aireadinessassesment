import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Globe, AlertCircle, Shield, Users, Layers, BarChart4, Database, Brain, ExternalLink } from "lucide-react";
import { CompanyInfo } from "@/types";
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
      });
    }
  };

  // Default values for required fields
  const DEFAULT_REGION = "North America";
  const DEFAULT_AI_MATURITY = "Initial";

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

    setSearchingWeb(true);
    try {
      const result = await searchCompanyAndSuggestWeights({ name: companyName });
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
                Searching Web...
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
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Web Search Results</AlertTitle>
              <AlertDescription>
                <p className="mb-2">We found the following information about {searchResults.companyDetails.name}:</p>
                <ul className="list-disc pl-5 mb-2">
                  <li><strong>Industry:</strong> {searchResults.companyDetails.industry}</li>
                  <li><strong>Size:</strong> {searchResults.companyDetails.size}</li>
                </ul>
                <p>{searchResults.explanation}</p>
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Recommended Weights</h3>
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
            
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-2">Company Insights</h3>
              <p className="text-sm text-muted-foreground">{searchResults.companyInsights}</p>
            </div>
            
            {searchResults.companyDetails.sources && searchResults.companyDetails.sources.length > 0 && (
              <div className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="text-lg font-medium mb-2">References</h3>
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
                  Information has been automatically extracted from these sources.
                </p>
              </div>
            )}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Continue to Assessment"
          )}
        </Button>
      </form>
    </Form>
  );
} 