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
      <div className="absolute inset-0 bg-[#683B2B]/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#FFFFFF] rounded-[14px] shadow-[0_12px_40px_rgba(104,59,43,0.15)] border border-[#DED1BD] p-6 sm:p-7 w-full max-w-md mx-auto space-y-4">
        <div>
          <p className="font-cinzel text-xs uppercase tracking-[0.2em] text-[#B08401] font-semibold">
            Arbiter Sanction
          </p>
          <h3 className="font-serif text-2xl text-[#683B2B] mt-1 tracking-tight">
            {title}
          </h3>
        </div>

        <p className="text-sm text-[#7A6658] leading-relaxed font-sans">
          {message}
        </p>

        <div className="flex gap-3 justify-end pt-3 border-t border-[#DED1BD]">
          <button
            type="button"
            onClick={onCancel}
            className="font-sans text-xs px-4 py-2 rounded-full border border-[#DED1BD] bg-[#FAF6F2] text-[#7A6658] hover:text-[#683B2B] hover:bg-[#DED1BD]/50 transition font-medium"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`font-sans text-xs px-5 py-2 rounded-full font-medium transition shadow-sm ${
              danger
                ? 'bg-[#9E3B3B] hover:bg-[#832F2F] text-[#FAF6F2]'
                : 'bg-[#B08401] hover:bg-[#997200] text-[#FAF6F2] font-semibold'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
