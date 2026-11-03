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
          // Exact Reference Colors: Soft Ivory Warm Aesthetic
          bg: "#FAF6F2",          // Dominant Primary Background (Soft Ivory)
          bgSecondary: "#F4EEE7", // Subtle secondary tone
          card: "#FFFFFF",        // Clean elevated card surface
          beige: "#DED1BD",       // Secondary surface & section cards (Warm Beige)
          gold: "#B08401",        // Primary Accent (Mustard Gold)
          goldHover: "#997200",
          rose: "#D49E8D",        // Secondary Accent (Dusty Rose)
          deepBrown: "#683B2B",   // Selective Deep Brown (Typography, nav, icons)
          
          textPrimary: "#683B2B", // High contrast editorial primary text
          textSecondary: "#7A6658",// Soft readable secondary text
          textMuted: "#9E8B7D",
          border: "#DED1BD",      // Hairline borders
          borderStrong: "#C9BAA3",
          sage: "#5B6E57",
          crimson: "#9E3B3B",

          // Adaptive mappings for legacy semantic token compatibility
          parchment: "#FAF6F2",
          surface: "#FFFFFF",
          surfaceHover: "#F6F1EA",
          walnut: "#683B2B",
          walnutMuted: "#7A6658",
          umber: "#7A6658",
          umberLight: "#DED1BD",
          boardFrame: "#683B2B",
          boardLight: "#FAF6F2",
          boardDark: "#DED1BD",
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
        'subtle': '0 1px 3px rgba(104, 59, 43, 0.06), 0 4px 12px rgba(104, 59, 43, 0.04)',
        'elevated': '0 4px 20px rgba(104, 59, 43, 0.08)',
      }
    },
  },
  plugins: [],
}
