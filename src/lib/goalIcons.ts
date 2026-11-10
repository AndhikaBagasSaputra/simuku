import {
  Bike,
  Car,
  Gem,
  Gift,
  GraduationCap,
  Hospital,
  House,
  Laptop,
  Plane,
  Smartphone,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/** Ikon yang bisa dipilih untuk target tabungan (kunci disimpan di data) */
export const GOAL_ICONS: Record<string, LucideIcon> = {
  target: Target,
  rumah: House,
  mobil: Car,
  motor: Bike,
  liburan: Plane,
  laptop: Laptop,
  hp: Smartphone,
  sekolah: GraduationCap,
  nikah: Gem,
  kesehatan: Hospital,
  hadiah: Gift,
  dana: Wallet,
}

/** Data lama menyimpan emoji; tetap dikenali supaya target yang sudah ada tidak kehilangan ikonnya */
const LEGACY: Record<string, string> = {
  '🎯': 'target',
  '🏠': 'rumah',
  '🚗': 'mobil',
  '🏍️': 'motor',
  '✈️': 'liburan',
  '💻': 'laptop',
  '📱': 'hp',
  '🎓': 'sekolah',
  '💍': 'nikah',
  '🏥': 'kesehatan',
  '🎁': 'hadiah',
  '💰': 'dana',
}

export function goalIconKey(icon: string) {
  return GOAL_ICONS[icon] ? icon : (LEGACY[icon] ?? 'target')
}
