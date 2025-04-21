"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { CompanyInfo, CategoryWeights } from "@/types";

// API import
import {
  getRecommendedWeights,
  saveCompanyWeights,
} from "@/lib/api";

const DEFAULT_ASSESSMENT_TYPES = [
  "AI Governance",
  "AI Culture",
  "AI Infrastructure",
  "AI Strategy",
  "AI Data",
  "AI Talent",
  "AI Security"
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("weights");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [defaultWeights, setDefaultWeights] = useState<CategoryWeights>({});
  const [companyWeights, setCompanyWeights] = useState<CategoryWeights>({});

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load companies
        let companiesData: CompanyInfo[] = [];
        try {
          const storedCompanies = localStorage.getItem("companies");
          if (storedCompanies) {
            companiesData = JSON.parse(storedCompanies);
          }
        } catch (error) {
          console.error("Error loading companies from localStorage:", error);
        }
        setCompanies(companiesData);

        // Load default weights
        try {
          const apiClient = await import('@/lib/api/client');
          const result = await apiClient.default.weights.getDefaultWeights();
          if (result.data && !result.error) {
            setDefaultWeights(result.data);
          } else {
            // Fallback to client-side values
            const defaultWeights: CategoryWeights = {};
            const equalWeight = 100 / DEFAULT_ASSESSMENT_TYPES.length;
            DEFAULT_ASSESSMENT_TYPES.forEach(type => {
              defaultWeights[type] = equalWeight;
            });
            setDefaultWeights(defaultWeights);
          }
        } catch (error) {
          console.error("Error loading default weights:", error);
          // Fallback to equal distribution
          const defaultWeights: CategoryWeights = {};
          const equalWeight = 100 / DEFAULT_ASSESSMENT_TYPES.length;
          DEFAULT_ASSESSMENT_TYPES.forEach(type => {
            defaultWeights[type] = equalWeight;
          });
          setDefaultWeights(defaultWeights);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load settings data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Load company weights when selected company changes
  useEffect(() => {
    if (!selectedCompany) {
      setCompanyWeights({});
      return;
    }

    const loadCompanyWeights = async () => {
      setLoading(true);
      try {
        const apiClient = await import('@/lib/api/client');
        const result = await apiClient.default.weights.getCompanyWeights(selectedCompany);
        if (result.data && !result.error) {
          setCompanyWeights(result.data);
        } else {
          // Fallback to defaultWeights or localStorage
          try {
            const storedWeights = localStorage.getItem(`company_weights_${selectedCompany}`);
            if (storedWeights) {
              setCompanyWeights(JSON.parse(storedWeights));
            } else {
              // If no stored weights, use default
              setCompanyWeights({...defaultWeights});
            }
          } catch (error) {
            console.error("Error loading company weights from localStorage:", error);
            setCompanyWeights({...defaultWeights});
          }
        }
      } catch (error) {
        console.error("Error loading company weights:", error);
        toast({
          title: "Error",
          description: "Failed to load company weights",
          variant: "destructive",
        });
        // Fallback to default weights
        setCompanyWeights({...defaultWeights});
      } finally {
        setLoading(false);
      }
    };

    loadCompanyWeights();
  }, [selectedCompany, defaultWeights, toast]);

  // Calculate total weight
  const calculateTotalWeight = (weights: CategoryWeights) => {
    return Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  };

  // Update weight handler for default weights
  const handleDefaultWeightChange = (category: string, value: number) => {
    const newWeights = { ...defaultWeights, [category]: value };
    setDefaultWeights(newWeights);
  };

  // Update weight handler for company weights
  const handleCompanyWeightChange = (category: string, value: number) => {
    const newWeights = { ...companyWeights, [category]: value };
    setCompanyWeights(newWeights);
  };

  // Save default weights to backend
  const handleSaveDefaultWeights = async () => {
    setSaving(true);
    try {
      const totalWeight = calculateTotalWeight(defaultWeights);
      if (Math.abs(totalWeight - 100) > 0.1) {
        toast({
          title: "Error",
          description: `Weights must add up to 100%. Current total: ${totalWeight.toFixed(1)}%`,
          variant: "destructive",
        });
        return;
      }

      const apiClient = await import('@/lib/api/client');
      const result = await apiClient.default.weights.updateDefaultWeights(defaultWeights);
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Success",
        description: "Default weights saved successfully",
      });
    } catch (error) {
      console.error("Error saving default weights:", error);
      toast({
        title: "Error",
        description: "Failed to save default weights",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Save company weights to backend
  const handleSaveCompanyWeights = async () => {
    if (!selectedCompany) {
      toast({
        title: "Error",
        description: "No company selected",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const totalWeight = calculateTotalWeight(companyWeights);
      if (Math.abs(totalWeight - 100) > 0.1) {
        toast({
          title: "Error",
          description: `Weights must add up to 100%. Current total: ${totalWeight.toFixed(1)}%`,
          variant: "destructive",
        });
        return;
      }

      await saveCompanyWeights(selectedCompany, companyWeights);

      toast({
        title: "Success",
        description: "Company weights saved successfully",
      });
    } catch (error) {
      console.error("Error saving company weights:", error);
      toast({
        title: "Error",
        description: "Failed to save company weights",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset company weights to default
  const handleResetCompanyWeights = () => {
    setCompanyWeights({...defaultWeights});
    toast({
      title: "Reset Complete",
      description: "Company weights reset to default values",
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-8">Admin Settings</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="mb-4">
            <TabsTrigger value="weights">Assessment Weights</TabsTrigger>
            <TabsTrigger value="system">System Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="weights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Assessment Weights</CardTitle>
                <CardDescription>
                  Set the default weights for each assessment type. These will be used for new companies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(defaultWeights).map(([category, weight]) => (
                    <div key={category} className="grid grid-cols-12 items-center gap-4">
                      <Label className="col-span-3">{category}</Label>
                      <Slider
                        className="col-span-7"
                        value={[weight]}
                        min={0}
                        max={100}
                        step={0.1}
                        onValueChange={([value]) => handleDefaultWeightChange(category, value)}
                      />
                      <div className="col-span-2 text-right">
                        <span className="font-medium">{weight.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 text-right">
                    <p className="text-sm font-medium mb-2">
                      Total: {calculateTotalWeight(defaultWeights).toFixed(1)}%
                      {Math.abs(calculateTotalWeight(defaultWeights) - 100) > 0.1 && (
                        <span className="text-destructive ml-2">
                          (Must equal 100%)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSaveDefaultWeights} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Default Weights
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company-Specific Weights</CardTitle>
                <CardDescription>
                  Customize weights for specific companies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="mb-6">
                    <Label htmlFor="company-select" className="block mb-2">
                      Select Company
                    </Label>
                    <Select
                      value={selectedCompany}
                      onValueChange={setSelectedCompany}
                    >
                      <SelectTrigger id="company-select">
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCompany ? (
                    <>
                      <div className="space-y-4">
                        {Object.entries(companyWeights).map(([category, weight]) => (
                          <div key={category} className="grid grid-cols-12 items-center gap-4">
                            <Label className="col-span-3">{category}</Label>
                            <Slider
                              className="col-span-7"
                              value={[weight]}
                              min={0}
                              max={100}
                              step={0.1}
                              onValueChange={([value]) => handleCompanyWeightChange(category, value)}
                            />
                            <div className="col-span-2 text-right">
                              <span className="font-medium">{weight.toFixed(1)}%</span>
                            </div>
                          </div>
                        ))}

                        <div className="mt-6 text-right">
                          <p className="text-sm font-medium mb-2">
                            Total: {calculateTotalWeight(companyWeights).toFixed(1)}%
                            {Math.abs(calculateTotalWeight(companyWeights) - 100) > 0.1 && (
                              <span className="text-destructive ml-2">
                                (Must equal 100%)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between mt-6">
                        <Button
                          variant="outline"
                          onClick={handleResetCompanyWeights}
                          disabled={saving}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reset to Default
                        </Button>
                        <Button
                          onClick={handleSaveCompanyWeights}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Company Weights
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      Select a company to customize weights
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure global system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  System settings will be added in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
} 