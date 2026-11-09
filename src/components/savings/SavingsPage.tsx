import { formatRupiah, formatShortDate, todayISO } from '../../lib/format'
import { getSavingsStats } from '../../lib/savings'
import type { SavingsGoal } from '../../types'

interface Props {
  goals: SavingsGoal[]
  onSelect: (goal: SavingsGoal) => void
}

export function SavingsPage({ goals, onSelect }: Props) {
  const today = todayISO()
  const list = goals
    .map((g) => ({ goal: g, stats: getSavingsStats(g, today) }))
    // Yang belum tercapai di atas
    .sort((a, b) => Number(a.stats.achieved) - Number(b.stats.achieved) || a.goal.createdAt.localeCompare(b.goal.createdAt))
  const totalSaved = list.reduce((sum, x) => sum + x.stats.saved, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0)

  if (goals.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-8 text-center shadow-sm">
        <p className="text-4xl">🎯</p>
        <p className="mt-2 font-medium text-slate-700">Belum ada target tabungan</p>
        <p className="mt-1 text-sm text-slate-500">
          Tekan tombol <b>+</b> untuk membuat target, misalnya beli laptop atau dana darurat.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-primary p-5 text-white shadow-sm lg:max-w-md">
        <p className="text-sm text-white/80">Total terkumpul</p>
        <p className="mt-1 text-3xl font-bold">{formatRupiah(totalSaved)}</p>
        <p className="mt-1 text-sm text-white/80">dari total target {formatRupiah(totalTarget)}</p>
      </div>

      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {list.map(({ goal, stats }) => (
          <li key={goal.id}>
            <button
              type="button"
              onClick={() => onSelect(goal)}
              className="h-full w-full rounded-2xl bg-surface p-4 text-left shadow-sm hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl">
                  {goal.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-800">{goal.name}</span>
                  <span className="block text-sm text-slate-500">
                    {formatRupiah(stats.saved)} / {formatRupiah(goal.target)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-emerald-700">{Math.floor(stats.progress)}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {stats.achieved
                  ? '🎉 Target tercapai!'
                  : stats.daysLeft === null
                    ? `Kurang ${formatRupiah(stats.remaining)}`
                    : stats.daysLeft < 0
                      ? `⚠️ Lewat tenggat (${formatShortDate(goal.deadline)}) · kurang ${formatRupiah(stats.remaining)}`
                      : `Kurang ${formatRupiah(stats.remaining)} · nabung ±${formatRupiah(stats.perMonth)}/bulan`}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
