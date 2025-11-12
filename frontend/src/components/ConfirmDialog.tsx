import * as Dialog from '@radix-ui/react-dialog'
import { type ReactNode, useId } from 'react'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (value: boolean) => void
  title: string
  description?: string
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel?: () => void
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()

  const confirmClasses =
    tone === 'danger'
      ? 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500'
      : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-200'

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          role="alertdialog"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          className="fixed left-1/2 top-1/2 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 dark:focus-visible:ring-zinc-200"
        >
          <Dialog.Title id={titleId} className="text-lg font-semibold">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description id={descriptionId} className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-700 dark:focus-visible:ring-zinc-200"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`rounded-xl px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 ${confirmClasses}`}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}