import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'

const styles = {
  success: { icon: CheckCircle2, className: 'border-brand-200 bg-white text-brand-900', iconClass: 'text-brand-600' },
  error: { icon: AlertCircle, className: 'border-red-200 bg-white text-red-900', iconClass: 'text-red-600' },
  info: { icon: Info, className: 'border-sand-300 bg-white text-brand-950', iconClass: 'text-sand-600' },
}

export default function Toast() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" role="region" aria-label="Benachrichtigungen">
      {toasts.map((toast) => {
        const style = styles[toast.type] || styles.info
        const Icon = style.icon
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex animate-slide-up items-start gap-3 rounded-2xl border p-4 shadow-xl ${style.className}`}
          >
            <Icon className={`mt-0.5 size-5 shrink-0 ${style.iconClass}`} />
            <p className="flex-1 text-sm font-semibold leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Benachrichtigung schließen"
              className="text-slate-400 transition-colors hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
