import type { SavingsEntryInput, SavingsGoal, SavingsGoalInput } from '../types'
import { useStoredList } from './useStoredList'

export function useSavings() {
  const [goals, setGoals] = useStoredList<SavingsGoal>('keuangan:savings')

  function updateWith(id: string, change: (goal: SavingsGoal) => SavingsGoal) {
    setGoals((prev) => prev.map((g) => (g.id === id ? change(g) : g)))
  }

  function addGoal(input: SavingsGoalInput) {
    const goal: SavingsGoal = { ...input, id: crypto.randomUUID(), entries: [], createdAt: new Date().toISOString() }
    setGoals((prev) => [...prev, goal])
  }

  function updateGoal(id: string, input: SavingsGoalInput) {
    updateWith(id, (g) => ({ ...g, ...input }))
  }

  function deleteGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  function addEntry(goalId: string, input: SavingsEntryInput) {
    updateWith(goalId, (g) => ({ ...g, entries: [...g.entries, { ...input, id: crypto.randomUUID() }] }))
  }

  function deleteEntry(goalId: string, entryId: string) {
    updateWith(goalId, (g) => ({ ...g, entries: g.entries.filter((e) => e.id !== entryId) }))
  }

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    addEntry,
    deleteEntry,
    /** Ganti seluruh data (dipakai fitur undo) */
    restoreGoals: setGoals,
  }
}
