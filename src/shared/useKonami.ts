import { useEffect } from 'react'

const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

/** Fires the callback when the classic up-up-down-down… code is typed. */
export function useKonami(onUnlock: () => void) {
  useEffect(() => {
    let i = 0
    const onKey = (e: KeyboardEvent) => {
      i = e.key === SEQ[i] ? i + 1 : e.key === SEQ[0] ? 1 : 0
      if (i === SEQ.length) {
        i = 0
        onUnlock()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onUnlock])
}
