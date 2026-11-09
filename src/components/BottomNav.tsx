import { Plus } from 'lucide-react'
import { BOTTOM_LEFT, BOTTOM_RIGHT, MORE_PAGES, type NavItem, type PageKey } from './layout/navigation'

interface Props {
  page: PageKey
  onNavigate: (page: PageKey) => void
  onAdd: () => void
  /** Angka kecil di ikon Lainnya (misalnya tagihan yang perlu dibayar) */
  moreBadge?: number
}

/** Navigasi bawah untuk HP (disembunyikan di desktop) */
export function BottomNav({ page, onNavigate, onAdd, moreBadge = 0 }: Props) {
  function renderTab({ key, label, icon: Icon }: NavItem) {
    const active = key === 'lainnya' ? MORE_PAGES.includes(page) : page === key
    return (
      <button
        key={key}
        type="button"
        onClick={() => onNavigate(key)}
        aria-current={active ? 'page' : undefined}
        className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium ${
          active ? 'text-emerald-700' : 'text-slate-500'
        }`}
      >
        <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
        {label}
        {key === 'lainnya' && moreBadge > 0 && (
          <span className="absolute top-1 right-1/2 translate-x-5 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
            {moreBadge}
          </span>
        )}
      </button>
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-surface/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-md items-center px-2 pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_LEFT.map(renderTab)}

        <button
          type="button"
          onClick={onAdd}
          aria-label="Tambah"
          className="-mt-6 mx-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover active:bg-primary-active"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>

        {BOTTOM_RIGHT.map(renderTab)}
      </div>
    </nav>
  )
}
