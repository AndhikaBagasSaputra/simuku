export interface ToastData {
  /** Berubah setiap notifikasi baru, supaya timer tutup-otomatis diulang */
  id: number
  message: string
  action?: { label: string; onClick: () => void }
}

interface Props {
  toast: ToastData | null
  onClose: () => void
}

/** Notifikasi kecil di bawah layar, opsional dengan tombol aksi (misalnya "Batalkan") */
export function Toast({ toast, onClose }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-8 lg:pl-64"
      role="status"
      aria-live="polite"
    >
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex max-w-md items-center gap-4 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg ring-1 ring-white/10"
        >
          <span className="min-w-0">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick()
              }}
              className="shrink-0 font-semibold text-emerald-300 hover:text-emerald-200"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 rounded px-1 text-white/50 hover:text-white"
            aria-label="Tutup notifikasi"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
