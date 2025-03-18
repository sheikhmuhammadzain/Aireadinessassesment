"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PremiumHero } from "@/components/premium-hero";
import { PremiumFeaturesSection } from "@/components/premium-features";
import { PremiumBackground } from "@/components/ui/premium-background";

export default function Home() {
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
      
      <section className="py-16 relative bg-gradient-to-b from-transparent to-background/80">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Ready to Assess Your AI Readiness?
            </h2>
            <p className="text-muted-foreground">
              Start your free assessment today and get actionable insights to accelerate your AI transformation journey.
            </p>
            <div className="pt-2">
              <Link href="/assessment">
              <Button 
                className="bg-primary hover:bg-primary/90 transition-all duration-300"
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