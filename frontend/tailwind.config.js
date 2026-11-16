/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0a0a0f', surface: '#13131a', border: '#1e1e2e' },
        accent: { purple: '#7c3aed', 'purple-light': '#a855f7', pink: '#ec4899' },
        text: { primary: '#f1f5f9', muted: '#64748b' },
        success: '#22c55e', warning: '#f59e0b', danger: '#ef4444'
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
