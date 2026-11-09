import { useEffect, useState } from 'react'

/** true kalau media query cocok, misalnya '(min-width: 1024px)' untuk desktop */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [query])

  return matches
}

export const DESKTOP_QUERY = '(min-width: 1024px)'
