import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useBottomBarHeight } from "../../hooks/useBottomBarHeight";

type ToastTone = "default" | "success" | "danger";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
  persist?: boolean;
}

interface ToastOptions {
  action?: ToastAction;
  /** Skip the auto-dismiss timer — the toast stays until the user acts on it. */
  persist?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const AUTO_DISMISS_MS = 3000;

const toneClasses: Record<ToastTone, string> = {
  default: "bg-graphite-900 text-graphite-25 dark:bg-graphite-100 dark:text-graphite-900",
  success: "bg-state-success text-white",
  danger: "bg-state-danger text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const bottomBarHeight = useBottomBarHeight();

  const showToast = useCallback(
    (message: string, tone: ToastTone = "default", options?: ToastOptions) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [
        ...current,
        { id, message, tone, action: options?.action, persist: options?.persist },
      ]);
      if (!options?.persist) {
        window.setTimeout(() => {
          setToasts((current) => current.filter((t) => t.id !== id));
        }, AUTO_DISMISS_MS);
      }
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        // Rides on the real, measured height of the bottom bar (nav +
        // install banner, when present) so it always clears it — falls
        // back to a fixed estimate only before that measurement exists
        // (e.g. on the admin side, which reports no bottom bar).
        className="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4"
        style={{
          bottom:
            bottomBarHeight > 0
              ? `calc(${bottomBarHeight}px + 16px)`
              : "calc(6rem + env(safe-area-inset-bottom))",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              "pointer-events-auto flex max-w-app items-center gap-3 rounded px-4 py-2.5 font-body text-[14px] shadow-raised",
              toneClasses[toast.tone],
            ].join(" ")}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  setToasts((current) => current.filter((t) => t.id !== toast.id));
                }}
                className="flex-shrink-0 rounded font-body text-[13px] font-semibold underline underline-offset-2 opacity-90 transition-opacity duration-150 ease-app hover:opacity-100"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
