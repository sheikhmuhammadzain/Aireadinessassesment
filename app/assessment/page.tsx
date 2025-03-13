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
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'company-info' | 'weight-adjustment' | 'categories'>('company-info');
  const [loading, setLoading] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [weights, setWeights] = useState<CategoryWeights>({});
  const [recommendedWeights, setRecommendedWeights] = useState<CategoryWeights | undefined>(undefined);
  const [questionnaires, setQuestionnaires] = useState<Record<string, string[]>>({});

  useEffect(() => {
    // Check if company info is stored in localStorage
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
  }, [toast]);

  const handleCompanyInfoSubmit = async (info: CompanyInfo) => {
    setCompanyInfo(info);
    setLoading(true);
    
    try {
      // Store company info in localStorage
      localStorage.setItem('company_info', JSON.stringify(info));
      
      // Fetch recommended weights based on company info
      await fetchRecommendedWeights(info);
      
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
      {step === 'company-info' && (
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Company Profile</h1>
          <CompanyInfoForm onSubmit={handleCompanyInfoSubmit} loading={loading} />
        </div>
      )}
      
      {step === 'weight-adjustment' && (
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
        <div>
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Assessment Categories</h1>
            <p className="text-muted-foreground">
              Select an individual assessment category or start all assessments at once
            </p>
            
            <div className="mt-6">
              <Button 
                size="lg" 
                onClick={handleStartAllAssessments}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Start All Assessments
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {assessmentTypes.map((assessment) => (
              <Card 
                key={assessment.id} 
                className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-primary/5 to-transparent transition-opacity duration-300"></div>
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                      <assessment.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-semibold">{assessment.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 relative">
                  <CardDescription className="text-muted-foreground text-sm min-h-[80px]">
                    {assessment.description}
                  </CardDescription>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Weight: </span>
                    <span className="text-primary">{weights[assessment.id]?.toFixed(1)}%</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-4 relative">
                  <Button 
                    variant="outline" 
                    className="w-full border-border/60 flex items-center justify-center gap-2 group-hover:border-primary/40 group-hover:text-primary transition-colors duration-300"
                    onClick={() => handleStartSingleAssessment(assessment.id)}
                  >
                    <span>Start Assessment</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
