/**
 * Simuku: pengiriman notifikasi pengingat tagihan (Vercel Function).
 *
 * GET  /api/push  -> dipanggil Vercel Cron tiap pagi; kirim pengingat ke semua akun.
 * POST /api/push  -> "Kirim notifikasi uji" dari aplikasi; hanya ke akun yang meminta.
 *
 * Sengaja berdiri sendiri (tanpa import dari src/) supaya aman dijalankan di server Node.
 *
 * Environment variables (diisi di Vercel):
 *   VITE_SUPABASE_URL          alamat project Supabase (sama dengan aplikasi)
 *   SUPABASE_SERVICE_ROLE_KEY  kunci rahasia Supabase untuk membaca data semua akun
 *   VITE_VAPID_PUBLIC_KEY      kunci publik notifikasi (sama dengan aplikasi)
 *   VAPID_PRIVATE_KEY          kunci privat notifikasi (rahasia)
 *   CRON_SECRET                pengaman supaya hanya Vercel Cron yang bisa memanggil GET
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { sendNotification, setVapidDetails } from 'web-push'

// ===== Jadwal tagihan (salinan logika src/lib/recurring.ts, dihitung dalam UTC) =====

interface BillPayment {
  dueDate: string
}
interface Bill {
  id: string
  name: string
  kind: 'subscription' | 'installment'
  amount: number
  frequency: 'weekly' | 'monthly' | 'yearly'
  firstDueDate: string
  installments: number
  payments: BillPayment[]
}

const DAY_MS = 86_400_000

function parse(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
function iso(ms: number) {
  return new Date(ms).toISOString().slice(0, 10)
}
function addDays(date: string, days: number) {
  return iso(parse(date) + days * DAY_MS)
}
function addMonths(date: string, months: number) {
  const d = new Date(parse(date))
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, lastDay))
  return iso(d.getTime())
}
function nextDueDate(bill: Bill): string | null {
  const paid = bill.payments?.length ?? 0
  if (bill.kind === 'installment' && bill.installments > 0 && paid >= bill.installments) return null
  if (bill.frequency === 'weekly') return addDays(bill.firstDueDate, 7 * paid)
  if (bill.frequency === 'yearly') return addMonths(bill.firstDueDate, 12 * paid)
  return addMonths(bill.firstDueDate, paid)
}

/** Tanggal hari ini di Indonesia (WIB, UTC+7) */
function todayWIB() {
  return iso(Date.now() + 7 * 3_600_000)
}

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

/** Pengingat dikirim untuk H-1, hari H, dan H+1 (sekali terlewat), supaya tidak mengganggu tiap hari */
function describe(daysLeft: number) {
  if (daysLeft === 1) return 'jatuh tempo besok'
  if (daysLeft === 0) return 'jatuh tempo hari ini'
  if (daysLeft === -1) return 'terlewat kemarin'
  return null
}

interface Reminder {
  name: string
  amount: number
  when: string
  daysLeft: number
}

export function buildMessage(reminders: Reminder[]) {
  reminders.sort((a, b) => a.daysLeft - b.daysLeft)
  if (reminders.length === 1) {
    const r = reminders[0]
    return {
      title: `Tagihan ${r.name} ${r.when}`,
      body: `${rupiah.format(r.amount)}. Ketuk untuk mencatat pembayarannya.`,
    }
  }
  return {
    title: `${reminders.length} tagihan perlu diperhatikan`,
    body: reminders.map((r) => `${r.name} ${r.when} (${rupiah.format(r.amount)})`).join('\n'),
  }
}

// ===== Supabase & pengiriman =====

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Environment variable ${name} belum diisi`)
  return value
}

function adminClient() {
  return createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function setupVapid() {
  setVapidDetails('https://simuku.vercel.app', env('VITE_VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'))
}

interface Subscription {
  endpoint: string
  user_id: string
  p256dh: string
  auth: string
}

/** Kirim ke semua perangkat milik satu akun. Langganan yang sudah mati dihapus. */
async function sendToSubscriptions(admin: SupabaseClient, subs: Subscription[], message: object) {
  let sent = 0
  for (const sub of subs) {
    try {
      await sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(message),
        { TTL: 60 * 60 * 12 },
      )
      sent++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      // 404/410 = HP/browser sudah mencabut izin atau langganannya kedaluwarsa
      if (status === 404 || status === 410) {
        await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }
  }
  return sent
}

async function loadBills(admin: SupabaseClient, userIds: string[]) {
  const byUser = new Map<string, Bill[]>()
  const { data, error } = await admin
    .from('items')
    .select('user_id,data')
    .eq('collection', 'bills')
    .eq('deleted', false)
    .in('user_id', userIds)
  if (error) throw error
  for (const row of (data ?? []) as { user_id: string; data: Bill }[]) {
    const list = byUser.get(row.user_id) ?? []
    list.push(row.data)
    byUser.set(row.user_id, list)
  }
  return byUser
}

export function remindersFor(bills: Bill[], today: string): Reminder[] {
  const result: Reminder[] = []
  for (const bill of bills) {
    const due = nextDueDate(bill)
    if (!due) continue
    const daysLeft = Math.round((parse(due) - parse(today)) / DAY_MS)
    const when = describe(daysLeft)
    if (when) result.push({ name: bill.name, amount: bill.amount, when, daysLeft })
  }
  return result
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

// ===== GET: dijalankan Vercel Cron tiap pagi =====

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${env('CRON_SECRET')}`) {
    return json({ error: 'unauthorized' }, 401)
  }
  setupVapid()
  const admin = adminClient()

  const { data: subs, error } = await admin.from('push_subscriptions').select('endpoint,user_id,p256dh,auth')
  if (error) return json({ error: error.message }, 500)
  const subsByUser = new Map<string, Subscription[]>()
  for (const sub of (subs ?? []) as Subscription[]) {
    subsByUser.set(sub.user_id, [...(subsByUser.get(sub.user_id) ?? []), sub])
  }
  if (subsByUser.size === 0) return json({ users: 0, sent: 0 })

  const today = todayWIB()
  const billsByUser = await loadBills(admin, [...subsByUser.keys()])
  let sent = 0
  let users = 0
  for (const [userId, userSubs] of subsByUser) {
    const reminders = remindersFor(billsByUser.get(userId) ?? [], today)
    if (reminders.length === 0) continue
    users++
    sent += await sendToSubscriptions(admin, userSubs, { ...buildMessage(reminders), url: '/?page=tagihan', tag: `tagihan-${today}` })
  }
  return json({ today, users, sent })
}

// ===== POST: notifikasi uji dari aplikasi (hanya untuk akun yang sedang masuk) =====

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token) return json({ error: 'Belum masuk' }, 401)

  const admin = adminClient()
  const { data: userData, error: userError } = await admin.auth.getUser(token)
  if (userError || !userData.user) return json({ error: 'Sesi tidak valid, silakan masuk lagi' }, 401)
  setupVapid()

  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('endpoint,user_id,p256dh,auth')
    .eq('user_id', userData.user.id)
  if (error) return json({ error: error.message }, 500)
  if (!subs?.length) return json({ error: 'Notifikasi belum diaktifkan di perangkat ini' }, 400)

  const sent = await sendToSubscriptions(admin, subs as Subscription[], {
    title: 'Notifikasi Simuku aktif',
    body: 'Kamu akan diingatkan sehari sebelum tagihan jatuh tempo, di hari H, dan sehari setelahnya.',
    url: '/',
    tag: 'uji',
  })
  return json({ sent })
}
