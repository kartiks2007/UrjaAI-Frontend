import { supabase } from "../lib/supabase";
import { API_BASE_URL, SESSION_EXPIRED_EVENT } from "../lib/config";
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
    public code = "NETWORK_ERROR",
    public details: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}
export const apiConfigured = Boolean(API_BASE_URL);
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const base = API_BASE_URL;
  if (!base)
    throw new ApiError(
      "The UrjaAI API URL is missing or invalid. Check VITE_API_URL.",
      0,
      "NOT_CONFIGURED",
    );
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) throw new ApiError("Invalid API request path.", 0, "INVALID_PATH");
  const session = supabase
    ? (await supabase.auth.getSession()).data.session
    : null;
  if (!session)
    throw new ApiError(
      "Your session has expired. Please sign in again.",
      401,
      "UNAUTHENTICATED",
    );
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
      headers,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    if (error instanceof DOMException && error.name === "TimeoutError") throw new ApiError("UrjaAI took too long to respond. Please retry.", 0, "TIMEOUT");
    throw new ApiError(
      "Unable to reach UrjaAI. Check your connection and try again.",
    );
  }
  if (response.status === 204) return undefined as T;
  let body;
  try { body = await response.json(); }
  catch { throw new ApiError("The API returned an invalid JSON response.", response.ok ? 502 : response.status, "INVALID_RESPONSE"); }
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    throw new ApiError(
      body?.error?.message ??
        (response.status === 403
          ? "You do not have access to this resource."
          : "The request could not be completed. Please retry."),
      response.status,
      body?.error?.code,
      Array.isArray(body?.error?.details) ? body.error.details.filter((item: unknown) => typeof item === "object" && item !== null && "path" in item && "message" in item && typeof item.path === "string" && typeof item.message === "string") : [],
    );
  }
  return body as T;
}
export function queryString(
  values: Record<string, string | number | undefined>,
) {
  return new URLSearchParams(
    Object.entries(values)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();
}
