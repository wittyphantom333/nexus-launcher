/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/src/**/*.{js,jsx,ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#080C18',
          surface: '#0E1525',
          card: '#131C30',
          'card-hover': '#1a2540',
          border: 'rgba(0,212,255,0.12)',
          'border-bright': 'rgba(0,212,255,0.35)',
          primary: '#00D4FF',
          'primary-dark': '#0099CC',
          secondary: '#7C3AED',
          accent: '#22D3EE',
          gold: '#F59E0B',
          'text-primary': '#E2E8F0',
          'text-secondary': '#94A3B8',
          'text-muted': '#4B5563',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Rajdhani', 'Inter', 'sans-serif']
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'nexus-gradient':
          'linear-gradient(135deg, #080C18 0%, #0E1525 50%, #0A1020 100%)',
        'glow-primary':
          'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
        'glow-secondary':
          'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)'
      },
      boxShadow: {
        'nexus-sm': '0 0 10px rgba(0,212,255,0.15)',
        'nexus-md': '0 0 20px rgba(0,212,255,0.2)',
        'nexus-lg': '0 0 40px rgba(0,212,255,0.25)',
        'nexus-glow': '0 0 30px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.1)',
        'card': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,212,255,0.2), 0 0 10px rgba(0,212,255,0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0,212,255,0.6), 0 0 40px rgba(0,212,255,0.3)' }
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      },
      backdropBlur: {
        xs: '2px'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem'
      }
    }
  },
  plugins: []
}
