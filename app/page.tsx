"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button"; // Assuming shadcn button
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Use Card for features
import {
  ArrowRight,
  Shield,
  Users,
  Layers,
  BarChart4,
  Database,
  Brain,
  ShieldCheck,
} from "lucide-react";
// Removed Image import as it's no longer used in the hero

export default function Home() {
  const features = [
    {
      title: "AI Governance",
      description:
        "Evaluate AI policies, accountability structures, and risk management frameworks within your organization.",
      icon: <Shield className="h-6 w-6" />,
    },
    {
      title: "AI Strategy & Vision",
      description:
        "Assess the clarity, alignment, and communication of your organization's AI strategic goals.",
      icon: <BarChart4 className="h-6 w-6" />,
    },
    {
      title: "AI Data Readiness",
      description:
        "Evaluate data management practices, quality assurance, accessibility, and governance for AI applications.",
      icon: <Database className="h-6 w-6" />,
    },
    {
      title: "AI Infrastructure",
      description:
        "Gauge the scalability, flexibility, and security of your technical infrastructure to support AI initiatives.",
      icon: <Layers className="h-6 w-6" />,
    },
    {
      title: "AI Talent & Skills",
      description:
        "Assess your organization's ability to attract, develop, and retain talent with necessary AI expertise.",
      icon: <Brain className="h-6 w-6" />,
    },
    {
      title: "AI Culture & Leadership",
      description:
        "Analyze leadership support, change management processes, and the overall organizational mindset towards AI adoption.",
      icon: <Users className="h-6 w-6" />,
    },
    {
      title: "AI Ethics & Fairness",
      description:
        "Review processes for ensuring ethical considerations, fairness, transparency, and bias mitigation in AI systems.",
      icon: <ShieldCheck className="h-6 w-6" />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* Hero Section - Centered */}
      <section className="container mx-auto px-6 py-24 sm:py-32 lg:py-40 text-center"> {/* Added text-center here */}
        {/* Removed the grid layout, wrapping content in a max-width container for better readability */}
        <div className="mx-auto max-w-3xl"> {/* Adjusted max-width as needed */}
          <div className="space-y-6">
            {/* Subtle pill using border */}
            <span className="inline-block border border-border px-3 py-1 rounded-full text-sm font-medium text-muted-foreground">
              Enterprise-Grade AI Assessment
            </span>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Assess Your AI Readiness
            </h1>

            <p className="text-lg text-muted-foreground">
              Evaluate your organization's preparedness for AI adoption across
              seven key dimensions. Receive actionable insights and personalized
              recommendations to accelerate your transformation.
            </p>

            {/* Ensure button container is centered */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center"> {/* Changed to justify-center */}
              <Link href="/assessment">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Removed the Image container div entirely */}
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-primary">
              Comprehensive Framework
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Seven Dimensions of AI Readiness
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our assessment provides a holistic view of your organization's
              capabilities and potential roadblocks for successful AI
              integration.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="flex flex-col bg-card hover:border-primary/50 transition-colors duration-200">
                <CardHeader>
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Begin Your AI Journey?
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              Start your free assessment today. Gain the clarity needed to
              confidently navigate your AI transformation and unlock new
              opportunities.
            </p>
            <div className="pt-4">
              <Link href="/assessment">
                <Button size="lg">
                  Start Free Assessment <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer Example */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Your Company Name. All rights reserved.
        </div>
      </footer>
    </div>
  );
}