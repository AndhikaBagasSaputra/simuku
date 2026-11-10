import { useRef, useState } from 'react'
import {
  BACKUP_LABELS,
  countData,
  downloadBackup,
  getLastBackup,
  readBackupFile,
  type BackupData,
  type BackupFile,
  type BackupKey,
} from '../../lib/backup'
import { daysBetween, formatShortDate, todayISO } from '../../lib/format'
import { primaryButtonClass } from '../../lib/ui'

export type RestoreMode = 'replace' | 'merge'

interface Props {
  data: BackupData
  onRestore: (data: BackupData, mode: RestoreMode) => void
}

/** "2026-11-06T10:00:00Z" -> "6 Nov 2026 (3 hari lalu)" */
function describeBackupDate(iso: string) {
  const date = iso.slice(0, 10)
  const days = daysBetween(date, todayISO())
  const ago = days <= 0 ? 'hari ini' : days === 1 ? 'kemarin' : `${days} hari lalu`
  return { text: `${formatShortDate(date)} (${ago})`, days }
}

export function BackupPage({ data, onRestore }: Props) {
  const [lastBackup, setLastBackup] = useState(getLastBackup)
  const [pending, setPending] = useState<{ name: string; file: BackupFile } | null>(null)
  const [mode, setMode] = useState<RestoreMode>('replace')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const current = countData(data)
  const totalCurrent = Object.values(current).reduce((a, b) => a + b, 0)
  const last = lastBackup ? describeBackupDate(lastBackup) : null
  const needsBackup = totalCurrent > 0 && (!last || last.days >= 30)

  function handleBackup() {
    downloadBackup(data)
    setLastBackup(getLastBackup())
  }

  async function handleFile(file: File | undefined) {
    setError('')
    setPending(null)
    if (!file) return
    const result = await readBackupFile(file)
    if (result.ok) {
      setPending({ name: file.name, file: result.file })
      setMode('replace')
    } else {
      setError(result.error)
    }
    // Reset supaya file yang sama bisa dipilih lagi
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleRestore() {
    if (!pending) return
    onRestore(pending.file.data, mode)
    setPending(null)
  }

  const incoming = pending ? countData(pending.file.data) : null
  const keys = Object.keys(BACKUP_LABELS) as BackupKey[]

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-6">
      {/* ===== Backup ===== */}
      <section className="space-y-4 rounded-2xl bg-surface p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Backup data</h2>
          <p className="mt-1 text-sm text-slate-500">
            Simpan semua data ke satu file. File ini bisa dipakai untuk memulihkan data kalau browser dibersihkan atau
            pindah perangkat.
          </p>
        </div>

        <div
          className={`rounded-xl p-3 text-sm ${
            needsBackup ? 'border border-amber-200 bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-600'
          }`}
        >
          {last ? (
            <>
              Terakhir backup: <b>{last.text}</b>
              {needsBackup && <span className="block">Sudah lebih dari sebulan, sebaiknya backup lagi.</span>}
            </>
          ) : totalCurrent > 0 ? (
            <>Kamu belum pernah backup. Data saat ini hanya tersimpan di browser ini.</>
          ) : (
            <>Belum ada data untuk di-backup.</>
          )}
        </div>

        <ul className="divide-y divide-slate-100 text-sm">
          {keys.map((k) => (
            <li key={k} className="flex justify-between py-2">
              <span className="text-slate-600">{BACKUP_LABELS[k]}</span>
              <span className="font-semibold text-slate-800 tabular-nums">{current[k]}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleBackup}
          disabled={totalCurrent === 0}
          className={`w-full ${primaryButtonClass}`}
        >
          Download Backup
        </button>
        <p className="text-xs text-slate-500">
          Simpan file backup di tempat aman, misalnya Google Drive atau kirim ke email sendiri.
        </p>
      </section>

      {/* ===== Restore ===== */}
      <section className="space-y-4 rounded-2xl bg-surface p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Pulihkan dari backup</h2>
          <p className="mt-1 text-sm text-slate-500">Pilih file backup (.json) yang pernah kamu download.</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border border-dashed border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Pilih file backup
        </button>

        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}

        {pending && incoming && (
          <div className="space-y-4 rounded-xl border border-slate-200 p-4">
            <div className="text-sm">
              <p className="truncate font-semibold text-slate-800">{pending.name}</p>
              {pending.file.exportedAt && (
                <p className="text-slate-500">Dibuat {describeBackupDate(pending.file.exportedAt).text}</p>
              )}
            </div>

            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1 font-medium">Data</th>
                  <th className="py-1 text-right font-medium">Sekarang</th>
                  <th className="py-1 text-right font-medium">Di backup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keys.map((k) => (
                  <tr key={k}>
                    <td className="py-1.5 text-slate-600">{BACKUP_LABELS[k]}</td>
                    <td className="py-1.5 text-right text-slate-800">{current[k]}</td>
                    <td className="py-1.5 text-right font-semibold text-slate-800">{incoming[k]}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-2" role="radiogroup" aria-label="Cara memulihkan">
              {(
                [
                  ['replace', 'Ganti semua data', 'Data sekarang diganti dengan isi backup.'],
                  ['merge', 'Gabungkan', 'Data sekarang tetap ada, data dari backup yang belum ada ditambahkan.'],
                ] as const
              ).map(([value, title, desc]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={mode === value}
                  onClick={() => setMode(value)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${
                    mode === value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                      mode === value ? 'border-emerald-600 bg-emerald-600 ring-2 ring-inset ring-white' : 'border-slate-300'
                    }`}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{title}</span>
                    <span className="block text-xs text-slate-500">{desc}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button type="button" onClick={handleRestore} className={`flex-1 ${primaryButtonClass}`}>
                Pulihkan Data
              </button>
            </div>
            <p className="text-xs text-slate-500">Setelah dipulihkan, kamu masih bisa membatalkannya selama beberapa detik.</p>
          </div>
        )}
      </section>
    </div>
  )
}
