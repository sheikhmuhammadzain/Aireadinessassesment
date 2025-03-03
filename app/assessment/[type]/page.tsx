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
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  question: string;
  answer: number | null;
}

interface CategoryQuestions {
  [category: string]: Question[];
}

export default function AssessmentPage({ params }: { params: { type: string } }) {
  const assessmentType = decodeURIComponent(params.type);
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<Record<string, string[]>>({});
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [questions, setQuestions] = useState<CategoryQuestions>({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await fetch(`http://103.18.20.205:8080/questionnaire/${assessmentType}`);
        if (!response.ok) {
          throw new Error("Failed to fetch questionnaire");
        }
        const data = await response.json();
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

    fetchQuestionnaire();
  }, [assessmentType, toast]);

  useEffect(() => {
    // Calculate overall progress
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
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (categoryIndex > 0) {
      setCategoryIndex(categoryIndex - 1);
      setCurrentCategory(categories[categoryIndex - 1]);
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
        }))
      }));
      
      const payload = {
        assessmentType,
        categoryResponses
      };

      const response = await fetch("http://103.18.20.205:8080/calculate-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit assessment");
      }

      const result = await response.json();

      // Store result in localStorage
      localStorage.setItem(`assessment_result_${assessmentType}`, JSON.stringify(result));

      // Navigate to results page
      router.push(`/results/${encodeURIComponent(assessmentType)}`);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: "Failed to submit the assessment. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

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
        
        <div className="mb-2 flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
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
        
        <CardFooter className="flex justify-between">
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
        </CardFooter>
      </Card>
    </div>
  );
}
