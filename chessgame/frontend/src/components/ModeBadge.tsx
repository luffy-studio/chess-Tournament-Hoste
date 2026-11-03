import React from 'react'

interface ModeBadgeProps {
  mode: 'swiss' | 'roundrobin' | string
}

const MODE_CONFIG: Record<string, { label: string; className: string }> = {
  swiss: {
    label: 'FIDE Swiss System',
    className: 'bg-[#F4F0E8] text-[#241E19] border border-[#CEBEA8]',
  },
  roundrobin: {
    label: 'Berger Round Robin',
    className: 'bg-[#FAF8F5] text-[#8C6B3E] border border-[#B18A52]/30',
  },
}

export const ModeBadge: React.FC<ModeBadgeProps> = ({ mode }) => {
  const normalized = mode.toLowerCase().replace(/[^a-z]/g, '')
  const key = normalized.includes('round') ? 'roundrobin' : 'swiss'
  const config = MODE_CONFIG[key] ?? {
    label: mode,
    className: 'bg-[#FAF8F5] text-[#786F66] border border-[#E2D9CB]',
  }

  return (
    <span
      className={`text-[10px] sm:text-[11px] font-cinzel uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full inline-block ${config.className}`}
    >
      {config.label}
    </span>
  )
}
