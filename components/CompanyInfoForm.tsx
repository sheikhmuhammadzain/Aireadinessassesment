import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building, Users, Briefcase, Globe, AlertCircle, BarChart4, Shield, Brain, Database, Layers } from "lucide-react";
import { CompanyInfo } from "@/types";
import { searchCompanyAndSuggestWeights } from "@/lib/openai";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  industry: z.string().min(1, { message: "Please select an industry" }),
  size: z.string().min(1, { message: "Please select a company size" }),
  description: z.string().optional(),
});

export interface CompanyInfoFormProps {
  onSubmit: (info: CompanyInfo) => void;
  loading?: boolean;
  initialData?: CompanyInfo | null;
}

export function CompanyInfoForm({ onSubmit, loading = false, initialData }: CompanyInfoFormProps) {
  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      industry: initialData?.industry || "",
      size: initialData?.size || "",
      description: initialData?.description || "",
    },
  });

  const [searchingWeb, setSearchingWeb] = useState(false);
  const [webSearchResult, setWebSearchResult] = useState<{
    weights: Record<string, number>;
    explanation: string;
    companyInsights: string;
  } | null>(null);
  const { toast } = useToast();

  // Handle form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  const handleWebSearch = async () => {
    const formValues = form.getValues();
    if (!formValues.name || !formValues.size || !formValues.industry) {
      toast({
        title: "Missing information",
        description: "Please fill in company name, size, and industry before searching.",
        variant: "destructive"
      });
      return;
    }

    setSearchingWeb(true);
    try {
      const result = await searchCompanyAndSuggestWeights(formValues);
      setWebSearchResult(result);
      toast({
        title: "Web search complete",
        description: "We've analyzed your company profile and suggested optimal weights.",
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
              <FormDescription>The name of the organization being assessed.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="industry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industry</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Select the industry that best describes your company.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Size</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Startup (1-9 employees)">Startup (1-9 employees)</SelectItem>
                  <SelectItem value="Small (10-99 employees)">Small (10-99 employees)</SelectItem>
                  <SelectItem value="Mid-size (100-999 employees)">Mid-size (100-999 employees)</SelectItem>
                  <SelectItem value="Enterprise (1000+ employees)">Enterprise (1000+ employees)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The approximate size of your organization.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of company, AI goals, or specific context..." 
                  className="resize-y min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>Any additional context that may be relevant to the assessment.</FormDescription>
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
            disabled={!form.formState.isValid || searchingWeb || loading}
          >
            {searchingWeb ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching Web...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4" />
                Search Web for Optimal Weights
              </>
            )}
          </Button>
        </div>

        {webSearchResult && (
          <div className="space-y-4 mt-4">
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Web Search Results</AlertTitle>
              <AlertDescription>
                <p className="mb-2">{webSearchResult.explanation}</p>
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Recommended Weights</h3>
              <div className="space-y-4">
                {Object.entries(webSearchResult.weights)
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
              <p className="text-sm text-muted-foreground">{webSearchResult.companyInsights}</p>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={!form.formState.isValid || loading}>
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