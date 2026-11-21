import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface SheetProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function Sheet({ title, isOpen, onClose, children }: SheetProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  // Callers pass a new arrow each render; a ref keeps the effect below from re-running
  // (and stealing focus) on every render.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      // A dropdown inside the sheet handles its own Escape and marks it handled.
      if (e.key === 'Escape' && !e.defaultPrevented) onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-fadeIn'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className='bg-[var(--app-card)] text-[var(--app-text)] rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl border-t border-[var(--app-border)] overflow-hidden'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-3.5 border-b border-[var(--app-border)]'>
          <h2 id={titleId} className='text-sm font-bold'>
            {title}
          </h2>
          <button
            ref={closeRef}
            type='button'
            onClick={onClose}
            aria-label={t('close')}
            className='p-1 rounded-md text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-sm font-bold'
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-5 custom-scrollbar'>{children}</div>
      </div>
    </div>
  )
}
