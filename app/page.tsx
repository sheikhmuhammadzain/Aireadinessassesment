"use client"
import Link from "next/link";
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
  TrendingUp,
  Clock,
  Award,
  ExternalLink
} from "lucide-react";
import { useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Animation components
const GridBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
    <div className="grid grid-cols-[repeat(40,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] h-full w-full opacity-30">
      {Array.from({ length: 800 }).map((_, i) => (
        <div 
          key={i} 
          className={`col-span-1 row-span-1 border-[0.5px] border-primary/20 ${Math.random() > 0.97 ? 'bg-primary/20' : ''}`}
        ></div>
      ))}
    </div>
    <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background"></div>
  </div>
);

const GlowingSphere = () => (
  <div className="absolute top-0 right-0 -z-10 w-96 h-96 rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-3xl opacity-30"></div>
);

const Glow = ({ position }) => (
  <div className={`absolute ${position} -z-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl opacity-40`}></div>
);

export default function Home() {
  const benefitsRef = useRef(null);

  const scrollToBenefits = () => {
    benefitsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Background elements */}
      <GridBackground />
      <GlowingSphere />
      <Glow position="top-1/4 -left-32" />
      <Glow position="bottom-1/4 -right-32" />
      
      {/* Hero Section */}
      <header className="relative border-b border-border/40">
        <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-block mb-4 px-4 py-1 bg-primary/10 rounded-full backdrop-blur-sm">
              <p className="text-primary text-sm font-medium">Enterprise-Grade AI Assessment</p>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground bg-clip-text">
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                AI Readiness Assessment
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Evaluate your organization's readiness for AI adoption across seven key dimensions
              and receive personalized recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/assessment">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 rounded-lg w-full sm:w-auto"
                >
                  Start Free Assessment
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-border/60 backdrop-blur-sm hover:bg-background/50 rounded-lg"
                onClick={scrollToBenefits}
              >
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      </header>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="relative py-24">
        <div className="absolute inset-0 -z-10 bg-muted/70 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-block mb-4 px-4 py-1 bg-primary/10 rounded-full backdrop-blur-sm">
              <p className="text-primary text-sm font-medium">Value Proposition</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Take Our Assessment?
            </h2>
            <p className="text-muted-foreground text-lg">
              Gain valuable insights to accelerate your AI transformation journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl mt-4">Comprehensive Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Assess your organization across seven critical dimensions of AI readiness, with customizable weights based on your company profile.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl mt-4">Actionable Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Receive tailored recommendations and practical next steps to improve your AI readiness score.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl mt-4">Quick & Easy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Complete the assessment in under 30 minutes and get immediate results with visualizations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/assessment">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
              >
                Start Your Assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-block mb-4 px-4 py-1 bg-primary/10 rounded-full backdrop-blur-sm">
              <p className="text-primary text-sm font-medium">Key Features</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comprehensive Assessment Framework
            </h2>
            <p className="text-muted-foreground text-lg">
              Our assessment evaluates your organization across seven critical dimensions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg mt-2">AI Governance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm">
                  Evaluate your organization's AI policies, accountability, and risk management frameworks.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg mt-2">AI Culture</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm">
                  Assess your organization's AI adoption culture, leadership support, and collaborative practices.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg mt-2">AI Infrastructure</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm">
                  Evaluate your technical infrastructure's readiness to support AI initiatives.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <BarChart4 className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg mt-2">AI Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm">
                  Assess your organization's AI strategy, security measures, and deployment approaches.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg mt-2">AI Data</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm">
                  Evaluate your data management practices, quality, and governance for AI readiness.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg mt-2">AI Talent</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm">
                  Assess your organization's AI talent acquisition, training, and development strategies.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-2">
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg mt-2">AI Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm">
                  Assess your organization's AI security measures, privacy controls, and risk mitigation strategies.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/assessment">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
              >
                Start Assessment Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 md:py-32 relative">
        <div className="absolute inset-0 -z-10 bg-muted/50 backdrop-blur-sm"></div>
        <Glow position="bottom-1/3 -left-32" />
        <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16">
          <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
            <div className="inline-block mb-4 px-4 py-1 bg-primary/10 rounded-full backdrop-blur-sm">
              <p className="text-primary text-sm font-medium">Success Stories</p>
            </div>
            <h2 className="text-4xl font-bold lg:text-5xl">Trusted by leading organizations</h2>
            <p className="text-muted-foreground">
              Our AI Readiness Assessment has helped companies of all sizes accelerate their AI transformation journey with actionable insights.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
            <Card className="grid grid-rows-[auto_1fr] gap-8 sm:col-span-2 sm:p-6 lg:row-span-2 bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <div className="p-2 w-fit rounded-md bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                  <p className="text-xl font-medium">
                    "The AI Readiness Assessment provided us with a comprehensive view of our organization's strengths and weaknesses. The customized recommendations helped us prioritize our AI initiatives and accelerate our digital transformation journey."
                  </p>

                  <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>

                    <div>
                      <cite className="text-sm font-medium">Jennifer Davis</cite>
                      <span className="text-muted-foreground block text-sm">CTO, Enterprise Solutions Inc.</span>
                    </div>
                  </div>
                </blockquote>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="h-full pt-6">
                <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                  <p className="text-xl font-medium">
                    "The assessment's focus on AI governance and security was exactly what we needed. It helped us identify critical gaps in our approach and develop a more robust AI strategy."
                  </p>

                  <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarFallback>MR</AvatarFallback>
                    </Avatar>
                    <div>
                      <cite className="text-sm font-medium">Michael Rodriguez</cite>
                      <span className="text-muted-foreground block text-sm">Head of AI, Financial Services Group</span>
                    </div>
                  </div>
                </blockquote>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="h-full pt-6">
                <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                  <p>
                    "As a startup, we needed to focus our limited resources effectively. This assessment helped us identify the most impactful AI initiatives to pursue first."
                  </p>

                  <div className="grid items-center gap-3 [grid-template-columns:auto_1fr]">
                    <Avatar className="size-12">
                      <AvatarFallback>SL</AvatarFallback>
                    </Avatar>
                    <div>
                      <cite className="text-sm font-medium">Sarah Lin</cite>
                      <span className="text-muted-foreground block text-sm">Founder, AI Innovations</span>
                    </div>
                  </div>
                </blockquote>
              </CardContent>
            </Card>
            
            <Card className="bg-card/30 backdrop-blur-sm border border-border/40 hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="h-full pt-6">
                <blockquote className="grid h-full grid-rows-[1fr_auto] gap-6">
                  <p>
                    "The visualization of our AI readiness across different dimensions was eye-opening. It helped us communicate our AI strategy more effectively to stakeholders."
                  </p>

                  <div className="grid grid-cols-[auto_1fr] gap-3">
                    <Avatar className="size-12">
                      <AvatarFallback>DP</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">David Patel</p>
                      <span className="text-muted-foreground block text-sm">Director of Innovation, Healthcare Solutions</span>
                    </div>
                  </div>
                </blockquote>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/assessment">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
              >
                Start Your Assessment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}