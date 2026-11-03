import React from 'react'

interface StatusBadgeProps {
  status: 'setup' | 'ongoing' | 'completed' | 'paused' | string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  setup: {
    label: 'Setup Phase',
    className: 'bg-[#FAF6F2] text-[#7A6658] border border-[#DED1BD]',
  },
  ongoing: {
    label: 'Live Arbitration',
    className: 'bg-[#5B6E57]/10 text-[#5B6E57] border border-[#5B6E57]/30',
  },
  completed: {
    label: 'Ratified & Concluded',
    className: 'bg-[#B08401]/10 text-[#B08401] border border-[#B08401]/30 font-bold',
  },
  paused: {
    label: 'On Hold',
    className: 'bg-[#D49E8D]/25 text-[#683B2B] border border-[#D49E8D] font-medium',
  },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase()
  const config = STATUS_CONFIG[normalized] ?? {
    label: status,
    className: 'bg-[#FAF6F2] text-[#7A6658] border border-[#DED1BD]',
  }

  return (
    <span
      className={`text-[10px] sm:text-[11px] font-cinzel uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${config.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  )
}
