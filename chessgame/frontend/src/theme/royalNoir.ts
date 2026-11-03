/**
 * ROYAL NOIR THEME TOKENS & SYSTEM DEFINITION
 * 
 * Master consistency configuration for ChessArena.
 * Every page, component, modal, toast, and state MUST import from this central file.
 */

export const royalNoir = {
  colors: {
    // Canvas & Surfaces
    base: '#0A0A0C',
    card: 'rgba(255, 255, 255, 0.04)',
    cardHover: 'rgba(255, 255, 255, 0.07)',
    input: 'rgba(255, 255, 255, 0.04)',
    
    // Typography
    cream: '#F3EAD3',       // Primary text
    secondary: '#B8AD8E',   // Secondary text
    muted: '#9A8F74',       // Metadata and muted text
    
    // Brand & Accents
    gold: '#D4AF37',        // Brand gold
    goldLight: '#E9D9A6',   // Light gold accent
    goldDark: '#1A1405',    // Text on gold
    
    // Borders & Dividers
    borderCard: 'rgba(212, 175, 55, 0.2)',
    borderDivider: 'rgba(212, 175, 55, 0.15)',
    borderInput: 'rgba(212, 175, 55, 0.25)',
    borderInputFocus: '#D4AF37',
    
    // Chessboard Tokens
    boardFrame: '#3A2C10',
    squareLight: '#D9C08A',
    squareDark: '#1B1B1F',
    
    // Status
    error: '#E26B5B',
    success: '#7FBF7A',
  },

  gradients: {
    goldButton: 'linear-gradient(135deg, #F0D77A, #B8912A)',
    heroGlow: 'radial-gradient(circle at 85% 15%, rgba(42, 33, 8, 0.7) 0%, rgba(10, 10, 12, 0) 65%), #0A0A0C',
    featureGlow: 'radial-gradient(circle at 50% 0%, rgba(42, 33, 8, 0.45) 0%, rgba(10, 10, 12, 0) 70%), #0A0A0C',
  },

  typography: {
    wordmark: 'font-cinzel tracking-[0.15em]',
    pageHeading: 'font-playfair italic font-normal text-4xl sm:text-5xl leading-[1.05]',
    sectionKicker: 'font-cinzel text-xs uppercase tracking-[0.3em] text-[#D4AF37]',
    statNumber: 'font-cinzel text-[#D4AF37] font-semibold',
    body: 'font-sans text-[#F3EAD3] text-sm sm:text-base leading-relaxed',
  },

  radii: {
    card: '18px',
    pill: '9999px',
    button: '9999px',
  },

  classes: {
    card: 'bg-white/[0.04] border border-[#D4AF37]/20 rounded-[18px] p-[22px]',
    cardInteractive: 'bg-white/[0.04] hover:bg-white/[0.07] border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 rounded-[18px] p-[22px] transition duration-200',
    btnPrimary: 'rn-btn-primary',
    btnSecondary: 'rn-btn-secondary',
    chip: 'rn-chip',
    chipActive: 'rn-chip active',
    input: 'w-full bg-white/[0.04] border border-[#D4AF37]/25 rounded-xl px-4 py-3 text-[#F3EAD3] placeholder-[#9A8F74] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm transition',
    tableRow: 'border-b border-[#D4AF37]/15 hover:bg-white/[0.02] transition',
    tableHeader: 'text-[#9A8F74] text-xs uppercase tracking-wider py-3 px-4 font-cinzel text-left',
  }
} as const;
