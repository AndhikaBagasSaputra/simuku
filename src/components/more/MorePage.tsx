import { getLastBackup } from '../../lib/backup'
import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import { getBillStatus, isAttention } from '../../lib/recurring'
import { getSavingsStats } from '../../lib/savings'
import type { RecurringBill, SavingsGoal } from '../../types'
import type { PageKey } from '../layout/navigation'
import { ThemeToggle } from '../ui/ThemeToggle'

interface Props {
  goals: SavingsGoal[]
  bills: RecurringBill[]
  onOpen: (page: PageKey) => void
}

export function MorePage({ goals, bills, onOpen }: Props) {
  const today = todayISO()
  const saved = goals.reduce((sum, g) => sum + getSavingsStats(g, today).saved, 0)
  const attention = bills.filter((b) => isAttention(getBillStatus(b, today).state)).length
  const lastBackup = getLastBackup()

  const items: { view: PageKey; icon: string; title: string; subtitle: string; badge?: string }[] = [
    {
      view: 'tabungan',
      icon: '🎯',
      title: 'Target Tabungan',
      subtitle: goals.length ? `${goals.length} target · ${formatRupiah(saved)} terkumpul` : 'Rencanakan tabunganmu',
    },
    {
      view: 'tagihan',
      icon: '🔔',
      title: 'Tagihan Rutin',
      subtitle: bills.length ? `${bills.length} tagihan & cicilan` : 'Langganan & cicilan',
      badge: attention ? `${attention} perlu dibayar` : undefined,
    },
    { view: 'ekspor', icon: '📥', title: 'Ekspor Data', subtitle: 'Download Excel / CSV' },
    {
      view: 'backup',
      icon: '💾',
      title: 'Backup & Restore',
      subtitle: lastBackup ? `Terakhir backup ${formatShortDate(lastBackup.slice(0, 10))}` : 'Belum pernah backup',
      badge: !lastBackup ? 'Disarankan' : undefined,
    },
  ]

  return (
    <div className="space-y-4">
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.view}>
          <button
            type="button"
            onClick={() => onOpen(item.view)}
            className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left shadow-sm hover:bg-slate-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl">
              {item.icon}
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
        <p className="mb-2 font-semibold text-slate-800">🎨 Tampilan</p>
        <ThemeToggle />
      </section>
    </div>
  )
}
