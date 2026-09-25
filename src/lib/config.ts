// Only public browser configuration belongs here. Database and service-role
// credentials must stay in the backend environment.
export function apiBase(value: string | undefined) {
  const base = value?.trim().replace(/\/+$/, "");
  if (!base) return null;
  if (base.startsWith("/") && !base.startsWith("//") && !base.includes("\\")) return base;
  try {
    const url = new URL(base);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    return base;
  } catch { return null; }
}
export function isPublicSupabaseKey(key: string) {
  if (key.startsWith("sb_secret_")) return false;
  if (key.split(".").length === 3) {
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replaceAll("-", "+").replaceAll("_", "/")));
      if (payload.role === "service_role") return false;
    } catch { return false; }
  }
  return Boolean(key);
}
export const API_BASE_URL = apiBase(import.meta.env.VITE_API_URL);
export const SESSION_EXPIRED_EVENT = "urjaai:session-expired";
