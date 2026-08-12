/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B0F1E',
          800: '#0E1525',
          700: '#131929',
          600: '#1a2235',
          500: '#243049',
        },
        accent: {
          purple: '#7C3AED',
          'purple-light': '#A78BFA',
          blue: '#3B82F6',
          'blue-light': '#60A5FA',
        },
        status: {
          pending: '#F59E0B',
          submitted: '#3B82F6',
          graded: '#10B981',
          absent: '#EF4444',
          present: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        blob: 'blob 8s ease-in-out infinite alternate',
      },
      keyframes: {
        slideUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        blob: { from: { transform: 'translate(0,0) scale(1)' }, to: { transform: 'translate(30px,20px) scale(1.1)' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
