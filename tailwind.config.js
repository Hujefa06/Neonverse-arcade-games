/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: {
          bg: '#07080F',
          surface: '#0B0E1A',
          card: 'rgba(255, 255, 255, 0.04)',
          cardHover: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(0, 240, 255, 0.2)',
          cyan: '#00F0FF',
          magenta: '#FF2E9A',
          violet: '#7C4DFF',
          lime: '#B6FF3C',
          amber: '#FFB800',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'Space Grotesk', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.4), 0 0 30px rgba(0, 240, 255, 0.2)',
        'neon-cyan-lg': '0 0 25px rgba(0, 240, 255, 0.6), 0 0 50px rgba(0, 240, 255, 0.3)',
        'neon-magenta': '0 0 15px rgba(255, 46, 154, 0.4), 0 0 30px rgba(255, 46, 154, 0.2)',
        'neon-violet': '0 0 15px rgba(124, 77, 255, 0.4), 0 0 30px rgba(124, 77, 255, 0.2)',
        'neon-lime': '0 0 15px rgba(182, 255, 60, 0.4), 0 0 30px rgba(182, 255, 60, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.02)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      backdropBlur: {
        glass: '14px',
      },
    },
  },
  plugins: [],
};
