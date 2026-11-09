import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  /** lg = lebih lebar di desktop (untuk form yang panjang) */
  size?: 'md' | 'lg'
}

/** Urutan panel yang terbuka, supaya tombol Esc hanya menutup panel paling atas */
const openSheets: string[] = []

/** Panel yang muncul dari bawah (HP) / di tengah layar (laptop) */
export function Sheet({ title, onClose, children, size = 'md' }: Props) {
  const id = useId()
  // Simpan onClose terbaru di ref, supaya efek di bawah cukup jalan sekali saat panel dibuka
  // (kalau tidak, urutan panel bisa teracak setiap render dan Esc menutup panel yang salah)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    openSheets.push(id)
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && openSheets[openSheets.length - 1] === id) onCloseRef.current()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      openSheets.splice(openSheets.indexOf(id), 1)
    }
  }, [id])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl ${
          size === 'lg' ? 'max-w-md lg:max-w-2xl lg:p-7' : 'max-w-md'
        }`}
      >
        {/* Header menempel di atas supaya tombol tutup selalu terlihat walau di-scroll */}
        <div
          className={`sticky z-10 mb-4 flex items-center justify-between gap-2 border-b border-slate-100 bg-surface pb-3 ${
            size === 'lg' ? '-top-5 -mx-5 -mt-5 px-5 pt-5 lg:-top-7 lg:-mx-7 lg:-mt-7 lg:px-7 lg:pt-7' : '-top-5 -mx-5 -mt-5 px-5 pt-5'
          }`}
        >
          <h2 className="min-w-0 truncate text-lg font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Tutup"
            title="Tutup (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
