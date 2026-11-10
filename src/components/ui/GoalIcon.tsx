import { GOAL_ICONS, goalIconKey } from '../../lib/goalIcons'

interface Props {
  /** Kunci ikon, atau emoji dari data lama */
  icon: string
  className?: string
}

/** Ikon garis untuk target tabungan */
export function GoalIcon({ icon, className = 'h-5 w-5' }: Props) {
  const Icon = GOAL_ICONS[goalIconKey(icon)]
  return <Icon className={className} aria-hidden="true" />
}
