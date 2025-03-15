"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PremiumHero } from "@/components/premium-hero";
import { PremiumFeaturesSection } from "@/components/premium-features";
import { PremiumTestimonials } from "@/components/premium-testimonials";
import { PremiumBackground } from "@/components/ui/premium-background";

export default function Home() {
  const testimonials = [
    {
      quote:
        "The AI Readiness Assessment provided us with a comprehensive view of our organization's strengths and weaknesses. The customized recommendations helped us prioritize our AI initiatives and accelerate our digital transformation journey.",
      name: "Jennifer Davis",
      designation: "CTO",
      company: "Enterprise Solutions Inc.",
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "The assessment's focus on AI governance and security was exactly what we needed. It helped us identify critical gaps in our approach and develop a more robust AI strategy.",
      name: "Michael Rodriguez",
      designation: "Head of AI",
      company: "Financial Services Group",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "As a startup, we needed to focus our limited resources effectively. This assessment helped us identify the most impactful AI initiatives to pursue first.",
      name: "Sarah Lin",
      designation: "Founder",
      company: "AI Innovations",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=3388&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "The visualization of our AI readiness across different dimensions was eye-opening. It helped us communicate our AI strategy more effectively to stakeholders.",
      name: "David Patel",
      designation: "Director of Innovation",
      company: "Healthcare Solutions",
      src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      quote:
        "The gap analysis feature was particularly valuable. It helped us understand where to focus our improvement efforts for maximum impact.",
      name: "Lisa Thompson",
      designation: "VP of Technology",
      company: "FutureNet",
      src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=3461&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <PremiumBackground
        gradientBackgroundStart="rgb(10, 10, 30)"
        gradientBackgroundEnd="rgb(0, 20, 50)"
        firstColor="18, 113, 255"
        secondColor="221, 74, 255"
        thirdColor="100, 220, 255"
        fourthColor="200, 50, 50"
        fifthColor="180, 180, 50"
        containerClassName="absolute inset-0 -z-10"
      />
      
      <PremiumHero
        badge={{
          text: "Enterprise-Grade AI Assessment",
          action: {
            text: "Learn more",
            href: "/about",
          },
        }}
        title="AI Readiness"
        rotatingTexts={["Assessment", "Evaluation", "Analysis", "Framework"]}
        description="Evaluate your organization's readiness for AI adoption across seven key dimensions and receive personalized recommendations."
        actions={[
          {
            text: "Start Free Assessment",
            href: "/assessment",
            variant: "default",
          },
          {
            text: "Learn More",
            href: "#features",
            variant: "outline",
          },
        ]}
        image={{
          src: "/hero.png", // Path to your image in the public folder
          alt: "AI Readiness Assessment Dashboard",
        }}
      />
      
      <div id="features">
        <PremiumFeaturesSection />
      </div>
      
      <PremiumTestimonials testimonials={testimonials} />
      
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to Assess Your AI Readiness?
            </h2>
            <p className="text-muted-foreground text-lg">
              Start your free assessment today and get actionable insights to accelerate your AI transformation journey.
            </p>
            <div className="pt-4">
              <Link href="/assessment">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
                >
                  Start Free Assessment <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}