import { Metadata } from "next";
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
  Award
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Readiness Assessment",
  description: "Evaluate your organization's readiness for AI adoption",
};

const assessmentTypes = [
  {
    id: "AI Governance",
    title: "AI Governance",
    description: "Evaluate your organization's AI policies, accountability, and risk management frameworks.",
    icon: Shield,
  },
  {
    id: "AI Culture",
    title: "AI Culture",
    description: "Assess your organization's AI adoption culture, leadership support, and collaborative practices.",
    icon: Users,
  },
  {
    id: "AI Infrastructure",
    title: "AI Infrastructure",
    description: "Evaluate your technical infrastructure's readiness to support AI initiatives.",
    icon: Layers,
  },
  {
    id: "AI Strategy",
    title: "AI Strategy",
    description: "Assess your organization's AI strategy, security measures, and deployment approaches.",
    icon: BarChart4,
  },
  {
    id: "AI Data",
    title: "AI Data",
    description: "Evaluate your data management practices, quality, and governance for AI readiness.",
    icon: Database,
  },
  {
    id: "AI Talent",
    title: "AI Talent",
    description: "Assess your organization's AI talent acquisition, training, and development strategies.",
    icon: Brain,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Enhanced with gradient and more professional design */}
      <header className="relative bg-gradient-to-r from-primary/10 via-background to-primary/10 dark:from-primary/5 dark:via-background dark:to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              AI Readiness Assessment
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Evaluate your organization's readiness for AI adoption across six key dimensions
              and receive personalized recommendations.
            </p>
            <div className="pt-4">
              <Button size="lg"  className="font-medium rounded-md px-8">
                Start Assessment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Assessment Types Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Our Assessment Framework</h2>
          <p className="text-muted-foreground text-lg">
            Comprehensive evaluation across six dimensions critical to successful AI implementation
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessmentTypes.map((assessment) => (
            <Card 
              key={assessment.id} 
              className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10">
                    <assessment.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{assessment.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <CardDescription className="text-muted-foreground text-sm min-h-[80px]">
                  {assessment.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="pt-0 pb-4">
                <Link href={`/assessment/${encodeURIComponent(assessment.id)}`} className="w-full">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    <span>Start Assessment</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Take Our Assessment?</h2>
            <p className="text-muted-foreground text-lg">
              Gain valuable insights to accelerate your AI transformation journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-card border border-border p-6 rounded-lg flex items-start gap-4 shadow-sm">
              <div className="p-3 rounded-md bg-primary/10 text-primary">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Comprehensive Evaluation</h3>
                <p className="text-muted-foreground">Get a 360° view of your organization's AI readiness with detailed analysis across all critical dimensions</p>
              </div>
            </div>
            <div className="bg-card border border-border p-6 rounded-lg flex items-start gap-4 shadow-sm">
              <div className="p-3 rounded-md bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Actionable Insights</h3>
                <p className="text-muted-foreground">Receive tailored recommendations prioritized by impact and implementation feasibility</p>
              </div>
            </div>
            <div className="bg-card border border-border p-6 rounded-lg flex items-start gap-4 shadow-sm">
              <div className="p-3 rounded-md bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Time Efficient</h3>
                <p className="text-muted-foreground">Complete the assessment in under 30 minutes and get immediate results with detailed analysis</p>
              </div>
            </div>
            <div className="bg-card border border-border p-6 rounded-lg flex items-start gap-4 shadow-sm">
              <div className="p-3 rounded-md bg-primary/10 text-primary">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Benchmark Comparison</h3>
                <p className="text-muted-foreground">See how your organization compares to industry peers with detailed benchmark analytics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">What Organizations Say</h2>
            <p className="text-muted-foreground text-lg">
              Trusted by leading enterprises across industries
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-6">
                  "The assessment provided us clear direction on where to focus our AI transformation efforts. The insights were invaluable for our strategic planning."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    SC
                  </div>
                  <div>
                    <p className="font-semibold">Sarah Chen</p>
                    <p className="text-sm text-muted-foreground">CTO, Global Finance Corp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-6">
                  "We used the insights to develop a roadmap that aligned our technical capabilities with our strategic AI goals. The framework was comprehensive yet practical."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    MJ
                  </div>
                  <div>
                    <p className="font-semibold">Mark Johnson</p>
                    <p className="text-sm text-muted-foreground">VP of Innovation, HealthTech Solutions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="pt-6">
                <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-6">
                  "The recommendations were practical and immediately actionable, which helped us accelerate our AI adoption journey. We've seen tangible improvements."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    PS
                  </div>
                  <div>
                    <p className="font-semibold">Priya Sharma</p>
                    <p className="text-sm text-muted-foreground">Chief Data Officer, Retail Innovations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/10 via-background to-primary/10 dark:from-primary/5 dark:via-background dark:to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your AI Capabilities?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Start your AI readiness assessment today and receive a detailed report with actionable recommendations tailored to your organization.
          </p>
          <Button size="lg" className="font-medium rounded-md px-8">
            Begin Assessment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted text-foreground py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">AI Readiness</h3>
              <p className="text-muted-foreground">Enterprise-grade assessment for organizations at any stage of AI adoption.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Assessment</h4>
              <ul className="space-y-2">
                {assessmentTypes.map((type) => (
                  <li key={type.id}>
                    <Link href={`/assessment/${encodeURIComponent(type.id)}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {type.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/resources/case-studies" className="text-muted-foreground hover:text-primary transition-colors">Case Studies</Link></li>
                <li><Link href="/resources/white-papers" className="text-muted-foreground hover:text-primary transition-colors">White Papers</Link></li>
                <li><Link href="/resources/ai-glossary" className="text-muted-foreground hover:text-primary transition-colors">AI Glossary</Link></li>
                <li><Link href="/resources/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} AI Readiness Assessment. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
