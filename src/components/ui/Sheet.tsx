import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  /** lg = lebih lebar di desktop (untuk form yang panjang) */
  size?: 'md' | 'lg'
  /** Tombol aksi yang selalu menempel di bawah panel (tetap terlihat walau isinya panjang) */
  footer?: ReactNode
  /** true = ada isian yang belum disimpan; menutup panel akan minta konfirmasi dulu */
  dirty?: boolean
}

const DISCARD_MESSAGE = 'Isian belum disimpan. Tutup dan buang isiannya?'

/** Urutan panel yang terbuka, supaya tombol Esc hanya menutup panel paling atas */
const openSheets: string[] = []

/** Panel yang muncul dari bawah (HP) / di tengah layar (laptop) */
export function Sheet({ title, onClose, children, size = 'md', footer, dirty = false }: Props) {
  const id = useId()
  // Simpan onClose terbaru di ref, supaya efek di bawah cukup jalan sekali saat panel dibuka
  // (kalau tidak, urutan panel bisa teracak setiap render dan Esc menutup panel yang salah)
  const onCloseRef = useRef(onClose)
  const dirtyRef = useRef(dirty)
  useEffect(() => {
    onCloseRef.current = onClose
    dirtyRef.current = dirty
  })

  /** Tutup panel; kalau ada isian yang belum disimpan, tanya dulu supaya tidak hilang karena salah ketuk */
  function requestClose() {
    if (dirtyRef.current && !window.confirm(DISCARD_MESSAGE)) return
    onCloseRef.current()
  }
  const requestCloseRef = useRef(requestClose)
  useEffect(() => {
    requestCloseRef.current = requestClose
  })

  useEffect(() => {
    openSheets.push(id)
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && openSheets[openSheets.length - 1] === id) requestCloseRef.current()
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
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl ${
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
            onClick={requestClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
            aria-label="Tutup"
            title="Tutup (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        {footer && (
          <div
            className={`sticky -bottom-5 z-10 -mx-5 -mb-5 mt-5 border-t border-slate-100 bg-surface px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] ${
              size === 'lg' ? 'lg:-bottom-7 lg:-mx-7 lg:-mb-7 lg:px-7 lg:pb-7' : ''
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
