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
  CheckCircle,
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

// Define primary blue color for consistency (Tailwind class)
// You can adjust this shade (e.g., 'blue-600', 'blue-700')
const primaryBlue = "blue-600";
const primaryBlueHover = "blue-700"; // Slightly darker for hover
const primaryBlueText = `text-${primaryBlue}`;
const primaryBlueBg = `bg-${primaryBlue}`;
const primaryBlueBorder = `border-${primaryBlue}`;
const primaryBlueRing = `ring-${primaryBlue}`;

// Helper function to construct Tailwind classes
const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function Home() {
  const features = [
    {
      title: "AI Governance",
      description: "Establish robust policies, accountability, and risk management for responsible AI.",
      icon: <Shield className={cn("h-6 w-6", primaryBlueText)} />,
    },
    {
      title: "AI Strategy",
      description: "Align AI initiatives with business goals for measurable impact and growth.",
      icon: <BarChart4 className={cn("h-6 w-6", primaryBlueText)} />,
    },
    {
      title: "AI Data",
      description: "Ensure high-quality, accessible, and governed data pipelines for AI success.",
      icon: <Database className={cn("h-6 w-6", primaryBlueText)} />,
    },
    {
      title: "AI Infrastructure",
      description: "Build scalable, secure, and flexible cloud or on-premise AI foundations.",
      icon: <Layers className={cn("h-6 w-6", primaryBlueText)} />,
    },
    {
      title: "AI Talent",
      description: "Cultivate in-house expertise and attract specialized AI talent.",
      icon: <Brain className={cn("h-6 w-6", primaryBlueText)} />,
    },
    {
      title: "AI Culture",
      description: "Foster an AI-driven mindset with strong leadership and change management.",
      icon: <Users className={cn("h-6 w-6", primaryBlueText)} />,
    },
    {
      title: "AI Security",
      description: "Ensure secure and ethical AI systems that protect data and uphold fairness.",
      icon: <ShieldCheck className={cn("h-6 w-6", primaryBlueText)} />,
    },
  ];

  return (
    // Apply a subtle light background, maybe with a very faint blue tint or pattern
    // NOTE: You'll need to define the `dot-background` style in your global CSS if you keep it.
    // Example: `body { background-color: #f8fafc; background-image: radial-gradient(#cbd5e1 1px, transparent 0); background-size: 20px 20px; }`
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 overflow-x-hidden"> {/* Light background */}

      {/* --- Hero Section --- */}
      <motion.section
        // Use a subtle blue gradient overlay or keep it cleaner
        className="relative isolate pt-32 pb-24 sm:pt-36 sm:pb-32 lg:pt-40 lg:pb-48 bg-gradient-to-b from-white via-blue-50/60 to-slate-50" // Subtle blue gradient background
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Background abstract shapes with blue tints */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div
            className={cn(
              "relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem]",
              "-translate-x-1/2 rotate-[30deg]",
              "bg-gradient-to-tr from-blue-300/30 via-blue-100/30 to-sky-300/30", // Adjusted blue gradient
              "opacity-50 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            )}
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div variants={fadeIn} className="max-w-4xl mx-auto">
             {/* Pill Badge with blue theme */}
             <motion.div variants={fadeIn} className="mb-6">
               <span className={cn(
                 "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium",
                 "bg-blue-100/60", // Lighter blue bg
                 primaryBlueText,
                 `ring-1 ring-inset ring-${primaryBlue}/20`
               )}>
                  AI Readiness Platform
               </span>
             </motion.div>

            <motion.h1
              variants={fadeIn}
              // Premium feel with strong contrast
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl leading-tight"
            >
              Unlock Your Organization's AI Potential
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="mt-6 text-lg lg:text-xl leading-8 text-slate-600 max-w-3xl mx-auto" // Adjusted text color for better contrast
            >
              Gain strategic clarity with our comprehensive AI readiness assessment. Identify strengths, pinpoint gaps, and receive a tailored roadmap for successful AI adoption.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {/* Primary Button with Blue Theme */}
              <Button asChild size="lg" className={cn(
                primaryBlueBg,
                `hover:${primaryBlueHover}`,
                'text-white', // Ensure text is white
                'shadow-md hover:shadow-lg transition-all duration-300 w-full sm:w-auto'
              )}>
                <Link href="/assessment">
                  Start Your Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {/* Outline Button with Blue Theme */}
              <Button asChild variant="outline" size="lg" className={cn(
                `border-${primaryBlue}/70`, // Blue border
                primaryBlueText,
                `hover:bg-blue-50/70`, // Light blue background on hover
                'w-full sm:w-auto transition-colors duration-300'
                )}>
                <Link href="#features">
                  Explore Dimensions
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Optional: Another background element with blue tints */}
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-35rem)]" aria-hidden="true">
           <div
            className={cn(
              "relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem]",
              "-translate-x-1/2",
               "bg-gradient-to-tr from-sky-300/30 via-blue-100/20 to-indigo-300/20", // Adjusted blue gradient
              "opacity-40 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            )}
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </motion.section>

      {/* --- Features Section --- */}
      <section id="features" className="py-24 sm:py-32 bg-white"> {/* Clean white background */}
        <div className="container mx-auto px-6">
          <motion.div
            className="mx-auto max-w-3xl text-center mb-16 lg:mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeIn}
          >
            <h2 className={cn("text-base font-semibold leading-7", primaryBlueText)}>Assessment Framework</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Holistic View Across 7 Key Dimensions
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Our methodology provides deep insights into every critical aspect of AI readiness, ensuring a well-rounded transformation strategy.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeIn}>
                 {/* Premium Card Styling */}
                <Card className={cn(
                    "h-full flex flex-col bg-white border border-slate-200/80",
                    "hover:border-blue-300/80 hover:shadow-lg", // Enhanced hover effect
                    "transition-all duration-300 ease-in-out group"
                 )}>
                   <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
                     {/* Icon Background */}
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                      "bg-blue-50/70 border border-blue-100/90", // Light blue bg & border
                      "group-hover:bg-blue-100/80 group-hover:border-blue-200", // Hover effect for icon bg
                      "transition-colors"
                      )}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-800 leading-tight pt-1">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow pt-0">
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

       {/* --- Benefits/How it Works Section --- */}
      <section className="py-24 sm:py-32 bg-slate-50"> {/* Slightly off-white background */}
        <div className="container mx-auto px-6">
          <motion.div
            className="mx-auto max-w-3xl text-center mb-16 lg:mb-20"
             initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeIn}
          >
            <h2 className={cn("text-base font-semibold leading-7", primaryBlueText)}>Your Strategic Advantage</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              From Assessment to Actionable Insights
            </p>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Understand precisely where you stand and receive clear, prioritized recommendations to accelerate your AI journey and achieve business outcomes.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12" // Increased gap
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer}
           >
             {/* Benefit Items with Blue Check */}
            <motion.div variants={fadeIn} className="flex items-start space-x-4">
              <CheckCircle className={cn("h-6 w-6 mt-0.5 flex-shrink-0", primaryBlueText)} />
              <div>
                <h3 className="font-semibold text-slate-800">Benchmark Performance</h3>
                <p className="mt-1 text-slate-600">Compare your readiness against industry standards and best practices.</p>
              </div>
            </motion.div>
             <motion.div variants={fadeIn} className="flex items-start space-x-4">
              <CheckCircle className={cn("h-6 w-6 mt-0.5 flex-shrink-0", primaryBlueText)} />
              <div>
                <h3 className="font-semibold text-slate-800">Identify Roadblocks</h3>
                <p className="mt-1 text-slate-600">Proactively uncover potential challenges in data, talent, or infrastructure.</p>
              </div>
            </motion.div>
             <motion.div variants={fadeIn} className="flex items-start space-x-4">
              <CheckCircle className={cn("h-6 w-6 mt-0.5 flex-shrink-0", primaryBlueText)} />
              <div>
                <h3 className="font-semibold text-slate-800">Prioritize Initiatives</h3>
                <p className="mt-1 text-slate-600">Focus resources effectively with a clear, data-driven action plan.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-white to-blue-50/60"> {/* Subtle gradient into CTA */}
        <div className="container mx-auto px-6">
          <motion.div
            className="mx-auto max-w-3xl text-center space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeIn}
          >
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Ready to Lead with AI?
            </h2>
            <p className="text-lg lg:text-xl leading-8 text-slate-600">
              Take the first step towards a data-driven future. Start your complimentary AI readiness assessment today and unlock strategic insights in minutes.
            </p>
            <div className="pt-6">
              <Button asChild size="lg" className={cn(
                primaryBlueBg,
                `hover:${primaryBlueHover}`,
                'text-white',
                'shadow-md hover:shadow-lg transition-all duration-300'
              )}>
                <Link href="/assessment">
                   Start Free Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 border-t border-slate-200/80 bg-slate-50"> {/* Match light bg */}
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Your Enterprise Name, Inc. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center space-x-6">
             <Link href="/privacy" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Privacy Policy</Link>
             <Link href="/terms" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}