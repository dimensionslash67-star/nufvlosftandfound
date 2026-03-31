/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 2.5s infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      colors: {
        brand: {
          DEFAULT: '#0f766e',
          dark: '#134e4a',
          light: '#ccfbf1',
          navy: '#1a237e',
          gold: '#FFC107',
          violet: '#7c3aed',
          teal: '#00bcd4',
        },
      },
    },
  },
  plugins: [],
};
