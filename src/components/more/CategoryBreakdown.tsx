import { ChevronDown, Pencil } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { getCategory } from '../../lib/categories'
import { formatRupiah } from '../../lib/format'
import { cleanNote, groupByNote, type NoteGroup } from '../../lib/notes'
import type { CategoryLine } from '../../lib/report'
import { inputClass, primaryButtonClass } from '../../lib/ui'
import type { Transaction } from '../../types'
import { CategoryIcon } from '../ui/CategoryIcon'
import { Sheet } from '../ui/Sheet'

interface Props {
  lines: CategoryLine[]
  /** Transaksi periode ini dengan jenis yang sama (pengeluaran atau pemasukan) */
  transactions: Transaction[]
  /** Ganti catatan semua transaksi dalam satu kelompok */
  onRenameNote: (ids: string[], note: string) => void
}

/** Daftar kategori dengan bar; ketuk kategori untuk melihat rincian berdasarkan catatan */
export function CategoryBreakdown({ lines, transactions, onRenameNote }: Props) {
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState<NoteGroup | null>(null)

  return (
    <>
      <ul className="space-y-1">
        {lines.map((c) => {
          const expanded = open === c.categoryId
          const groups = expanded ? groupByNote(transactions.filter((t) => t.categoryId === c.categoryId)) : []
          return (
            <li key={c.categoryId}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : c.categoryId)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-slate-50"
              >
                <CategoryIcon categoryId={c.categoryId} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate text-slate-700">{c.name}</span>
                    <span className="shrink-0 font-semibold text-slate-800 tabular-nums">{formatRupiah(c.amount)}</span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${Math.max(c.percent, 2)}%`, backgroundColor: getCategory(c.categoryId).color }}
                    />
                  </span>
                </span>
                <span className="w-9 shrink-0 text-right text-xs text-slate-500 tabular-nums">{Math.round(c.percent)}%</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {expanded && (
                <ul className="mb-2 ml-11 divide-y divide-slate-100 rounded-xl border border-slate-100">
                  {groups.map((g) =>
                    g.key && g.editableIds.length > 0 ? (
                      <li key={g.key}>
                        <button
                          type="button"
                          onClick={() => setEditing(g)}
                          aria-label={`Ubah catatan ${g.label}`}
                          className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span className="min-w-0 flex-1 truncate text-slate-700">{g.label}</span>
                          <span className="shrink-0 text-xs text-slate-500 tabular-nums">{g.count}x</span>
                          <span className="w-24 shrink-0 text-right font-semibold text-slate-800 tabular-nums">
                            {formatRupiah(g.amount)}
                          </span>
                          <Pencil className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                        </button>
                      </li>
                    ) : (
                      <li key={g.key || 'tanpa-catatan'} className="flex min-h-11 items-center gap-2 px-3 py-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-slate-500 italic">{g.key ? g.label : 'Tanpa catatan'}</span>
                        <span className="shrink-0 text-xs text-slate-500 tabular-nums">{g.count}x</span>
                        <span className="w-24 shrink-0 text-right font-semibold text-slate-800 tabular-nums">
                          {formatRupiah(g.amount)}
                        </span>
                        <span className="w-3.5 shrink-0" />
                      </li>
                    ),
                  )}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {editing && (
        <RenameNote
          group={editing}
          onClose={() => setEditing(null)}
          onSave={(note) => {
            onRenameNote(editing.editableIds, note)
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

function RenameNote({ group, onSave, onClose }: { group: NoteGroup; onSave: (note: string) => void; onClose: () => void }) {
  const [value, setValue] = useState(group.label)
  const clean = cleanNote(value)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    // Tidak ada yang berubah kalau semua tulisan aslinya sudah persis sama dengan yang baru
    if (!clean || group.rawNotes.every((n) => n === clean)) return onClose()
    onSave(clean)
  }

  return (
    <Sheet title="Ubah catatan" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          autoFocus
          maxLength={100}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Catatan"
          className={inputClass}
        />
        <p className="mt-2 text-sm text-slate-600">Berlaku untuk {group.editableIds.length} transaksi.</p>
        <button type="submit" disabled={!clean} className={`mt-4 w-full ${primaryButtonClass}`}>
          Simpan
        </button>
      </form>
    </Sheet>
  )
}
