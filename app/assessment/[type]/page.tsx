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
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Info, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyInfoForm } from "@/components/CompanyInfoForm";
import { WeightAdjustment } from "@/components/WeightAdjustment";
import { SubcategoryWeightAdjustment } from "@/components/SubcategoryWeightAdjustment";
import { CompanyInfo, CategoryQuestions, CategoryWeights, SubcategoryWeights } from "@/types";
import { fetchQuestionnaire, submitAssessment, getRecommendedWeights } from "@/lib/api";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";

// Add type for weights object
type Weights = {
  [key: string]: number;
};

// Add type for responses object
type Responses = {
  [key: string]: string;
};

// Updated type for subcategory responses
type ResponsesBySubcategory = {
  [category: string]: {
    [subcategory: string]: {
      question: string;
      answer: number;
    }[];
  };
};

export default function AssessmentPage({ params }: { params: { type: string } }) {
  return (
    <ProtectedRoute>
      <AssessmentTypeContent params={params} />
    </ProtectedRoute>
  );
}

function AssessmentTypeContent({ params }: { params: { type: string } }) {
  const assessmentType = decodeURIComponent(params.type);
  const router = useRouter();
  const { toast } = useToast();
  const { user, canEditPillar } = useAuth();
  
  const [step, setStep] = useState<'company-info' | 'weight-adjustment' | 'questions'>('questions');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<Record<string, Record<string, string[]>>>({});
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [questions, setQuestions] = useState<CategoryQuestions>({});
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [weights, setWeights] = useState<Weights>({
    "AI Governance": 0,
    "AI Culture": 0,
    "AI Infrastructure": 0,
    "AI Strategy": 0,
    "AI Data": 0,
    "AI Talent": 0,
    "AI Security": 0,
  });

  const [responses, setResponses] = useState<Responses>({});
  const [recommendedWeights, setRecommendedWeights] = useState<CategoryWeights | undefined>(undefined);
  const [subcategoryWeights, setSubcategoryWeights] = useState<SubcategoryWeights>({});
  const [recommendedSubcategoryWeights, setRecommendedSubcategoryWeights] = useState<SubcategoryWeights | undefined>(undefined);

  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("questions");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isDoingAllAssessments, setIsDoingAllAssessments] = useState(false);
  const [allAssessmentTypes, setAllAssessmentTypes] = useState<string[]>([]);
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  const [lockedCategories, setLockedCategories] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const doingAll = localStorage.getItem('doing_all_assessments') === 'true';
    setIsDoingAllAssessments(doingAll);

    if (doingAll) {
      const assessmentTypes = JSON.parse(localStorage.getItem('assessment_types') || '[]');
      const currentIndex = parseInt(localStorage.getItem('current_assessment_index') || '0');
      setAllAssessmentTypes(assessmentTypes);
      setCurrentAssessmentIndex(currentIndex);
    }

    const storedCompanyInfo = localStorage.getItem('company_info');
    const storedSubcategoryWeights = localStorage.getItem('subcategory_weights');
    const storedLockedCategories = localStorage.getItem('locked_categories');

    if (storedLockedCategories) {
      try {
        const parsedLocked = JSON.parse(storedLockedCategories);
        setLockedCategories(parsedLocked);
      } catch (error) {
        console.error("Error parsing stored locked categories:", error);
        setLockedCategories({});
      }
    }

    if (storedCompanyInfo) {
      try {
        const parsedInfo = JSON.parse(storedCompanyInfo);
        setCompanyInfo(parsedInfo);

        if (storedSubcategoryWeights) {
          try {
            const parsedWeights = JSON.parse(storedSubcategoryWeights);
            setSubcategoryWeights(parsedWeights);
            setWeights(convertSubcategoryToCategory(parsedWeights));
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

  useEffect(() => {
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

  const fetchQuestionnaires = async () => {
    try {
      setLoading(true);
      setLoadingError(null);

      console.log(`Attempting to fetch questionnaire for: ${assessmentType}`);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. The server might be slow or unavailable.')), 15000);
      });

      const data = await Promise.race([fetchQuestionnaire(assessmentType), timeoutPromise]);
      console.log(`Successfully fetched questionnaire data:`, data);

      if (!data[assessmentType]) {
        throw new Error(`Invalid data structure: missing "${assessmentType}" key`);
      }

      const questionnaireData = data[assessmentType];
      console.log(`Categories found:`, Object.keys(questionnaireData));

      setQuestionnaire(data);
      const categoryList = Object.keys(questionnaireData);
      setCategories(categoryList);

      if (categoryList.length > 0) {
        setCurrentCategory(categoryList[0]);
      }

      const initialQuestions: CategoryQuestions = {};
      for (const category of categoryList) {
        initialQuestions[category] = [];
        if (questionnaireData[category] && Array.isArray(questionnaireData[category])) {
          const questions = questionnaireData[category] as string[];
          const categoryQuestions = questions.map((q: string) => ({
            question: q,
            answer: null
          }));
          initialQuestions[category] = categoryQuestions;
        }
      }

      console.log("Processed questions:", initialQuestions);
      setQuestions(initialQuestions);

      if (Object.keys(subcategoryWeights).length === 0) {
        const mainCategoryWeights = initializeCategoryWeightsOnly(questionnaireData);
        setWeights(mainCategoryWeights);

        const simpleSubcatWeights: SubcategoryWeights = {};
        for (const category in mainCategoryWeights) {
          simpleSubcatWeights[category] = {
            [category]: mainCategoryWeights[category]
          };
        }

        setSubcategoryWeights(simpleSubcatWeights);
        localStorage.setItem('subcategory_weights', JSON.stringify(simpleSubcatWeights));
      }

      setLoading(false);
      setStep('questions');
    } catch (error) {
      console.error("Error fetching questionnaire:", error);
      setLoadingError(error instanceof Error ? error.message : "Failed to load the assessment questions");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load the assessment questions. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const convertSubcategoryToCategory = (subWeights: SubcategoryWeights): CategoryWeights => {
    const catWeights: CategoryWeights = {};
    for (const category in subWeights) {
      catWeights[category] = 0;
      for (const subcategory in subWeights[category]) {
        catWeights[category] += subWeights[category][subcategory];
      }
    }
    return catWeights;
  };

  const initializeCategoryWeightsOnly = (data: Record<string, any>): CategoryWeights => {
    const categoryCount = Object.keys(data).length;
    const equalWeight = 100 / categoryCount;
    const categoryWeights: CategoryWeights = {};
    Object.keys(data).forEach(category => {
      categoryWeights[category] = parseFloat(equalWeight.toFixed(1));
    });
    return categoryWeights;
  };

  const fetchRecommendedWeights = async (info: CompanyInfo) => {
    try {
      const predefinedWeights: Weights = {
        "AI Governance": 25,
        "AI Culture": 15,
        "AI Infrastructure": 20,
        "AI Strategy": 15,
        "AI Data": 10,
        "AI Talent": 10,
        "AI Security": 5
      };

      setWeights(predefinedWeights);
      setRecommendedWeights(predefinedWeights);

      const data = await fetchQuestionnaire(assessmentType);
      setQuestionnaire(data);

      if (data[assessmentType]) {
        const questionnaireData = data[assessmentType];
        const categories = Object.keys(questionnaireData);
        const recSubWeights: SubcategoryWeights = {};

        for (const category of categories) {
          if (!(category in predefinedWeights)) continue;
          recSubWeights[category] = {};
          const categoryWeight = predefinedWeights[category] || 0;
          if (Array.isArray(questionnaireData[category])) {
            recSubWeights[category][category] = categoryWeight;
          }
        }

        setRecommendedSubcategoryWeights(recSubWeights);
        setSubcategoryWeights(recSubWeights);
        localStorage.setItem('subcategory_weights', JSON.stringify(recSubWeights));
      }
    } catch (error) {
      console.error("Error setting predefined weights:", error);
      if (Object.keys(questionnaire).length > 0) {
        const simpleData = questionnaire[assessmentType] || {};
        initializeCategoryWeightsOnly(simpleData);
      }
    }
  };

  const handleWeightsChange = (newWeights: CategoryWeights) => {
    setWeights(newWeights);
  };

  const handleSubcategoryWeightsChange = (newWeights: SubcategoryWeights) => {
    setSubcategoryWeights(newWeights);
    setWeights(convertSubcategoryToCategory(newWeights));
  };

  const handleWeightsSubmit = () => {
    localStorage.setItem('subcategory_weights', JSON.stringify(subcategoryWeights));
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
    const unansweredQuestions = questions[currentCategory].filter(q => q.answer === null);
    if (unansweredQuestions.length > 0) {
      toast({
        title: "Warning",
        description: "Please answer all questions before proceeding.",
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

  const prepareSubcategoryResponses = (): ResponsesBySubcategory => {
    const responsesBySubcategory: ResponsesBySubcategory = {};
    for (const category in questionnaire) {
      const subcategoryQuestionMap: { [key: string]: { start: number, end: number } } = {};
      let questionIndex = 0;

      for (const subcategory in questionnaire[category]) {
        const subcategoryData = questionnaire[category][subcategory];
        let questionCount = 0;

        if (Array.isArray(subcategoryData)) {
          questionCount = subcategoryData.length;
        } else if (typeof subcategoryData === 'string') {
          questionCount = 1;
        } else {
          console.warn(`Skipping subcategory ${subcategory} - unsupported data type:`, subcategoryData);
          continue;
        }

        subcategoryQuestionMap[subcategory] = {
          start: questionIndex,
          end: questionIndex + questionCount - 1
        };
        questionIndex += questionCount;
      }

      for (const subcategory in subcategoryQuestionMap) {
        const { start, end } = subcategoryQuestionMap[subcategory];
        if (!questions[category] || start >= questions[category].length) {
          console.warn(`Not enough questions for ${category}/${subcategory}. Expected to start at index ${start} but array length is ${questions[category]?.length || 0}`);
          continue;
        }

        if (!responsesBySubcategory[category]) {
          responsesBySubcategory[category] = {};
        }

        const safeEnd = Math.min(end, questions[category].length - 1);
        responsesBySubcategory[category][subcategory] = questions[category]
          .slice(start, safeEnd + 1)
          .map(q => ({
            question: q.question,
            answer: q.answer as number
          }));
      }
    }
    return responsesBySubcategory;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const timeoutId = setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "Request Timeout",
        description: "The submission is taking longer than expected. You may try again.",
        variant: "destructive",
      });
    }, 20000);

    try {
      const subcategoryResponses = prepareSubcategoryResponses();
      let totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      const normalizedWeights = { ...weights };

      if (Math.abs(totalWeight - 100) > 0.01) {
        const normalizationFactor = 100 / totalWeight;
        for (const category in normalizedWeights) {
          normalizedWeights[category] = Math.round(normalizedWeights[category] * normalizationFactor * 10) / 10;
        }

        const newTotal = Object.values(normalizedWeights).reduce((sum, w) => sum + w, 0);
        if (Math.abs(newTotal - 100) > 0.01) {
          const categories = Object.keys(normalizedWeights);
          const largestCategory = categories.reduce((a, b) =>
            normalizedWeights[a] > normalizedWeights[b] ? a : b
          );
          normalizedWeights[largestCategory] += (100 - newTotal);
        }
      }

      const categoryResponses = Object.entries(questions).map(([category, questionList]) => {
        const categoryWeight = normalizedWeights[category];
        return {
          category,
          responses: questionList.map(q => ({
            question: q.question,
            answer: q.answer as number
          })),
          weight: categoryWeight,
          subcategoryResponses: Object.entries(subcategoryWeights[category] || {}).map(([subcategory, weight]) => ({
            subcategory,
            weight,
            responses: (subcategoryResponses[category]?.[subcategory] || [])
          }))
        };
      });
      
      const payload = {
        assessmentType,
        categoryResponses
      };

      const result = await submitAssessment(payload);
      clearTimeout(timeoutId);

      localStorage.setItem(`assessment_result_${assessmentType}`, JSON.stringify(result));
      localStorage.setItem(`subcategory_weights_${assessmentType}`, JSON.stringify(subcategoryWeights));

      if (isDoingAllAssessments) {
        const nextIndex = currentAssessmentIndex + 1;
        if (nextIndex < allAssessmentTypes.length) {
          localStorage.setItem('current_assessment_index', nextIndex.toString());
          router.push(`/assessment/${encodeURIComponent(allAssessmentTypes[nextIndex])}`);
        } else {
          localStorage.removeItem('doing_all_assessments');
          localStorage.removeItem('current_assessment_index');
          localStorage.removeItem('assessment_types');
          router.push('/dashboard');
        }
      } else {
        router.push(`/results/${encodeURIComponent(assessmentType)}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: `Failed to submit the assessment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const toggleCategoryLock = (category: string) => {
    setLockedCategories(prev => {
      const updated = { ...prev };
      updated[category] = !updated[category];
      localStorage.setItem('locked_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCompanyInfoSubmit = async (info: CompanyInfo) => {
    setCompanyInfo(info);
    setLoading(true);

    try {
      localStorage.setItem('company_info', JSON.stringify(info));
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

  // Check if the user has permission to view this assessment (only admin can view all, others can view their assigned pillar)
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const userPillar = assessmentType;
      const canAccess = canEditPillar(userPillar);
      
      if (!canAccess) {
        toast({
          title: "Access Restricted",
          description: `You don't have permission to access the ${assessmentType} assessment. Please select your assigned pillar or contact your administrator.`,
          variant: "destructive",
        });
        router.push("/assessment");
      }
    }
  }, [user, assessmentType, canEditPillar, router, toast]);

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
            {companyInfo?.name ? `Based on ${companyInfo.name}'s profile, we recommend the following weights` : 'Customize the importance of each subcategory in your assessment'}
          </p>
          <SubcategoryWeightAdjustment
            weights={subcategoryWeights}
            recommendedWeights={recommendedSubcategoryWeights}
            onWeightsChange={handleSubcategoryWeightsChange}
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
          <p className="text-lg">Loading assessment questions for {assessmentType}...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a few moments. Please wait...</p>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
            <h3 className="text-lg font-medium mb-2">Error Loading Questions</h3>
            <p className="mb-4">{loadingError}</p>
            <p className="text-sm mb-4">The server might be down or there might be a connection issue.</p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => fetchQuestionnaires()}
              >
                Try Again
              </Button>
              <Button
                variant="default"
                onClick={() => router.push("/")}
              >
                Go to Home
              </Button>
            </div>
          </div>
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
          <TabsTrigger value="weights">Subcategory Weights</TabsTrigger>
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
                             value === 3 ? " Agree" : 
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
                        Adjust the weight of each main category. Lock a category to prevent its weight from changing when adjusting others.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                Set the importance of each category in your assessment (total: 100%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.keys(weights).map((category) => (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Label className="text-base font-medium">{category}</Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryLock(category);
                          }}
                          title={lockedCategories[category] ? "Unlock category weight" : "Lock category weight"}
                        >
                          {lockedCategories[category] ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <span className="font-medium">{weights[category].toFixed(1)}%</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Category weight</span>
                        <span>{weights[category].toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[weights[category] || 0]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => {
                          const newValue = value[0];
                          const oldValue = weights[category];
                          const difference = newValue - oldValue;
                          const updatedWeights = { ...weights };
                          updatedWeights[category] = newValue;

                          const otherCategories = Object.keys(updatedWeights)
                            .filter(cat => cat !== category && !lockedCategories[cat]);

                          if (otherCategories.length === 0) {
                            toast({
                              title: "Weight adjustment limited",
                              description: "All other categories are locked. Unlock some to enable proper weight distribution.",
                              variant: "destructive",
                            });
                            setWeights(prev => ({
                              ...prev,
                              [category]: newValue
                            }));
                            return;
                          }

                          const totalOtherWeights = otherCategories.reduce((sum, cat) => sum + updatedWeights[cat], 0);
                          if (totalOtherWeights > 0 && difference !== 0) {
                            let adjustedDifference = difference;
                            otherCategories.forEach(cat => {
                              const proportion = updatedWeights[cat] / totalOtherWeights;
                              const potentialNewWeight = updatedWeights[cat] - (difference * proportion);
                              if (potentialNewWeight < 1) {
                                const maxReduction = updatedWeights[cat] - 1;
                                const proportionalMaxReduction = maxReduction / proportion;
                                if (proportionalMaxReduction < Math.abs(adjustedDifference)) {
                                  adjustedDifference = difference > 0 ? proportionalMaxReduction : -proportionalMaxReduction;
                                }
                              }
                            });

                            otherCategories.forEach(cat => {
                              const proportion = updatedWeights[cat] / totalOtherWeights;
                              updatedWeights[cat] = Math.max(1, updatedWeights[cat] - (adjustedDifference * proportion));
                            });
                          }

                          let total = Object.values(updatedWeights).reduce((sum, w) => sum + w, 0);
                          if (Math.abs(total - 100) > 0.1) {
                            const lockedCats = Object.keys(updatedWeights)
                              .filter(cat => lockedCategories[cat] || cat === category);
                            const lockedSum = lockedCats.reduce((sum, cat) => sum + updatedWeights[cat], 0);
                            const remainingSum = 100 - lockedSum;

                            if (remainingSum <= 0) {
                              toast({
                                title: "Weight adjustment failed",
                                description: "Too many locked categories. Please unlock some to continue adjusting.",
                                variant: "destructive",
                              });
                              return;
                            }

                            const unlockedSum = otherCategories.reduce((sum, cat) => sum + updatedWeights[cat], 0);
                            const normalizationFactor = remainingSum / unlockedSum;
                            otherCategories.forEach(cat => {
                              updatedWeights[cat] = Math.round(updatedWeights[cat] * normalizationFactor * 10) / 10;
                            });
                          }

                          let finalTotal = Object.values(updatedWeights).reduce((sum, w) => sum + w, 0);
                          if (Math.abs(finalTotal - 100) > 0.01) {
                            if (otherCategories.length > 0) {
                              const difference = 100 - finalTotal;
                              const largestUnlockedCategory = otherCategories.reduce((a, b) =>
                                updatedWeights[a] > updatedWeights[b] ? a : b
                              );
                              updatedWeights[largestUnlockedCategory] += difference;

                              finalTotal = Object.values(updatedWeights).reduce((sum, w) => sum + w, 0);
                              if (Math.abs(finalTotal - 100) > 0.001) {
                                const tinyDifference = 100 - finalTotal;
                                updatedWeights[largestUnlockedCategory] += tinyDifference;
                              }
                            } else {
                              updatedWeights[category] = 100 - (finalTotal - updatedWeights[category]);
                            }
                          }

                          setWeights(updatedWeights);
                          const updatedSubWeights = { ...subcategoryWeights };
                          for (const cat in updatedSubWeights) {
                            if (cat === category || otherCategories.includes(cat)) {
                              const subTotal = Object.values(updatedSubWeights[cat]).reduce((sum, w) => sum + w, 0);
                              if (subTotal > 0) {
                                const factor = updatedWeights[cat] / subTotal;
                                for (const sub in updatedSubWeights[cat]) {
                                  updatedSubWeights[cat][sub] *= factor;
                                }
                              }
                            }
                          }
                          setSubcategoryWeights(updatedSubWeights);
                          localStorage.setItem('assessment_weights', JSON.stringify(updatedWeights));
                          localStorage.setItem('subcategory_weights', JSON.stringify(updatedSubWeights));
                        }}
                        className="cursor-pointer"
                        disabled={lockedCategories[category]}
                      />
                    </div>
                    {category !== Object.keys(weights).pop() && (
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
          className="relative"
        >
          {categoryIndex < categories.length - 1 ? (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
              <span className="absolute -bottom-5 text-xs font-normal text-muted-foreground whitespace-nowrap">
                This may take a few moments
              </span>
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