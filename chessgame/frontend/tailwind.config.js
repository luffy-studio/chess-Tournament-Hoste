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
          parchment: "#F4F0E8",
          surface: "#FAF8F5",
          surfaceHover: "#F6F2EC",
          border: "#E2D9CB",
          borderStrong: "#CEBEA8",
          walnut: "#241E19",
          walnutMuted: "#3A342E",
          umber: "#786F66",
          umberLight: "#A69E95",
          gold: "#B18A52",
          bronze: "#8C6B3E",
          goldLight: "#DBC7A2",
          sage: "#5B6E57",
          crimson: "#9E3B3B",
          boardFrame: "#3D3024",
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
        'subtle': '0 1px 3px rgba(36, 30, 25, 0.04), 0 4px 12px rgba(36, 30, 25, 0.03)',
        'elevated': '0 4px 20px rgba(36, 30, 25, 0.06)',
      }
    },
  },
  plugins: [],
}
