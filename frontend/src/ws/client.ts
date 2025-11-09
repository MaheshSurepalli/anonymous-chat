// Thin helper for debounced typing if you want to centralize later.
export const debounce = (fn: (...args:any[]) => void, ms=180) => {
  let t: number | undefined
  return (...args:any[]) => {
    clearTimeout(t)
    t = window.setTimeout(() => fn(...args), ms)
  }
}