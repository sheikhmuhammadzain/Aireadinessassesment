import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, HelpCircle, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "About - AI Readiness Assessment",
  description: "Learn about the AI Readiness Assessment methodology and framework",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">About the AI Readiness Assessment</h1>
        <p className="text-muted-foreground">
          Understanding the methodology and framework behind our assessment tool
        </p>
      </div>
      
      <Tabs defaultValue="methodology" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
          <TabsTrigger value="dimensions">Assessment Dimensions</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="methodology" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Methodology</CardTitle>
              <CardDescription>
                How we evaluate your organization's AI readiness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Comprehensive Framework</h3>
                <p className="text-muted-foreground">
                  Our AI Readiness Assessment is based on a comprehensive framework that evaluates six key dimensions 
                  of organizational readiness for AI adoption. Each dimension contains multiple categories with 
                  specific questions designed to assess your current capabilities.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Scoring System</h3>
                <p className="text-muted-foreground">
                  Responses are collected on a 4-point scale (Strongly Disagree to Strongly Agree) and converted to 
                  percentage scores. We use advanced algorithms including reinforcement learning techniques to weight 
                  different categories based on their importance and interdependencies.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Personalized Recommendations</h3>
                <p className="text-muted-foreground">
                  Based on your assessment results, we provide tailored recommendations to help improve your 
                  organization's AI readiness. These recommendations are prioritized based on your scores and the 
                  relative importance of each area.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Continuous Improvement</h3>
                <p className="text-muted-foreground">
                  The assessment is designed to be taken periodically to track your organization's progress over time. 
                  By comparing results across multiple assessments, you can measure the effectiveness of your 
                  improvement initiatives.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dimensions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Dimensions</CardTitle>
              <CardDescription>
                The six key dimensions of AI readiness
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">AI Governance</h3>
                <p className="text-muted-foreground">
                  Evaluates your organization's policies, accountability structures, and risk management frameworks 
                  for AI. This includes ethical guidelines, regulatory compliance, bias mitigation, transparency, 
                  and explainability.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">AI Culture</h3>
                <p className="text-muted-foreground">
                  Assesses your organization's cultural readiness for AI adoption, including leadership vision, 
                  experimentation and innovation practices, cross-functional collaboration, and change management 
                  approaches.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">AI Infrastructure</h3>
                <p className="text-muted-foreground">
                  Evaluates your technical infrastructure's readiness to support AI initiatives, including compute 
                  resources, storage and data access, deployment efficiency, performance optimization, and MLOps 
                  capabilities.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">AI Strategy</h3>
                <p className="text-muted-foreground">
                  Assesses your organization's strategic approach to AI, including data security, model access 
                  control, API security, deployment strategy, and monitoring practices.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">AI Data</h3>
                <p className="text-muted-foreground">
                  Evaluates your data management practices, including accessibility and cataloging, governance and 
                  compliance, quality and processing, bias and fairness considerations, and data infrastructure.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">AI Talent</h3>
                <p className="text-muted-foreground">
                  Assesses your organization's AI talent acquisition, training, and development strategies, including 
                  cross-functional collaboration, leadership capabilities, and engineering practices.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Common questions about the AI Readiness Assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">How long does it take to complete an assessment?</h3>
                    <p className="text-muted-foreground">
                      Each assessment dimension takes approximately 10-15 minutes to complete. You can complete 
                      dimensions individually at your own pace.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Who should complete the assessment?</h3>
                    <p className="text-muted-foreground">
                      Ideally, the assessment should be completed by a cross-functional team including IT leaders, 
                      data scientists, business stakeholders, and executives to get a comprehensive view of your 
                      organization's readiness.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">How often should we take the assessment?</h3>
                    <p className="text-muted-foreground">
                      We recommend taking the assessment every 6-12 months to track progress and adjust your 
                      improvement initiatives accordingly.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">How are the scores calculated?</h3>
                    <p className="text-muted-foreground">
                      Scores are calculated using a combination of average responses and weighted importance factors. 
                      We use reinforcement learning techniques to determine optimal weightings for different categories.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Is my assessment data private?</h3>
                    <p className="text-muted-foreground">
                      Yes, all assessment data is stored locally in your browser and is not transmitted to any servers. 
                      You can download your results as a PDF report for sharing within your organization.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">How can I get more detailed insights?</h3>
                    <p className="text-muted-foreground">
                      For more detailed insights and customized recommendations, consider engaging with AI readiness 
                      consultants who can provide in-depth analysis and implementation support.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
        <div className="flex gap-4 items-start">
          <Info className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold mb-2">Why AI Readiness Matters</h2>
            <p className="text-muted-foreground mb-4">
              Organizations that proactively assess and improve their AI readiness are better positioned to:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Successfully implement AI initiatives with higher ROI</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Reduce risks associated with AI adoption</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Build sustainable AI capabilities across the organization</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Ensure ethical and responsible AI development and deployment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Gain competitive advantage through AI-driven innovation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}