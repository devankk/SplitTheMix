/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        console: {
          bg: '#090909',
          card: '#141414',
          surface: '#202020',
          border: '#292929',
          'border-muted': '#1f1f1f',
          accent: '#E32636',
          'accent-hover': '#f03a4b',
          'accent-deep': '#8D1422',
          'accent-dim': 'rgba(227, 38, 54, 0.12)',
          text: '#F4F1ED',
          muted: '#929292',
          subtle: '#5c5c5c',
          unknown: '#3a3a3a',
          success: '#22c55e',
          warning: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'console-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.8)',
        'console-md': '0 4px 12px 0 rgba(0, 0, 0, 0.9)',
        'console-glow': '0 0 20px -3px rgba(227, 38, 54, 0.25)',
      }
    }
  },
  plugins: []
}
