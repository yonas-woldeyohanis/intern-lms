/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep Midnight Navy and vibrant Cyan/Indigo palette
        brand: {
          50: '#eef8ff',
          100: '#d9efff',
          200: '#bae0ff',
          300: '#8cceff',
          400: '#54b4ff',
          500: '#2b96fd',
          600: '#0071ce', // Primary brand color
          700: '#005bac',
          800: '#004d8f',
          900: '#064074',
          950: '#04294f'
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee', // Primary accent
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344'
        },
        success: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
        danger: { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
        warning: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
        surface: {
          light: '#f8fafc',
          dark: '#020617' // Super deep slate/midnight
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Barlow Condensed', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      fontSize: {
        'xs':   ['0.8125rem', { lineHeight: '1.25rem' }],
        'sm':   ['0.9375rem', { lineHeight: '1.5rem' }],
        'base': ['1.0625rem', { lineHeight: '1.75rem' }],
        'lg':   ['1.1875rem', { lineHeight: '1.875rem' }],
        'xl':   ['1.3125rem', { lineHeight: '2rem' }],
        '2xl':  ['1.625rem',  { lineHeight: '2rem' }],
        '3xl':  ['2rem',      { lineHeight: '2.375rem' }],
        '4xl':  ['2.5rem',    { lineHeight: '2.75rem' }],
        '5xl':  ['3.25rem',   { lineHeight: '1.1' }],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 40px -4px rgba(0, 0, 0, 0.1)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      }
    }
  },
  plugins: []
};
