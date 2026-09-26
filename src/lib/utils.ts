import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const number = (value: number | null | undefined, digits = 1) =>
  value == null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(
        value,
      );
export const money = (value: number | null | undefined, currency = "INR") =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(value);
export const date = (value: string | null | undefined) => {
  if (!value) return "Not available";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Not available";
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return "Not available";
  }
};
export const label = (value: string | null | undefined) =>
  !value
    ? "Unknown"
    : String(value)
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^./, (s) => s.toUpperCase());
export function safeRedirect(path: string | null): string {
  return path?.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : "/dashboard";
}
export function dateRange(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}
