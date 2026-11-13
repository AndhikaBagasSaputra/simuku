import { useState, type FormEvent } from 'react'
import { cleanName, MAX_NAME_LENGTH } from '../../lib/profile'
import { inputClass, labelClass, primaryButtonClass } from '../../lib/ui'
import { Sheet } from '../ui/Sheet'

interface Props {
  onSave: (name: string) => void
  onClose: () => void
}

/** Ditanyakan sekali sebelum membuat split bill pertama, supaya teks ke teman memakai nama asli, bukan "Saya" */
export function NamePrompt({ onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = cleanName(name)
    if (!clean) return setError('Isi namamu dulu')
    onSave(clean)
  }

  return (
    <Sheet title="Siapa namamu?" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-slate-600">
          Namamu dipakai di split bill dan teks yang kamu kirim ke teman, misalnya "Dibayar oleh Andhika". Bisa
          diubah nanti di halaman Akun &amp; Sinkron.
        </p>
        <label className="mt-4 block">
          <span className={labelClass}>Nama</span>
          <input
            type="text"
            autoFocus
            autoComplete="given-name"
            maxLength={MAX_NAME_LENGTH}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            aria-invalid={Boolean(error) || undefined}
            className={inputClass}
          />
        </label>
        {error && (
          <p role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
            {error}
          </p>
        )}
        <button type="submit" className={`mt-5 w-full ${primaryButtonClass}`}>
          Lanjut
        </button>
      </form>
    </Sheet>
  )
}
