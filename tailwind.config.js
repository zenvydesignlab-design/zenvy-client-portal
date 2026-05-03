/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0d0f14',
        aqua: '#67e8f9',
        violet: '#9b87f5',
        ember: '#ff6b35',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(103, 232, 249, 0.18)',
        violet: '0 0 44px rgba(155, 135, 245, 0.18)',
      },
      backgroundImage: {
        'premium-grid':
          'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
