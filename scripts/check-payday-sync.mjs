// Memastikan daftar libur & tanggal gajian di aplikasi (src/lib/payday.ts) dan di server notifikasi
// (api/push.ts) sama persis. Dijalankan sebelum build; build gagal kalau berbeda.
import { readFileSync } from 'node:fs'

function holidays(file) {
  const text = readFileSync(file, 'utf8')
  const start = text.indexOf('HOLIDAYS = new Set([')
  if (start < 0) throw new Error(`Daftar libur tidak ditemukan di ${file}`)
  const block = text.slice(start, text.indexOf('])', start))
  return [...block.matchAll(/'(\d{4}-\d{2}-\d{2})'/g)].map((m) => m[1]).sort()
}

const app = holidays('src/lib/payday.ts')
const server = holidays('api/push.ts')
const onlyApp = app.filter((d) => !server.includes(d))
const onlyServer = server.filter((d) => !app.includes(d))
const appDay = /PAYDAY_DATE = (\d+)/.exec(readFileSync('src/lib/payday.ts', 'utf8'))?.[1]
const serverUsesSameDay = readFileSync('api/push.ts', 'utf8').includes(`-${appDay}\``)

if (onlyApp.length || onlyServer.length || !serverUsesSameDay) {
  console.error('Daftar libur / tanggal gajian di src/lib/payday.ts dan api/push.ts berbeda.')
  if (onlyApp.length) console.error('Hanya di aplikasi:', onlyApp.join(', '))
  if (onlyServer.length) console.error('Hanya di server:', onlyServer.join(', '))
  if (!serverUsesSameDay) console.error(`Server tidak memakai tanggal gajian ${appDay}`)
  process.exit(1)
}
console.log(`Daftar libur sama (${app.length} tanggal), tanggal gajian ${appDay}.`)
