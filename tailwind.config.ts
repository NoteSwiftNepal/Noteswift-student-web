import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        headline: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        code: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
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
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Full ramps (docs/DESIGN-STANDARDS.md §2.1) — use these for anything
        // that isn't a shadcn semantic slot above (e.g. bg-success-100
        // text-success-700, bg-accent-50, border-neutral-200).
        neutral: {
          0: 'hsl(var(--neutral-0))',
          50: 'hsl(var(--neutral-50))',
          100: 'hsl(var(--neutral-100))',
          200: 'hsl(var(--neutral-200))',
          300: 'hsl(var(--neutral-300))',
          400: 'hsl(var(--neutral-400))',
          500: 'hsl(var(--neutral-500))',
          600: 'hsl(var(--neutral-600))',
          700: 'hsl(var(--neutral-700))',
          800: 'hsl(var(--neutral-800))',
          900: 'hsl(var(--neutral-900))',
          950: 'hsl(var(--neutral-950))',
        },
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          200: 'hsl(var(--brand-200))',
          300: 'hsl(var(--brand-300))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          800: 'hsl(var(--brand-800))',
          900: 'hsl(var(--brand-900))',
        },
        gold: {
          50: 'hsl(var(--accent-50))',
          100: 'hsl(var(--accent-100))',
          200: 'hsl(var(--accent-200))',
          300: 'hsl(var(--accent-300))',
          400: 'hsl(var(--accent-400))',
          500: 'hsl(var(--accent-500))',
          600: 'hsl(var(--accent-600))',
          // 700 deliberately aliases the same var as 500: --accent-500 is the
          // stop the .dark block actually lifts for contrast (§2.1), so a
          // status-badge text color built on a *different*, dark-unaware 700
          // stop would go muddy the moment dark mode is toggled — matches
          // the same alias used for success/warning/danger below.
          700: 'hsl(var(--accent-500))',
        },
        success: {
          100: 'hsl(var(--success-100))',
          500: 'hsl(var(--success-500))',
          700: 'hsl(var(--success-500))',
        },
        warning: {
          100: 'hsl(var(--warning-100))',
          500: 'hsl(var(--warning-500))',
          700: 'hsl(var(--warning-500))',
        },
        danger: {
          100: 'hsl(var(--danger-100))',
          500: 'hsl(var(--danger-500))',
          700: 'hsl(var(--danger-500))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          raised: 'hsl(var(--surface-raised))',
          sunken: 'hsl(var(--surface-sunken))',
          overlay: 'hsl(var(--surface-overlay))',
        },
      },
      fontSize: {
        display: ['2.75rem', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }],
        h1: ['2rem', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.01em' }],
        h2: ['1.5rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        h3: ['1.1875rem', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
        title: ['1rem', { lineHeight: '1.45', fontWeight: '600' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.6' }],
        body: ['0.9375rem', { lineHeight: '1.55' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '500' }],
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.01em' }],
        eyebrow: ['0.6875rem', { lineHeight: '1.3', fontWeight: '700', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        xs: '0.375rem',
        sm: '0.5rem',
        md: 'var(--radius)',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        1: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 1px 0 rgb(15 23 42 / 0.03)',
        2: '0 4px 10px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        3: '0 12px 24px -6px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.06)',
        4: '0 24px 48px -12px rgb(15 23 42 / 0.18), 0 8px 16px -8px rgb(15 23 42 / 0.08)',
        glass: '0 8px 32px -8px rgb(15 23 42 / 0.12), inset 0 1px 0 0 rgb(255 255 255 / 0.4)',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '160ms',
        base: '220ms',
        slow: '360ms',
        celebratory: '700ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)',
        accelerate: 'cubic-bezier(0.7, 0, 0.84, 0)',
        celebratory: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
