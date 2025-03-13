"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyInfoForm } from "@/components/CompanyInfoForm";
import { WeightAdjustment } from "@/components/WeightAdjustment";
import { CompanyInfo, CategoryQuestions, CategoryWeights } from "@/types";
import { fetchQuestionnaire, submitAssessment, getRecommendedWeights } from "@/lib/api";
import { Slider } from "@/components/ui/slider";

// Configure your FastAPI backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AssessmentPage({ params }: { params: { type: string } }) {
  const assessmentType = decodeURIComponent(params.type);
  const router = useRouter();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'company-info' | 'weight-adjustment' | 'questions'>('questions');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<Record<string, string[]>>({});
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [questions, setQuestions] = useState<CategoryQuestions>({});
  const [weights, setWeights] = useState<CategoryWeights>({});
  const [recommendedWeights, setRecommendedWeights] = useState<CategoryWeights | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("questions");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isDoingAllAssessments, setIsDoingAllAssessments] = useState(false);
  const [allAssessmentTypes, setAllAssessmentTypes] = useState<string[]>([]);
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  
  useEffect(() => {
    // Check if we're doing all assessments
    const doingAll = localStorage.getItem('doing_all_assessments') === 'true';
    setIsDoingAllAssessments(doingAll);
    
    if (doingAll) {
      const assessmentTypes = JSON.parse(localStorage.getItem('assessment_types') || '[]');
      const currentIndex = parseInt(localStorage.getItem('current_assessment_index') || '0');
      setAllAssessmentTypes(assessmentTypes);
      setCurrentAssessmentIndex(currentIndex);
    }
    
    // Check if company info is stored in localStorage
    const storedCompanyInfo = localStorage.getItem('company_info');
    const storedWeights = localStorage.getItem('assessment_weights');
    
    if (storedCompanyInfo) {
      try {
        const parsedInfo = JSON.parse(storedCompanyInfo);
        setCompanyInfo(parsedInfo);
        
        if (storedWeights) {
          try {
            const parsedWeights = JSON.parse(storedWeights);
            setWeights(parsedWeights);
            fetchQuestionnaires();
          } catch (error) {
            console.error("Error parsing stored weights:", error);
            setStep('company-info');
          }
        } else {
          setStep('weight-adjustment');
          fetchRecommendedWeights(parsedInfo);
        }
      } catch (error) {
        console.error("Error parsing stored company info:", error);
        setStep('company-info');
      }
    } else {
      setStep('company-info');
    }
  }, [assessmentType]);

  const fetchQuestionnaires = async () => {
    try {
      // Direct call to FastAPI backend
      const data = await fetchQuestionnaire(assessmentType);
      setQuestionnaire(data);

      const categoryList = Object.keys(data);
      setCategories(categoryList);

      if (categoryList.length > 0) {
        setCurrentCategory(categoryList[0]);
      }

      // Initialize questions structure
      const initialQuestions: CategoryQuestions = {};
      
      for (const category in data) {
        initialQuestions[category] = data[category].map((q: string) => ({
          question: q,
          answer: null
        }));
      }
      
      setQuestions(initialQuestions);
      setLoading(false);
      setStep('questions');
    } catch (error) {
      console.error("Error fetching questionnaire:", error);
      toast({
        title: "Error",
        description: "Failed to load the assessment questions. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    // Calculate overall progress
    if (Object.keys(questions).length === 0) return;
    
    let answeredCount = 0;
    let totalCount = 0;
    
    for (const category in questions) {
      for (const question of questions[category]) {
        totalCount++;
        if (question.answer !== null) {
          answeredCount++;
        }
      }
    }
    
    const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
    setProgress(progressPercentage);
  }, [questions]);

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
      const defaultWeight = 100 / 7; // 7 categories
      
      const fallbackWeights: CategoryWeights = {
        "AI Governance": defaultWeight,
        "AI Culture": defaultWeight,
        "AI Infrastructure": defaultWeight,
        "AI Strategy": defaultWeight,
        "AI Data": defaultWeight,
        "AI Talent": defaultWeight,
        "AI Security": defaultWeight
      };
      
      setWeights(fallbackWeights);
    }
  };

  const handleWeightsChange = (newWeights: CategoryWeights) => {
    setWeights(newWeights);
  };

  const handleWeightsSubmit = () => {
    // Store weights in localStorage
    localStorage.setItem('assessment_weights', JSON.stringify(weights));
    fetchQuestionnaires();
  };

  const handleAnswerChange = (questionIndex: number, value: number) => {
    setQuestions(prev => {
      const updatedQuestions = { ...prev };
      updatedQuestions[currentCategory][questionIndex].answer = value;
      return updatedQuestions;
    });
  };

  const handleNext = () => {
    // Check if all questions in current category are answered
    const unansweredQuestions = questions[currentCategory].filter(q => q.answer === null);
    
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Incomplete Answers",
        description: "Please answer all questions in this category before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    if (categoryIndex < categories.length - 1) {
      setCategoryIndex(categoryIndex + 1);
      setCurrentCategory(categories[categoryIndex + 1]);
      setActiveTab("questions");
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (categoryIndex > 0) {
      setCategoryIndex(categoryIndex - 1);
      setCurrentCategory(categories[categoryIndex - 1]);
      setActiveTab("questions");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      // Format the data for the API
      const categoryResponses = Object.entries(questions).map(([category, questionList]) => ({
        category,
        responses: questionList.map(q => ({
          question: q.question,
          answer: q.answer as number
        })),
        weight: weights[category] || (100 / Object.keys(questions).length)  // Use stored weight or default
      }));
      
      const payload = {
        assessmentType,
        categoryResponses
      };

      // Direct call to FastAPI backend
      const result = await submitAssessment(payload);

      // Store result in localStorage
      localStorage.setItem(`assessment_result_${assessmentType}`, JSON.stringify(result));

      // Check if we're doing all assessments
      if (isDoingAllAssessments) {
        const nextIndex = currentAssessmentIndex + 1;
        if (nextIndex < allAssessmentTypes.length) {
          // Go to next assessment
          localStorage.setItem('current_assessment_index', nextIndex.toString());
          router.push(`/assessment/${encodeURIComponent(allAssessmentTypes[nextIndex])}`);
        } else {
          // All done, go to results
          localStorage.removeItem('doing_all_assessments');
          localStorage.removeItem('current_assessment_index');
          localStorage.removeItem('assessment_types');
          router.push('/results');
        }
      } else {
        // Single assessment, go directly to results
        router.push(`/results/${encodeURIComponent(assessmentType)}`);
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: `Failed to submit the assessment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  if (step === 'company-info') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Company Profile</h1>
          <CompanyInfoForm onSubmit={handleCompanyInfoSubmit} loading={loading} />
        </div>
      </div>
    );
  }
  
  if (step === 'weight-adjustment') {
    return (
      <div className="container mx-auto px-4 py-12">
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
            loading={loading}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading assessment questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{assessmentType} Assessment</h1>
        <p className="text-muted-foreground mb-4">
          Answer all questions on a scale of 1 (Strongly Disagree) to 4 (Strongly Agree).
        </p>
        
        {isDoingAllAssessments && (
          <div className="bg-primary/10 text-primary rounded-md p-3 mb-4 flex items-center gap-2">
            <Info className="h-5 w-5" />
            <div>
              <p className="font-medium">Assessment {currentAssessmentIndex + 1} of {allAssessmentTypes.length}</p>
              <p className="text-sm">You are completing all assessment categories in sequence</p>
            </div>
          </div>
        )}
        
        <div className="mb-2 flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="weights">Category Weights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{currentCategory}</CardTitle>
              <CardDescription>
                Category {categoryIndex + 1} of {categories.length}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-8">
                {questions[currentCategory]?.map((q, index) => (
                  <div key={index} className="space-y-4">
                    <div className="font-medium">{q.question}</div>
                    
                    <RadioGroup 
                      value={q.answer?.toString() || ""} 
                      onValueChange={(value) => handleAnswerChange(index, parseInt(value))}
                      className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0"
                    >
                      {[1, 2, 3, 4].map((value) => (
                        <div key={value} className="flex items-center space-x-2">
                          <RadioGroupItem value={value.toString()} id={`q${index}-${value}`} />
                          <Label htmlFor={`q${index}-${value}`} className="cursor-pointer">
                            {value === 1 ? "Strongly Disagree" : 
                             value === 2 ? "Disagree" : 
                             value === 3 ? "Agree" : 
                             "Strongly Agree"}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    {index < questions[currentCategory].length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weights">
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Category Weights</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Adjust the importance of each category. The weights will be used to calculate your final score.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                Customize weights for each category in your assessment
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                {Object.keys(weights).map((category) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between">
                      <Label>{category}</Label>
                      <span className="font-medium">{weights[category]?.toFixed(1)}%</span>
                    </div>
                    <Slider
                      value={[weights[category] || 0]}
                      min={5}
                      max={50}
                      step={0.1}
                      onValueChange={(value) => {
                        const newWeights = { ...weights };
                        const oldValue = newWeights[category];
                        const newValue = value[0];
                        const diff = newValue - oldValue;
                        
                        // Update the weight for this category
                        newWeights[category] = newValue;
                        
                        // Distribute the difference among other categories proportionally
                        const otherCategories = Object.keys(newWeights).filter(cat => cat !== category);
                        if (otherCategories.length > 0) {
                          const totalOtherWeights = otherCategories.reduce((sum, cat) => sum + newWeights[cat], 0);
                          
                          if (totalOtherWeights > 0) {
                            otherCategories.forEach(cat => {
                              const proportion = newWeights[cat] / totalOtherWeights;
                              newWeights[cat] = Math.max(0, newWeights[cat] - (diff * proportion));
                            });
                          }
                        }
                        
                        // Ensure all weights sum to 100 by normalizing
                        const sum = Object.values(newWeights).reduce((a, b) => a + b, 0);
                        if (Math.abs(sum - 100) > 0.1) {
                          Object.keys(newWeights).forEach(cat => {
                            newWeights[cat] = (newWeights[cat] / sum) * 100;
                          });
                        }
                        
                        setWeights(newWeights);
                        // Update in localStorage
                        localStorage.setItem('assessment_weights', JSON.stringify(newWeights));
                      }}
                      className="cursor-pointer"
                    />
                    {category !== Object.keys(weights)[Object.keys(weights).length - 1] && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={categoryIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <Button 
          onClick={handleNext}
          disabled={submitting}
        >
          {categoryIndex < categories.length - 1 ? (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit
              <CheckCircle className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}