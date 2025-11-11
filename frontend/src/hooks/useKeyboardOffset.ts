import { useEffect, useState } from 'react'

export default function useKeyboardOffset() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const viewport = window.visualViewport
    if (!viewport) return

    const handleResize = () => {
      const bottomInset = window.innerHeight - (viewport.height + viewport.offsetTop)
      setOffset(bottomInset > 0 ? Math.round(bottomInset) : 0)
    }

    handleResize()

    viewport.addEventListener('resize', handleResize)
    viewport.addEventListener('scroll', handleResize)

    return () => {
      viewport.removeEventListener('resize', handleResize)
      viewport.removeEventListener('scroll', handleResize)
    }
  }, [])

  return offset
}
