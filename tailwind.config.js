/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-page': '#0F172A',
        'bg-card': '#1E293B',
        'bg-surface': '#334155',
        'bg-sidebar': '#0B1120',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        'accent': '#2563EB',
        'accent-hover': '#1D4ED8',
        'danger': '#EF4444',
        'warning': '#F59E0B',
        'success': '#22C55E',
        'no-show': '#374151',
        'border': '#334155',
        'border-light': '#1E293B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
