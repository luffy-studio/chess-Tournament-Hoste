import React from 'react'

interface ModeBadgeProps {
  mode: 'swiss' | 'roundrobin' | string
}

const MODE_CONFIG: Record<string, { label: string; className: string }> = {
  swiss: {
    label: 'Swiss System',
    className: 'bg-[#FAF6F2] text-[#683B2B] border border-[#DED1BD]',
  },
  roundrobin: {
    label: 'Berger Round Robin',
    className: 'bg-[#D49E8D]/15 text-[#683B2B] border border-[#D49E8D]/40 font-semibold',
  },
}

export const ModeBadge: React.FC<ModeBadgeProps> = ({ mode }) => {
  const normalized = mode.toLowerCase().replace(/[^a-z]/g, '')
  const key = normalized.includes('round') ? 'roundrobin' : 'swiss'
  const config = MODE_CONFIG[key] ?? {
    label: mode,
    className: 'bg-[#FAF6F2] text-[#7A6658] border border-[#DED1BD]',
  }

  return (
    <span
      className={`text-[10px] sm:text-[11px] font-cinzel uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full inline-block ${config.className}`}
    >
      {config.label}
    </span>
  )
}
