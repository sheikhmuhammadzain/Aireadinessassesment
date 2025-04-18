"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  BarChart4, 
  Brain, 
  Database, 
  Layers, 
  Shield, 
  Users,
  CheckCircle,
  Loader2,
  PlayCircle
} from "lucide-react";
import Link from "next/link";
import { CompanyInfoForm } from "@/components/CompanyInfoForm";
import { WeightAdjustment } from "@/components/WeightAdjustment";
import { CompanyInfo, CategoryWeights } from "@/types";
import { fetchAllQuestionnaires, getRecommendedWeights } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth, ROLE_TO_PILLAR } from "@/lib/auth-context";

const assessmentTypes = [
  {
    id: "AI Governance",
    title: "AI Governance",
    description: "Evaluate your organization's AI policies, accountability, and risk management frameworks.",
    icon: Shield,
  },
  {
    id: "AI Culture",
    title: "AI Culture",
    description: "Assess your organization's AI adoption culture, leadership support, and collaborative practices.",
    icon: Users,
  },
  {
    id: "AI Infrastructure",
    title: "AI Infrastructure",
    description: "Evaluate your technical infrastructure's readiness to support AI initiatives.",
    icon: Layers,
  },
  {
    id: "AI Strategy",
    title: "AI Strategy",
    description: "Assess your organization's AI strategy, security measures, and deployment approaches.",
    icon: BarChart4,
  },
  {
    id: "AI Data",
    title: "AI Data",
    description: "Evaluate your data management practices, quality, and governance for AI readiness.",
    icon: Database,
  },
  {
    id: "AI Talent",
    title: "AI Talent",
    description: "Assess your organization's AI talent acquisition, training, and development strategies.",
    icon: Brain,
  },
  {
    id: "AI Security",
    title: "AI Security",
    description: "Assess your organization's AI Security acquisition, training, and development strategies.",
    icon: Shield,
  },
];

export default function AssessmentPage() {
  return (
    <ProtectedRoute>
      <AssessmentContent />
    </ProtectedRoute>
  );
}

function AssessmentContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [step, setStep] = useState<'company-info' | 'weight-adjustment' | 'categories'>('categories');
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [weights, setWeights] = useState<CategoryWeights>({});
  const [recommendedWeights, setRecommendedWeights] = useState<CategoryWeights | undefined>(undefined);
  const [questionnaires, setQuestionnaires] = useState<Record<string, string[]>>({});

  // Filter assessment types based on user role
  const filteredAssessmentTypes = assessmentTypes.filter(type => {
    // Admin can see all assessment types
    if (user?.role === "admin") return true;
    
    // Other users can only see their assigned assessment type
    return user?.role ? ROLE_TO_PILLAR[user.role] === type.title : false;
  });

  useEffect(() => {
    // Only admins should start at the company-info step
    // Other users skip directly to the categories step
    if (user?.role === "admin") {
      setStep('company-info');
    } else {
      setStep('categories');
    }

    // Check if company info is stored in localStorage - only for admins
    if (user?.role === "admin") {
      const storedCompanyInfo = localStorage.getItem('company_info');
      const storedWeights = localStorage.getItem('assessment_weights');
      
      if (storedCompanyInfo) {
        try {
          const parsedInfo = JSON.parse(storedCompanyInfo);
          setCompanyInfo(parsedInfo);
          
          if (storedWeights) {
            const parsedWeights = JSON.parse(storedWeights);
            setWeights(parsedWeights);
            setStep('categories');
          } else {
            setStep('weight-adjustment');
            fetchRecommendedWeights(parsedInfo);
          }
        } catch (error) {
          console.error("Error parsing stored company info:", error);
        }
      }
    } else {
      // For non-admin users, set default weights or use stored weights
      const storedWeights = localStorage.getItem('assessment_weights');
      if (storedWeights) {
        try {
          const parsedWeights = JSON.parse(storedWeights);
          setWeights(parsedWeights);
        } catch (error) {
          console.error("Error parsing stored weights:", error);
        }
      }
    }
    
    // Fetch all questionnaires
    const fetchQuestionnaires = async () => {
      try {
        const data = await fetchAllQuestionnaires();
        setQuestionnaires(data);
        
        // Initialize weights with equal distribution if not already set
        if (Object.keys(weights).length === 0) {
          const categories = assessmentTypes.map(type => type.id);
          const defaultWeight = 100 / categories.length;
          
          const initialWeights: CategoryWeights = {};
          categories.forEach(category => {
            initialWeights[category] = defaultWeight;
          });
          
          setWeights(initialWeights);
        }
      } catch (error) {
        console.error("Error fetching questionnaires:", error);
        toast({
          title: "Error",
          description: "Failed to load assessment data. Please try again.",
          variant: "destructive",
        });
      }
    };
    
    fetchQuestionnaires();
  }, [toast, user?.role]);

  const handleCompanyInfoSubmit = async (info: CompanyInfo, suggestedWeights?: Record<string, number>) => {
    setCompanyInfo(info);
    setLoading(true);
    
    try {
      // Store company info in localStorage
      localStorage.setItem('company_info', JSON.stringify(info));
      
      if (suggestedWeights) {
        // Use weights suggested by web search
        setRecommendedWeights(suggestedWeights);
        setWeights(suggestedWeights);
        toast({
          title: "Web-suggested weights applied",
          description: "We've applied the weights suggested based on your company's web profile.",
        });
      } else {
        // Fetch recommended weights based on company info
        await fetchRecommendedWeights(info);
      }
      
      setStep('weight-adjustment');
    } catch (error) {
      console.error("Error processing company info:", error);
      toast({
        title: "Error",
        description: "Failed to analyze company profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedWeights = async (info: CompanyInfo) => {
    try {
      const recommendedWeights = await getRecommendedWeights(info);
      setRecommendedWeights(recommendedWeights);
      setWeights(recommendedWeights);
    } catch (error) {
      console.error("Error fetching recommended weights:", error);
      // Fall back to equal distribution
      const categories = assessmentTypes.map(type => type.id);
      const defaultWeight = 100 / categories.length;
      
      const fallbackWeights: CategoryWeights = {};
      categories.forEach(category => {
        fallbackWeights[category] = defaultWeight;
      });
      
      setWeights(fallbackWeights);
    }
  };

  const handleWeightsChange = (newWeights: CategoryWeights) => {
    setWeights(newWeights);
  };

  const handleWeightsSubmit = () => {
    // Store weights in localStorage
    localStorage.setItem('assessment_weights', JSON.stringify(weights));
    setStep('categories');
  };

  const handleStartAllAssessments = () => {
    // Store the fact that we're doing all assessments
    localStorage.setItem('doing_all_assessments', 'true');
    localStorage.setItem('current_assessment_index', '0');
    localStorage.setItem('assessment_types', JSON.stringify(assessmentTypes.map(type => type.id)));
    
    // Navigate to the first assessment
    router.push(`/assessment/${encodeURIComponent(assessmentTypes[0].id)}`);
  };

  // Add a function to handle starting a single assessment
  const handleStartSingleAssessment = (assessmentId: string) => {
    // Store the fact that we're doing a single assessment
    localStorage.setItem('doing_all_assessments', 'false');
    
    // Navigate to the selected assessment
    router.push(`/assessment/${encodeURIComponent(assessmentId)}`);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {step === 'company-info' && user?.role === 'admin' && (
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Company Profile</h1>
          <CompanyInfoForm onSubmit={handleCompanyInfoSubmit} loading={loading} />
        </div>
      )}
      
      {step === 'weight-adjustment' && user?.role === 'admin' && (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Assessment Weights</h1>
          <p className="text-center text-muted-foreground mb-8">
            {companyInfo?.name ? `Based on ${companyInfo.name}'s profile, we recommend the following weights` : 'Customize the importance of each assessment category'}
          </p>
          <WeightAdjustment 
            weights={weights}
            recommendedWeights={recommendedWeights}
            onWeightsChange={handleWeightsChange}
            onSubmit={handleWeightsSubmit}
          />
        </div>
      )}
      
      {step === 'categories' && (
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">AI Readiness Assessment</h1>
          <p className="text-center text-muted-foreground mb-8">
            {user?.role === 'admin' 
              ? 'Complete assessments for each key dimension of AI readiness' 
              : user?.role ? `Complete your ${ROLE_TO_PILLAR[user.role]} assessment` : 'Complete your assessment'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredAssessmentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card key={type.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {type.title}
                    </CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span>Weight:</span>
                        <span className="font-medium">{weights[type.id]?.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Questions:</span>
                        <span className="font-medium">{questionnaires[type.id]?.length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handleStartSingleAssessment(type.id)}
                    >
                      Start Assessment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
