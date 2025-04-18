// AssessmentPage.tsx
"use client";

import { useEffect, useState, use, useCallback } from "react"; // Added 'use' and useCallback
import { useRouter } from "next/navigation";
import NextDynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Info, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CompanyInfoForm } from "@/components/CompanyInfoForm";
import { WeightAdjuster } from "@/components/WeightAdjuster";
import { CategoryWeightAdjuster } from "@/components/CategoryWeightAdjuster";
import { 
  CompanyInfo, 
  CategoryWeights, 
  SubcategoryWeights, 
  AssessmentResponse, 
  CategoryResponse
} from "@/types";
import { fetchQuestionnaire, submitAssessment, getRecommendedWeights } from "@/lib/api";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";

// Force dynamic to ensure data is always fresh
export const dynamic = "force-dynamic";

// --- Type Definitions ---
// Interface for questions state within a category
interface QuestionItem {
      question: string;
  answer: number | null; // Allow null for unanswered
}
// Type for the overall questions state object
type CategoryQuestions = Record<string, QuestionItem[]>;

// Reusing existing types...

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
  const [step, setStep] = useState<'company-info' | 'weight-adjustment' | 'questions'>('company-info'); // Start with company info
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
  const [lockedCategories, setLockedCategories] = useState<Record<string, boolean>>({}); // Key: `${category}-${subcategory}`

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

  // Define fetchQuestionnaires first without depending on fetchRecommendedWeights
  const fetchQuestionnaires = useCallback(async () => {
    if (Object.keys(questionnaire).length > 0 && !loadingError) {
      console.log("Questionnaire seems already loaded.");
      setLoading(false); // Make sure loading is off
      return;
    }
    setLoading(true);
    setLoadingError(null);
    console.log(`Fetching questionnaire for: ${assessmentType}`);
    try {
      const data = await fetchQuestionnaire(assessmentType);
      console.log(`Raw questionnaire data fetched:`, data);

      const assessmentData = data?.[assessmentType];
      if (!assessmentData || typeof assessmentData !== 'object') {
        throw new Error(`Invalid or missing questionnaire data structure for type "${assessmentType}".`);
      }

      const categoryList = Object.keys(assessmentData);
      if (categoryList.length === 0) {
        throw new Error(`No categories/subcategories found for assessment type "${assessmentType}".`);
      }

      setQuestionnaire({ [assessmentType]: assessmentData }); // Store raw structure
      setCategories(categoryList);
      setCurrentCategory(categoryList[0]); // Set first category
      setCategoryIndex(0);

      // Initialize questions state based on fetched structure
      const initialQuestionsState: CategoryQuestions = {};
      categoryList.forEach(cat => {
        initialQuestionsState[cat] = [];
        const categoryContent = assessmentData[cat];
        if (Array.isArray(categoryContent)) { // Direct questions under category
          categoryContent.forEach((qText: string) => {
            initialQuestionsState[cat].push({ question: qText, answer: null });
          });
        } else if (typeof categoryContent === 'object' && categoryContent !== null) { // Subcategories with questions
          Object.values(categoryContent).forEach((subcatQuestions: any) => {
            if (Array.isArray(subcatQuestions)) {
              subcatQuestions.forEach((qText: string) => {
                initialQuestionsState[cat].push({ question: qText, answer: null });
              });
            }
          });
        }
      });
      setQuestions(initialQuestionsState);
      console.log("Initialized questions state:", initialQuestionsState);

      // Check if we have stored weights, and if not, initialize from scratch
      const storedSubWeights = localStorage.getItem('subcategory_weights');
      let shouldInitializeWeights = false;
      
      try {
        if (storedSubWeights) {
          const parsedWeights = JSON.parse(storedSubWeights);
          // Verify the stored weights match the current assessment's categories
          const hasMissingCategories = categoryList.some(cat => !parsedWeights[cat]);
          shouldInitializeWeights = hasMissingCategories;
          
          if (!shouldInitializeWeights) {
            console.log("Using stored weights as they match the current assessment");
            setSubcategoryWeights(parsedWeights);
            setWeights(convertSubcategoryToCategory(parsedWeights));
          }
        } else {
          shouldInitializeWeights = true;
        }
      } catch (e) {
        console.error("Error parsing stored weights, will initialize new ones:", e);
        shouldInitializeWeights = true;
      }
      
      // Initialize weights ONLY if they need to be initialized
      if (shouldInitializeWeights) {
        console.log("Initializing fresh weights as none were valid for this assessment");
        const initialSubW = initializeDefaultSubcategoryWeights(assessmentData);
        setSubcategoryWeights(initialSubW);
        setWeights(convertSubcategoryToCategory(initialSubW));
        localStorage.setItem('subcategory_weights', JSON.stringify(initialSubW));
        localStorage.setItem('assessment_weights', JSON.stringify(convertSubcategoryToCategory(initialSubW)));
      }

      setStep('questions'); // Ensure we are on the questions step
      setActiveTab('questions'); // Ensure questions tab is active
      setLoading(false);
    } catch (error) {
      console.error("Error fetching/processing questionnaire:", error);
      const msg = error instanceof Error ? error.message : "Unknown error loading questions.";
      setLoadingError(msg);
      toast({ title: "Error Loading Questions", description: msg, variant: "destructive" });
      setQuestions({}); setCategories([]); setCurrentCategory(""); // Reset state on error
      setLoading(false);
    }
  }, [assessmentType, loadingError, questionnaire, toast]);

  // Now define fetchRecommendedWeights without referencing fetchQuestionnaires
  const fetchRecommendedWeights = useCallback(async (info: CompanyInfo) => {
    setLoading(true);
    try {
      console.log("Setting up recommended weights based on:", info);
      const questionnaireStructure = await fetchQuestionnaire(assessmentType);
      if (!questionnaireStructure?.[assessmentType]) {
          throw new Error("Could not fetch questionnaire structure for weight setup.");
      }
      const assessmentData = questionnaireStructure[assessmentType];

      const recSubWeights = initializeDefaultSubcategoryWeights(assessmentData);
      const recCatWeights = convertSubcategoryToCategory(recSubWeights);

      console.log("Using default distribution as 'recommended':", recSubWeights);
      setRecommendedSubcategoryWeights(recSubWeights);
      setRecommendedWeights(recCatWeights);

      // Set the *actual* working weights to these recommendations initially
      setSubcategoryWeights(recSubWeights);
      setWeights(recCatWeights);

      // Save these initial weights to localStorage
      localStorage.setItem('subcategory_weights', JSON.stringify(recSubWeights));
      localStorage.setItem('assessment_weights', JSON.stringify(recCatWeights));

      // Check if all categories have only one subcategory (thus nothing to adjust)
      let allCategoriesHaveOnlyOneSubcategory = true;
      
      for (const category in recSubWeights) {
        const subcategoryCount = Object.keys(recSubWeights[category]).length;
        if (subcategoryCount > 1) {
          allCategoriesHaveOnlyOneSubcategory = false;
          break;
        }
      }
      
      // If all categories have only one subcategory, skip the weight adjustment step
      if (allCategoriesHaveOnlyOneSubcategory) {
        console.log("Skipping weight adjustment step as all categories have only one subcategory");
        // Change to directly set the step - no fetchQuestionnaires call
        setStep('questions');
        setQuestionnaire({ [assessmentType]: assessmentData }); // Reuse the already fetched data
      } else {
        setStep('weight-adjustment'); // Only show adjustment UI if there's something to adjust
      }
      setLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error setting up recommended weights:", error);
      toast({ title: "Weight Setup Error", description: error.message, variant: "destructive" });
      // Fallback: try initializing truly default weights without structure fetch if possible
      setRecommendedSubcategoryWeights({}); setRecommendedWeights({});
      setSubcategoryWeights({}); setWeights({});
      setStep('weight-adjustment'); // Still go to adjustment, but might be empty
        setLoading(false);
    }
  }, [assessmentType, toast]);

  // Authorization Check Effect
  useEffect(() => {
    if (user && user.role !== 'admin' && !canEditPillar(assessmentType)) {
        toast({
          title: "Access Restricted",
        description: `You don't have permission for the ${assessmentType} assessment.`,
          variant: "destructive",
        });
      router.replace("/assessment");
      }
  }, [user, assessmentType, canEditPillar, router, toast]);
  
  // Progress Calculation Effect
  useEffect(() => {
    if (!questions || Object.keys(questions).length === 0) {
      setProgress(0);
      return;
    }
    let answeredCount = 0;
    let totalCount = 0;
    Object.values(questions).forEach(categoryQList => {
      categoryQList.forEach(q => {
            totalCount++;
        if (q.answer !== null) { // Check only for null
              answeredCount++;
            }
          });
    });
    setProgress(totalCount > 0 ? (answeredCount / totalCount) * 100 : 0);
  }, [questions]); // Rerun when questions (including answers) change

  // Initial Load Effect - MOVED to AFTER function definitions
  useEffect(() => {
    console.log("Assessment Type:", assessmentType);
    setLoading(true);
    setLoadingError(null);
    setCategoryIndex(0); // Reset index on type change
    setCurrentCategory(""); // Reset category on type change

    // Multi-assessment setup
    const doingAll = localStorage.getItem('doing_all_assessments') === 'true';
    setIsDoingAllAssessments(doingAll);
    if (doingAll) {
      const typesStr = localStorage.getItem('assessment_types');
      const indexStr = localStorage.getItem('current_assessment_index');
      try {
        if (!typesStr || !indexStr) throw new Error("Missing multi-assessment state");
        setAllAssessmentTypes(JSON.parse(typesStr));
        setCurrentAssessmentIndex(parseInt(indexStr, 10));
      } catch (e) {
        console.error("Error parsing multi-assessment state, disabling.", e);
        setIsDoingAllAssessments(false);
        // Clean up potentially corrupt storage
        localStorage.removeItem('doing_all_assessments');
        localStorage.removeItem('assessment_types');
        localStorage.removeItem('current_assessment_index');
      }
    }

    // Load state from localStorage
    const storedCompanyInfo = localStorage.getItem('company_info');
    const storedSubWeights = localStorage.getItem('subcategory_weights'); // Key specific to subweights
    const storedLocks = localStorage.getItem('locked_categories');
    const isRetaking = localStorage.getItem('retaking_assessment') === 'true';

    let initialSubWeights: SubcategoryWeights = {};
    let initialLocks: Record<string, boolean> = {};
    let initialCompanyInfo: CompanyInfo | null = null;
    let determinedStep: 'company-info' | 'weight-adjustment' | 'questions' = 'company-info';

    try {
      if (storedLocks) initialLocks = JSON.parse(storedLocks);
    } catch (e) { console.error("Failed to parse stored locks", e); }
    setLockedCategories(initialLocks);

    try {
      if (storedCompanyInfo) initialCompanyInfo = JSON.parse(storedCompanyInfo);
    } catch (e) { console.error("Failed to parse stored company info", e); }
    setCompanyInfo(initialCompanyInfo);

    try {
      if (storedSubWeights) initialSubWeights = JSON.parse(storedSubWeights);
    } catch (e) { console.error("Failed to parse stored sub weights", e); }
    // Don't set state yet, depends on company info presence

    // Determine starting step based on user role and data
    // Only admins should see company profile and weight adjustment
    const isAdmin = user?.role === 'admin';
    
    if (isAdmin) {
      // Admin flow - normal decision process
      if (initialCompanyInfo) {
        // For admin retaking assessment, respect the retaking flag
        if (isRetaking) {
          console.log("Admin retaking assessment, skipping to questions directly");
          setSubcategoryWeights(initialSubWeights);
          setWeights(convertSubcategoryToCategory(initialSubWeights));
          determinedStep = 'questions';
        } else if (Object.keys(initialSubWeights).length > 0) {
          // Has info and weights -> go to questions
          setSubcategoryWeights(initialSubWeights);
          setWeights(convertSubcategoryToCategory(initialSubWeights));
          determinedStep = 'questions';
        } else {
          // Has info, no weights -> go to weight adjustment
          determinedStep = 'weight-adjustment';
        }
      } else {
        // No company info -> start with company info for admins
        determinedStep = 'company-info';
      }
    } else {
      // Non-admin flow - always skip to questions with default or stored weights
      if (initialCompanyInfo && Object.keys(initialSubWeights).length > 0) {
        // Use existing company info and weights if available
        setSubcategoryWeights(initialSubWeights);
        setWeights(convertSubcategoryToCategory(initialSubWeights));
      } else {
        // If missing company info or weights, create default ones
        console.log("Non-admin user using default assessment configuration");
        
        // Create default company info if not exists
        if (!initialCompanyInfo) {
          const defaultCompanyInfo: CompanyInfo = {
            name: "Default Company",
            industry: "Technology",
            size: "Mid-size (100-999 employees)",
            aiMaturity: "Exploring",
            region: "North America",
            notes: "Default configuration for non-admin user"
          };
          setCompanyInfo(defaultCompanyInfo);
          localStorage.setItem('company_info', JSON.stringify(defaultCompanyInfo));
          initialCompanyInfo = defaultCompanyInfo;
        }
        
        // Will set default weights via fetchQuestionnaires if needed
      }
      
      // Always go directly to questions for non-admin users
      determinedStep = 'questions';
    }

    console.log("Determined initial step:", determinedStep, "for user role:", user?.role || "unknown");
    setStep(determinedStep);

    // Add this near the initial load effect
    const shouldResetWeights = localStorage.getItem('reset_weights') === 'true';
    
    if (shouldResetWeights) {
      console.log("Resetting weights as requested");
      clearAssessmentData();
      localStorage.removeItem('reset_weights'); // Clear the flag
      // Will continue to normal initialization without stored weights
    }

    // Clean up retaking flag if it exists
    if (isRetaking) {
      localStorage.removeItem('retaking_assessment');
    }

    // Try to get company-specific weights
    if (initialCompanyInfo) {
      try {
        // Use optional chaining and nullish coalescing to handle undefined
        const companyId = initialCompanyInfo?.id ?? "";
        if (companyId) {
          const companyWeightsKey = `company_weights_${companyId}`;
          const storedCompanyWeights = localStorage.getItem(companyWeightsKey);
          if (storedCompanyWeights) {
            console.log("Using company-specific weights");
            const parsedWeights = JSON.parse(storedCompanyWeights);
            setWeights(parsedWeights);
            localStorage.setItem('assessment_weights', JSON.stringify(parsedWeights));
          }
        }
      } catch (error) {
        console.error("Error loading company-specific weights:", error);
      }
    }

    // Execute the appropriate data fetching based on the determined step
    if (determinedStep === 'questions') {
      fetchQuestionnaires();
    } else if (determinedStep === 'weight-adjustment' && initialCompanyInfo) {
      fetchRecommendedWeights(initialCompanyInfo);
    }
  }, [assessmentType, fetchQuestionnaires, fetchRecommendedWeights, user]);

  // --- Event Handlers ---

  const handleCompanyInfoSubmit = async (info: CompanyInfo) => {
    setCompanyInfo(info);
    setLoading(true);
    try {
      localStorage.setItem('company_info', JSON.stringify(info));
      await fetchRecommendedWeights(info); // Fetches recommendations, sets initial weights, moves step
    } catch (error) {
      console.error("Error processing company info submission:", error);
      toast({ title: "Error", description: "Failed to process company profile.", variant: "destructive" });
      setLoading(false);
      setStep('company-info'); // Stay on this step on error
    }
  };

  // Parent handler - directly updates state and saves
  const handleSubcategoryWeightsChange = useCallback((newWeights: SubcategoryWeights) => {
    // Update state immediately - no setTimeout
    setSubcategoryWeights(newWeights);
    const derivedCategoryWeights = convertSubcategoryToCategory(newWeights);
    setWeights(derivedCategoryWeights);
    
    try {
      localStorage.setItem('subcategory_weights', JSON.stringify(newWeights));
      localStorage.setItem('assessment_weights', JSON.stringify(derivedCategoryWeights));
    } catch (error) {
      console.error("Error saving weights to localStorage:", error);
      toast({ title: "Storage Error", description: "Could not save weight changes locally.", variant: "destructive" });
    }
  }, [toast]); // Only toast as a dependency

  const handleWeightsSubmit = () => {
    // Weights are saved live via handleSubcategoryWeightsChange.
    // This button confirms the user is done adjusting and wants to proceed.
    console.log("Weights adjustment confirmed by user.");
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
    setLockedCategories(prev => {
      const updatedLockState = { ...prev, [lockKey]: !prev[lockKey] };
      try {
        localStorage.setItem('locked_categories', JSON.stringify(updatedLockState));
      } catch (error) {
          console.error("Error saving locked categories to localStorage:", error);
           toast({ title: "Storage Error", description: "Could not save lock state locally.", variant: "destructive" });
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
    if (!companyInfo || !assessmentType || Object.keys(questions).length === 0 || !user) {
      toast({ title: "Submission Error", description: "Missing required information (Company Info, User, or Questions). Cannot submit.", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    try {
      // CRITICAL FIX: Ensure we have valid weights that sum to 100
      // Create an array of all categories in the assessment
      const allCategories = Object.keys(questions);
      if (allCategories.length === 0) {
        throw new Error("No assessment categories found");
      }
      
      // Create valid weights by ensuring every category has a non-zero weight
      // and the total sum is exactly 100
      let validWeights: Record<string, number> = {};
      
      // First assign equal weights to all categories
      const equalWeight = Number((100 / allCategories.length).toFixed(1));
      allCategories.forEach(category => {
        validWeights[category] = equalWeight;
      });
      
      // Calculate the current sum and adjust if needed to ensure exactly 100
      let totalWeight = Object.values(validWeights).reduce((sum, weight) => sum + weight, 0);
      if (Math.abs(totalWeight - 100) > 0.0001) {
        // If there's a discrepancy, adjust the last category
        const lastCategory = allCategories[allCategories.length - 1];
        validWeights[lastCategory] = Number((validWeights[lastCategory] + (100 - totalWeight)).toFixed(1));
      }
      
      // Double-check that weights sum to 100
      totalWeight = Object.values(validWeights).reduce((sum, weight) => sum + weight, 0);
      console.log(`Total weight before submission: ${totalWeight}`);
      console.log("Category weights for submission:", validWeights);
      
      if (Math.abs(totalWeight - 100) > 0.1) {
        // If still not close to 100, show error and prevent submission
        throw new Error(`Weight validation failed. Total: ${totalWeight.toFixed(1)}%. Must be 100%.`);
      }

      // Format payload according to API specification using the validWeights
      const categoryResponses = allCategories.map(category => ({
        category: category,
        weight: validWeights[category],
        responses: questions[category].map(q => ({
          question: q.question,
          answer: q.answer ?? 0 // Default unanswered to 0
        }))
      }));

      const payload = {
        assessmentType,
        companyId: companyInfo.id || "",
        companyName: companyInfo.name || "",
        categoryResponses,
        userId: user.id || "",
        userName: user.name || "",
        userRole: user.role || "",
        completedAt: new Date().toISOString()
      };

      console.log("Submitting assessment payload:", JSON.stringify(payload, null, 2));
      const result = await submitAssessment(payload);
      console.log("Assessment submitted successfully:", result);
      
      try {
        // Save result for immediate display on results page
        localStorage.setItem(`assessment_result_${assessmentType}`, JSON.stringify(result));
        
        // Also save the result by company ID for company-specific retrieval
        // First, get any existing company assessments
        const companyAssessmentsKey = `company_assessments_${companyInfo.id || ""}`;
        const existingData = localStorage.getItem(companyAssessmentsKey);
        let companyAssessments: Record<string, any> = {};
        
        if (existingData) {
          try {
            companyAssessments = JSON.parse(existingData);
          } catch (error) {
            console.error("Error parsing existing company assessments:", error);
          }
        }
        
        // Update with the new assessment result
        companyAssessments[assessmentType] = {
          ...result,
          completedBy: {
            id: user.id,
            name: user.name,
            role: user.role
          },
          completedAt: new Date().toISOString()
        };
        
        // Save back to localStorage
        localStorage.setItem(companyAssessmentsKey, JSON.stringify(companyAssessments));
        
        // Update company assessment status
        if (companyInfo.id) {
          updateCompanyAssessmentStatus(companyInfo.id, assessmentType, result.overallScore);
        } else {
          console.log("No company ID available for assessment status update");
        }
        
      } catch (storageError) {
        console.error("Error saving results to localStorage:", storageError);
        // Don't block navigation, but warn user
        toast({ title: "Storage Warning", description: "Could not save results locally for instant view.", variant: "default" });
      }

      // Clear specific assessment data from localStorage after successful submission
      localStorage.removeItem('subcategory_weights'); // Clear general weights
      localStorage.removeItem('assessment_weights');
      localStorage.removeItem('locked_categories');
      // Keep company_info if doing multi-assessment, clear otherwise or at the end

      // Handle navigation
      if (isDoingAllAssessments) {
        const nextIndex = currentAssessmentIndex + 1;
        if (nextIndex < allAssessmentTypes.length) {
          // Move to next assessment
          localStorage.setItem('current_assessment_index', nextIndex.toString());
          router.replace(`/assessment/${encodeURIComponent(allAssessmentTypes[nextIndex])}`);
          // Don't clear company_info yet
        } else {
          // All assessments done
          toast({ title: "All Assessments Completed!", description: "Navigating to dashboard.", variant: "default" });
          localStorage.removeItem('doing_all_assessments');
          localStorage.removeItem('current_assessment_index');
          localStorage.removeItem('assessment_types');
          localStorage.removeItem('company_info'); // Clear info now
          router.replace('/dashboard');
        }
      } else {
        // Single assessment done
        localStorage.removeItem('company_info'); // Clear info
        router.replace(`/results/${encodeURIComponent(assessmentType)}`);
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error submitting assessment:", error);
      toast({ title: "Submission Error", description: error.message, variant: "destructive" });
      setSubmitting(false); // Allow retry
    }
    // No need to setSubmitting(false) on success because we navigate away
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
                  <Button variant="outline" onClick={() => window.location.reload()}> Try Again </Button>
                  <Button variant="secondary" onClick={() => router.push("/")}> Go Home </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }


  // Step: Company Info
  if (step === 'company-info') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Company Profile</h1>
          <p className="text-center text-muted-foreground mb-6">Provide details about the company being assessed.</p>
          <CompanyInfoForm onSubmit={handleCompanyInfoSubmit} loading={loading} initialData={companyInfo} />
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
            onWeightsChange={handleSubcategoryWeightsChange} // CORRECTED handler
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


  // Step: Questions (Main Assessment UI)
  // Safeguard: Ensure necessary data is present before rendering questions UI
   if (step !== 'questions' || !categories.length || !currentCategory || !questions[currentCategory]) {
    // Log the issues to help debug what's missing
    console.log("Debug missing data:", {
      step,
      categoriesLength: categories.length,
      categories,
      currentCategory, 
      hasQuestionsForCurrentCategory: currentCategory ? !!questions[currentCategory] : false,
      questionKeys: Object.keys(questions)
    });
    
    // Force set the category if categories exist but currentCategory is empty
    if (categories.length > 0 && (!currentCategory || !questions[currentCategory])) {
      console.log("Fixing missing current category. Will use:", categories[0]);
      // Immediately use the first category rather than wait for state update
      const fixedCategory = categories[0];
      setCurrentCategory(fixedCategory);
      setCategoryIndex(0);
      
      // If we have the category in questions, we can proceed immediately
      if (questions[fixedCategory]) {
        return (
          <div className="container mx-auto px-4 py-12">
            {/* Render the actual questions directly */}
            <div className="mb-8 max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold mb-2">{assessmentType} Assessment</h1>
              <p className="text-muted-foreground mb-4">
                Rate your agreement: 1 (Strongly Disagree) to 4 (Strongly Agree).
              </p>
              {/* Rest of your UI */}
              {/* ... */}
            </div>
            {/* This will trigger the main render on next cycle */}
          </div>
        );
      }
    }
    
     return (
       <div className="container mx-auto px-4 py-12 text-center">
               <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
               <p className="text-muted-foreground">Preparing questions...</p>
        <Button onClick={() => {
          // Enhanced retry that attempts to fix the category issue
          if (categories.length > 0) {
            setCurrentCategory(categories[0]);
            setCategoryIndex(0);
          }
          fetchQuestionnaires();
        }} variant="outline" className="mt-4">Retry Load</Button>
       </div>
     );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header - Add max-width and center alignment */}
      <div className="mb-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{assessmentType} Assessment</h1>
        <p className="text-muted-foreground mb-4">
          Rate your agreement: 1 (Strongly Disagree) to 4 (Strongly Agree).
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
      
      {/* Simplified Tabs - Also add consistent max-width */}
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

        {/* Weights Tab */}
        {activeTab === "weights" && (
          <div className="space-y-8">
            {/* Category-level weight adjuster */}
            <CategoryWeightAdjuster
              weights={weights}
              onWeightsChange={(newWeights) => {
                setWeights(newWeights);
                localStorage.setItem('assessment_weights', JSON.stringify(newWeights));
              }}
            />
          </div>
        )}
      </div>
      
      {/* Navigation - Also add consistent max-width */}
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