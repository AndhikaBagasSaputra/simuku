import type { LucideIcon } from 'lucide-react'

/** Ikon bulat untuk tampilan kosong (menggantikan emoji besar) */
export function EmptyIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </span>
  )
}
