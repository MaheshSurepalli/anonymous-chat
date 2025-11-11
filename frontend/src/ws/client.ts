// Thin helper for debounced typing if you want to centralize later.
export const debounce = <Args extends unknown[]>(fn: (...args: Args) => void, ms = 180) => {
  let timeoutId: number | undefined
  return (...args: Args) => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => fn(...args), ms)
  }
}