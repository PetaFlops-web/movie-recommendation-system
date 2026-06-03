import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Custom blue palette
        brand: {
          DEFAULT: '#00A9FF',
          50: '#CDF5FD',
          100: '#A0E9FF',
          200: '#89CFF3',
          300: '#00A9FF',
          400: '#0090DB',
          500: '#0077B6',
          600: '#005F92',
        },
      },
      animation: {
        'spin-slow': 'spin 6s linear infinite',
        'float': 'floatCard 6s ease-in-out infinite alternate',
        'float-reverse': 'floatCard 5s ease-in-out infinite alternate-reverse',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
