import { useState, type FormEvent } from 'react'
import { describeSync, type SyncAccount } from '../../hooks/useSync'
import { dangerButtonClass, inputClass, labelClass, primaryButtonClass, segmentClass } from '../../lib/ui'
import { PushSettings } from './PushSettings'

interface Props {
  account: SyncAccount
}

const MIN_PASSWORD = 8

/** Login / daftar dan status sinkron antar perangkat */
export function AccountPage({ account }: Props) {
  const [mode, setMode] = useState<'masuk' | 'daftar'>('masuk')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    const cleanEmail = email.trim()
    if (!cleanEmail) return setError('Email wajib diisi')
    if (mode === 'daftar' && password.length < MIN_PASSWORD) {
      return setError(`Password minimal ${MIN_PASSWORD} karakter`)
    }
    if (!password) return setError('Password wajib diisi')

    setBusy(true)
    const result = mode === 'masuk' ? await account.signIn(cleanEmail, password) : await account.signUp(cleanEmail, password)
    setBusy(false)

    if (result === 'confirm') {
      setMode('masuk')
      setPassword('')
      setNotice(`Akun dibuat. Buka link konfirmasi yang dikirim ke ${cleanEmail}, lalu masuk di sini.`)
    } else if (result) {
      setError(result)
    } else {
      setPassword('')
    }
  }

  if (!account.configured) {
    return (
      <section className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 lg:max-w-xl">
        <p className="font-semibold">Sinkron belum diatur</p>
        <p className="mt-1">
          Alamat dan kunci Supabase belum diisi di aplikasi ini, jadi login belum bisa dipakai. Datamu tetap aman
          tersimpan di perangkat ini.
        </p>
      </section>
    )
  }

  if (account.loading) {
    return <p className="py-10 text-center text-sm text-slate-500">Memeriksa akun…</p>
  }

  if (account.user) {
    const tone =
      account.status === 'error'
        ? 'bg-rose-50 text-rose-600'
        : account.status === 'offline'
          ? 'bg-amber-50 text-amber-800'
          : 'bg-emerald-50 text-emerald-700'
    return (
      <div className="space-y-4 lg:max-w-xl">
        <section className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="text-sm text-slate-500">Masuk sebagai</p>
          <p className="truncate font-semibold text-slate-800">{account.user.email}</p>

          <div role="status" className={`mt-3 rounded-xl p-3 text-sm font-medium ${tone}`}>
            {describeSync(account)}
            {account.status === 'error' && account.error && (
              <span className="mt-0.5 block text-xs font-normal">{account.error}</span>
            )}
          </div>

          <button
            type="button"
            onClick={account.syncNow}
            disabled={account.status === 'syncing'}
            className={`mt-3 w-full ${primaryButtonClass}`}
          >
            Sinkronkan sekarang
          </button>
        </section>

        <PushSettings />

        <section className="rounded-2xl bg-surface p-4 shadow-sm">
          <p className="font-semibold text-slate-800">Keluar</p>
          <p className="text-sm text-slate-500">
            Data dikirim dulu ke akunmu, lalu dihapus dari perangkat ini supaya tidak tercampur dengan akun lain.
            Datamu tetap aman dan muncul lagi saat kamu masuk.
          </p>
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true)
              try {
                await account.signOut()
              } finally {
                setSigningOut(false)
              }
            }}
            className={`mt-3 w-full disabled:opacity-50 ${dangerButtonClass}`}
          >
            {signingOut ? 'Menyinkronkan…' : 'Keluar dari akun'}
          </button>
        </section>

        <p className="px-1 text-xs text-slate-500">
          Data disinkronkan otomatis setiap ada perubahan, saat aplikasi dibuka, dan saat internet kembali. Masuk
          dengan akun yang sama di perangkat lain untuk melihat data yang sama.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 lg:max-w-xl">
      <form onSubmit={handleSubmit} className="rounded-2xl bg-surface p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {(['masuk', 'daftar'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value)
                setError('')
              }}
              className={segmentClass(mode === value)}
            >
              {value === 'masuk' ? 'Masuk' : 'Daftar'}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className={labelClass}>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="mt-3 block">
          <span className={labelClass}>Password{mode === 'daftar' ? ` (minimal ${MIN_PASSWORD} karakter)` : ''}</span>
          <input
            type="password"
            autoComplete={mode === 'masuk' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-rose-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </p>
        )}

        <button type="submit" disabled={busy} className={`mt-4 w-full ${primaryButtonClass}`}>
          {busy ? 'Memproses…' : mode === 'masuk' ? 'Masuk' : 'Buat akun'}
        </button>
      </form>

      <p className="px-1 text-xs text-slate-500">
        Setelah masuk, data di perangkat ini diunggah ke akunmu dan digabung dengan data yang sudah ada di sana.
        Tanpa masuk, aplikasi tetap bisa dipakai dan data hanya tersimpan di perangkat ini.
      </p>
    </div>
  )
}
