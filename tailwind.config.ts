import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        appear: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        first: {
          "0%": { transform: "translateY(0px) scale(1)" },
          "33%": { transform: "translateY(-10px) scale(1.05)" },
          "66%": { transform: "translateY(10px) scale(0.95)" },
          "100%": { transform: "translateY(0px) scale(1)" },
        },
        second: {
          "0%": { transform: "translateY(0px) scale(1)" },
          "33%": { transform: "translateY(-20px) scale(1.1)" },
          "66%": { transform: "translateY(10px) scale(0.9)" },
          "100%": { transform: "translateY(0px) scale(1)" },
        },
        third: {
          "0%": { transform: "translateY(0px) scale(1)" },
          "33%": { transform: "translateY(10px) scale(0.9)" },
          "66%": { transform: "translateY(-20px) scale(1.1)" },
          "100%": { transform: "translateY(0px) scale(1)" },
        },
        fourth: {
          "0%": { transform: "translateY(0px) scale(1)" },
          "33%": { transform: "translateY(-30px) scale(1.15)" },
          "66%": { transform: "translateY(15px) scale(0.85)" },
          "100%": { transform: "translateY(0px) scale(1)" },
        },
        fifth: {
          "0%": { transform: "translateY(0px) scale(1)" },
          "33%": { transform: "translateY(15px) scale(0.85)" },
          "66%": { transform: "translateY(-30px) scale(1.15)" },
          "100%": { transform: "translateY(0px) scale(1)" },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        "appear": "appear 0.6s ease-in-out",
        "first": "first 8s ease-in-out infinite",
        "second": "second 8s ease-in-out infinite",
        "third": "third 8s ease-in-out infinite",
        "fourth": "fourth 8s ease-in-out infinite",
        "fifth": "fifth 8s ease-in-out infinite",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
