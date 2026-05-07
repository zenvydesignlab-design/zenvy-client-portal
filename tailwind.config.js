/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#09090b', // Zinc 950
        'night-light': '#18181b', // Zinc 900
        'night-lighter': '#27272a', // Zinc 800
        aqua: '#06b6d4', // Cyan 500
        violet: '#8b5cf6', // Violet 500
        ember: '#f97316', // Orange 500
        slate: {
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
      },
      boxShadow: {
        'premium': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        'premium-hover': '0 0 0 1px rgba(255, 255, 255, 0.12), 0 20px 40px -15px rgba(0, 0, 0, 0.6)',
        'glow': '0 0 20px rgba(6, 182, 212, 0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      letterSpacing: {
        tightest: '-.075em',
        tighter: '-.05em',
      },
    },
  },
  plugins: [],
};
