import React from 'react'

interface StatusBadgeProps {
  status: 'setup' | 'ongoing' | 'completed' | 'paused' | string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  setup: {
    label: 'Setup Phase',
    className: 'bg-[#302A25] text-[#B9AEA0] border border-[#514538]',
  },
  ongoing: {
    label: 'Live Arbitration',
    className: 'bg-[#5B6E57]/20 text-[#6E8B67] border border-[#5B6E57]/50',
  },
  completed: {
    label: 'Ratified & Concluded',
    className: 'bg-[#B18A52]/20 text-[#C49D63] border border-[#B18A52]/50',
  },
  paused: {
    label: 'On Hold',
    className: 'bg-[#9E3B3B]/20 text-[#B84A4A] border border-[#9E3B3B]/50',
  },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase()
  const config = STATUS_CONFIG[normalized] ?? {
    label: status,
    className: 'bg-[#302A25] text-[#B9AEA0] border border-[#514538]',
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
