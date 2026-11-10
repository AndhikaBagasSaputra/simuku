import { BellRing, Cloud, DatabaseBackup, Download, Lock, Target, type LucideIcon } from 'lucide-react'
import { useAppLock } from '../../hooks/useAppLock'
import { getLastBackup } from '../../lib/backup'
import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import { getBillStatus, isAttention } from '../../lib/recurring'
import { getSavingsStats } from '../../lib/savings'
import type { RecurringBill, SavingsGoal } from '../../types'
import type { PageKey } from '../layout/navigation'
import { InstallCard } from '../pwa/InstallCard'
import { ThemeToggle } from '../ui/ThemeToggle'

interface Props {
  goals: SavingsGoal[]
  bills: RecurringBill[]
  /** Status sinkron singkat, misalnya "Tersinkron 10.30" */
  syncLabel: string
  onOpen: (page: PageKey) => void
}

export function MorePage({ goals, bills, syncLabel, onOpen }: Props) {
  const today = todayISO()
  const saved = goals.reduce((sum, g) => sum + getSavingsStats(g, today).saved, 0)
  const attention = bills.filter((b) => isAttention(getBillStatus(b, today).state)).length
  const lastBackup = getLastBackup()
  const lock = useAppLock()

  const items: { view: PageKey; icon: LucideIcon; title: string; subtitle: string; badge?: string }[] = [
    {
      view: 'tabungan',
      icon: Target,
      title: 'Target Tabungan',
      subtitle: goals.length ? `${goals.length} target · ${formatRupiah(saved)} terkumpul` : 'Rencanakan tabunganmu',
    },
    {
      view: 'tagihan',
      icon: BellRing,
      title: 'Tagihan Rutin',
      subtitle: bills.length ? `${bills.length} tagihan & cicilan` : 'Langganan & cicilan',
      badge: attention ? `${attention} perlu dibayar` : undefined,
    },
    { view: 'ekspor', icon: Download, title: 'Ekspor Data', subtitle: 'Download Excel / CSV' },
    {
      view: 'backup',
      icon: DatabaseBackup,
      title: 'Backup & Restore',
      subtitle: lastBackup ? `Terakhir backup ${formatShortDate(lastBackup.slice(0, 10))}` : 'Belum pernah backup',
      badge: !lastBackup ? 'Disarankan' : undefined,
    },
    {
      view: 'keamanan',
      icon: Lock,
      title: 'Kunci Aplikasi',
      subtitle: lock.enabled ? 'Kunci PIN aktif' : 'Lindungi aplikasi dengan PIN',
    },
    { view: 'akun', icon: Cloud, title: 'Akun & Sinkron', subtitle: syncLabel },
  ]

  return (
    <div className="space-y-4">
    <InstallCard />
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.view}>
          <button
            type="button"
            onClick={() => onOpen(item.view)}
            className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left shadow-sm hover:bg-slate-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <item.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-800">{item.title}</span>
              <span className="block truncate text-sm text-slate-500">{item.subtitle}</span>
            </span>
            {item.badge && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {item.badge}
              </span>
            )}
            <span className="text-xl text-slate-300">›</span>
          </button>
        </li>
      ))}
    </ul>

      <section className="rounded-2xl bg-surface p-4 shadow-sm">
        <p className="mb-2 font-semibold text-slate-800">Tampilan</p>
        <ThemeToggle />
      </section>
    </div>
  )
}
