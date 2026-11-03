/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gm: {
          bg: "#24211E",
          bgSecondary: "#2E2925",
          elevated: "#38312B",
          input: "#302A25",
          textPrimary: "#F3EDE3",
          textSecondary: "#B9AEA0",
          border: "#514538",
          borderStrong: "#665747",
          gold: "#B18A52",
          goldHover: "#C49D63",
          goldMuted: "#8C6B3E",
          sage: "#5B6E57",
          crimson: "#9E3B3B",

          // Adaptive mappings for seamless continuity
          parchment: "#24211E",
          surface: "#2E2925",
          surfaceHover: "#38312B",
          walnut: "#F3EDE3",
          walnutMuted: "#B9AEA0",
          umber: "#B9AEA0",
          umberLight: "#D1C7BA",
          boardFrame: "#2A241F",
          boardLight: "#E8DFCF",
          boardDark: "#6E553E",
        }
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'serif'],
        playfair: ['"Playfair Display"', 'serif'],
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 14px rgba(0, 0, 0, 0.25)',
        'elevated': '0 4px 20px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
