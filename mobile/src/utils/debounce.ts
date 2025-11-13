export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, ms = 180) {
  let t: ReturnType<typeof setTimeout> | undefined
  return (...args: Args) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

