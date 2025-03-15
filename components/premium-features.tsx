"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Shield,
  Clock,
  Globe,
  Users,
  Headphones,
  CreditCard,
  Star,
  Brain,
  Database,
  Layers,
  BarChart4
} from "lucide-react";

export function PremiumFeaturesSection() {
  const features = [
    {
      title: "AI Governance",
      description: "Evaluate your organization's AI policies, accountability, and risk management frameworks.",
      icon: <Shield className="h-6 w-6" />,
    },
    {
      title: "AI Culture",
      description: "Assess your organization's AI adoption culture, leadership support, and collaborative practices.",
      icon: <Users className="h-6 w-6" />,
    },
    {
      title: "AI Infrastructure",
      description: "Evaluate your technical infrastructure's readiness to support AI initiatives.",
      icon: <Layers className="h-6 w-6" />,
    },
    {
      title: "AI Strategy",
      description: "Assess your organization's AI strategy, security measures, and deployment approaches.",
      icon: <BarChart4 className="h-6 w-6" />,
    },
    {
      title: "AI Data",
      description: "Evaluate your data management practices, quality, and governance for AI readiness.",
      icon: <Database className="h-6 w-6" />,
    },
    {
      title: "AI Talent",
      description: "Assess your organization's AI talent acquisition, training, and development strategies.",
      icon: <Brain className="h-6 w-6" />,
    },
    {
      title: "AI Security",
      description: "Assess your organization's AI security measures, privacy controls, and risk mitigation strategies.",
      icon: <Shield className="h-6 w-6" />,
    },
    {
      title: "Premium Features",
      description: "Access to exclusive tools and capabilities for power users.",
      icon: <Star className="h-6 w-6" />,
    },
  ];

  return (
    <div className="w-full py-20 bg-background">
      <div className="container mx-auto">
        <div className="flex flex-col gap-12">
          <motion.div 
            className="flex gap-4 flex-col items-center text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Key Features</Badge>
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter font-bold">
                Comprehensive Assessment Framework
              </h2>
              <p className="text-lg max-w-2xl mx-auto leading-relaxed text-muted-foreground">
                Our assessment evaluates your organization across seven critical dimensions
              </p>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10">
            {features.map((feature, index) => (
              <Feature key={feature.title} {...feature} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "flex flex-col lg:border-r border-border py-10 relative group/feature",
        (index === 0 || index === 4) && "lg:border-l",
        index < 4 && "lg:border-b"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-muted to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-muted to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-primary">
        <motion.div 
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {icon}
        </motion.div>
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-muted-foreground group-hover/feature:bg-primary transition-all duration-200 origin-center" />
        <motion.span 
          className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-foreground"
          whileHover={{ x: 5 }}
        >
          {title}
        </motion.span>
      </div>
      <p className="text-sm text-muted-foreground max-w-xs relative z-10 px-10">
        {description}
      </p>
    </motion.div>
  );
}; 