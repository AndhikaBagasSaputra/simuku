import type { SavingsGoal } from '../types'
import { daysBetween } from './format'

export interface SavingsStats {
  saved: number
  remaining: number
  /** 0–100 */
  progress: number
  achieved: boolean
  /** Sisa hari ke tenggat (null = tanpa tenggat) */
  daysLeft: number | null
  /** Saran nabung per bulan / per minggu supaya tercapai tepat waktu */
  perMonth: number
  perWeek: number
}

export const SAVINGS_ICONS = ['🎯', '🏠', '🚗', '🏍️', '✈️', '💻', '📱', '🎓', '💍', '🏥', '🎁', '💰']

export function getSavingsStats(goal: SavingsGoal, today: string): SavingsStats {
  const saved = goal.entries.reduce((sum, e) => sum + (e.kind === 'deposit' ? e.amount : -e.amount), 0)
  const remaining = Math.max(goal.target - saved, 0)
  const daysLeft = goal.deadline ? daysBetween(today, goal.deadline) : null

  let perMonth = 0
  let perWeek = 0
  if (daysLeft !== null && daysLeft > 0 && remaining > 0) {
    perMonth = Math.ceil(remaining / Math.max(daysLeft / 30.44, 1))
    perWeek = Math.ceil(remaining / Math.max(daysLeft / 7, 1))
  }

  return {
    saved,
    remaining,
    progress: goal.target > 0 ? Math.min((saved / goal.target) * 100, 100) : 0,
    achieved: saved >= goal.target,
    daysLeft,
    perMonth,
    perWeek,
  }
}
