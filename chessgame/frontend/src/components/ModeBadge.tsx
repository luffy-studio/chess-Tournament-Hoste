import React from 'react'

interface ModeBadgeProps {
  mode: 'swiss' | 'roundrobin' | string
}

const MODE_CONFIG: Record<string, { label: string; className: string }> = {
  swiss: {
    label: 'Swiss System',
    className: 'bg-[#302A25] text-[#F3EDE3] border border-[#514538]',
  },
  roundrobin: {
    label: 'Berger Round Robin',
    className: 'bg-[#302A25] text-[#B18A52] border border-[#B18A52]/40',
  },
}

export const ModeBadge: React.FC<ModeBadgeProps> = ({ mode }) => {
  const normalized = mode.toLowerCase().replace(/[^a-z]/g, '')
  const key = normalized.includes('round') ? 'roundrobin' : 'swiss'
  const config = MODE_CONFIG[key] ?? {
    label: mode,
    className: 'bg-[#302A25] text-[#B9AEA0] border border-[#514538]',
  }

  return (
    <span
      className={`text-[10px] sm:text-[11px] font-cinzel uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full inline-block ${config.className}`}
    >
      {config.label}
    </span>
  )
}
