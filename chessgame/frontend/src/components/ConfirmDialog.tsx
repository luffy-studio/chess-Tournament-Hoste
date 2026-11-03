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
      <div className="absolute inset-0 bg-[#241E19]/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#FAF8F5] rounded-[14px] shadow-[0_12px_40px_rgba(36,30,25,0.18)] border border-[#E2D9CB] p-6 sm:p-7 w-full max-w-md mx-auto space-y-4">
        <div>
          <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#B18A52]">
            Arbiter Sanction
          </p>
          <h3 className="font-serif text-2xl text-[#241E19] mt-1 tracking-tight">
            {title}
          </h3>
        </div>

        <p className="text-sm text-[#786F66] leading-relaxed font-sans">
          {message}
        </p>

        <div className="flex gap-3 justify-end pt-3 border-t border-[#E2D9CB]">
          <button
            type="button"
            onClick={onCancel}
            className="font-sans text-xs px-4 py-2 rounded-full border border-[#CEBEA8] bg-[#FAF8F5] text-[#786F66] hover:text-[#241E19] hover:bg-[#F4F0E8] transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`font-sans text-xs px-5 py-2 rounded-full font-medium transition shadow-sm ${
              danger
                ? 'bg-[#9E3B3B] hover:bg-[#832F2F] text-[#FAF8F5]'
                : 'bg-[#241E19] hover:bg-[#3A342E] text-[#FAF8F5]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
