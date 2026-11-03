import React from 'react'

interface StatusBadgeProps {
  status: 'setup' | 'ongoing' | 'completed' | 'paused' | string
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  setup: {
    label: 'Setup Phase',
    className: 'bg-[#FAF8F5] text-[#786F66] border border-[#CEBEA8]',
  },
  ongoing: {
    label: 'Live Arbitration',
    className: 'bg-[#5B6E57]/10 text-[#5B6E57] border border-[#5B6E57]/30',
  },
  completed: {
    label: 'Ratified & Concluded',
    className: 'bg-[#B18A52]/10 text-[#B18A52] border border-[#B18A52]/30',
  },
  paused: {
    label: 'On Hold',
    className: 'bg-[#9E3B3B]/10 text-[#9E3B3B] border border-[#9E3B3B]/30',
  },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase()
  const config = STATUS_CONFIG[normalized] ?? {
    label: status,
    className: 'bg-[#FAF8F5] text-[#786F66] border border-[#CEBEA8]',
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
