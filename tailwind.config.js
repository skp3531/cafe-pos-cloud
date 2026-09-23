/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode toggling
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#2563EB',
          accent: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
        },
        ui: {
          bg: 'var(--bg)',
          card: 'var(--card)',
          text: 'var(--text)',
          muted: 'var(--muted)',
          border: 'var(--border)',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'float': '0 10px 30px -5px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
