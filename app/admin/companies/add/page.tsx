"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
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
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CompanyInfo } from "@/types";
import api from '@/lib/api/client';

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

// Default values for removed fields
const DEFAULT_REGION = "North America";
const DEFAULT_AI_MATURITY = "AI Dormant";

// AI Maturity scores mapping
const AI_MATURITY_SCORES = {
  "AI Dormant": "0-30",  // Unprepared
  "AI Aware": "30-60",   // Somewhat Ready
  "AI Rise": "60-85",    // Moderately Prepared
  "AI Ready": "85+"      // Fully Prepared
};

export default function AddCompanyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Initialize form
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      industry: "",
      size: "",
      notes: "",
    },
  });

  const onSubmit = async (values: CompanyFormValues) => {
    setSubmitting(true);
    
    try {
      // Use the API client to create the company in the database
      const { data: newCompany, error } = await api.companies.createCompany({
        name: values.name,
        industry: values.industry,
        size: values.size,
        region: DEFAULT_REGION, // Use default value
        aiMaturity: DEFAULT_AI_MATURITY, // Use default value
        notes: values.notes || "",
      });
      
      if (error) {
        throw new Error(error);
      }
      
      if (!newCompany) {
        throw new Error("Failed to create company - no data returned");
      }
      
      // Save the current company in localStorage for the profiling/weight adjustment page
      localStorage.setItem("company_info", JSON.stringify(newCompany));
      
      toast({
        title: "Company Created",
        description: `${values.name} has been successfully created. Proceeding to assessment configuration.`,
      });
      
      // Navigate to the company profiling/weight adjustment page instead
      router.push(`/admin/companies/${newCompany.id}/profile`);
    } catch (error) {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: "Failed to create company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-bold">Add New Company</h1>
          <p className="text-muted-foreground">Create a new company record</p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Enter the company details and click create when you're done.
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
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Company
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