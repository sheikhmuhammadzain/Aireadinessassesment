"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building, Plus } from "lucide-react";
import { CompanyInfo } from "@/types";
import { toast } from "@/hooks/use-toast";
import api from '@/lib/api/client';
import { useAuth } from "@/lib/auth-context";

interface CompanySelectorProps {
  onSelectCompany: (company: CompanyInfo) => void;
}

export function CompanySelector({ onSelectCompany }: CompanySelectorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies when component mounts
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const { data, error } = await api.companies.getCompanies();
        
        if (error) {
          throw new Error(error);
        }
        
        if (data && Array.isArray(data)) {
          setCompanies(data);
          // If there are companies, set the first one as selected
          if (data.length > 0) {
            setSelectedCompanyId(data[0].id || "");
          }
        } else {
          setCompanies([]);
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
        setError("Failed to load companies. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load companies from the server.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleSelectCompany = () => {
    if (!selectedCompanyId) {
      toast({
        title: "No Company Selected",
        description: "Please select a company or create a new one.",
        variant: "destructive"
      });
      return;
    }

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    if (selectedCompany) {
      onSelectCompany(selectedCompany);
    }
  };

  const handleCreateNewCompany = () => {
    router.push("/admin/companies/add");
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Companies</CardTitle>
          <CardDescription>Please wait while we fetch available companies...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error Loading Companies</CardTitle>
          <CardDescription>There was a problem fetching companies from the server.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          {isAdmin && (
            <Button onClick={handleCreateNewCompany}>
              <Plus className="mr-2 h-4 w-4" /> Create New Company
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select a Company</CardTitle>
        <CardDescription>
          {isAdmin 
            ? "Choose an existing company or create a new one" 
            : "Choose a company to continue with the assessment"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {companies.length === 0 ? (
          <div className="text-center py-6">
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {isAdmin 
                ? "No companies found. Create a new company to continue." 
                : "No companies found. Please contact an administrator."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id || ""}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCompanyId && (
              <div className="rounded-md bg-muted p-4">
                <h3 className="font-medium mb-2">Company Details</h3>
                {(() => {
                  const company = companies.find(c => c.id === selectedCompanyId);
                  return company ? (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Industry:</span> {company.industry}</p>
                      <p><span className="font-medium">Size:</span> {company.size}</p>
                      <p><span className="font-medium">Region:</span> {company.region}</p>
                      <p><span className="font-medium">AI Maturity:</span> {company.aiMaturity}</p>
                      {company.notes && <p><span className="font-medium">Notes:</span> {company.notes}</p>}
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
        <div className="space-x-2">
          {isAdmin && (
            <Button variant="outline" onClick={handleCreateNewCompany}>
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          )}
          {companies.length > 0 && (
            <Button onClick={handleSelectCompany} disabled={!selectedCompanyId}>
              Continue with Selected
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 