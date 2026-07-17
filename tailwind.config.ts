import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/client/**/*.{js,ts,jsx,tsx}',
    './src/client/app/**/*.{js,ts,jsx,tsx}',
    './src/client/pages/**/*.{js,ts,jsx,tsx}',
    './src/client/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bae6ff',
          300: '#7dd3ff',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d66',
        },
        horizon: {
          dark: '#0f172a',
          light: '#f8fafc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;
