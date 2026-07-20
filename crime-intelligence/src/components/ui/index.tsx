"use client";

import {
  createContext,
  cloneElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  isValidElement,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

function joinClasses(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";
export type SystemStateTone = "loading" | "empty" | "error" | "success" | "warning" | "info" | "offline";
export type ToastTone = "info" | "success" | "warning" | "danger";

interface ToastMessage {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  persistent?: boolean;
}

interface ToastContextValue {
  notify: (message: Omit<ToastMessage, "id">) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function PageHeader({
  title,
  description,
  actions,
  headingId,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  headingId?: string;
}) {
  return (
    <div className="ksp-page-header">
      <div>
        <h1 id={headingId} className="ksp-page-title" tabIndex={-1}>{title}</h1>
        {description && <p className="ksp-page-description">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="ksp-section-title">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageSection({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={joinClasses("space-y-4", className)}>{children}</section>;
}

export function Card({ children, compact = false, className }: { children: ReactNode; compact?: boolean; className?: string }) {
  return <div className={joinClasses(compact ? "ksp-card-compact" : "ksp-card", className)}>{children}</div>;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "secondary",
  loading,
  loadingLabel,
  children,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
}) {
  const variantClass =
    variant === "primary"
      ? "ksp-button-primary"
      : variant === "ghost"
        ? "ksp-button-ghost"
        : variant === "danger"
          ? "ksp-button-danger"
          : "ksp-button-secondary";

  return (
    <button
      className={joinClasses(variantClass, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <span
          className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {loading ? loadingLabel ?? "Working..." : children}
    </button>
  );
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <button className={joinClasses("ksp-icon-button", className)} aria-label={label} title={label} {...props}>
      {children}
    </button>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={joinClasses("ksp-input", className)} {...props} />;
}

export function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input type="search" autoComplete="off" {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={joinClasses("ksp-textarea", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={joinClasses("ksp-input appearance-none pr-9", className)} {...props}>
      {children}
    </select>
  );
}

export function FormField({
  id,
  label,
  description,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, descriptionId].filter(Boolean).join(" ") || undefined;
  const child =
    isValidElement(children)
      ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy,
          "aria-required": required || undefined,
        })
      : children;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="ksp-label">
        {label}
        {required && (
          <>
            <span className="ml-1 text-red-600" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </>
        )}
      </label>
      {child}
      {description && !error && <p id={descriptionId} className="text-xs text-ink-muted">{description}</p>}
      {error && <p id={errorId} className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const toneClass =
    tone === "success"
      ? "ksp-badge-success"
      : tone === "warning"
        ? "ksp-badge-warning"
        : tone === "danger"
          ? "ksp-badge-danger"
          : tone === "info"
            ? "border-blue-200 bg-blue-50 text-blue-800"
            : "";
  return <span className={joinClasses("ksp-badge", toneClass, className)}>{children}</span>;
}

export function StatusBadge({ status, tone = "neutral" }: { status: string; tone?: Tone }) {
  return <Badge tone={tone}>{status}</Badge>;
}

export function Alert({ tone = "info", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const toneClass =
    tone === "success"
      ? "ksp-alert-success"
      : tone === "warning"
        ? "ksp-alert-warning"
        : tone === "danger"
          ? "ksp-alert-danger"
          : tone === "info"
            ? "ksp-alert-info"
            : "";
  return (
    <div className={joinClasses("ksp-alert", toneClass, className)} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export function LoadingState({ label = "Loading...", description }: { label?: string; description?: string }) {
  return (
    <div className="ksp-card flex items-start gap-3 text-sm text-ink-secondary" role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-app-primary border-t-transparent" aria-hidden="true" />
      <span>
        <span className="block font-medium text-ink-primary">{label}</span>
        {description && <span className="mt-1 block text-ink-secondary">{description}</span>}
      </span>
    </div>
  );
}

export function SkeletonBlock({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={joinClasses("ksp-card space-y-3", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={joinClasses(
            "h-4 animate-pulse rounded bg-slate-100",
            index === 0 ? "w-2/3" : index === lines - 1 ? "w-1/2" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

export function RefreshingIndicator({ label = "Refreshing" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-2.5 py-1 text-xs font-medium text-ink-secondary" role="status" aria-live="polite">
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-app-primary border-t-transparent" aria-hidden="true" />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ksp-card mx-auto max-w-xl py-8 text-center">
      <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load this view",
  description,
  action,
  secondaryAction,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="ksp-card mx-auto max-w-xl py-8 text-center" role="alert">
      <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function StateNotice({
  tone,
  title,
  description,
  action,
}: {
  tone: SystemStateTone;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warning" || tone === "offline"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : tone === "error"
          ? "border-red-200 bg-red-50 text-red-900"
          : tone === "loading"
            ? "border-blue-200 bg-blue-50 text-blue-900"
            : "border-app-border bg-app-surface text-ink-secondary";

  return (
    <div
      className={joinClasses("rounded-app border p-4 text-sm", toneClass)}
      role={tone === "error" || tone === "offline" ? "alert" : "status"}
      aria-live={tone === "error" || tone === "offline" ? "assertive" : "polite"}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{title}</p>
          {description && <p className="mt-1 opacity-90">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

function toastToneClass(tone: ToastTone) {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  if (tone === "danger") return "border-red-200 bg-red-50 text-red-950";
  return "border-blue-200 bg-blue-50 text-blue-950";
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const notify = useCallback((message: Omit<ToastMessage, "id">) => {
    const id = nextId.current++;
    setMessages((current) => [...current.slice(-2), { ...message, id }]);
    if (!message.persistent) {
      window.setTimeout(() => dismiss(id), message.tone === "danger" ? 7000 : 4200);
    }
  }, [dismiss]);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        role="region"
        aria-label="System notifications"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={joinClasses("rounded-app border p-4 shadow-app-lg", toastToneClass(message.tone))}
            role={message.tone === "danger" ? "alert" : "status"}
            aria-live={message.tone === "danger" ? "assertive" : "polite"}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{message.title}</p>
                {message.description && <p className="mt-1 text-sm opacity-90">{message.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(message.id)}
                className="rounded px-1 text-sm font-semibold opacity-70 hover:opacity-100"
                aria-label="Dismiss notification"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within <ToastProvider>.");
  }
  return context;
}

export function ConnectivityBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900" role="alert">
      You are offline. Current data may be stale, and new actions will be retried only after the connection returns.
    </div>
  );
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={joinClasses("ksp-card grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}

export function Table({
  children,
  className,
  caption,
}: {
  children: ReactNode;
  className?: string;
  caption?: string;
}) {
  return (
    <div className="ksp-responsive-table" tabIndex={0} aria-label={caption ? undefined : "Scrollable data table"}>
      <table className={joinClasses("ksp-table", className)}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-ink-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button type="button" onClick={onPrevious} disabled={page <= 1}>
          Previous
        </Button>
        <Button type="button" onClick={onNext} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function ChartContainer({
  title,
  description,
  children,
  empty,
  summary,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  empty?: boolean;
  summary?: ReactNode;
}) {
  return (
    <Card>
      <SectionHeader title={title} description={description} />
      {summary && <div className="mb-4 rounded-app border border-app-border bg-app-muted p-3 text-sm text-ink-secondary">{summary}</div>}
      {empty ? <EmptyState title="No chart data" description="No records are available for the selected filters." /> : children}
    </Card>
  );
}

export function MapControlPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ksp-map-panel">
      <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}
