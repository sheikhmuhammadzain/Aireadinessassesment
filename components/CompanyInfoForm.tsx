import { useState } from "react";
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

interface CompanyInfoFormProps {
  onSubmit: (companyInfo: CompanyInfo, suggestedWeights?: Record<string, number>) => void;
  loading: boolean;
}

export function CompanyInfoForm({ onSubmit, loading }: CompanyInfoFormProps) {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "",
    size: "",
    industry: "",
    description: ""
  });
  const [searchingWeb, setSearchingWeb] = useState(false);
  const [webSearchResult, setWebSearchResult] = useState<{
    weights: Record<string, number>;
    explanation: string;
    companyInsights: string;
  } | null>(null);
  const { toast } = useToast();

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
    // Clear web search results when form changes
    setWebSearchResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(companyInfo, webSearchResult?.weights);
  };

  const handleWebSearch = async () => {
    if (!companyInfo.name || !companyInfo.size || !companyInfo.industry) {
      toast({
        title: "Missing information",
        description: "Please fill in company name, size, and industry before searching.",
        variant: "destructive"
      });
      return;
    }

    setSearchingWeb(true);
    try {
      const result = await searchCompanyAndSuggestWeights(companyInfo);
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

  const isValid = companyInfo.name.trim() !== "" && 
                 companyInfo.size !== "" && 
                 companyInfo.industry !== "";

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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Company Information</CardTitle>
        <CardDescription>
          Please provide details about your company to help us customize the assessment weights.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="company-name" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Company Name
            </Label>
            <Input
              id="company-name"
              placeholder="Enter your company name"
              value={companyInfo.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company-size" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Company Size
            </Label>
            <Select
              value={companyInfo.size}
              onValueChange={(value) => handleChange("size", value)}
              required
            >
              <SelectTrigger id="company-size">
                <SelectValue placeholder="Select company size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Startup (1-9 employees)">Startup (1-9 employees)</SelectItem>
                <SelectItem value="Small (10-99 employees)">Small (10-99 employees)</SelectItem>
                <SelectItem value="Mid-size (100-999 employees)">Mid-size (100-999 employees)</SelectItem>
                <SelectItem value="Enterprise (1000+ employees)">Enterprise (1000+ employees)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Industry
            </Label>
            <Select
              value={companyInfo.industry}
              onValueChange={(value) => handleChange("industry", value)}
              required
            >
              <SelectTrigger id="industry">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Government">Government</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              Company Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="Briefly describe your company, its main products/services, and AI goals"
              value={companyInfo.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-center">
            <Button 
              type="button" 
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleWebSearch}
              disabled={!isValid || searchingWeb || loading}
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
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full"
            disabled={!isValid || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Company Profile...
              </>
            ) : (
              "Continue to Assessment"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 