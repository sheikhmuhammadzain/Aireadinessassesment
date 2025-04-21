"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanySelector } from "@/components/CompanySelector";
import { CompanyInfo } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Shield, Users, Layers, BarChart4, Database, Brain, Lock } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";

// List of assessment types with their icons and descriptions
const assessmentTypes = [
  {
    id: "AI Governance",
    name: "AI Governance", 
    icon: Shield,
    description: "Evaluate policies, oversight mechanisms, and accountability for AI systems"
  },
  {
    id: "AI Culture",
    name: "AI Culture", 
    icon: Users,
    description: "Assess organizational awareness, attitudes, and adoption of AI technologies"
  },
  {
    id: "AI Infrastructure",
    name: "AI Infrastructure", 
    icon: Layers,
    description: "Evaluate technical foundations, platforms, and tools for AI development"
  },
  {
    id: "AI Strategy",
    name: "AI Strategy", 
    icon: BarChart4,
    description: "Assess alignment of AI initiatives with business goals and vision"
  },
  {
    id: "AI Data",
    name: "AI Data", 
    icon: Database,
    description: "Evaluate data quality, management practices, and governance"
  },
  {
    id: "AI Talent",
    name: "AI Talent", 
    icon: Brain,
    description: "Assess skills, roles, and capabilities for AI implementation"
  }
];

export default function AssessmentHomePage() {
  return (
    <ProtectedRoute>
      <AssessmentContent />
    </ProtectedRoute>
  );
}

function AssessmentContent() {
  const router = useRouter();
  const { user, canEditPillar } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(null);
  const [companySelected, setCompanySelected] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("AI Governance");

  const handleSelectCompany = (company: CompanyInfo) => {
    setSelectedCompany(company);
    setCompanySelected(true);
    
    // Save to localStorage for backwards compatibility
    localStorage.setItem('company_info', JSON.stringify(company));
    
        toast({
      title: "Company Selected",
      description: `Selected ${company.name} for assessment.`
    });
  };

  const handleStartAssessment = () => {
    if (!selectedCompany) {
      toast({
        title: "No Company Selected",
        description: "Please select a company to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!canEditPillar(selectedType)) {
      toast({
        title: "Access Denied",
        description: `You don't have permission to access the ${selectedType} assessment.`,
        variant: "destructive"
      });
      return;
    }

    router.push(`/assessment/${encodeURIComponent(selectedType)}`);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">AI Readiness Assessment</h1>
      
      {!companySelected ? (
        <CompanySelector onSelectCompany={handleSelectCompany} />
      ) : (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Selected Company: {selectedCompany?.name}</CardTitle>
              <CardDescription>
                {selectedCompany?.industry} • {selectedCompany?.size} • {selectedCompany?.region}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" onClick={() => setCompanySelected(false)}>
                Change Company
              </Button>
            </CardFooter>
          </Card>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Select Assessment Type</h2>
            <Tabs defaultValue="assessments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assessments">Assessment Types</TabsTrigger>
                <TabsTrigger value="about">About Assessments</TabsTrigger>
              </TabsList>
              
              <TabsContent value="assessments" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assessmentTypes.map((type) => {
              const Icon = type.icon;
                    const canAccess = canEditPillar(type.id);
                    
              return (
                      <Card 
                        key={type.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedType === type.id ? 'ring-2 ring-primary' : ''
                        } ${!canAccess ? 'opacity-60' : ''}`}
                        onClick={() => canAccess && setSelectedType(type.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-primary" />
                              <CardTitle className="text-lg">{type.name}</CardTitle>
                            </div>
                            {!canAccess && <Lock className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{type.description}</CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="mt-8 flex justify-end">
                  <Button onClick={handleStartAssessment} size="lg">
                    Start {selectedType} Assessment
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About the Assessment Framework</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>
                      The AI Readiness Assessment framework evaluates your organization's preparedness
                      for AI adoption across six key dimensions:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <span className="font-semibold">AI Governance:</span> Examines the policies, 
                        oversight mechanisms, and accountability structures in place for AI systems.
                      </li>
                      <li>
                        <span className="font-semibold">AI Culture:</span> Evaluates organizational 
                        awareness, attitudes, and adoption practices for AI technologies.
                      </li>
                      <li>
                        <span className="font-semibold">AI Infrastructure:</span> Assesses the technical 
                        foundations, platforms, and tools supporting AI development.
                      </li>
                      <li>
                        <span className="font-semibold">AI Strategy:</span> Examines how well AI initiatives 
                        align with business goals and organizational vision.
                      </li>
                      <li>
                        <span className="font-semibold">AI Data:</span> Evaluates data quality, management 
                        practices, governance, and accessibility for AI systems.
                      </li>
                      <li>
                        <span className="font-semibold">AI Talent:</span> Assesses skills, roles, training, 
                        and capabilities needed for successful AI implementation.
                      </li>
                    </ul>
                    <p>
                      Each assessment takes approximately 15-20 minutes to complete and provides 
                      targeted recommendations for improvement.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}

