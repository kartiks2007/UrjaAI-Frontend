import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Circle,
  Factory,
  LoaderCircle,
  Pause,
  PlugZap,
  WifiOff,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "./ui/button";
import { cn, label } from "../lib/utils";
export { Button, buttonVariants };
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark">
        <PlugZap size={21} />
      </span>
      {!compact && (
        <>
          Urja<span>AI</span>
        </>
      )}
    </span>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="heading-actions">{action}</div>}
    </div>
  );
}
export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel", className)}>
      {title && (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  title,
  description,
  action,
  icon: Icon = Factory,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: typeof Factory;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={24} strokeWidth={1.5} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Feedback({
  kind,
  title,
  children,
  retry,
}: {
  kind: "error" | "success" | "loading" | "info";
  title: string;
  children?: ReactNode;
  retry?: () => void;
}) {
  const Icon =
    kind === "loading"
      ? LoaderCircle
      : kind === "success"
        ? Check
        : AlertCircle;
  return (
    <div
      className={cn("feedback", kind)}
      role={kind === "error" ? "alert" : "status"}
    >
      <Icon size={19} className={kind === "loading" ? "spin" : ""} />
      <div>
        <strong>{title}</strong>
        {children && <div>{children}</div>}
      </div>
      {retry && (
        <Button size="sm" variant="outline" onClick={retry}>
          Retry
        </Button>
      )}
    </div>
  );
}
export function Status({
  value,
  stale = false,
}: {
  value: string;
  stale?: boolean;
}) {
  const Icon =
    value === "RUNNING"
      ? Check
      : value === "IDLE"
        ? Pause
        : value === "OFFLINE"
          ? WifiOff
          : Circle;
  return (
    <span className={cn("status", value.toLowerCase(), stale && "stale")}>
      <Icon size={12} />
      {label(value)}
      {stale ? " · stale" : ""}
    </span>
  );
}
export function Field({
  label: caption,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{caption}</label>
      {children(id)}
      {hint && <small>{hint}</small>}
      {error && (
        <small role="alert" className="field-error">
          {error}
        </small>
      )}
    </div>
  );
}
export function Metric({
  label: caption,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
}) {
  return (
    <div className="metric">
      <span>{caption}</span>
      <div>
        {value}
        <small>{unit}</small>
      </div>
      {note && <p>{note}</p>}
    </div>
  );
}
export function TextLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-link" to={to}>
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <Dialog.Close className="dialog-close" aria-label="Close dialog">
            <X size={19} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
