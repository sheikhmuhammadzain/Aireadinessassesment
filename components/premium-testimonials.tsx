"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";

type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
  company?: string;
};

export const PremiumTestimonials = ({
  testimonials,
  autoplay = true,
  autoplayInterval = 5000,
  className,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
  autoplayInterval?: number;
  className?: string;
}) => {
  const [active, setActive] = useState(0);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, autoplayInterval);
      return () => clearInterval(interval);
    }
  }, [autoplay, autoplayInterval]);

  const randomRotateY = () => {
    return Math.floor(Math.random() * 21) - 10;
  };

  return (
    <div className={cn("w-full py-20 bg-background", className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Trusted by thousands of businesses worldwide. Here's what some of our clients have to say about our services.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 max-w-5xl mx-auto">
          <div>
            <div className="relative h-80 w-full">
              <AnimatePresence>
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={testimonial.src}
                    initial={{
                      opacity: 0,
                      scale: 0.9,
                      z: -100,
                      rotate: randomRotateY(),
                    }}
                    animate={{
                      opacity: isActive(index) ? 1 : 0.7,
                      scale: isActive(index) ? 1 : 0.95,
                      z: isActive(index) ? 0 : -100,
                      rotate: isActive(index) ? 0 : randomRotateY(),
                      zIndex: isActive(index)
                        ? 999
                        : testimonials.length + 2 - index,
                      y: isActive(index) ? [0, -80, 0] : 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      z: 100,
                      rotate: randomRotateY(),
                    }}
                    transition={{
                      duration: 0.4,
                      ease: "easeInOut",
                    }}
                    className="absolute inset-0 origin-bottom"
                  >
                    <div className="relative h-full w-full rounded-3xl overflow-hidden border border-border shadow-lg">
                      <div className="h-full w-full relative">
                        <Image
                          src={testimonial.src}
                          alt={testimonial.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 500px"
                          priority
                          className="object-cover object-center"
                          style={{ objectFit: "cover" }}
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex justify-between flex-col py-4">
            <div className="relative">
              <Quote className="absolute -top-6 -left-6 h-12 w-12 text-primary/20" />
              <motion.div
                key={active}
                initial={{
                  y: 20,
                  opacity: 0,
                }}
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                exit={{
                  y: -20,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                }}
              >
                <motion.p className="text-lg md:text-xl text-muted-foreground mb-8">
                  {testimonials[active].quote.split(" ").map((word, index) => (
                    <motion.span
                      key={index}
                      initial={{
                        filter: "blur(10px)",
                        opacity: 0,
                        y: 5,
                      }}
                      animate={{
                        filter: "blur(0px)",
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        duration: 0.2,
                        ease: "easeInOut",
                        delay: 0.02 * index,
                      }}
                      className="inline-block"
                    >
                      {word}&nbsp;
                    </motion.span>
                  ))}
                </motion.p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden border border-border relative">
                    <Image
                      src={testimonials[active].src}
                      alt={testimonials[active].name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {testimonials[active].name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {testimonials[active].designation}
                      {testimonials[active].company && (
                        <span> at {testimonials[active].company}</span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
            <div className="flex gap-4 pt-12 md:pt-0">
              <button
                onClick={handlePrev}
                className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group/button hover:bg-primary/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-foreground group-hover/button:rotate-12 transition-transform duration-300" />
              </button>
              <button
                onClick={handleNext}
                className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group/button hover:bg-primary/10 transition-colors"
              >
                <ArrowRight className="h-5 w-5 text-foreground group-hover/button:-rotate-12 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-12 gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActive(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === active ? "w-8 bg-primary" : "w-2 bg-secondary"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};