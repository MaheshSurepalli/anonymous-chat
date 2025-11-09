import * as Dialog from '@radix-ui/react-dialog'

export default function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, onCancel }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-sm rounded-2xl bg-white p-4 shadow-lg outline-none dark:bg-zinc-800">
          <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
          {description && <Dialog.Description className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{description}</Dialog.Description>}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onCancel} className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2">
              Cancel
            </button>
            <button onClick={onConfirm} className="px-3 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 focus:outline-none focus:ring-2">
              Confirm
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}