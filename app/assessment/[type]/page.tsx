"use client";

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
// Assuming WeightAdjustment might still be used elsewhere, keeping import
// import { WeightAdjustment } from "@/components/WeightAdjustment"; 
import { SubcategoryWeightAdjustment } from "@/components/SubcategoryWeightAdjustment";
import { CompanyInfo, Weights, SubcategoryWeights, AssessmentResponse, CategoryResponse } from "@/types";
import { fetchQuestionnaire, submitAssessment, getRecommendedWeights } from "@/lib/api"; // Ensure getRecommendedWeights is defined/used if needed
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // If used in sub-components
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/components/ui/use-toast";

// Keep force-dynamic if needed for serverless functions / edge runtime data fetching consistency
export const dynamic = "force-dynamic"; 

// Type definitions (keep as is)
type Responses = { [key: string]: string; };
type ResponsesBySubcategory = {
  [category: string]: {
    [subcategory: string]: {
      question: string;
      answer: number;
    }[];
  };
};

interface AssessmentSubmission {
  assessmentType: string;
  companyInfo: CompanyInfo;
  userId: string;
  categoryResponses: {
    category: string;
    answers: number[];
  }[];
  finalWeights: Weights;
  finalSubcategoryWeights: SubcategoryWeights;
}

// Main Page Component
export default function AssessmentPage({ params }: { params: { type: string } }) {
  return (
    <ProtectedRoute>
      <AssessmentTypeContent params={params} />
    </ProtectedRoute>
  );
}

// Core Content Component
function AssessmentTypeContent({ params }: { params: { type: string } }): JSX.Element {
  const assessmentType = decodeURIComponent(params.type);
  const router = useRouter();
  const { toast } = useToast();
  const { user, canEditPillar } = useAuth();
  
  // State Variables
  const [step, setStep] = useState<'company-info' | 'weight-adjustment' | 'questions'>('questions'); // Default might need adjustment based on logic
  const [loading, setLoading] = useState(true); // Loading state for initial data fetch
  const [submitting, setSubmitting] = useState(false); // Submission loading state
  const [questionnaire, setQuestionnaire] = useState<Record<string, Record<string, string[]>>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [questions, setQuestions] = useState<CategoryQuestions>({});
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [weights, setWeights] = useState<Weights>({}); // Initialize empty, populated later
  const [recommendedWeights, setRecommendedWeights] = useState<CategoryWeights | undefined>(undefined);
  const [subcategoryWeights, setSubcategoryWeights] = useState<SubcategoryWeights>({}); // Initialize empty
  const [recommendedSubcategoryWeights, setRecommendedSubcategoryWeights] = useState<SubcategoryWeights | undefined>(undefined);

  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("questions"); // Default tab
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isDoingAllAssessments, setIsDoingAllAssessments] = useState(false);
  const [allAssessmentTypes, setAllAssessmentTypes] = useState<string[]>([]);
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  const [lockedCategories, setLockedCategories] = useState<Record<string, boolean>>({});

  // --- Effects ---

  // Initial Load Effect (Determine Step, Load Data)
  useEffect(() => {
    console.log("Assessment Type:", assessmentType);
    setLoading(true); // Start loading indicator
    setLoadingError(null); // Reset errors

    const doingAll = localStorage.getItem('doing_all_assessments') === 'true';
    setIsDoingAllAssessments(doingAll);

    if (doingAll) {
      const assessmentTypesStr = localStorage.getItem('assessment_types');
      const currentIndexStr = localStorage.getItem('current_assessment_index');
      if (assessmentTypesStr && currentIndexStr) {
        try {
          setAllAssessmentTypes(JSON.parse(assessmentTypesStr));
          setCurrentAssessmentIndex(parseInt(currentIndexStr, 10));
        } catch (e) {
          console.error("Error parsing multi-assessment state from localStorage", e);
          // Fallback to single assessment mode if localStorage is corrupt
          setIsDoingAllAssessments(false);
          localStorage.removeItem('doing_all_assessments');
          localStorage.removeItem('assessment_types');
          localStorage.removeItem('current_assessment_index');
        }
      } else {
        // If state is missing, disable multi-assessment mode
        setIsDoingAllAssessments(false);
      }
    }

    const storedCompanyInfo = localStorage.getItem('company_info');
    const storedSubcategoryWeights = localStorage.getItem('subcategory_weights'); // Use generic key for now
    const storedLockedCategories = localStorage.getItem('locked_categories');

    if (storedLockedCategories) {
      try {
        setLockedCategories(JSON.parse(storedLockedCategories));
      } catch (error) {
        console.error("Error parsing stored locked categories:", error);
        setLockedCategories({});
      }
    } else {
       setLockedCategories({}); // Ensure it's initialized if not in storage
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
            // Company info and weights exist, go fetch questions
            fetchQuestionnaires(); // This will set loading to false on completion/error
            setStep('questions'); // Tentatively set to questions
          } catch (error) {
            console.error("Error parsing stored weights:", error);
            // Corrupt weights, might need re-adjustment
            setStep('weight-adjustment');
            fetchRecommendedWeights(parsedInfo); // Fetch recommendations again
            setLoading(false); // Stop loading as we are showing weight adjustment
          }
        } else {
          // Company info exists, but no weights - go to weight adjustment
          setStep('weight-adjustment');
          fetchRecommendedWeights(parsedInfo); // Fetch recommendations
          setLoading(false); // Stop loading
        }
      } catch (error) {
        console.error("Error parsing stored company info:", error);
        // Corrupt company info, start from scratch
        setStep('company-info');
        setLoading(false); // Stop loading
      }
    } else {
      // No company info, start from the beginning
      setStep('company-info');
      setLoading(false); // Stop loading
    }
    // setLoading(false) is handled within the branches or by fetchQuestionnaires
  }, [assessmentType]); // Rerun only when assessment type changes

  // Progress Calculation Effect
  useEffect(() => {
    if (!questions || Object.keys(questions).length === 0) {
      setProgress(0);
      return;
    }

    let answeredCount = 0;
    let totalCount = 0;
    
    Object.values(questions).forEach(categoryQuestions => {
      if (Array.isArray(categoryQuestions)) {
          categoryQuestions.forEach(question => {
            totalCount++;
            if (question.answer !== null && question.answer !== undefined) { // Check for null or undefined
              answeredCount++;
            }
          });
      }
    });
    
    const progressPercentage = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;
    setProgress(progressPercentage);
  }, [questions]); // Rerun whenever questions state (answers) changes

  // Authorization Check Effect
  useEffect(() => {
    if (user && user.role !== 'admin') {
      // User exists and is not an admin, check pillar access
      if (!canEditPillar(assessmentType)) {
        toast({
          title: "Access Restricted",
          description: `You don't have permission to access the ${assessmentType} assessment. Redirecting...`,
          variant: "destructive",
        });
        // Redirect to a safe page, maybe the dashboard or selection page
        router.replace("/assessment"); // Use replace to avoid history entry
      }
    }
    // No else needed: if user is null, ProtectedRoute handles it. If user is admin, they have access.
  }, [user, assessmentType, canEditPillar, router, toast]);

  // --- Data Fetching ---

  const fetchQuestionnaires = async () => {
    // Don't fetch if already loaded or currently fetching
    if (Object.keys(questionnaire).length > 0 && !loadingError) {
      console.log("Questionnaire data already seems loaded.");
      setLoading(false); // Ensure loading is false if we skip fetch
      return;
    }

    setLoading(true);
    setLoadingError(null);
    console.log(`Fetching questionnaire for: ${assessmentType}`);

    try {
      const data = await fetchQuestionnaire(assessmentType);
      console.log(`Successfully fetched questionnaire data:`, data);

      if (!data || !data[assessmentType]) {
        throw new Error(`Invalid data structure received: missing "${assessmentType}" key or data is null.`);
      }

      const questionnaireData = data[assessmentType];
      const categoryList = Object.keys(questionnaireData);
      console.log(`Categories found:`, categoryList);

      if (categoryList.length === 0) {
        throw new Error(`No categories found for assessment type "${assessmentType}".`);
      }

      setQuestionnaire(data);

      // Initialize questions state structure
      const initialQuestions: CategoryQuestions = {};
      categoryList.forEach(category => {
        initialQuestions[category] = [];
        const categoryData = questionnaireData[category];
        
        if (Array.isArray(categoryData)) {
          // If categoryData is an array, treat it as direct questions
          categoryData.forEach((q: string) => {
            initialQuestions[category].push({ question: q, answer: null });
          });
        } else if (typeof categoryData === 'object' && categoryData !== null) {
          // If categoryData is an object, it contains subcategories
          Object.values(categoryData).forEach((questionsArray) => {
            if (Array.isArray(questionsArray)) {
              questionsArray.forEach((q: string) => {
                initialQuestions[category].push({ question: q, answer: null });
              });
            }
          });
        }
      });

      console.log("Processed initial questions structure:", initialQuestions);
      setQuestions(initialQuestions);
      setCategories(categoryList);
      setCurrentCategory(categoryList[0]);
      setCategoryIndex(0);

      // Initialize weights if they weren't loaded from storage
      if (Object.keys(subcategoryWeights).length === 0) {
        console.log("Initializing default weights as none were found in storage.");
        const initialSubWeights = initializeDefaultSubcategoryWeights(questionnaireData);
        setSubcategoryWeights(initialSubWeights);
        setWeights(convertSubcategoryToCategory(initialSubWeights));
        localStorage.setItem('subcategory_weights', JSON.stringify(initialSubWeights));
        localStorage.setItem('assessment_weights', JSON.stringify(convertSubcategoryToCategory(initialSubWeights)));
      }

      setStep('questions');
      setLoading(false);

    } catch (error) {
      console.error("Error fetching questionnaire:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while loading questions.";
      setLoadingError(errorMessage);
      toast({
        title: "Error Loading Assessment",
        description: errorMessage + " Please try refreshing the page or contact support.",
        variant: "destructive",
      });
      setLoading(false);
      setQuestions({});
      setCategories([]);
      setCurrentCategory("");
    }
  };

  const fetchRecommendedWeights = async (info: CompanyInfo) => {
    setLoading(true);
    try {
      console.log("Fetching recommended weights based on:", info);
      const predefinedWeights: Weights = {
        "AI Governance": 25, "AI Culture": 15, "AI Infrastructure": 20,
        "AI Strategy": 15, "AI Data": 10, "AI Talent": 10, "AI Security": 5
      };
      console.log("Using predefined weights:", predefinedWeights);

      const questionnaireStructure = await fetchQuestionnaire(assessmentType);
      if (!questionnaireStructure || !questionnaireStructure[assessmentType]) {
        throw new Error("Could not fetch questionnaire structure needed for weight distribution.");
      }
      const assessmentData = questionnaireStructure[assessmentType];
      const actualCategories = Object.keys(assessmentData);

      const recSubWeights: SubcategoryWeights = {};
      let totalAssignedWeight = 0;

      actualCategories.forEach(category => {
        recSubWeights[category] = {};
        const categoryWeight = predefinedWeights[category] ?? (100 / actualCategories.length);
        
        const subcategories = (typeof assessmentData[category] === 'object' && !Array.isArray(assessmentData[category]))
          ? Object.keys(assessmentData[category])
          : [category];
        
        const numSubcategories = subcategories.length;
        if (numSubcategories > 0) {
          const weightPerSub = categoryWeight / numSubcategories;
          subcategories.forEach(subcat => {
            recSubWeights[category][subcat] = parseFloat(weightPerSub.toFixed(1));
          });
        } else {
          recSubWeights[category][category] = categoryWeight;
        }
        totalAssignedWeight += categoryWeight;
      });

      if (Math.abs(totalAssignedWeight - 100) > 0.1) {
        console.warn("Normalizing recommended weights. Initial total:", totalAssignedWeight);
        const factor = 100 / totalAssignedWeight;
        for (const cat in recSubWeights) {
          for (const subcat in recSubWeights[cat]) {
            recSubWeights[cat][subcat] = parseFloat((recSubWeights[cat][subcat] * factor).toFixed(1));
          }
        }
        const normalizedCategoryWeights = convertSubcategoryToCategory(recSubWeights);
        setWeights(normalizedCategoryWeights);
        setRecommendedWeights(normalizedCategoryWeights);
      } else {
        setWeights(convertSubcategoryToCategory(recSubWeights));
        setRecommendedWeights(convertSubcategoryToCategory(recSubWeights));
      }
      
      setRecommendedSubcategoryWeights(recSubWeights);
      setSubcategoryWeights(recSubWeights);
      localStorage.setItem('subcategory_weights', JSON.stringify(recSubWeights));
      localStorage.setItem('assessment_weights', JSON.stringify(convertSubcategoryToCategory(recSubWeights)));
      console.log("Recommended subcategory weights set:", recSubWeights);

      setStep('weight-adjustment');
      setLoading(false);

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error fetching/setting recommended weights:", error);
      toast({
        title: "Weight Recommendation Error",
        description: error.message || "Could not get weight recommendations. Using default equal weights.",
        variant: "destructive",
      });
      try {
        const questionnaireStructure = await fetchQuestionnaire(assessmentType);
        if (questionnaireStructure && questionnaireStructure[assessmentType]) {
          const initialSubWeights = initializeDefaultSubcategoryWeights(questionnaireStructure[assessmentType]);
          setSubcategoryWeights(initialSubWeights);
          setWeights(convertSubcategoryToCategory(initialSubWeights));
          localStorage.setItem('subcategory_weights', JSON.stringify(initialSubWeights));
          localStorage.setItem('assessment_weights', JSON.stringify(convertSubcategoryToCategory(initialSubWeights)));
        } else {
          setWeights({});
          setSubcategoryWeights({});
        }
      } catch (fetchError) {
        console.error("Fallback weight initialization failed:", fetchError);
        setWeights({});
        setSubcategoryWeights({});
      } finally {
        setStep('weight-adjustment');
        setLoading(false);
      }
    }
  };

  // --- Helper Functions ---

  const convertSubcategoryToCategory = (subWeights: SubcategoryWeights): CategoryWeights => {
    const catWeights: CategoryWeights = {};
    for (const category in subWeights) {
      catWeights[category] = Object.values(subWeights[category] || {}).reduce((sum, weight) => sum + (weight || 0), 0);
      catWeights[category] = parseFloat(catWeights[category].toFixed(1));
    }
    return catWeights;
  };

  const initializeDefaultSubcategoryWeights = (data: Record<string, any>): SubcategoryWeights => {
    const categories = Object.keys(data);
    const categoryCount = categories.length;
    if (categoryCount === 0) return {};

    const equalCategoryWeight = 100 / categoryCount;
    const subWeights: SubcategoryWeights = {};

    categories.forEach(category => {
      subWeights[category] = {};
      const categoryData = data[category];
      const subcategories = (typeof categoryData === 'object' && !Array.isArray(categoryData) && categoryData !== null)
        ? Object.keys(categoryData)
        : [category];
      const subcategoryCount = subcategories.length;

      if (subcategoryCount > 0) {
        const equalSubWeight = equalCategoryWeight / subcategoryCount;
        subcategories.forEach(subcat => {
          subWeights[category][subcat] = parseFloat(equalSubWeight.toFixed(1));
        });
      } else {
        subWeights[category][category] = parseFloat(equalCategoryWeight.toFixed(1));
      }
    });

    return subWeights;
  };

  // Update the toast variant type
  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
    });
  };

  // Update the prepareSubcategoryResponses function
  const prepareSubcategoryResponses = (): ResponsesBySubcategory => {
    const responsesBySub: ResponsesBySubcategory = {};
    if (!questionnaire || !questionnaire[assessmentType] || !questions) {
      console.error("Cannot prepare subcategory responses: Missing questionnaire or questions data.");
      return {};
    }

    const assessmentData = questionnaire[assessmentType];

    for (const category in assessmentData) {
      if (!assessmentData.hasOwnProperty(category)) continue;
      if (!responsesBySub[category]) responsesBySub[category] = {};

      const categoryQuestions = questions[category] || [];
      let questionIndexOffset = 0;

      const categoryStructure = assessmentData[category];

      // Handle both array and object structures
      if (Array.isArray(categoryStructure)) {
        // If categoryStructure is an array, treat it as direct questions
        const subcategoryName = category;
        responsesBySub[category][subcategoryName] = categoryQuestions.map(q => ({
          question: q.question,
          answer: q.answer === null || q.answer === undefined ? 0 : q.answer
        }));
      } else if (typeof categoryStructure === 'object' && categoryStructure !== null) {
        // If categoryStructure is an object, it contains subcategories
        Object.entries(categoryStructure).forEach(([subcategory, questionsArray]) => {
          if (Array.isArray(questionsArray)) {
            const numQuestionsInSub = questionsArray.length;
            const endIndex = questionIndexOffset + numQuestionsInSub;
            
            const subResponses = categoryQuestions.slice(questionIndexOffset, endIndex).map(q => ({
              question: q.question,
              answer: q.answer === null || q.answer === undefined ? 0 : q.answer
            }));

            responsesBySub[category][subcategory] = subResponses;
            questionIndexOffset = endIndex;
          }
        });
      }
    }
    return responsesBySub;
  };

  // --- Event Handlers ---

  const handleCompanyInfoSubmit = async (info: CompanyInfo) => {
    setCompanyInfo(info);
    setLoading(true); // Show loading while processing/fetching weights

    try {
      localStorage.setItem('company_info', JSON.stringify(info));
      await fetchRecommendedWeights(info); // Fetch weights and move to next step
      // setLoading(false) and setStep are handled within fetchRecommendedWeights
    } catch (error) {
      console.error("Error processing company info submission:", error);
      toast({
        title: "Error",
        description: "Failed to process company profile. Please try again.",
        variant: "destructive",
      });
      setLoading(false); // Ensure loading stops on error
      setStep('company-info'); // Stay on company info step on error
    }
  };

  const handleWeightsChange = (newWeights: CategoryWeights) => {
     // This might not be directly used if only SubcategoryWeightAdjustment is present
     console.log("Category weights changed (likely derived from subcategory):", newWeights);
     setWeights(newWeights);
     // Note: Persisting should happen in handleSubcategoryWeightsChange or on submit/save
  };

  const handleSubcategoryWeightsChange = (newWeights: SubcategoryWeights) => {
    // Create a copy of the new weights to modify
    const updatedWeights = { ...newWeights };
    
    // Process each category
    Object.keys(updatedWeights).forEach(category => {
      const categoryWeights = updatedWeights[category];
      const subcategories = Object.keys(categoryWeights);
      const lockedSubcategories = subcategories.filter(sub => lockedCategories[`${category}-${sub}`]);
      const unlockedSubcategories = subcategories.filter(sub => !lockedCategories[`${category}-${sub}`]);
      
      // Calculate total weight of locked subcategories
      const lockedTotal = lockedSubcategories.reduce((sum, sub) => sum + (categoryWeights[sub] || 0), 0);
      
      // If there are unlocked subcategories, distribute remaining weight among them
      if (unlockedSubcategories.length > 0) {
        const remainingWeight = 100 - lockedTotal;
        const weightPerUnlocked = remainingWeight / unlockedSubcategories.length;
        
        // Distribute remaining weight equally among unlocked subcategories
        unlockedSubcategories.forEach(sub => {
          categoryWeights[sub] = parseFloat(weightPerUnlocked.toFixed(1));
        });
      }
      
      // Ensure total is exactly 100
      const total = Object.values(categoryWeights).reduce((sum, w) => sum + w, 0);
      if (Math.abs(total - 100) > 0.1) {
        const factor = 100 / total;
        Object.keys(categoryWeights).forEach(sub => {
          categoryWeights[sub] = parseFloat((categoryWeights[sub] * factor).toFixed(1));
        });
      }
    });

    setSubcategoryWeights(updatedWeights);
    const derivedCategoryWeights = convertSubcategoryToCategory(updatedWeights);
    setWeights(derivedCategoryWeights);
    
    // Save changes to localStorage
    localStorage.setItem('subcategory_weights', JSON.stringify(updatedWeights));
    localStorage.setItem('assessment_weights', JSON.stringify(derivedCategoryWeights));
  };

  const handleWeightsSubmit = () => {
    // Save final weights (already saved on change, but this confirms the step)
    localStorage.setItem('subcategory_weights', JSON.stringify(subcategoryWeights));
    localStorage.setItem('assessment_weights', JSON.stringify(weights));
    console.log("Weights adjustment submitted. Fetching questionnaires...");
    fetchQuestionnaires(); // Fetch questions to proceed to the next step
  };

  const handleAnswerChange = (questionIndex: number, value: number) => {
    setQuestions(prev => {
      if (!prev || !prev[currentCategory] || !prev[currentCategory][questionIndex]) {
          console.error("Error updating answer: Invalid state structure for", currentCategory, questionIndex);
          return prev; // Return previous state if structure is invalid
      }
      // Create deep copy to avoid mutation issues
      const updatedQuestions = JSON.parse(JSON.stringify(prev)); 
      updatedQuestions[currentCategory][questionIndex].answer = value;
      return updatedQuestions;
    });
  };

  // Update the handleNext function
  const handleNext = () => {
    const currentQuestions = questions[currentCategory] || [];
    const unanswered = currentQuestions.filter(q => q.answer === null || q.answer === undefined);
    
    if (unanswered.length > 0) {
      showToast(
        "Incomplete Section",
        `Please answer all ${currentQuestions.length} questions in the "${currentCategory}" category before proceeding. (${unanswered.length} remaining)`,
        "destructive"
      );
      return;
    }
    
    if (categoryIndex < categories.length - 1) {
      const nextIndex = categoryIndex + 1;
      setCategoryIndex(nextIndex);
      setCurrentCategory(categories[nextIndex]);
      setActiveTab("questions");
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (categoryIndex > 0) {
      const prevIndex = categoryIndex - 1;
      setCategoryIndex(prevIndex);
      setCurrentCategory(categories[prevIndex]);
      setActiveTab("questions"); // Switch back to questions tab
      window.scrollTo(0, 0); // Scroll to top
    }
  };

  const toggleCategoryLock = (category: string, subcategory: string) => {
    const lockKey = `${category}-${subcategory}`;
    setLockedCategories(prev => {
      const updated = { ...prev, [lockKey]: !prev[lockKey] };
      localStorage.setItem('locked_categories', JSON.stringify(updated));
      
      // Recalculate weights when toggling locks
      const updatedWeights = { ...subcategoryWeights };
      const categoryWeights = updatedWeights[category];
      if (categoryWeights) {
        const subcategories = Object.keys(categoryWeights);
        const lockedSubcategories = subcategories.filter(sub => updated[`${category}-${sub}`]);
        const unlockedSubcategories = subcategories.filter(sub => !updated[`${category}-${sub}`]);
        
        // Calculate total weight of locked subcategories
        const lockedTotal = lockedSubcategories.reduce((sum, sub) => sum + (categoryWeights[sub] || 0), 0);
        
        // Distribute remaining weight among unlocked subcategories
        if (unlockedSubcategories.length > 0) {
          const remainingWeight = 100 - lockedTotal;
          const weightPerUnlocked = remainingWeight / unlockedSubcategories.length;
          
          unlockedSubcategories.forEach(sub => {
            categoryWeights[sub] = parseFloat(weightPerUnlocked.toFixed(1));
          });
        }
        
        // Ensure total is exactly 100
        const total = Object.values(categoryWeights).reduce((sum, w) => sum + w, 0);
        if (Math.abs(total - 100) > 0.1) {
          const factor = 100 / total;
          Object.keys(categoryWeights).forEach(sub => {
            categoryWeights[sub] = parseFloat((categoryWeights[sub] * factor).toFixed(1));
          });
        }
        
        setSubcategoryWeights(updatedWeights);
        const derivedCategoryWeights = convertSubcategoryToCategory(updatedWeights);
        setWeights(derivedCategoryWeights);
        
        // Save updated weights
        localStorage.setItem('subcategory_weights', JSON.stringify(updatedWeights));
        localStorage.setItem('assessment_weights', JSON.stringify(derivedCategoryWeights));
      }
      
      return updated;
    });
  };

  // --- Main Submission Logic (FIXED) ---
  const handleSubmit = async () => {
    try {
      if (!companyInfo || !assessmentType) {
        throw new Error("Missing required information");
      }

      const categoryResponses: CategoryResponse[] = Object.entries(questions).map(([category, responses]) => ({
        category,
        responses: responses.map(q => ({
          question: q.question,
          answer: q.answer || 0
        })),
        weight: weights[category] || 0,
        subcategoryResponses: Object.entries(subcategoryWeights[category] || {}).map(([subcategory, weight]) => ({
          subcategory,
          weight,
          responses: responses.map(q => ({
            question: q.question,
            answer: q.answer || 0
          }))
        }))
      }));

      const payload: AssessmentSubmission = {
        assessmentType,
        companyInfo,
        userId: user?.uid || "",
        categoryResponses,
        finalWeights: weights,
        finalSubcategoryWeights: subcategoryWeights
      };

      console.log("Submitting assessment payload:", JSON.stringify(payload, null, 2));

      const result = await submitAssessment(payload);
      console.log("Assessment submitted successfully. API Result:", result);
      
      try {
        localStorage.setItem(`assessment_result_${assessmentType}`, JSON.stringify(result));
        localStorage.setItem(`subcategory_weights_${assessmentType}`, JSON.stringify(subcategoryWeights));
        console.log("Result and final weights saved to localStorage.");
      } catch (storageError) {
        console.error("Error saving results/weights to localStorage:", storageError);
        toast({
          title: "Storage Warning",
          description: "Could not save assessment results locally. Your results were submitted, but might not be immediately visible if you refresh.",
          variant: "destructive",
        });
      }

      if (isDoingAllAssessments) {
        const nextIndex = currentAssessmentIndex + 1;
        if (nextIndex < allAssessmentTypes.length) {
          console.log(`Multi-assessment: Moving to next assessment: ${allAssessmentTypes[nextIndex]}`);
          localStorage.setItem('current_assessment_index', nextIndex.toString());
          router.replace(`/assessment/${encodeURIComponent(allAssessmentTypes[nextIndex])}`);
        } else {
          console.log("Multi-assessment: All assessments completed. Cleaning up and navigating to dashboard.");
          localStorage.removeItem('doing_all_assessments');
          localStorage.removeItem('current_assessment_index');
          localStorage.removeItem('assessment_types');
          localStorage.removeItem('company_info');
          localStorage.removeItem('subcategory_weights');
          localStorage.removeItem('assessment_weights');
          localStorage.removeItem('locked_categories');
          router.replace('/dashboard');
        }
      } else {
        console.log(`Single assessment completed. Navigating to results page for ${assessmentType}`);
        localStorage.removeItem('company_info');
        localStorage.removeItem('subcategory_weights');
        localStorage.removeItem('assessment_weights');
        localStorage.removeItem('locked_categories');
        router.replace(`/results/${encodeURIComponent(assessmentType)}`);
      }

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit assessment",
        variant: "destructive"
      });
    }
  };

  // --- Conditional Rendering based on Step / Loading / Error ---

  // Loading State (Initial Load)
  if (loading && step !== 'company-info' && step !== 'weight-adjustment') { // Show loading only if not on info/weight steps already
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading Assessment...</p>
          <p className="text-sm text-muted-foreground mt-2">Fetching questions and configuration for {assessmentType}.</p>
        </div>
      </div>
    );
  }

  // Error State (Loading Failed)
  if (loadingError) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-lg text-center bg-destructive/10 border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Error Loading Assessment</CardTitle>
            </CardHeader>
            <CardContent>
                 <p className="mb-4">{loadingError}</p>
                 <p className="text-sm mb-4 text-muted-foreground">Could not load the required data. The server might be temporarily unavailable or there could be a configuration issue.</p>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
                 <Button
                   variant="outline"
                   onClick={() => window.location.reload()} // Simple refresh might work
                 >
                   <ArrowLeft className="mr-2 h-4 w-4"/> Try Again
                 </Button>
                 <Button
                   variant="secondary"
                   onClick={() => router.push("/")} // Go to home/dashboard
                 >
                   Go Home
                 </Button>
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
          <p className="text-center text-muted-foreground mb-6">Please provide some details about the company being assessed.</p>
          {/* Pass initialData if editing */}
          <CompanyInfoForm onSubmit={handleCompanyInfoSubmit} loading={loading} initialData={companyInfo} />
        </div>
      </div>
    );
  }

  // Step: Weight Adjustment
  if (step === 'weight-adjustment') {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-2">Adjust Assessment Weights</h1>
          <p className="text-center text-muted-foreground mb-8">
            {companyInfo?.name ? `Based on ${companyInfo.name}'s profile, we recommend the weights below.` : 'Customize the importance of each category and subcategory.'} Review and adjust as needed.
          </p>
          {/* Ensure SubcategoryWeightAdjustment handles potential empty weights gracefully */}
          <SubcategoryWeightAdjustment
            weights={subcategoryWeights}
            recommendedWeights={recommendedSubcategoryWeights} // Pass recommendations
            onWeightsChange={handleSubcategoryWeightsChange} // Pass handler
            onSubmit={handleWeightsSubmit} // Pass handler for 'Confirm Weights' button
            loading={loading} // Pass loading state if needed inside
            lockedCategories={lockedCategories} // Pass lock state
            onToggleLock={(category, subcategory) => toggleCategoryLock(category, subcategory)} // Pass lock toggle handler
            categories={categories} // Pass actual categories from questionnaire
          />
        </div>
      </div>
    );
  }

  // --- Step: Questions (Main Assessment UI) ---
  // Ensure we have categories and the current category exists before rendering
  if (!categories || categories.length === 0 || !currentCategory || !questions[currentCategory]) {
     // This case should ideally be caught by loading/error states, but acts as a safeguard
     return (
       <div className="container mx-auto px-4 py-12 text-center">
         <p className="text-lg text-muted-foreground">Assessment data is not fully loaded. Please wait or try refreshing.</p>
         <Button onClick={() => window.location.reload()} className="mt-4">Refresh Page</Button>
       </div>
     );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{assessmentType} Assessment</h1>
        {/* Subtitle with scale */}
        <p className="text-muted-foreground mb-4">
          Please rate your agreement with the following statements on a scale of 1 (Strongly Disagree) to 4 (Strongly Agree).
        </p>

        {/* Multi-Assessment Indicator */}
        {isDoingAllAssessments && allAssessmentTypes.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-md p-3 mb-4 flex items-center gap-3 shadow-sm">
            <Info className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Completing All Pillars: Assessment {currentAssessmentIndex + 1} of {allAssessmentTypes.length}</p>
              <p className="text-sm">You are currently assessing: <span className="font-medium">{assessmentType}</span></p>
            </div>
          </div>
        )}
        
        {/* Progress Bar */}
        <div className="mb-2 flex justify-between text-sm font-medium">
          <span>Overall Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2 w-full" />
      </div>
      
      {/* Tabs for Questions / Weights */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="questions">Questions ({categoryIndex + 1}/{categories.length})</TabsTrigger>
          <TabsTrigger value="weights">Category Weights</TabsTrigger>
        </TabsList>
        
        {/* Questions Tab Content */}
        <TabsContent value="questions">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">{currentCategory}</CardTitle>
              <CardDescription>
                Category {categoryIndex + 1} of {categories.length}. Please answer all questions below.
              </CardDescription>
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
                        { value: 1, label: "Strongly Disagree" },
                        { value: 2, label: "Disagree" },
                        { value: 3, label: "Agree" },
                        { value: 4, label: "Strongly Agree" }
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={option.value.toString()} 
                            id={`q-${currentCategory}-${index}-${option.value}`} 
                            aria-label={`${q.question} - ${option.label}`}
                          />
                          <Label htmlFor={`q-${currentCategory}-${index}-${option.value}`} className="cursor-pointer font-normal">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Weights Tab Content */}
        <TabsContent value="weights">
          {/* Use the SubcategoryWeightAdjustment component here for consistency */}
          {/* This provides both category overview and subcategory detail */}
          <SubcategoryWeightAdjustment
             weights={subcategoryWeights}
             onWeightsChange={handleSubcategoryWeightsChange}
             lockedCategories={lockedCategories}
             onToggleLock={(category, subcategory) => toggleCategoryLock(category, subcategory)}
             // Pass categories to ensure it displays correctly
             categories={categories} 
             // No onSubmit needed here, changes save live
             // No recommended weights needed here unless you want comparison view
          />
        </TabsContent>
      </Tabs>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={categoryIndex === 0 || submitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <Button 
          onClick={handleNext}
          disabled={submitting || loadingError !== null}
          className="min-w-[120px] relative"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : categoryIndex < categories.length - 1 ? (
            <>
              Next Category
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Submit Assessment
              <CheckCircle className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}