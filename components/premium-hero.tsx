"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface FloatingShapeProps {
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  className?: string;
}

function FloatingShape({
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
  className,
}: FloatingShapeProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{
          width,
          height,
        }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

interface TextRotateProps {
  texts: string[];
  interval?: number;
}

function TextRotate({ texts, interval = 3000 }: TextRotateProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [texts, interval]);

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    });
  }, [currentIndex, controls]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={controls}
        exit={{ opacity: 0, y: -20 }}
        className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-blue-500"
      >
        {texts[currentIndex]}
      </motion.span>
    </AnimatePresence>
  );
}

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline";
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  rotatingTexts?: string[];
  actions: HeroAction[];
  image?: {
    src: string;
    alt: string;
  };
}

export function PremiumHero({
  badge,
  title,
  description,
  rotatingTexts = ["beautiful", "premium", "responsive", "modern"],
  actions,
  image,
}: HeroProps) {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-blue-500/[0.05] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <FloatingShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <FloatingShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-blue-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <FloatingShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-indigo-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <FloatingShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-blue-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />
      </div>

      <div className="mx-auto flex max-w-container flex-col gap-12 pt-16 sm:gap-24 z-10 px-4">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {/* Badge */}
          {badge && (
            <Badge variant="outline" className="animate-appear gap-2">
              <span className="text-muted-foreground">{badge.text}</span>
              <Link href={badge.action.href} className="flex items-center gap-1">
                {badge.action.text}
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </Badge>
          )}

          {/* Title */}
          <motion.h1 
            className="relative z-10 inline-block text-4xl font-semibold leading-tight sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 0.86, 0.39, 0.96] }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
              {title} <TextRotate texts={rotatingTexts} />
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            className="text-md relative z-10 max-w-[550px] font-medium text-muted-foreground sm:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 0.86, 0.39, 0.96] }}
          >
            {description}
          </motion.p>

          {/* Actions */}
          <motion.div 
            className="relative z-10 flex justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 0.86, 0.39, 0.96] }}
          >
            {actions.map((action, index) => (
              <Button key={index} variant={action.variant || "default"} size="lg" asChild>
                <Link href='/assessment' className="flex items-center gap-2">
                  {action.icon}
                  {action.text}
                </Link>
              </Button>
            ))}
          </motion.div>

          {/* Image with Glow */}
          {image && (
            <motion.div 
              className="relative py-12 w-full"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.23, 0.86, 0.39, 0.96] }}
            >
              <div className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-border/40 shadow-2xl">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={1248}
                  height={765}
                  priority
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/20 pointer-events-none"></div>
              </div>
              <div className="absolute -inset-10 bg-primary/20 blur-3xl opacity-30 -z-10"></div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 pointer-events-none" />
    </section>
  );
} 