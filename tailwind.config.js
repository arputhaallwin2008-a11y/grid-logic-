/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        logic: {
          bg: '#0a0d14',
          canvas: '#0e131f',
          panel: '#131926',
          panelBorder: '#1e293b',
          high: '#10b981',      // Emerald glow for logic 1
          highGlow: 'rgba(16, 185, 129, 0.4)',
          low: '#475569',       // Slate for logic 0
          active: '#38bdf8',     // Sky blue for selected/hover
          clock: '#f59e0b',      // Amber for clock signals
          bus: '#a855f7',        // Purple for multi-bit / special
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'logic-high': '0 0 12px rgba(16, 185, 129, 0.6), 0 0 24px rgba(16, 185, 129, 0.2)',
        'logic-clock': '0 0 12px rgba(245, 158, 11, 0.6)',
        'logic-active': '0 0 14px rgba(56, 189, 248, 0.5)',
      },
    },
  },
  plugins: [],
};
