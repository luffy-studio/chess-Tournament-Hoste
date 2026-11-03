import React from 'react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Confirm Arbiter Action',
  message,
  confirmLabel = 'Confirm Decree',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#1A1816]/80 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#2E2925] rounded-[14px] shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-[#514538] p-6 sm:p-7 w-full max-w-md mx-auto space-y-4">
        <div>
          <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#B18A52]">
            Arbiter Sanction
          </p>
          <h3 className="font-serif text-2xl text-[#F3EDE3] mt-1 tracking-tight">
            {title}
          </h3>
        </div>

        <p className="text-sm text-[#B9AEA0] leading-relaxed font-sans">
          {message}
        </p>

        <div className="flex gap-3 justify-end pt-3 border-t border-[#514538]">
          <button
            type="button"
            onClick={onCancel}
            className="font-sans text-xs px-4 py-2 rounded-full border border-[#514538] bg-[#302A25] text-[#B9AEA0] hover:text-[#F3EDE3] hover:bg-[#38312B] transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`font-sans text-xs px-5 py-2 rounded-full font-medium transition shadow-sm ${
              danger
                ? 'bg-[#9E3B3B] hover:bg-[#832F2F] text-[#F3EDE3]'
                : 'bg-[#B18A52] hover:bg-[#C49D63] text-[#24211E] font-semibold'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
