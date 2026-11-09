import { useEffect, useState } from 'react'
import { loadFromStorage, saveToStorage } from '../lib/storage'

/** Daftar data yang otomatis tersimpan di browser */
export function useStoredList<T>(key: string) {
  const [items, setItems] = useState<T[]>(() => loadFromStorage<T[]>(key, []))
  useEffect(() => saveToStorage(key, items), [key, items])
  return [items, setItems] as const
}
