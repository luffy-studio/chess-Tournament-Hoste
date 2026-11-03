/**
 * GRANDMASTER SUITE — OFFICIAL THEME TOKENS & DESIGN SYSTEM
 * 
 * Aesthetic: Historic International Chess Institution & Boutique Luxury Editorial.
 * Character: Grounded, authentic, tactile, human-crafted, high-legibility.
 */

export const grandmasterTheme = {
  colors: {
    // Surfaces & Canvas
    parchment: '#F4F0E8',         // Primary warm paper canvas
    surface: '#FAF8F5',           // Elevated card & form surface
    surfaceHover: '#F6F2EC',      // Subtle interactive hover state
    surfaceDark: '#241E19',       // Deep walnut contrast surface
    
    // Typography
    walnut: '#241E19',            // Primary text & headings (deep walnut)
    walnutMuted: '#3A342E',       // Secondary headers & emphasis
    umber: '#786F66',             // Secondary descriptive copy
    umberLight: '#9E948A',        // Metadata, labels, timestamps
    
    // Brand & Accents (Used sparingly for hierarchy)
    antiqueGold: '#B18A52',       // Refined metallic antique gold
    antiqueBronze: '#8C6B3E',     // Deep antique bronze accent
    goldLight: '#DBC7A2',         // Subtle gold highlight
    goldMuted: '#C7AC7D',         // Subtle badge border
    
    // Structural Dividers
    border: '#E2D9CB',            // 1px hairline border for cards & rows
    borderStrong: '#CEBEA8',      // Emphasized container borders
    borderDivider: 'rgba(177, 138, 82, 0.2)', // Table dividers
    
    // Real Staunton Chessboard Colors
    boardFrame: '#3D3024',        // Handcrafted dark walnut outer rim
    squareLight: '#E8DFCF',       // Natural maple / beech light square
    squareDark: '#6E553E',        // Rich walnut dark square
    
    // Status Accents (Muted & Institutional)
    sage: '#5B6E57',              // Verified FIDE pass, live sync, win
    crimson: '#9E3B3B',           // Resignation, error, check alert
    brass: '#B89146',             // In-progress round indicator
  },

  typography: {
    wordmark: 'font-cinzel tracking-[0.2em] font-bold',
    editorialHeading: 'font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.1]',
    sectionKicker: 'font-cinzel text-xs uppercase tracking-[0.25em] text-[#B18A52]',
    dataScore: 'font-cinzel font-bold text-[#241E19]',
    body: 'font-sans text-[#3A342E] text-sm sm:text-base leading-relaxed',
  },

  radii: {
    card: '14px',
    pill: '9999px',
    button: '9999px',
    badge: '6px',
  },

  classes: {
    card: 'bg-[#FAF8F5] border border-[#E2D9CB] rounded-[14px] shadow-[0_1px_3px_rgba(36,30,25,0.04),0_4px_12px_rgba(36,30,25,0.02)]',
    cardInteractive: 'bg-[#FAF8F5] border border-[#E2D9CB] hover:border-[#B18A52]/50 hover:shadow-[0_4px_16px_rgba(36,30,25,0.06)] rounded-[14px] transition-all',
    input: 'bg-[#FAF8F5] border border-[#CEBEA8] focus:border-[#B18A52] focus:ring-1 focus:ring-[#B18A52] rounded-[10px] text-[#241E19] placeholder-[#9E948A] transition font-sans',
    btnPrimary: 'bg-[#241E19] hover:bg-[#3A342E] text-[#FAF8F5] font-sans font-medium rounded-full px-5 py-2.5 transition-all shadow-sm active:scale-[0.99]',
    btnSecondary: 'bg-[#FAF8F5] hover:bg-[#F4F0E8] text-[#241E19] border border-[#CEBEA8] hover:border-[#B18A52] font-sans font-medium rounded-full px-5 py-2.5 transition-all',
    btnGold: 'bg-[#B18A52] hover:bg-[#8C6B3E] text-[#FAF8F5] font-sans font-medium rounded-full px-5 py-2.5 transition-all shadow-sm active:scale-[0.99]',
    badge: 'font-cinzel text-[11px] px-2.5 py-0.5 rounded-full border tracking-wide uppercase',
  }
}
