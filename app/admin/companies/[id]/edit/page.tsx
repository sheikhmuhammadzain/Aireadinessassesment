"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CompanyInfo } from "@/types";

// The same sample data as in the other files for demonstration
const SAMPLE_COMPANIES: CompanyInfo[] = [
  {
    id: "1",
    name: "TechInnovate Solutions",
    industry: "Technology",
    size: "Enterprise (1000+ employees)",
    region: "North America",
    aiMaturity: "Exploring",
    notes: "Global tech firm focused on cloud solutions",
    createdAt: "2023-06-15T10:30:00Z",
    updatedAt: "2023-11-22T14:45:00Z"
  },
  {
    id: "2",
    name: "FinServe Global",
    industry: "Financial Services",
    size: "Enterprise (1000+ employees)",
    region: "Europe",
    aiMaturity: "Expanding",
    notes: "International banking corporation",
    createdAt: "2023-05-10T08:20:00Z",
    updatedAt: "2023-10-18T11:30:00Z"
  },
  {
    id: "3",
    name: "HealthPlus Medical",
    industry: "Healthcare",
    size: "Mid-size (100-999 employees)",
    region: "Asia Pacific",
    aiMaturity: "Exploring",
    notes: "Medical equipment manufacturer",
    createdAt: "2023-07-20T09:15:00Z",
    updatedAt: "2023-12-05T16:20:00Z"
  },
  {
    id: "4",
    name: "GreenEnergy Co",
    industry: "Energy",
    size: "Mid-size (100-999 employees)",
    region: "North America",
    aiMaturity: "Initial",
    notes: "Renewable energy provider",
    createdAt: "2023-08-05T13:40:00Z",
    updatedAt: "2023-11-30T10:10:00Z"
  },
  {
    id: "5",
    name: "RetailNow",
    industry: "Retail",
    size: "Small (10-99 employees)",
    region: "Europe",
    aiMaturity: "Initial",
    notes: "E-commerce company for fashion products",
    createdAt: "2023-09-12T11:25:00Z",
    updatedAt: "2023-12-10T09:30:00Z"
  }
];

// Zod schema for form validation
const companyFormSchema = z.object({
  name: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  industry: z.string().min(1, {
    message: "Please select an industry.",
  }),
  size: z.string().min(1, {
    message: "Please select a company size.",
  }),
  region: z.string().min(1, {
    message: "Please select a region.",
  }),
  aiMaturity: z.string().min(1, {
    message: "Please select an AI maturity level.",
  }),
  notes: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

// Industry options
const industryOptions = [
  "Technology",
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Energy",
  "Transportation",
  "Education",
  "Government",
  "Media & Entertainment",
  "Professional Services",
  "Other",
];

// Company size options
const sizeOptions = [
  "Small (10-99 employees)",
  "Mid-size (100-999 employees)",
  "Enterprise (1000+ employees)",
];

// Region options
const regionOptions = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
  "Middle East & Africa",
];

// AI Maturity options
const aiMaturityOptions = [
  "Initial", // Just getting started with AI
  "Exploring", // Exploring AI use cases
  "Expanding", // Implementing AI in several areas
  "Leading", // Advanced AI implementation across the organization
];

export default function EditCompanyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  // Initialize form
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      industry: "",
      size: "",
      region: "",
      aiMaturity: "",
      notes: "",
    },
  });

  useEffect(() => {
    // Load companies from localStorage
    const storedCompaniesJson = localStorage.getItem("companies");
    let companies: CompanyInfo[] = [];
    
    if (storedCompaniesJson) {
      try {
        companies = JSON.parse(storedCompaniesJson);
      } catch (error) {
        console.error("Error parsing companies from localStorage:", error);
        // Fallback to sample data if parsing fails
        companies = SAMPLE_COMPANIES;
      }
    } else {
      // If no data in localStorage, use sample data
      companies = SAMPLE_COMPANIES;
      localStorage.setItem("companies", JSON.stringify(SAMPLE_COMPANIES));
    }
    
    const foundCompany = companies.find(c => c.id === params.id);
    
    if (foundCompany) {
      setCompany(foundCompany);
      
      // Set form default values
      form.reset({
        name: foundCompany.name,
        industry: foundCompany.industry,
        size: foundCompany.size,
        region: foundCompany.region,
        aiMaturity: foundCompany.aiMaturity,
        notes: foundCompany.notes || "",
      });
    } else {
      toast({
        title: "Company Not Found",
        description: "The requested company could not be found.",
        variant: "destructive",
      });
      router.push("/admin/companies");
    }
    
    setLoading(false);
  }, [params.id, form, router]);

  const onSubmit = async (values: CompanyFormValues) => {
    setSubmitting(true);
    
    try {
      // Get all companies from localStorage
      const storedCompaniesJson = localStorage.getItem("companies");
      let companies: CompanyInfo[] = [];
      
      if (storedCompaniesJson) {
        companies = JSON.parse(storedCompaniesJson);
      }
      
      // Update the specific company
      const updatedCompanies = companies.map(c => {
        if (c.id === params.id) {
          return {
            ...c,
            ...values,
            updatedAt: new Date().toISOString()
          };
        }
        return c;
      });
      
      // Save back to localStorage
      localStorage.setItem("companies", JSON.stringify(updatedCompanies));
      
      toast({
        title: "Company Updated",
        description: `${values.name} has been successfully updated.`,
      });
      
      // Redirect to company details page
      router.push(`/admin/companies/${params.id}`);
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "Error",
        description: "Failed to update company information.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-muted rounded w-1/2 mb-8"></div>
          <div className="space-y-6">
            <div className="h-56 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
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
          <h1 className="text-3xl font-bold">Edit Company</h1>
          <p className="text-muted-foreground">Update information for {company?.name}</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update the company details and click save when you're done.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {industryOptions.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sizeOptions.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regionOptions.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aiMaturity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Maturity Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select AI maturity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {aiMaturityOptions.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter additional notes about the company" 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()} 
                  className="mr-2"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 