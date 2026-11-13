import { Plus } from 'lucide-react'
import { InstallCard } from '../pwa/InstallCard'
import { ThemeToggle } from '../ui/ThemeToggle'
import { PAGE_INFO, SIDEBAR_ITEMS, type PageKey } from './navigation'

interface Props {
  /** Nama tampilan pengguna (kosong = belum diisi) */
  myName: string
  page: PageKey
  onNavigate: (page: PageKey) => void
  /** Kosong = halaman ini tidak punya tombol tambah */
  onAdd?: () => void
  billsBadge: number
}

/** Navigasi samping untuk layar lebar (desktop) */
export function Sidebar({ myName, page, onNavigate, onAdd, billsBadge }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-surface lg:flex">
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <img src="/icon.png" alt="" className="h-10 w-10" />
        <div>
          <p className="text-lg leading-tight font-extrabold text-slate-800">Simuku</p>
          <p className="truncate text-xs text-slate-500">{myName ? `Halo, ${myName}` : 'Catatan keuangan pribadi'}</p>
        </div>
      </div>

      {/* Tempatnya tetap ada walau tombol disembunyikan, supaya menu di bawahnya tidak loncat */}
      <div className="mb-6 h-10 px-4">
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover active:bg-primary-active"
          >
            <Plus className="h-4 w-4" />
            {PAGE_INFO[page].addLabel}
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Menu utama">
        {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = page === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              <span className="flex-1 text-left">{label}</span>
              {key === 'tagihan' && billsBadge > 0 && (
                <span className="rounded-full bg-alert px-2 py-0.5 text-xs font-bold text-white">{billsBadge}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="space-y-3 px-4 pb-6">
        <InstallCard variant="compact" />
        <div>
          <p className="mb-1.5 px-2 text-xs font-semibold text-slate-500">Tampilan</p>
          <ThemeToggle />
        </div>
        <p className="px-2 text-xs text-slate-500">Data tersimpan di browser ini</p>
      </div>
    </aside>
  )
}
