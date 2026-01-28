import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'slot-gold': '#FFD700',
        'slot-red': '#DC143C',
        'slot-green': '#228B22',
        'slot-blue': '#1E90FF',
        'slot-purple': '#8B5CF6',
        'slot-orange': '#FF8C00',
        'slot-bg': '#1a1a2e',
        'slot-card': '#16213e',
        'slot-accent': '#0f3460',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slot': 'spin-slot 0.1s linear infinite',
        'slot-stop': 'slot-stop 0.3s ease-out forwards',
        'bounce-in': 'bounce-in 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'spin-slot': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        'slot-stop': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '50%': { transform: 'translateY(5px)' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
