"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanySelector } from "@/components/CompanySelector";
import { CompanyInfo } from "@/types";
import { toast } from "@/hooks/use-toast";
import { Shield, Users, Layers, BarChart4, Database, Brain, Lock, ShieldAlert } from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";

// Default assessment types with their icons and descriptions
// This will be used as fallback if API fails
const defaultAssessmentTypes = [
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
  },
  {
    id: "AI Security",
    name: "AI Security", 
    icon: ShieldAlert,
    description: "Evaluate security measures for AI systems, models, and data"
  }
];

// Map pillar names to their icons
const iconMap: Record<string, React.ElementType> = {
  "AI Governance": Shield,
  "AI Culture": Users,
  "AI Infrastructure": Layers,
  "AI Strategy": BarChart4,
  "AI Data": Database,
  "AI Talent": Brain,
  "AI Security": ShieldAlert
};

// Map pillar names to their descriptions
const descriptionMap: Record<string, string> = {
  "AI Governance": "Evaluate policies, oversight mechanisms, and accountability for AI systems",
  "AI Culture": "Assess organizational awareness, attitudes, and adoption of AI technologies",
  "AI Infrastructure": "Evaluate technical foundations, platforms, and tools for AI development",
  "AI Strategy": "Assess alignment of AI initiatives with business goals and vision",
  "AI Data": "Evaluate data quality, management practices, and governance",
  "AI Talent": "Assess skills, roles, and capabilities for AI implementation",
  "AI Security": "Evaluate security measures for AI systems, models, and data"
};

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
  const [assessmentTypes, setAssessmentTypes] = useState(defaultAssessmentTypes);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch assessment types from the backend
  useEffect(() => {
    async function fetchAssessmentTypes() {
      try {
        setIsLoading(true);
        
        // Dynamically import the API client
        const { default: api } = await import('@/lib/api/client');
        
        const response = await api.questionnaires.getQuestionnaires();
        
        if (response.error) {
          console.error("Error fetching assessment types:", response.error);
          // Fallback to default assessment types
          return;
        }
        
        if (response.data) {
          // Transform the data into the format we need
          // Backend returns an object with pillar names as keys
          const pillars = Object.keys(response.data);
          
          const mappedTypes = pillars.map(pillar => ({
            id: pillar,
            name: pillar,
            icon: iconMap[pillar] || Shield, // Default to Shield if no icon mapping exists
            description: descriptionMap[pillar] || `Assessment for ${pillar}`
          }));
          
          setAssessmentTypes(mappedTypes);
        }
      } catch (error) {
        console.error("Failed to fetch assessment types:", error);
        // Keep using default assessment types
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAssessmentTypes();
  }, []);

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
                {isLoading ? (
                  <div className="flex justify-center items-center p-10">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
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
                )}
                
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
                      for AI adoption across seven key dimensions:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      {assessmentTypes.map(type => (
                        <li key={type.id}>
                          <span className="font-semibold">{type.name}:</span> {type.description}
                        </li>
                      ))}
                    </ul>
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

