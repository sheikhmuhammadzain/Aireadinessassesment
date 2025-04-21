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
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Info, Lock, Unlock, AlertCircle, Check, Clock, AlertTriangle } from "lucide-react";
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
import { fallbackQuestionnaires } from "@/lib/fallback/questionnaires";

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

  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questionnaires, setQuestionnaires] = useState<Record<string, any> | null>(null);

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

  async function fetchQuestionnairesWithRetry(setError: React.Dispatch<React.SetStateAction<string | null>>): Promise<Record<string, any> | null> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    const maxDelay = 5000; // 5 seconds
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to fetch questionnaires (attempt ${attempt + 1}/${maxRetries + 1})...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        // Use direct backend connection instead of proxy
        const response = await fetch('http://127.0.0.1:8000/questionnaires', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
          cache: 'no-store',
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status} (${response.statusText})`);
        }
        
        const data = await response.json();
        console.log('Successfully fetched questionnaires');
        return data;
      } catch (error) {
        // Create a more detailed error message
        let errorMessage = 'Unknown error';
        
        if (error instanceof Error) {
          errorMessage = error.message;
          
          // Add more context for specific error types
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out after 15 seconds';
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error - Cannot connect to backend API (http://127.0.0.1:8000). Check if the server is running.';
          }
        }
        
        console.error(`Attempt ${attempt + 1} failed: ${errorMessage}`);
        
        if (attempt < maxRetries) {
          // Calculate delay with exponential backoff, capped at maxDelay
          const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // All retries failed
          console.error('All attempts to fetch questionnaires failed. Using fallback data.');
          setError(`Could not connect to the backend server (${errorMessage}). Using offline data.`);
          return fallbackQuestionnaires;
        }
      }
    }
    
    return null;
  }

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
      // Use direct fetch method that bypasses proxy and API routing
      const { fetchQuestionnairesDirectly } = await import('@/lib/api');
      const allQuestionnairesData = await fetchQuestionnairesDirectly();
      
      // Extract the specific assessment type data
      const data = { [assessmentType]: allQuestionnairesData?.[assessmentType] };
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
      
      // Try to sync weights with backend first if we have a company ID
      if (info.id) {
        try {
          const { syncCategoryWeights } = await import('@/lib/api');
          // Ensure assessmentType is never undefined when passed to syncCategoryWeights
          const syncedWeights = await syncCategoryWeights(info.id, assessmentType || '');
          
          if (Object.keys(syncedWeights).length > 0) {
            console.log("Using synchronized weights from backend:", syncedWeights);
            
            // Create subcategory weights structure 
            const subWeights: SubcategoryWeights = {
              [assessmentType]: syncedWeights
            };
            
            // Set the weights in state
            setRecommendedSubcategoryWeights(subWeights);
            setSubcategoryWeights(subWeights);
            
            // Calculate and set category weights
            const catWeights = convertSubcategoryToCategory(subWeights);
            setRecommendedWeights(catWeights);
            setWeights(catWeights);
            
            // Skip to next appropriate step
            const allCategoriesHaveOnlyOneSubcategory = 
              Object.keys(syncedWeights).length <= 1 || 
              !Object.keys(syncedWeights).some(category => Object.keys(syncedWeights[category]).length > 1);
              
            if (allCategoriesHaveOnlyOneSubcategory) {
              console.log("Skipping weight adjustment step as all categories have only one subcategory");
              
              // Load questionnaires if we're skipping directly to questions
              await fetchQuestionnaires();
              setStep('questions');
            } else {
              setStep('weight-adjustment');
            }
            
            setLoading(false);
            return;
          }
        } catch (syncError) {
          console.warn("Could not sync weights from backend, falling back to defaults:", syncError);
        }
      }
      
      // Use direct fetch method that bypasses proxy and API routing
      const { fetchQuestionnairesDirectly } = await import('@/lib/api');
      const allQuestionnairesData = await fetchQuestionnairesDirectly();
      
      // Extract the specific assessment type data from all questionnaires
      const assessmentData = allQuestionnairesData?.[assessmentType];
      
      if (!assessmentData) {
        throw new Error(`Could not find questionnaire data for ${assessmentType}`);
      }
      
      console.log(`Successfully fetched questionnaire data for ${assessmentType}`);

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
      
      // If we have a company ID, save to backend for future sync
      if (info.id) {
        try {
          const { saveCategoryWeights } = await import('@/lib/api');
          await saveCategoryWeights(info.id, assessmentType || '', recSubWeights);
          console.log(`Successfully saved weights to backend for company ${info.id}`);
        } catch (saveError) {
          console.warn("Could not save weights to backend:", saveError);
        }
      }

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
        setStep('questions');
        setQuestionnaire({ [assessmentType]: assessmentData }); // Store fetched data in questionnaire state
      } else {
        setStep('weight-adjustment'); // Only show adjustment UI if there's something to adjust
      }
      setLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error setting up recommended weights:", error);
      toast({ title: "Weight Setup Error", description: error.message, variant: "destructive" });
      
      // Provide fallback weights based on company size
      try {
        const fallbackWeights = getDefaultWeightsByCompanySize(info.size);
        setRecommendedWeights(fallbackWeights);
        setWeights(fallbackWeights);
        setStep('weight-adjustment');
      } catch (fallbackError) {
        // Last resort fallback
        setRecommendedSubcategoryWeights({}); 
        setRecommendedWeights({});
        setSubcategoryWeights({}); 
        setWeights({});
        setStep('weight-adjustment');
      }
        setLoading(false);
    }
  }, [assessmentType, fetchQuestionnaires, toast]);

  // Helper function to provide fallback weights based on company size
  const getDefaultWeightsByCompanySize = (size: string): CategoryWeights => {
    // Default weights if all else fails
    const defaultWeights = {
      "AI Governance": 14.3,
      "AI Culture": 14.3,
      "AI Infrastructure": 14.3,
      "AI Strategy": 14.3,
      "AI Data": 14.3,
      "AI Talent": 14.3,
      "AI Security": 14.2
    };
    
    if (size === "Enterprise (1000+ employees)") {
      return {
        "AI Governance": 18,
        "AI Culture": 12,
        "AI Infrastructure": 15,
        "AI Strategy": 16,
        "AI Data": 14,
        "AI Talent": 10,
        "AI Security": 15
      };
    } else if (size === "Mid-size (100-999 employees)") {
      return {
        "AI Governance": 12,
        "AI Culture": 15,
        "AI Infrastructure": 16,
        "AI Strategy": 15,
        "AI Data": 16,
        "AI Talent": 13,
        "AI Security": 13
      };
    } else if (size === "Small (10-99 employees)") {
      return {
        "AI Governance": 10,
        "AI Culture": 16,
        "AI Infrastructure": 14,
        "AI Strategy": 14,
        "AI Data": 18,
        "AI Talent": 16,
        "AI Security": 12
      };
    }
    
    return defaultWeights;
  };

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
      if (storedCompanyInfo) {
        initialCompanyInfo = JSON.parse(storedCompanyInfo);
        
        // Check and fix company ID format
        if (initialCompanyInfo && initialCompanyInfo.id) {
          const formattedId = ensureValidCompanyId(initialCompanyInfo.id);
          if (formattedId !== initialCompanyInfo.id) {
            console.log(`Fixed company ID format from "${initialCompanyInfo.id}" to "${formattedId}"`);
            initialCompanyInfo.id = formattedId;
            localStorage.setItem('company_info', JSON.stringify(initialCompanyInfo));
          }
        }
      }
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

  // Helper function to get a valid company ID from the backend
  const getValidCompanyId = async (info: CompanyInfo): Promise<string | null> => {
    try {
      // If there's already a valid company ID, use it
      if (info.id) {
        return info.id;
      }
      
      // Otherwise, fetch companies from the backend using the public endpoint that doesn't require auth
      console.log('Fetching public company list from backend');
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/companies/public`;
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
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/companies`;
          
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
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/companies/${encodeURIComponent(companyId)}`;
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

      // Save the assessment to the backend database for persistent tracking
      try {
        if (companyInfo.id) {
          // Dynamically import the API client to ensure it's only loaded client-side
          const { default: api } = await import('@/lib/api/client');
          
          // First, check if there's an existing assessment for this company and type
          const { data: existingAssessments, error: fetchError } = await api.assessments.getCompanyAssessments(companyInfo.id);
          
          let existingAssessmentId: string | null = null;
          
          if (!fetchError && existingAssessments) {
            // Find the assessment with matching type
            const matchingAssessment = Array.isArray(existingAssessments) 
              ? existingAssessments.find((a: any) => a.assessment_type === assessmentType)
              : existingAssessments.assessments?.find((a: any) => a.type === assessmentType);
              
            if (matchingAssessment) {
              existingAssessmentId = matchingAssessment.id;
            }
          }
          
          if (existingAssessmentId) {
            console.log(`Updating existing assessment (${existingAssessmentId}) in backend database`);
            // For update, we need to pass the full assessment data
            const { error: updateError } = await api.assessments.updateAssessment(
              existingAssessmentId, 
              {
                company_id: companyInfo.id,
                assessment_type: assessmentType,
                status: "completed",
                score: result.overallScore,
                data: {
                  categoryScores: result.categoryScores,
                  userWeights: result.userWeights || result.adjustedWeights,
                  adjustedWeights: result.adjustedWeights,
                  qValues: result.qValues,
                  responses: categoryResponses
                },
                completed_at: new Date().toISOString(),
                completed_by_id: user.id || null
              }
            );
            
            if (updateError) {
              console.error("Failed to update assessment in database:", updateError);
              toast({ 
                title: "Database Update Warning", 
                description: "Assessment submitted successfully but could not update the database record.", 
                variant: "default"
              });
            } else {
              console.log("Assessment successfully updated in database");
            }
          } else {
            console.log("Creating new assessment in backend database");
            try {
              // For create, we need to pass the correct parameters
              const { error: createError } = await api.assessments.createAssessment(
                companyInfo.id,
                assessmentType
              );
              
              if (createError) {
                console.error("Failed to create assessment in database:", createError);
                toast({ 
                  title: "Database Warning", 
                  description: "Assessment submitted successfully but could not create a database record.", 
                  variant: "default"
                });
              } else {
                console.log("Assessment successfully saved to database");
                
                // If the assessment was created successfully, try to update it with the complete data
                const { data: assessments } = await api.assessments.getCompanyAssessments(companyInfo.id);
                if (assessments && Array.isArray(assessments)) {
                  const newAssessment = assessments.find((a: any) => a.assessment_type === assessmentType);
                  if (newAssessment && newAssessment.id) {
                    console.log("Updating newly created assessment with results");
                    await api.assessments.updateAssessment(
                      newAssessment.id,
                      {
                        company_id: companyInfo.id,
                        assessment_type: assessmentType,
                        status: "completed",
                        score: result.overallScore,
                        data: {
                          categoryScores: result.categoryScores,
                          userWeights: result.userWeights || result.adjustedWeights,
                          adjustedWeights: result.adjustedWeights,
                          qValues: result.qValues,
                          responses: categoryResponses
                        },
                        completed_at: new Date().toISOString(),
                        completed_by_id: user.id || null
                      }
                    );
                  }
                }
              }
            } catch (createApiError) {
              console.error("API error when creating assessment:", createApiError);
              toast({ 
                title: "Database Warning", 
                description: "Assessment submitted successfully but could not create a database record due to an API error.", 
                variant: "default"
              });
            }
          }
        } else {
          console.warn("Missing company ID - cannot save assessment to database");
        }
      } catch (dbError) {
        console.error("Error saving assessment to database:", dbError);
        // Don't block navigation, just notify user
        toast({ 
          title: "Database Warning", 
          description: "Assessment submitted successfully but could not be saved to the database.", 
          variant: "default"
        });
      }
      
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

  useEffect(() => {
    const loadQuestionnaires = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchQuestionnairesWithRetry(setError);
        
        if (data) {
          setQuestionnaires(data);
          
          // Initialize weights using company info or defaults
          const initialWeights = getInitialWeights(data, companyInfo);
          setWeights(initialWeights);
          
          // Initialize scores with zeros
          const initialScores: Record<string, number> = {};
          
          // Handle both data formats - API format with subcategories.questions and fallback format with direct arrays
          if (data && typeof data === 'object') {
            Object.keys(data).forEach(category => {
              const categoryData = data[category];
              
              // API Format with subcategories object that contains a questions array
              if (categoryData && categoryData.subcategories) {
                Object.keys(categoryData.subcategories).forEach(subcategory => {
                  if (Array.isArray(categoryData.subcategories[subcategory].questions)) {
                    categoryData.subcategories[subcategory].questions.forEach((q: { id: string }) => {
                      if (q && q.id) {
                        initialScores[q.id] = 0;
                      }
                    });
                  }
                });
              } 
              // Fallback Format where each category contains subcategories with question arrays directly
              else if (categoryData && typeof categoryData === 'object') {
                Object.keys(categoryData).forEach(subcategory => {
                  const questions = categoryData[subcategory];
                  if (Array.isArray(questions)) {
                    // For each question text, generate a synthetic ID
                    questions.forEach((questionText: string, index: number) => {
                      const syntheticId = `${category}_${subcategory}_q${index}`;
                      initialScores[syntheticId] = 0;
                    });
                  }
                });
              }
            });
          }
          
          console.log('Initialized scores with structure:', Object.keys(initialScores).length);
          setScores(initialScores);
        } else {
          setError("Failed to load questionnaires. Please try again later.");
        }
      } catch (err) {
        console.error("Error in questionnaire loading:", err);
        setError("An unexpected error occurred while loading the assessment. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (companyInfo) {
      loadQuestionnaires();
    }
  }, [companyInfo]);

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
          fetchQuestionnairesWithRetry(setError)
            .then(data => {
              if (data) {
                setQuestionnaires(data);
                
                // Initialize weights directly here
                const weights: Record<string, number> = {};
                
                const initialWeights = getInitialWeights(data, companyInfo);
                setWeights(initialWeights);
                const initialScores: Record<string, number> = {};
                Object.keys(data).forEach(category => {
                  Object.keys(data[category].subcategories).forEach(subcategory => {
                    data[category].subcategories[subcategory].questions.forEach((q: { id: string }) => {
                      initialScores[q.id] = 0;
                    });
                  });
                });
                setScores(initialScores);
              }
              setIsLoading(false);
            })
            .catch(() => {
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

// Helper function to ensure a valid company ID format
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