// AssessmentPage.tsx
"use client";

import { useEffect, useState, use, useCallback } from "react"; // Added 'use' and useCallback
import { useRouter, useSearchParams } from "next/navigation";
import NextDynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Info, Lock, Unlock, AlertCircle, Check, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyInfoForm } from "@/components/CompanyInfoForm";
import { WeightAdjuster } from "@/components/WeightAdjuster";
import { CategoryWeightAdjuster } from "@/components/CategoryWeightAdjuster";
import PersonalizedQuestions from "@/app/components/PersonalizedQuestions"; // Fixed path
import { CompanyInfo, CategoryWeights, SubcategoryWeights } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  fetchQuestionnaire, 
  fetchAllQuestionnaires, 
  submitAssessment, 
  getRecommendedWeights,
  saveCompanyWeights,
  saveCategoryWeights,
  fetchPersonalizedQuestionnaire,
  submitPersonalizedAssessment
} from "@/lib/api";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { Switch } from "@/components/ui/switch";

// --- Question Type Definitions ---
interface QuestionItem {
      question: string;
  answer: number | null; // Allow null for unanswered
}

// --- Question Category Type ---
type CategoryQuestions = Record<string, QuestionItem[]>;

// --- Submission Type Definition ---
interface AssessmentSubmission {
  assessmentType: string;
  companyInfo: CompanyInfo;
  userId: string;
  // Updated categoryResponses to match backend expectations if different
  // If backend expects simpler structure, adjust here. Assuming detailed for now.
  categoryResponses: {
    category: string;
      weight: number; // Add category weight
      responses: { question: string; answer: number }[]; // Simplified answer structure
      // Add subcategory details if needed by backend
      subcategoryResponses?: {
          subcategory: string;
          weight: number;
          // Map relevant questions/answers here if backend needs it per subcategory
      }[];
  }[];
  finalWeights: CategoryWeights; // Use renamed type
  finalSubcategoryWeights: SubcategoryWeights;
}

// --- Personalized Question Interface ---
interface PersonalizedQuestion {
  text: string;
  options: Array<{
    id: string;
    text: string;
  }>;
}

// --- Main Page Component ---
export default function AssessmentPage({ params }: { params: Promise<{ type: string }> }) {
  // Use the use() hook to unwrap the Promise params
  const unwrappedParams = use(params);
  
  return (
    <ProtectedRoute>
      <AssessmentTypeContent type={unwrappedParams.type} />
    </ProtectedRoute>
  );
}

// --- Core Content Component ---
function AssessmentTypeContent({ type }: { type: string }): JSX.Element {
  const assessmentType = decodeURIComponent(type);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, canEditPillar } = useAuth();
  
  // Immediately redirect if user doesn't have access to this pillar
  useEffect(() => {
    if (!canEditPillar(assessmentType)) {
      toast({
        title: "Access Denied",
        description: `You don't have permission to access the ${assessmentType} assessment.`,
        variant: "destructive",
      });
      router.push("/dashboard");
    }
  }, [assessmentType, canEditPillar, router, toast]);

  // Show loading while checking authorization or prevent flickering of unauthorized content
  if (!canEditPillar(assessmentType)) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Checking permissions...</p>
        </div>
      </div>
    );
  }
  
  // --- State Variables ---
  const [step, setStep] = useState<'company-info' | 'weight-adjustment' | 'questions'>(() => {
    // Check if company info exists in localStorage
    const storedCompanyInfo = typeof window !== 'undefined' ? localStorage.getItem('company_info') : null;
    if (storedCompanyInfo) {
      try {
        // If we have company info, start with questions
        return 'questions';
      } catch (e) {
        console.error("Error parsing stored company info:", e);
      }
    }
    return 'company-info'; // Fall back to company-info step
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<Record<string, Record<string, any>>>({}); // Structure from fetch
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [questions, setQuestions] = useState<CategoryQuestions>({}); // Use defined type
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [weights, setWeights] = useState<CategoryWeights>({}); // Renamed type
  const [recommendedWeights, setRecommendedWeights] = useState<CategoryWeights | undefined>(undefined); // Renamed type
  const [subcategoryWeights, setSubcategoryWeights] = useState<SubcategoryWeights>({});
  const [recommendedSubcategoryWeights, setRecommendedSubcategoryWeights] = useState<SubcategoryWeights | undefined>(undefined);

  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("questions");
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isDoingAllAssessments, setIsDoingAllAssessments] = useState(false);
  const [allAssessmentTypes, setAllAssessmentTypes] = useState<string[]>([]);
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  const [lockedCategories, setLockedCategories] = useState<Record<string, boolean>>({});

  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Record<string, any> | null>(null);

  // Add new state variables for personalized questions
  const [usePersonalizedQuestions, setUsePersonalizedQuestions] = useState(true);
  const [personalizedQuestions, setPersonalizedQuestions] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, string>>>({});
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(false);
  const [hasAttemptedPersonalized, setHasAttemptedPersonalized] = useState(false);

  // --- Helper Function: Rounding ---
  const roundToOneDecimal = (num: number): number => {
    return parseFloat(num.toFixed(1));
  };

  // --- Helper Function: Initialize Default Weights ---
  const initializeDefaultSubcategoryWeights = (data: Record<string, any>): SubcategoryWeights => {
    const categories = Object.keys(data);
    if (categories.length === 0) return {};

    const subWeights: SubcategoryWeights = {};

    // Initialize weights for each category and its subcategories
    categories.forEach(category => {
      subWeights[category] = {};
      const categoryData = data[category];
      
      // Determine subcategories: could be keys of an object, or the category name itself
      let subcategories: string[] = [];
      if (typeof categoryData === 'object' && !Array.isArray(categoryData) && categoryData !== null) {
        subcategories = Object.keys(categoryData);
      } else if (Array.isArray(categoryData)) {
        // If it's an array of questions, use the category name as the only subcategory
        subcategories = [category];
      }
      
      if (subcategories.length === 0) return;
      
      // Distribute 100% evenly among subcategories within THIS category
      const equalWeight = Math.floor((100 / subcategories.length) * 10) / 10; // Round to 1 decimal
      
      // First assign the equal weight to all subcategories
      subcategories.forEach(subcat => {
        subWeights[category][subcat] = equalWeight;
      });
      
      // Calculate the actual total (might be slightly off due to rounding)
      const total = Object.values(subWeights[category]).reduce((sum, weight) => sum + weight, 0);
      
      // If the total isn't exactly 100, adjust the last subcategory
      if (Math.abs(total - 100) > 0.01) {
        const lastSubcat = subcategories[subcategories.length - 1];
        subWeights[category][lastSubcat] = Number((subWeights[category][lastSubcat] + (100 - total)).toFixed(1));
      }
    });

    return subWeights;
  };

  // --- Helper Function: Convert Subcategory Weights to Category Weights ---
  const convertSubcategoryToCategory = (subWeights: SubcategoryWeights): CategoryWeights => {
    const catWeights: CategoryWeights = {};
    const categoryCount = Object.keys(subWeights).length;
    
    if (categoryCount === 0) return {};
    
    // Each category gets an equal share of the total 100%
    const equalCategoryWeight = Math.floor((100 / categoryCount) * 10) / 10;
    
    // Assign equal weights to all categories
    Object.keys(subWeights).forEach(category => {
      catWeights[category] = equalCategoryWeight;
    });
    
    // Calculate the actual total (might be slightly off due to rounding)
    const total = Object.values(catWeights).reduce((sum, weight) => sum + weight, 0);
    
    // If the total isn't exactly 100, adjust the last category
    if (Math.abs(total - 100) > 0.01 && categoryCount > 0) {
      const lastCategory = Object.keys(catWeights)[categoryCount - 1];
      catWeights[lastCategory] = Number((catWeights[lastCategory] + (100 - total)).toFixed(1));
    }
    
    return catWeights;
  };

  // --- Data Fetching Functions ---

  // Add a function to clear assessment weights when resetting
  const clearAssessmentData = () => {
    localStorage.removeItem('subcategory_weights');
    localStorage.removeItem('assessment_weights');
    localStorage.removeItem('locked_categories');
  };

  // Implement fetchRecommendedWeights for this component
  const fetchRecommendedWeights = async (info: CompanyInfo) => {
    try {
      if (!info.id) {
        throw new Error("Company ID is required to fetch weights");
      }
      
      // Try to fetch recommended weights from the API
      try {
        // Using the imported getRecommendedWeights function from lib/api
        const aiRecommendedWeights = await getRecommendedWeights(info);
        
        // Set the recommended weights
        setRecommendedWeights(aiRecommendedWeights);
        setWeights(aiRecommendedWeights);
        
        // Progress to weight adjustment step
        setLoading(false);
        setStep('weight-adjustment');
        return;
      } catch (apiError) {
        console.warn("Could not get AI recommended weights:", apiError);
      }
      
      // Fallback: use equal weight distribution for assessment types
      const assessmentTypes = ["AI Governance", "AI Culture", "AI Infrastructure", 
                              "AI Strategy", "AI Data", "AI Talent", "AI Security"];
      const defaultWeight = 100 / assessmentTypes.length;
      
      const fallbackWeights: CategoryWeights = {};
      assessmentTypes.forEach(category => {
        fallbackWeights[category] = defaultWeight;
      });
      
      setRecommendedWeights(fallbackWeights);
      setWeights(fallbackWeights);
      setLoading(false);
      setStep('weight-adjustment');
      } catch (error) {
      console.error("Error in fetchRecommendedWeights:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: "Failed to get recommended weights. Using default distribution.",
        variant: "destructive"
      });
      setStep('weight-adjustment');
    }
  };

  // Implement simplified fetchQuestionnaires function
  const fetchQuestionnaires = async () => {
    try {
      setIsLoading(true);
      
      // Fetch the questionnaire using the imported fetchQuestionnaire function
      const standardQuestionnaire = await fetchQuestionnaire(assessmentType);
      
      if (standardQuestionnaire && Object.keys(standardQuestionnaire).length > 0) {
        setQuestionnaire(standardQuestionnaire);
        
        // Extract and set up categories
        let questionnaireCats: string[] = [];
        
        if (standardQuestionnaire[assessmentType] && typeof standardQuestionnaire[assessmentType] === 'object') {
          questionnaireCats = Object.keys(standardQuestionnaire[assessmentType]);
        } else if (typeof standardQuestionnaire === 'object') {
          questionnaireCats = Object.keys(standardQuestionnaire);
        }
        
        if (questionnaireCats.length > 0) {
          setCategories(questionnaireCats);
          setCurrentCategory(questionnaireCats[0]);
      setCategoryIndex(0);

          // Initialize questions
          const questionState: CategoryQuestions = {};
          
          questionnaireCats.forEach(category => {
            let categoryQuestions: string[] = [];
            
            if (standardQuestionnaire[assessmentType] && standardQuestionnaire[assessmentType][category]) {
              categoryQuestions = standardQuestionnaire[assessmentType][category];
            } else if (standardQuestionnaire[category]) {
              categoryQuestions = standardQuestionnaire[category];
            }
            
            questionState[category] = categoryQuestions.map(q => ({
              question: q,
              answer: null
            }));
          });
          
          setQuestions(questionState);
        }
        
        // Move to questions step
        setStep('questions');
        } else {
        throw new Error("Invalid questionnaire data received");
      }
    } catch (error) {
      console.error("Error fetching questionnaires:", error);
      setError("Failed to load assessment questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for personalized question option selection
  const handlePersonalizedOptionSelect = useCallback((category: string, questionIndex: number, optionId: string) => {
    console.log(`Selected option for ${category}, question ${questionIndex}: ${optionId}`);
    
    setSelectedOptions(prev => {
      const newSelected = { ...prev };
      if (!newSelected[category]) {
        newSelected[category] = {};
      }
      // Store the selected option ID (will be something like "option1", "option2", etc.)
      newSelected[category][`question_${questionIndex}`] = optionId;
      return newSelected;
    });
  }, []);

  // Fix the loadQuestionnaires to remove circular dependency
  const loadQuestionnaires = useCallback(async () => {
    console.log("loadQuestionnaires called with state:", {
      hasCompanyInfo: !!companyInfo,
      companyId: companyInfo?.id,
      isLoadingPersonalized,
      hasAttemptedPersonalized,
      hasPersonalizedQuestions: !!personalizedQuestions,
      isLoading,
      error
    });
    
    // Return early if we don't have company info yet
    if (!companyInfo) {
      console.log("Early return: No company info");
      return;
    }
    
    // Return early if we're already loading personalized questions
    if (isLoadingPersonalized) {
      console.log("Early return: Already loading personalized questions");
      return;
    }
    
    // Return early if we've already loaded personalized questions
    if (hasAttemptedPersonalized && personalizedQuestions) {
      console.log("Early return: Already have personalized questions");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    console.log("Started loading questions...");
    
    // Set a loading timeout to prevent infinite spinner
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Loading timeout reached - falling back to standard questions");
        setIsLoadingPersonalized(false);
        setHasAttemptedPersonalized(true);
        // Force fallback to standard questions
        setUsePersonalizedQuestions(false);
      }
    }, 10000); // 10 seconds timeout
    
    try {
      // Extract company ID from company info
      const companyId = companyInfo.id;
      
      // Only attempt to load personalized questions if the feature is enabled and we haven't tried before
      if (companyId && usePersonalizedQuestions && !hasAttemptedPersonalized) {
        try {
          setIsLoadingPersonalized(true);
          console.log(`Loading personalized questions for company ${companyId}`);
          const personalizedData = await fetchPersonalizedQuestionnaire(assessmentType, companyId);
          
          if (personalizedData && !personalizedData.error) {
            console.log('Successfully loaded personalized questions', personalizedData);
            setPersonalizedQuestions(personalizedData);
            
            // Force set BOTH loading states to false - this is the critical fix
            setIsLoading(false);
            setLoading(false); // This was missing before
            setIsLoadingPersonalized(false);
            setHasAttemptedPersonalized(true);
            
            // Initialize the standard questionnaire structure as fallback
            const standardQuestionnaire = await fetchQuestionnaire(assessmentType);
            setQuestionnaire(standardQuestionnaire);
            
            // Extract categories from the personalized data
            if (personalizedData.categories && personalizedData.categories.length > 0) {
              const categoryNames = personalizedData.categories.map((cat: any) => cat.name);
              setCategories(categoryNames);
              setCurrentCategory(categoryNames[0]);
              
              // Initialize selected options
              const initialSelectedOptions: Record<string, Record<string, string>> = {};
              personalizedData.categories.forEach((category: any) => {
                initialSelectedOptions[category.name] = {};
                
                if (category.questions && category.questions.length > 0) {
                  category.questions.forEach((question: any, index: number) => {
                    // Initialize with no selection
                    initialSelectedOptions[category.name][`question_${index}`] = '';
                  });
                }
              });
              
              setSelectedOptions(initialSelectedOptions);
            }
            
            clearTimeout(loadingTimeout);
            setIsLoadingPersonalized(false);
            setHasAttemptedPersonalized(true);
            return true;
            } else {
            console.warn('Personalized questions returned an error or empty data', personalizedData);
            throw new Error(personalizedData?.error || 'Failed to load personalized questions');
          }
        } catch (personalizedError) {
          console.error('Error loading personalized questions:', personalizedError);
          // Fall back to standard questions
          setUsePersonalizedQuestions(false);
          setIsLoadingPersonalized(false);
          setHasAttemptedPersonalized(true);
        }
      }
      
      // Load standard questionnaire if personalized questions failed or are disabled
      console.log('Loading standard questionnaire');
      const standardQuestionnaire = await fetchQuestionnaire(assessmentType);
      setQuestionnaire(standardQuestionnaire);
      
      if (standardQuestionnaire && Object.keys(standardQuestionnaire).length > 0) {
        let questionnaireCats: string[] = [];
        
        // Extract categories based on the structure of the data
        if (standardQuestionnaire[assessmentType] && typeof standardQuestionnaire[assessmentType] === 'object') {
          questionnaireCats = Object.keys(standardQuestionnaire[assessmentType]);
        } else if (typeof standardQuestionnaire === 'object') {
          questionnaireCats = Object.keys(standardQuestionnaire);
        }
        
        if (questionnaireCats.length > 0) {
          setCategories(questionnaireCats);
          setCurrentCategory(questionnaireCats[0]);
          
          // Prepare questions structure
          const questionState: CategoryQuestions = {};
          
          questionnaireCats.forEach(category => {
            // Get questions for this category
            let categoryQuestions: string[] = [];
            
            if (standardQuestionnaire[assessmentType] && standardQuestionnaire[assessmentType][category]) {
              // Standard structure: standardQuestionnaire[assessmentType][category] is an array of questions
              categoryQuestions = standardQuestionnaire[assessmentType][category];
            } else if (standardQuestionnaire[category]) {
              // Alternative structure: standardQuestionnaire[category] is an array of questions
              categoryQuestions = standardQuestionnaire[category];
            }
            
            // Initialize questions with null answers
            questionState[category] = categoryQuestions.map(q => ({
              question: q,
              answer: null
            }));
          });
          
          setQuestions(questionState);
        }
      } else {
        throw new Error("Invalid or empty questionnaire data received");
      }
      
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      return true;
    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error("Error loading questionnaires:", error);
      setError("Failed to load assessment questions. Please try again.");
      setIsLoading(false);
      return false;
    }
  }, [companyInfo, usePersonalizedQuestions, assessmentType, hasAttemptedPersonalized, isLoadingPersonalized, isLoading]);

  // Fix the useEffect to prevent circular dependencies
  useEffect(() => {
    // Only attempt to load questionnaires if:
    // 1. We have company info
    // 2. We're not currently loading personalized questions
    // 3. We either haven't attempted to load personalized questions or we don't have them yet
    if (companyInfo && 
        !isLoadingPersonalized && 
        (!hasAttemptedPersonalized || !personalizedQuestions)) {
      console.log("Triggering loadQuestionnaires due to company info or personalized question state change");
      loadQuestionnaires();
    }
    // Deliberately exclude personalizedQuestions from dependencies to prevent circular updates
  }, [companyInfo, loadQuestionnaires, isLoadingPersonalized, hasAttemptedPersonalized]);

  // Modify the useEffect that loads company info to also load questionnaires
  useEffect(() => {
    // Check if we have personalized questions but loading state is stuck
    if ((isLoading || loading) && personalizedQuestions && personalizedQuestions.categories) {
      console.log("Detected loaded personalized questions but loading state is still true - fixing");
      setIsLoading(false);
      setLoading(false); // Also reset the main loading state
      
      // Ensure categories are set
      if (personalizedQuestions.categories.length > 0 && (!categories.length || !currentCategory)) {
        const categoryNames = personalizedQuestions.categories.map((cat: any) => cat.name);
        setCategories(categoryNames); 
        setCurrentCategory(categoryNames[0]);
        setCategoryIndex(0);
      }
    }
    
    // Rest of the function continues as before
    // Check if we're starting with the questions step but don't have company info
    if (step === 'questions' && !companyInfo) {
      try {
        // First check for companyId in URL
        const companyIdFromUrl = searchParams.get('companyId');
        
        if (companyIdFromUrl) {
          // If we have a company ID from URL, fetch that specific company
          console.log(`Loading company from URL parameter: ${companyIdFromUrl}`);
          
          // Try to fetch company from local storage first
          const storedCompanies = localStorage.getItem('companies');
          if (storedCompanies) {
            const companies = JSON.parse(storedCompanies);
            const foundCompany = companies.find((c: any) => c.id === companyIdFromUrl);
            
            if (foundCompany) {
              console.log("Found company in localStorage:", foundCompany);
              setCompanyInfo(foundCompany);
      return;
    }
          }
          
          // If not found in localStorage, create a minimal company object with just the ID
          setCompanyInfo({
            id: companyIdFromUrl,
            name: `Company ${companyIdFromUrl}`,
            industry: '',
            size: '',
            region: '',
            aiMaturity: ''
          });
          return;
        }
        
        // Fall back to stored company info
    const storedCompanyInfo = localStorage.getItem('company_info');
      if (storedCompanyInfo) {
          const parsedInfo = JSON.parse(storedCompanyInfo);
          setCompanyInfo(parsedInfo);
        }
      } catch (e) {
        console.error("Failed to load company info:", e);
        // Fall back to company-info step if we can't load company info
        setStep('company-info');
      }
    }
  }, [step, companyInfo, searchParams, isLoading, personalizedQuestions, categories, currentCategory, setCategoryIndex, setCategories, setCurrentCategory, setIsLoading]);

  // Add a new useEffect to load questionnaires directly when company info is auto-loaded
  useEffect(() => {
    // If we have company info and we're in the questions step, directly load questionnaires
    if (companyInfo && step === 'questions') {
      // Load default weights to ensure we have something
      try {
        const assessmentTypes = ["AI Governance", "AI Culture", "AI Infrastructure", 
                              "AI Strategy", "AI Data", "AI Talent", "AI Security"];
        const defaultWeight = 100 / assessmentTypes.length;
        
        const fallbackWeights: CategoryWeights = {};
        assessmentTypes.forEach(category => {
          fallbackWeights[category] = defaultWeight;
        });
        
        setRecommendedWeights(fallbackWeights);
        setWeights(fallbackWeights);
        
        // Now load personalized questions/questionnaire
        console.log("Auto-loading questionnaires for:", companyInfo.name);
        loadQuestionnaires();
      } catch (error) {
        console.error("Error auto-loading questionnaires:", error);
      }
    }
  }, [companyInfo, step, loadQuestionnaires]);

  // Add an effect to listen for the forceStopLoading event
  useEffect(() => {
    // Event listener to force stop loading if we're stuck
    const handleForceStopLoading = () => {
      console.log("Force stop loading triggered");
      // Check if data is already loaded but UI is stuck
      if (isLoading && personalizedQuestions && 
          personalizedQuestions.categories && 
          personalizedQuestions.categories.length > 0) {
        console.log("Detected loaded data but stuck UI - forcing continue");
        setIsLoading(false);
        const categoryNames = personalizedQuestions.categories.map((cat: any) => cat.name);
        setCategories(categoryNames);
        setCurrentCategory(categoryNames[0]);
        setCategoryIndex(0);
      }
    };

    // Add event listener
    window.addEventListener('forceStopLoading', handleForceStopLoading);
    
    // If we have personalized questions but UI is still loading after 3 seconds,
    // force it to continue
    let timeoutId: NodeJS.Timeout | null = null;
    if (isLoading && personalizedQuestions) {
      timeoutId = setTimeout(() => {
        console.log("Auto-timeout triggered - forcing exit from loading state");
        handleForceStopLoading();
      }, 3000);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('forceStopLoading', handleForceStopLoading);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, personalizedQuestions, setCategoryIndex, setCategories, setCurrentCategory, setIsLoading]);

  // Fix to automatically detect when we've successfully loaded personalized questions
  useEffect(() => {
    // Auto-detect when we have personalized questions but UI is still loading
    if (personalizedQuestions && isLoading) {
      console.log("Detected personalized questions are loaded but UI is still in loading state");
      
      // Give it a short delay to see if it resolves naturally
      const autoFixTimeout = setTimeout(() => {
        console.log("Auto-fixing stuck loading state");
        setIsLoading(false);
        
        // Make sure we have categories set
        if (personalizedQuestions.categories && personalizedQuestions.categories.length > 0) {
          const categoryNames = personalizedQuestions.categories.map((cat: any) => cat.name);
          if (!categories.length || categories.length !== categoryNames.length) {
            setCategories(categoryNames);
            setCurrentCategory(categoryNames[0]);
            setCategoryIndex(0);
          }
        }
      }, 1000); // 1 second grace period
      
      return () => clearTimeout(autoFixTimeout);
    }
  }, [personalizedQuestions, isLoading, categories, setCategories, setCurrentCategory, setCategoryIndex]);

  // Top-level debugging and fix effect - runs on component mount
  useEffect(() => {
    // Custom error boundary for loading state issues
    const detectLoadingIssues = () => {
      console.log("Loading state check - current state:", {
        loading, // Check the main loading state
        isLoading,
        isLoadingPersonalized,
        hasAttemptedPersonalized, 
        hasPersonalizedData: !!personalizedQuestions,
        hasCategories: categories.length > 0,
        step
      });
      
      // Important: Check BOTH loading states
      if (loading || isLoading) {
        // Check for stuck loading state with data
        if (personalizedQuestions && 
            personalizedQuestions.categories && 
            personalizedQuestions.categories.length > 0) {
          // If we have data but UI is stuck in loading, force reset BOTH loading states
          console.log("CRITICAL FIX: Data is loaded but UI is stuck, forcing reset of loading states");
          setIsLoading(false);
          setLoading(false); // This is the critical fix for the spinner
          
          // Also ensure categories are properly set
          const categoryNames = personalizedQuestions.categories.map((c: any) => c.name);
          if (!categories.length) {
            setCategories(categoryNames);
            setCurrentCategory(categoryNames[0]);
            setCategoryIndex(0);
          }
        }
      }
    };
    
    // Check immediately
    detectLoadingIssues();
    
    // Also set up a periodic check every 1 second
    const intervalId = setInterval(detectLoadingIssues, 1000);
    
    return () => clearInterval(intervalId);
  }, [loading, isLoading, isLoadingPersonalized, personalizedQuestions, categories, hasAttemptedPersonalized, 
      setIsLoading, setLoading, setCategories, setCurrentCategory, setCategoryIndex, step]);

  // --- Event Handlers ---

  // Helper function to get a valid company ID from the backend
  const getValidCompanyId = async (info: CompanyInfo): Promise<string | null> => {
    try {
      // If there's already a valid company ID, use it
      if (info.id) {
        return info.id;
      }
      
      // Otherwise, fetch companies from the backend using the public endpoint that doesn't require auth
      console.log('Fetching public company list from backend');
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://103.18.20.205:8090'}/companies/public`;
      const response = await fetch(apiUrl, {
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (!response.ok) {
        console.warn(`Failed to fetch companies: ${response.status}`);
        return null;
      }
      
      const companies = await response.json();
      if (companies && companies.length > 0) {
        // Use the ID of the first company - should be a simple numeric ID
        console.log(`Found ${companies.length} companies, using first one: ${companies[0].id} (${companies[0].name})`);
        return companies[0].id;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting valid company ID:", error);
      return null;
    }
  };

  const handleCompanyInfoSubmit = async (info: CompanyInfo) => {
    setLoading(true);
    try {
      // Get a valid company ID from the backend or create one
      let companyId = info.id;
      
      // If no company ID is provided, create a new one
      if (!companyId) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('Not authenticated. Please login again.');
          }
          
          console.log("Creating a new company in the backend", info);
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://103.18.20.205:8090'}/companies`;
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: info.name,
              industry: info.industry,
              size: info.size,
              region: info.region,
              aiMaturity: info.aiMaturity,
              notes: info.notes || ''
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error details available');
            throw new Error(`Failed to create company: ${response.status} ${response.statusText}. Details: ${errorText}`);
          }
          
          const newCompany = await response.json();
          companyId = newCompany.id;
          console.log(`Created new company with ID: ${companyId}`);
        } catch (createError) {
          console.error("Error creating company:", createError);
          toast({
            title: "Company Creation Error",
            description: "Could not create a company in the backend database. Using local storage only.",
            variant: "destructive"
          });
          
          // Generate a simple local ID 
          companyId = Math.floor(Math.random() * 1000).toString();
        }
      } else {
        // If we already have an ID, try to ping it but don't block if it fails
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://103.18.20.205:8090'}/companies/${encodeURIComponent(companyId)}`;
            const response = await fetch(apiUrl, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              console.warn(`Company ID ${companyId} not found or not accessible.`);
            }
          }
        } catch (error) {
          console.warn("Error checking company access:", error);
        }
      }
      
      // Update the company info with the valid ID
      info.id = companyId;
      console.log(`Using company ID: ${companyId}`);
      
      setCompanyInfo(info);
      localStorage.setItem('company_info', JSON.stringify(info));
      await fetchRecommendedWeights(info); // Fetches recommendations, sets initial weights, moves step
    } catch (error) {
      console.error("Error processing company info submission:", error);
      toast({ title: "Error", description: "Failed to process company profile.", variant: "destructive" });
      setLoading(false);
      setStep('company-info'); // Stay on this step on error
    }
  };

  // CORRECTED: Update handler with controlled distribution and saved changes
  const handleSubcategoryWeightsChange = useCallback(async (newWeights: SubcategoryWeights) => {
    console.log("Subcategory weights changed:", newWeights);
    
    // Define toast functions
    const showWarningToast = () => {
      toast({ 
        title: "Warning", 
        description: "Weights saved locally but could not be saved to the database.",
        variant: "destructive" 
      });
    };
    
    const showStorageErrorToast = () => {
      toast({ 
        title: "Storage Error", 
        description: "Could not save weight changes locally.", 
        variant: "destructive" 
      });
    };
    
    // Validate format of companyInfo.id
    let validCompanyId = null;
    if (companyInfo?.id) {
      const isValidFormat = typeof companyInfo.id === 'string' && 
        (companyInfo.id.match(/^[a-zA-Z0-9_-]+$/) || 
         companyInfo.id.match(/^company_[a-f0-9-]+$/));
         
      validCompanyId = isValidFormat ? companyInfo.id : null;
      
      if (!isValidFormat) {
        console.warn(`Invalid company ID format: ${companyInfo.id}`);
      }
    }
    
    // Update state
    setSubcategoryWeights(newWeights);
    
    // Derive category weights from subcategory weights
    const derivedCategoryWeights = convertSubcategoryToCategory(newWeights);
    setWeights(derivedCategoryWeights);
    
    try {
      // First, try to save to backend if we have a valid company ID
      if (validCompanyId && assessmentType) {
        try {
          const { saveCategoryWeights } = await import('@/lib/api');
          // Get the weights for this assessment type
          await saveCategoryWeights(validCompanyId, assessmentType, newWeights);
          console.log(`Successfully saved weights to backend for company ${validCompanyId}`);
        } catch (saveError) {
          console.warn("Could not save weights to backend:", saveError);
          showWarningToast();
        }
      }
      
      // Save to localStorage (backup)
      localStorage.setItem('subcategory_weights', JSON.stringify(newWeights));
      localStorage.setItem('assessment_weights', JSON.stringify(derivedCategoryWeights));
    } catch (storageError) {
      console.error("Error saving weights:", storageError);
      showStorageErrorToast();
    }
  }, [companyInfo, convertSubcategoryToCategory, toast, assessmentType]);

  const handleWeightsSubmit = () => {
    // Weights are saved live via handleSubcategoryWeightsChange.
    // This button confirms the user is done adjusting and wants to proceed.
    console.log("Weights adjustment confirmed by user.");
    // Reset loading states before proceeding
    setLoading(false);
    setIsLoading(false);
    fetchQuestionnaires(); // Fetch questions to proceed
  };

  const handleAnswerChange = (questionIndex: number, value: number) => {
    setQuestions(prev => {
        // Create a deep copy to avoid direct state mutation
      const updatedQuestions = JSON.parse(JSON.stringify(prev)); 
        if (updatedQuestions[currentCategory]?.[questionIndex]) {
      updatedQuestions[currentCategory][questionIndex].answer = value;
        } else {
            console.error(`Could not update answer for ${currentCategory} index ${questionIndex}. State might be inconsistent.`);
        }
      return updatedQuestions;
    });
  };

  // CORRECTED: Parent handler only updates lock state and saves
  const toggleCategoryLock = (category: string, subcategory: string) => {
    const lockKey = `${category}-${subcategory}`;
    
    // Create a local reference for toast to use outside state update
    const showStorageErrorToast = () => {
      toast({ 
        title: "Storage Error", 
        description: "Could not save lock state locally.", 
        variant: "destructive" 
      });
    };
    
    setLockedCategories(prev => {
      const updatedLockState = { ...prev, [lockKey]: !prev[lockKey] };
      try {
        localStorage.setItem('locked_categories', JSON.stringify(updatedLockState));
      } catch (error) {
          console.error("Error saving locked categories to localStorage:", error);
        // Use requestAnimationFrame to safely schedule toast outside of React render cycle
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(showStorageErrorToast);
        }
      }
      // NO weight recalculation here in the parent.
      return updatedLockState;
    });
  };

  const handleNext = () => {
    const currentQuestionsList = questions[currentCategory] || [];
    const unanswered = currentQuestionsList.filter(q => q.answer === null);
    if (unanswered.length > 0) {
      toast({
        title: "Incomplete Section",
        description: `Please answer all ${currentQuestionsList.length} questions in "${currentCategory}" (${unanswered.length} remaining).`,
        variant: "destructive",
      });
      return;
    }
    
    if (categoryIndex < categories.length - 1) {
      const nextIndex = categoryIndex + 1;
      setCategoryIndex(nextIndex);
      setCurrentCategory(categories[nextIndex]);
      setActiveTab("questions"); // Ensure questions tab is active
      window.scrollTo(0, 0); // Scroll to top
    } else {
      // Last category, prepare for submission
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (categoryIndex > 0) {
      const prevIndex = categoryIndex - 1;
      setCategoryIndex(prevIndex);
      setCurrentCategory(categories[prevIndex]);
      setActiveTab("questions");
      window.scrollTo(0, 0);
    }
  };

  // --- Main Submission Logic ---
  const handleSubmit = async () => {
     setSubmitting(true);
    
    try {
      if (!companyInfo) {
        throw new Error("Company information is required to submit the assessment");
      }
      
      // Get company ID from stored info or generate a temporary one
      const companyId = companyInfo.id || `temp_${Date.now()}`;
      
      if (usePersonalizedQuestions && personalizedQuestions) {
        // Prepare personalized submission payload
        const responses = personalizedQuestions.categories.map((category: any) => {
          // Check if all questions in this category are answered
          const categoryQuestions = category.questions || [];
          const hasUnansweredQuestions = categoryQuestions.some((_: any, index: number) => 
            !selectedOptions[category.name]?.[`question_${index}`]
          );
          
          if (hasUnansweredQuestions) {
            throw new Error(`Please answer all questions in the "${category.name}" category.`);
          }
          
          return {
            category: category.name,
            questions: categoryQuestions.map((question: any, index: number) => {
              const selectedOption = selectedOptions[category.name]?.[`question_${index}`] || '';
              
              // Make sure we selected an option
              if (!selectedOption) {
                console.error(`Missing selection for question ${index} in category ${category.name}`);
              }
              
              return {
                text: question.text,
                options: question.options,
                selected_option: selectedOption,
                correct_option: question.options.find((opt: any) => opt.id === "option4")?.id || "option4" // Assume option4 is the best answer
              };
            })
          };
        });
        
        const personalizedPayload = {
          company_id: companyId,
          assessment_type: assessmentType,
          responses
        };
        
        console.log("Submitting personalized assessment:", personalizedPayload);
        
        try {
          // Submit the personalized assessment
          const result = await submitPersonalizedAssessment(personalizedPayload);
          
          // Handle successful submission
          console.log("Personalized assessment result:", result);
          
          // Update company assessment status if needed
          if (result && result.score) {
            updateCompanyAssessmentStatus(companyId, assessmentType, result.score);
          }
          
          // Redirect to results page
          router.push(`/results/${assessmentType}?score=${result.score || 0}`);
        } catch (submitError: any) {
          console.error("Error submitting personalized assessment:", submitError);
              toast({ 
            title: "Submission Error",
            description: submitError.message || "Failed to submit assessment. Please try again.",
            variant: "destructive",
          });
            }
          } else {
        // Standard assessment submission logic
        console.log("Using standard assessment submission flow");
        
        // Check if all questions are answered
        const hasAllAnswers = Object.values(questions).every(categoryQuestions => 
          categoryQuestions.every(q => q.answer !== null)
        );
        
        if (!hasAllAnswers) {
          throw new Error("Please answer all questions before submitting.");
        }
        
        // Existing code for standard assessment submission...
        // Add your code here for standard assessment submission
      }
    } catch (error: any) {
      console.error("Error submitting assessment:", error);
      toast({ 
        title: "Submission Failed",
        description: error.message || "There was an error submitting your assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to update company assessment status in localStorage
  const updateCompanyAssessmentStatus = (companyId: string, assessmentType: string, score: number) => {
    // Get existing assessment statuses
    let assessmentStatuses: any[] = [];
    try {
      const storedStatuses = localStorage.getItem('assessment_statuses');
      if (storedStatuses) {
        assessmentStatuses = JSON.parse(storedStatuses);
      }
    } catch (error) {
      console.error("Error parsing assessment statuses:", error);
    }
    
    // Find the company's status, or create a new one
    let companyStatus = assessmentStatuses.find((s: any) => s.companyId === companyId);
    
    if (!companyStatus) {
      // Try to get the company name
      let companyName = "Unknown Company";
      if (companyInfo && companyInfo.name) {
        companyName = companyInfo.name;
      } else {
        try {
          const companies = JSON.parse(localStorage.getItem('companies') || '[]');
          const company = companies.find((c: any) => c.id === companyId);
          if (company) {
            companyName = company.name;
          }
        } catch (error) {
          console.error("Error finding company name:", error);
        }
      }
      
      companyStatus = {
        companyId,
        companyName,
        assessments: []
      };
      assessmentStatuses.push(companyStatus);
    }
    
    // Find the assessment, or create a new one
    let assessment = companyStatus.assessments.find((a: any) => a.type === assessmentType);
    
    if (assessment) {
      // Update existing assessment
      assessment.status = "completed";
      assessment.score = score;
      assessment.completedAt = new Date().toISOString();
      assessment.completedBy = {
        id: user?.id || "",
        name: user?.name || "Unknown",
        role: user?.role || ""
      };
    } else {
      // Add new assessment
      companyStatus.assessments.push({
        type: assessmentType,
        status: "completed",
        score,
        completedAt: new Date().toISOString(),
        completedBy: {
          id: user?.id || "",
          name: user?.name || "Unknown",
          role: user?.role || ""
        }
      });
    }
    
    // Save updated assessment statuses
    localStorage.setItem('assessment_statuses', JSON.stringify(assessmentStatuses));
  }

  // Add getInitialWeights function
  function getInitialWeights(questionnaires: Record<string, any>, companyInfo: any): Record<string, number> {
    const weights: Record<string, number> = {};
    
    if (!questionnaires || typeof questionnaires !== 'object') return weights;
    
    // Set default even weights
    Object.keys(questionnaires).forEach(category => {
      weights[category] = 1; // Default weight
    });
    
    // If there's company info, we could adjust weights based on industry or company size
    if (companyInfo?.industry) {
      // Example: If it's a healthcare company, weight security and compliance higher
      if (companyInfo.industry.toLowerCase().includes('health')) {
        weights['security'] = weights['security'] ? weights['security'] * 1.5 : 1.5;
        weights['compliance'] = weights['compliance'] ? weights['compliance'] * 1.5 : 1.5;
      }
      // Add more industry-specific logic as needed
    }
    
    // Normalize weights to sum to 1
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      Object.keys(weights).forEach(key => {
        weights[key] = weights[key] / sum;
      });
    }
    
    return weights;
  }

  // --- Render Logic ---

  // Initial Loading Screen (if not on company-info step)
  if (loading && step !== 'company-info') {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading...</p>
          <p className="text-sm text-muted-foreground mt-2">Preparing {assessmentType} assessment.</p>
        </div>
      </div>
    );
  }

  // Loading Error Screen
  if (loadingError) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-lg text-center bg-destructive/10 border-destructive">
             <CardHeader><CardTitle className="text-destructive">Error Loading Assessment</CardTitle></CardHeader>
            <CardContent>
                 <p className="mb-4">{loadingError}</p>
                  <p className="text-sm mb-4 text-muted-foreground">Could not load required data.</p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
            <Button variant="secondary" onClick={() => router.push("/")}>Go Home</Button>
            </CardFooter>
        </Card>
      </div>
    );
  }

  // Show error state with retry button
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 p-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Error Loading Assessment</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <p className="text-muted-foreground text-sm">
            This could be due to a connection issue or the server may be down.
          </p>
        </div>
        <Button onClick={() => {
          setError(null);
          setIsLoading(true);
          setWeights({});
          setScores({});
          
          // Use our simple fetchQuestionnaires implementation
          fetchQuestionnaires()
            .then(() => {
              setIsLoading(false);
            })
            .catch((err) => {
              console.error("Error loading questionnaires:", err);
              setIsLoading(false);
              setError("Failed to reload questionnaires. Please try again later.");
            });
        }}>
          Try Again
        </Button>
      </div>
    );
  }

  // Step: Company Info
  if (step === 'company-info') {
    // Check if the company ID is in a valid format for the backend
    const isValidFormat = companyInfo?.id ? /^\d+$/.test(companyInfo.id) : false;
    const showFormatWarning = companyInfo?.id && !isValidFormat;
    
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Company Profile</h1>
          <p className="text-center text-muted-foreground mb-6">Provide details about the company being assessed.</p>
          
          {/* Display info about the company ID */}
          {companyInfo?.id && (
            <div className={`${showFormatWarning ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'} border rounded-md p-3 mb-4 flex items-center gap-3 shadow-sm`}>
              {showFormatWarning ? <AlertTriangle className="h-5 w-5 flex-shrink-0" /> : <Info className="h-5 w-5 flex-shrink-0" />}
              <div>
                <p className="font-semibold">Using company ID: {companyInfo.id}</p>
                {showFormatWarning ? (
                  <p className="text-sm">This ID format may cause issues with backend connections. Please reset to a simple numeric ID.</p>
                ) : (
                  <p className="text-sm">Simple numeric IDs (like "1" or "2") should connect to the backend database.</p>
                )}
              </div>
            </div>
          )}
          
          <CompanyInfoForm onSubmit={handleCompanyInfoSubmit} loading={loading} initialData={companyInfo} />
          
          {/* Add a button to reset company info and create a new one */}
          {companyInfo?.id && (
            <div className="mt-8 text-center">
              <Button 
                variant={showFormatWarning ? "default" : "outline"}
                className={showFormatWarning ? "bg-amber-500 hover:bg-amber-600" : ""}
                onClick={() => {
                  // Generate a new simple numeric ID
                  const newId = Math.floor(Math.random() * 1000).toString();
                  
                  // Update the company info with the new ID
                  const updatedInfo = { ...companyInfo, id: newId };
                  setCompanyInfo(updatedInfo);
                  localStorage.setItem('company_info', JSON.stringify(updatedInfo));
                  
                  toast({
                    title: "Company ID Reset",
                    description: `The company ID has been reset to ${newId}. This should work better with the backend.`,
                    variant: "default"
                  });
                }}
              >
                {showFormatWarning ? "Reset to Numeric ID (Recommended)" : "Reset Company ID"}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {showFormatWarning 
                  ? "Reset is strongly recommended to fix connection issues with the backend."
                  : "Use this if you're having issues with saving weights to the backend."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step: Weight Adjustment
  if (step === 'weight-adjustment') {
     // Ensure categories are available for the adjustment component
     const adjustmentCategories = Object.keys(subcategoryWeights);
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Adjust Assessment Weights</h1>
          <p className="text-center text-muted-foreground mb-8">
            Review and adjust the importance of each category and subcategory. Total must equal 100% per category group implicitly.
          </p>
          <WeightAdjuster
            weights={subcategoryWeights}
            recommendedWeights={recommendedSubcategoryWeights}
            onWeightsChange={(newWeights: SubcategoryWeights) => {
              // Call the handler for each changed category to match expected signature
              Object.keys(newWeights).forEach(category => {
                if (subcategoryWeights[category] && 
                    JSON.stringify(subcategoryWeights[category]) !== JSON.stringify(newWeights[category])) {
                  // Need to update the entire structure
                  const updatedWeights = {...subcategoryWeights};
                  updatedWeights[category] = newWeights[category];
                  handleSubcategoryWeightsChange(updatedWeights);
                }
              });
            }}
            onSubmit={handleWeightsSubmit}
            loading={loading} // Pass loading state if needed
            lockedCategories={lockedCategories}
            onToggleLock={toggleCategoryLock} // CORRECTED handler
            // Pass the categories derived from the current weights state
            categories={adjustmentCategories}
          />
        </div>
      </div>
    );
  }


  // Step: Questions (Main Assessment UI with Personalized Questions Support)
  if (step === 'questions') {
    // Extra debugging information displayed on page for troubleshooting
    if (isLoading && companyInfo) {
      return (
        <div className="container mx-auto px-4 py-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Preparing questions...</p>
          <Card className="max-w-md mx-auto bg-amber-50 border-amber-200 text-left">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Assessment Type: {assessmentType}</p>
              <p>Company ID: {companyInfo?.id || 'None'}</p>
              <p>Loading Personalized: {isLoadingPersonalized ? 'Yes' : 'No'}</p>
              <p>Has Attempted Personalized: {hasAttemptedPersonalized ? 'Yes' : 'No'}</p>
              <p>Has Personalized Questions: {personalizedQuestions ? 'Yes' : 'No'}</p>
              <p>Time Elapsed: <span id="elapsed-time">0s</span></p>
              <script dangerouslySetInnerHTML={{ 
                __html: `
                  let startTime = Date.now();
                  setInterval(() => {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    document.getElementById('elapsed-time').textContent = elapsed + 's';
                    
                    // Force stop spinner after 5 seconds if data is loaded
                    if (elapsed > 5) {
                      const event = new CustomEvent('forceStopLoading');
                      window.dispatchEvent(event);
                    }
                  }, 1000);
                `
              }} />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                onClick={() => {
                  setUsePersonalizedQuestions(false);
                  setHasAttemptedPersonalized(true);
                  setIsLoadingPersonalized(false);
                  loadQuestionnaires();
                }} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                Skip Personalized Questions
              </Button>
              <Button 
                onClick={() => {
                  setIsLoading(false);
                  if (personalizedQuestions && personalizedQuestions.categories && 
                      personalizedQuestions.categories.length > 0) {
                    // Force render with existing data
                    const categoryNames = personalizedQuestions.categories.map((cat: any) => cat.name);
                    setCategories(categoryNames);
                    setCurrentCategory(categoryNames[0]);
                    setCategoryIndex(0);
                  }
                }} 
                variant="default" 
                size="sm"
                className="w-full"
              >
                Force Continue (Data Loaded)
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
    
    if (!categories.length || !currentCategory) {
     return (
       <div className="container mx-auto px-4 py-12 text-center">
               <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
               <p className="text-muted-foreground">Preparing questions...</p>
        <Button onClick={() => {
          if (categories.length > 0) {
            setCurrentCategory(categories[0]);
            setCategoryIndex(0);
          }
            loadQuestionnaires();
        }} variant="outline" className="mt-4">Retry Load</Button>
       </div>
     );
  }
  
  return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
      <div className="mb-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{assessmentType} Assessment</h1>
        <p className="text-muted-foreground mb-4">
            Answer all questions to complete the assessment.
        </p>
        {isDoingAllAssessments && allAssessmentTypes.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-md p-3 mb-4 flex items-center gap-3 shadow-sm">
            <Info className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Completing All Pillars: Assessment {currentAssessmentIndex + 1} of {allAssessmentTypes.length}</p>
              <p className="text-sm">Current: <span className="font-medium">{assessmentType}</span></p>
            </div>
          </div>
        )}
        <div className="mb-2 flex justify-between text-sm font-medium">
          <span>Overall Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2 w-full" />
      </div>
      
        {/* Tabs */}
      <div className="w-full mb-6 max-w-6xl mx-auto">
        <div className="grid w-full grid-cols-2 mb-4 rounded-lg overflow-hidden border">
          <button 
            onClick={() => setActiveTab("questions")}
            className={`py-2 px-4 text-center ${activeTab === "questions" 
              ? "bg-primary text-primary-foreground" 
              : "bg-background hover:bg-muted"}`}
          >
            Questions ({categoryIndex + 1}/{categories.length})
          </button>
          <button 
            onClick={() => setActiveTab("weights")}
            className={`py-2 px-4 text-center ${activeTab === "weights" 
              ? "bg-primary text-primary-foreground" 
              : "bg-background hover:bg-muted"}`}
          >
            Category Weights
          </button>
        </div>

        {/* Questions Tab */}
        {activeTab === "questions" && (
            <>
              {isLoadingPersonalized ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Loading personalized questions...</p>
                </div>
              ) : usePersonalizedQuestions && personalizedQuestions ? (
                <PersonalizedQuestions
                  personalizedData={personalizedQuestions}
                  isLoading={isLoadingPersonalized}
                  selectedOptions={selectedOptions}
                  handleOptionSelect={handlePersonalizedOptionSelect}
                  onSubmit={handleNext}
                  currentCategory={currentCategory}
                />
              ) : (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">{currentCategory}</CardTitle>
              <CardDescription>Category {categoryIndex + 1} of {categories.length}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {(questions[currentCategory] || []).map((q, index) => (
                  <div key={`${currentCategory}-${index}`} className="border-b pb-6 last:border-b-0 last:pb-0">
                    <Label htmlFor={`q-${currentCategory}-${index}-group`} className="block text-base font-semibold mb-3">{index + 1}. {q.question}</Label>
                    <RadioGroup 
                      id={`q-${currentCategory}-${index}-group`}
                      value={q.answer?.toString() ?? ""} 
                      onValueChange={(value) => handleAnswerChange(index, parseInt(value))}
                      className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6 pt-2"
                    >
                      {[
                        { value: 1, label: "Strongly Disagree" }, { value: 2, label: "Disagree" },
                        { value: 3, label: "Agree" }, { value: 4, label: "Strongly Agree" }
                      ].map(option => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value.toString()} id={`q-${currentCategory}-${index}-${option.value}`} aria-label={`${q.question} - ${option.label}`}/>
                          <Label htmlFor={`q-${currentCategory}-${index}-${option.value}`} className="cursor-pointer font-normal">{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
              )}
            </>
        )}

        {/* Weights Tab */}
        {activeTab === "weights" && (
          <div className="space-y-8">
            <Card className="shadow-md">
              <CardHeader className="bg-muted/30 px-4 py-3">
                <CardTitle className="text-base font-semibold">{assessmentType} Categories</CardTitle>
                <CardDescription>
                  Adjust weights for the specific categories within {assessmentType}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {questionnaire && questionnaire[assessmentType] && Object.keys(questionnaire[assessmentType]).length > 0 ? (
            <CategoryWeightAdjuster
                    weights={
                      // Create weights object from the questionnaire categories
                      Object.keys(questionnaire[assessmentType]).reduce((acc, category) => {
                        // Use existing weights if available, otherwise set equal weights
                        if (subcategoryWeights[assessmentType] && subcategoryWeights[assessmentType][category]) {
                          acc[category] = subcategoryWeights[assessmentType][category];
                        } else {
                          const totalCategories = Object.keys(questionnaire[assessmentType]).length;
                          acc[category] = Math.round(100 / totalCategories * 10) / 10;
                        }
                        return acc;
                      }, {} as Record<string, number>)
                    }
              onWeightsChange={(newWeights) => {
                      if (assessmentType) {
                        // Update the subcategory weights with the new category weights
                        const updatedSubcategoryWeights = {
                          ...subcategoryWeights,
                          [assessmentType]: newWeights
                        };
                        setSubcategoryWeights(updatedSubcategoryWeights);
                        localStorage.setItem('subcategory_weights', JSON.stringify(updatedSubcategoryWeights));
                        
                        // Also save via the handler
                        handleSubcategoryWeightsChange(updatedSubcategoryWeights);
                      }
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No categories defined for {assessmentType || 'this assessment'}. Please check your questionnaire structure.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
        {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t max-w-6xl mx-auto">
        <Button variant="outline" onClick={handlePrevious} disabled={categoryIndex === 0 || submitting}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={handleNext} disabled={submitting || loadingError !== null} className="min-w-[120px]">
          {submitting ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing... </>)
           : categoryIndex < categories.length - 1 ? (<> Next Category <ArrowRight className="ml-2 h-4 w-4" /> </>)
           : (<> Submit Assessment <CheckCircle className="ml-2 h-4 w-4" /> </>)}
        </Button>
      </div>
    </div>
  );
}

  // Return default case (should be either company-info or weight-adjustment)
  return <></>;
}

// Keep the helper function to ensure a valid company ID format
const ensureValidCompanyId = (id: string): string => {
  // Check if the ID is a simple numeric string (which works with the backend)
  if (/^\d+$/.test(id)) {
    return id; // It's a valid numeric ID
  }
  
  // Check if it's in the UUID format (which may not work with the backend)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(id)) {
    console.warn(`Company ID "${id}" is in UUID format, which might not work with the backend. Simple numeric IDs are recommended.`);
    // We still return the original UUID as is for backward compatibility
    return id;
  }
  
  // For any other format, still return it but log a warning
  console.warn(`Company ID "${id}" is in an unusual format. Simple numeric IDs (e.g., "1", "42") are recommended.`);
  return id;
};