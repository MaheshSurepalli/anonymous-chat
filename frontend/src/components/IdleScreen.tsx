import { useChatStore } from '../state/useChatStore'

export default function IdleScreen() {
  const { connectAndFind, queueSize, avatar } = useChatStore()
  return (
    <div className="flex-1 grid place-items-center">
      <div className="w-full max-w-sm p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-4xl">{avatar}</div>
        <h2 className="mt-2 text-lg font-semibold">Ready to chat?</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Anonymous 1‑to‑1 chat. No login.</p>
        <button onClick={connectAndFind} className="mt-4 w-full px-3 py-2 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 focus:outline-none focus:ring-2">
          Find Stranger
        </button>
        {typeof queueSize === 'number' && <div className="mt-2 text-xs text-zinc-500">~{queueSize} waiting</div>}
      </div>
    </div>
  )
}