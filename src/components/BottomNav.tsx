import { Plus } from 'lucide-react'
import { BOTTOM_LEFT, BOTTOM_RIGHT, MORE_PAGES, type NavItem, type PageKey } from './layout/navigation'

interface Props {
  page: PageKey
  onNavigate: (page: PageKey) => void
  /** Kosong = halaman ini tidak punya tombol tambah */
  onAdd?: () => void
  /** Angka kecil di ikon Lainnya (misalnya tagihan yang perlu dibayar) */
  moreBadge?: number
}

/**
 * Navigasi bawah HP yang mengambang: tab dengan ikon di atas dan nama di bawah (tab aktif diberi
 * latar hijau lembut), dan tombol tambah bulat di tengah. Disembunyikan di desktop.
 */
export function BottomNav({ page, onNavigate, onAdd, moreBadge = 0 }: Props) {
  function renderTab({ key, label, icon: Icon }: NavItem) {
    const active = key === 'lainnya' ? MORE_PAGES.includes(page) : page === key
    const badge = key === 'lainnya' && moreBadge > 0
    return (
      <button
        key={key}
        type="button"
        onClick={() => onNavigate(key)}
        aria-current={active ? 'page' : undefined}
        aria-label={badge ? `${label}, ${moreBadge} perlu perhatian` : undefined}
        className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 transition-colors duration-200 motion-reduce:transition-none ${
          active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <span className="relative">
          <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
          {badge && (
            <span
              aria-hidden="true"
              className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-alert px-1 text-center text-[10px] leading-4 font-bold text-white ring-2 ring-surface"
            >
              {moreBadge}
            </span>
          )}
        </span>
        <span className={`max-w-full truncate text-[11px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
          {label}
        </span>
      </button>
    )
  }

  return (
    <nav
      aria-label="Navigasi utama"
      // Wadahnya tembus sentuh; hanya panelnya yang bisa diketuk
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 px-4 lg:hidden"
    >
      {/* Panel mengambang agak tembus pandang, supaya isi halaman samar terlihat di belakangnya */}
      <div className="pointer-events-auto mx-auto flex max-w-md items-center gap-1 rounded-3xl bg-surface/85 p-1.5 shadow-lg ring-1 ring-slate-200/80 backdrop-blur-md">
        {BOTTOM_LEFT.map(renderTab)}

        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label="Tambah"
            className="mx-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-hover active:bg-primary-active"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}

        {BOTTOM_RIGHT.map(renderTab)}
      </div>
    </nav>
  )
}
