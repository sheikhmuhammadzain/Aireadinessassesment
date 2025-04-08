"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Users,
  Layers,
  BarChart4,
  Database,
  Brain,
  ShieldCheck,
  CheckCircle, // Example for benefits
} from "lucide-react";
import { motion } from "framer-motion";

// --- Animation Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export default function Home() {
  const features = [
    {
      title: "AI Governance",
      description: "Establish robust policies, accountability, and risk management for responsible AI.",
      icon: <Shield className="h-6 w-6 text-primary" />, // Pass color directly
    },
    {
      title: "AI Strategy & Vision",
      description: "Align AI initiatives with business goals for measurable impact and growth.",
      icon: <BarChart4 className="h-6 w-6 text-primary" />,
    },
    {
      title: "AI Data Readiness",
      description: "Ensure high-quality, accessible, and governed data pipelines for AI success.",
      icon: <Database className="h-6 w-6 text-primary" />,
    },
    {
      title: "AI Infrastructure",
      description: "Build scalable, secure, and flexible cloud or on-premise AI foundations.",
      icon: <Layers className="h-6 w-6 text-primary" />,
    },
    {
      title: "AI Talent & Skills",
      description: "Cultivate in-house expertise and attract specialized AI talent.",
      icon: <Brain className="h-6 w-6 text-primary" />,
    },
    {
      title: "AI Culture & Leadership",
      description: "Foster an AI-driven mindset with strong leadership and change management.",
      icon: <Users className="h-6 w-6 text-primary" />,
    },
    {
      title: "AI Ethics & Fairness",
      description: "Implement processes for transparent, fair, and ethical AI systems.",
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    },
  ];

  // Placeholder for "Trusted By" logos
  const trustedLogos = [
    { name: "Placeholder Corp", logo: "/placeholder-logo-1.svg" }, // Replace with actual paths
    { name: "Innovate Inc", logo: "/placeholder-logo-2.svg" },
    { name: "Enterprise Solutions", logo: "/placeholder-logo-3.svg" },
    { name: "Global Tech", logo: "/placeholder-logo-4.svg" },
    { name: "Data Systems", logo: "/placeholder-logo-5.svg" },
  ];

  return (
    // Apply subtle background pattern to the whole page body or a main wrapper
    <div className="min-h-screen w-full bg-background text-foreground overflow-x-hidden dot-background"> {/* Apply dot-background */}

      {/* --- Hero Section --- */}
      <motion.section
        className="relative isolate pt-32 pb-24 sm:pt-40 sm:pb-32 lg:pt-48 lg:pb-40 gradient-overlay" // Apply gradient overlay
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Optional: Subtle background shapes/glows */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/20 via-primary/10 to-secondary/10 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10"> {/* Ensure content is above gradient */}
          <motion.div variants={fadeIn} className="max-w-4xl mx-auto"> {/* Increased max-width */}
            {/* Optional Pill Badge */}
             <motion.div variants={fadeIn} className="mb-6">
               <span className="inline-flex items-center rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
                  AI Readiness Platform
               </span>
             </motion.div>

            <motion.h1
              variants={fadeIn}
              // More sophisticated gradient or just solid color
              className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-tight"
              // Example subtle gradient:
              // className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-tight text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-700 dark:from-white dark:to-gray-300"
            >
              Unlock Your Organization's AI Potential
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="mt-6 text-lg lg:text-xl leading-8 text-muted-foreground max-w-2xl mx-auto"
            >
              Gain strategic clarity with our comprehensive AI readiness assessment. Identify strengths, pinpoint gaps, and receive a tailored roadmap for successful AI adoption.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button asChild size="lg" className="shadow-sm hover:shadow-md transition-shadow duration-300 w-full sm:w-auto">
                <Link href="/assessment">
                  Start Your Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="#features">
                  Explore Dimensions
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Optional: Another background element */}
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-secondary/20 via-secondary/5 to-primary/5 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </motion.section>

      {/* --- Trusted By Section --- */}
       <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-base font-semibold text-muted-foreground tracking-wider uppercase">
            Trusted by forward-thinking organizations
          </h2>
          <motion.div
             className="mt-10 grid grid-cols-2 gap-y-8 gap-x-6 sm:grid-cols-3 lg:grid-cols-5 justify-items-center items-center"
             initial="hidden"
             whileInView="visible"
             viewport={{ once: true, amount: 0.2 }}
             variants={staggerContainer}
           >
            {trustedLogos.map((item) => (
              <motion.div key={item.name} variants={fadeIn} className="opacity-60 hover:opacity-100 transition-opacity">
                {/* Replace with actual img tags or SVG components */}
                 <span className="text-sm text-muted-foreground">{item.name}</span> {/* Placeholder text */}
                {/* <img className="h-8 lg:h-10 w-auto" src={item.logo} alt={item.name} /> */}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="features" className="py-24 sm:py-32 bg-muted/40"> {/* Slightly different bg */}
        <div className="container mx-auto px-6">
          <motion.div
            className="mx-auto max-w-3xl text-center mb-16 lg:mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            <h2 className="text-base font-semibold leading-7 text-primary">Assessment Framework</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Holistic View Across 7 Key Dimensions
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Our methodology provides deep insights into every critical aspect of AI readiness, ensuring a well-rounded transformation strategy.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }} // Trigger slightly earlier for grid
            variants={staggerContainer}
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeIn}>
                 {/* Use Card component with refined styling */}
                <Card className="h-full flex flex-col bg-card border border-border/50 hover:border-border hover:shadow-sm transition-all duration-300 ease-in-out group"> {/* Subtle hover */}
                   <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4"> {/* Adjust layout */}
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center border border-primary/10 group-hover:border-primary/20 transition-colors">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg font-semibold leading-tight pt-1">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow pt-0">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

       {/* --- Example: Benefits/How it Works Section --- */}
      <section className="py-24 sm:py-32 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            className="mx-auto max-w-3xl text-center mb-16 lg:mb-20"
             initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeIn}
          >
            <h2 className="text-base font-semibold leading-7 text-primary">Your Strategic Advantage</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              From Assessment to Actionable Insights
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Understand precisely where you stand and receive clear, prioritized recommendations to accelerate your AI journey and achieve business outcomes.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer}
           >
             {/* Example Benefit Cards */}
            <motion.div variants={fadeIn} className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Benchmark Performance</h3>
                <p className="mt-1 text-muted-foreground">Compare your readiness against industry standards and best practices.</p>
              </div>
            </motion.div>
             <motion.div variants={fadeIn} className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Identify Roadblocks</h3>
                <p className="mt-1 text-muted-foreground">Proactively uncover potential challenges in data, talent, or infrastructure.</p>
              </div>
            </motion.div>
             <motion.div variants={fadeIn} className="flex items-start space-x-4">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Prioritize Initiatives</h3>
                <p className="mt-1 text-muted-foreground">Focus resources effectively with a clear, data-driven action plan.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-24 sm:py-32 bg-muted/40">
        <div className="container mx-auto px-6">
          <motion.div
            className="mx-auto max-w-3xl text-center space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Ready to Lead with AI?
            </h2>
            <p className="text-lg lg:text-xl leading-8 text-muted-foreground">
              Take the first step towards a data-driven future. Start your complimentary AI readiness assessment today and unlock strategic insights in minutes.
            </p>
            <div className="pt-6">
              <Button asChild size="lg" className="shadow-sm hover:shadow-md transition-shadow duration-300">
                <Link href="/assessment">
                   Start Free Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 border-t border-border/50 bg-background">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Your Enterprise Name, Inc. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center space-x-6">
             <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
             <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}