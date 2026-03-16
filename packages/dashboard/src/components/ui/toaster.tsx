import { useToast } from '@/hooks/useToast';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            relative rounded-lg border p-4 shadow-lg transition-all duration-300
            ${toast.open ? 'animate-in slide-in-from-right-full' : 'animate-out fade-out-80 slide-out-to-right-full'}
            ${toast.variant === 'destructive' 
              ? 'border-red-500/50 bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100' 
              : 'border-border bg-background text-foreground'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              {toast.title && (
                <div className="font-semibold">{toast.title}</div>
              )}
              {toast.description && (
                <div className="text-sm opacity-90 mt-1">{toast.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="rounded-full p-1 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
