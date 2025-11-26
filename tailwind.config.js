/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        foreground: '#ffffff',
        muted: '#1f1f1f',
        'muted-foreground': '#888888',
        border: '#262626',
        accent: '#00FFFF',
        'accent-soft': '#00FFFF20',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 255, 0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 255, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 255, 255, 0.4)',
        'float': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'float-lg': '0 12px 48px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
