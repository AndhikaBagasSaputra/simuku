import { STATUS_INFO, type DebtStatus } from '../../lib/debt'

export function DebtStatusBadge({ status }: { status: DebtStatus }) {
  const info = STATUS_INFO[status]
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${info.className}`}>
      <span>{info.icon}</span>
      {info.label}
    </span>
  )
}
