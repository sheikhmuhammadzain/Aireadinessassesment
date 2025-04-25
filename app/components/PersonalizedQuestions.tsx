import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';

// Types
interface PersonalizedOption {
  id: string;
  text: string;
}

interface PersonalizedQuestion {
  text: string;
  options: PersonalizedOption[];
}

interface PersonalizedCategory {
  name: string;
  questions: PersonalizedQuestion[];
}

interface PersonalizedQuestionnaireData {
  pillar: string;
  company: {
    id: string;
    name: string;
    industry: string;
    size: string;
    region: string;
    ai_maturity: string;
  };
  categories: PersonalizedCategory[];
}

interface PersonalizedQuestionsProps {
  personalizedData: PersonalizedQuestionnaireData | null;
  isLoading: boolean;
  selectedOptions: Record<string, Record<string, string>>;
  handleOptionSelect: (category: string, questionIndex: number, optionId: string) => void;
  onSubmit: () => void;
  currentCategory: string;
}

const PersonalizedQuestions: React.FC<PersonalizedQuestionsProps> = ({
  personalizedData,
  isLoading,
  selectedOptions,
  handleOptionSelect,
  onSubmit,
  currentCategory,
}) => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Debug log to see what data we're getting
    console.log('PersonalizedQuestions - data:', personalizedData);
    console.log('PersonalizedQuestions - currentCategory:', currentCategory);
    console.log('PersonalizedQuestions - selectedOptions:', selectedOptions);
    
    // Force rendering if necessary
    if (personalizedData && personalizedData.categories && 
        personalizedData.categories.length > 0 && currentCategory) {
      const cat = personalizedData.categories.find(cat => cat.name === currentCategory);
      if (!cat) {
        console.warn(`Current category "${currentCategory}" not found in personalized data. Available categories:`, 
          personalizedData.categories.map(c => c.name));
      }
    }
  }, [personalizedData, currentCategory, selectedOptions]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading personalized questions...</p>
      </div>
    );
  }

  if (!personalizedData) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">No personalized questions available.</p>
      </div>
    );
  }

  const currentCategoryData = personalizedData.categories.find(
    (cat) => cat.name === currentCategory
  );

  if (!currentCategoryData) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-center mb-4">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
          <p className="text-muted-foreground">Category "{currentCategory}" not found in personalized data.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Available categories:</p>
          <ul className="list-disc pl-6 mt-2">
            {personalizedData.categories.map(cat => (
              <li key={cat.name}>{cat.name}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const areAllQuestionsAnswered = () => {
    if (!currentCategoryData || !selectedOptions[currentCategory]) return false;
    
    for (let i = 0; i < currentCategoryData.questions.length; i++) {
      const questionKey = `question_${i}`;
      if (!selectedOptions[currentCategory][questionKey]) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <span>AI-Personalized Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            These questions have been specially tailored for <span className="font-semibold">{personalizedData.company.name}</span> based on your company profile.
          </p>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">{currentCategory}</CardTitle>
          <CardDescription>
            Answer all questions in this category to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {currentCategoryData.questions.map((question, questionIndex) => (
              <div key={`${currentCategory}-${questionIndex}`} className="border-b pb-6 last:border-b-0 last:pb-0">
                <Label htmlFor={`q-${currentCategory}-${questionIndex}-group`} className="block text-base font-semibold mb-4">
                  {questionIndex + 1}. {question.text}
                </Label>
                <RadioGroup 
                  id={`q-${currentCategory}-${questionIndex}-group`}
                  value={selectedOptions[currentCategory]?.[`question_${questionIndex}`] || ''}
                  onValueChange={(value) => handleOptionSelect(currentCategory, questionIndex, value)}
                  className="space-y-3 pt-2"
                >
                  {question.options.map((option) => (
                    <div key={option.id} className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted transition-colors">
                      <RadioGroupItem 
                        value={option.id} 
                        id={`${currentCategory}-${questionIndex}-${option.id}`} 
                        className="mt-0.5"
                      />
                      <Label 
                        htmlFor={`${currentCategory}-${questionIndex}-${option.id}`}
                        className="cursor-pointer font-normal"
                      >
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {!selectedOptions[currentCategory]?.[`question_${questionIndex}`] && (
                  <div className="mt-2 text-amber-600 dark:text-amber-400 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>Please select an option</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t pt-6">
          <div>
            {!areAllQuestionsAnswered() && (
              <p className="text-sm text-muted-foreground">
                Please answer all questions to continue
              </p>
            )}
          </div>
          <Button 
            onClick={onSubmit} 
            disabled={!areAllQuestionsAnswered()}
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PersonalizedQuestions; 