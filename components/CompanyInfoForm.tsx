import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building, Users, Briefcase } from "lucide-react";
import { CompanyInfo } from "@/types";

interface CompanyInfoFormProps {
  onSubmit: (companyInfo: CompanyInfo) => void;
  loading: boolean;
}

export function CompanyInfoForm({ onSubmit, loading }: CompanyInfoFormProps) {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "",
    size: "",
    industry: "",
    description: ""
  });

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(companyInfo);
  };

  const isValid = companyInfo.name.trim() !== "" && 
                 companyInfo.size !== "" && 
                 companyInfo.industry !== "";

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