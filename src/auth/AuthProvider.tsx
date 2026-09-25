import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { request, ApiError } from "../api/client";
import { SESSION_EXPIRED_EVENT } from "../lib/config";
import type { Me } from "../types/domain";
import { Feedback } from "../components/ui";
const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
}>({ session: null, loading: true });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const cache = useQueryClient();
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const expired = () => {
      setSession(null);
      cache.clear();
      void supabase?.auth.signOut({ scope: "local" });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expired);
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setSession(data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, value) => {
      setSession(value);
      setLoading(false);
      if (_event !== "TOKEN_REFRESHED") cache.clear();
    });
    return () => {
      mounted = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, expired);
      data.subscription.unsubscribe();
    };
  }, [cache]);
  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
export function usePreview() {
  const location = useLocation();
  return import.meta.env.DEV && location.pathname.startsWith("/preview");
}
export function useMe() {
  const { session } = useAuth();
  const preview = usePreview();
  return useQuery({
    queryKey: ["me", session?.user.id],
    queryFn: ({ signal }) => request<Me>("/auth/me", { signal }),
    enabled: !!session && !preview,
    retry: (count, error) => !(error instanceof ApiError && [401, 403].includes(error.status)) && count < 1,
  });
}
export function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const preview = usePreview();
  const me = useMe();
  if (preview) return children;
  if (loading) return <Feedback kind="loading" title="Checking your session" />;
  if (!session)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (me.isPending) return <Feedback kind="loading" title="Loading your workspace" />;
  if (me.isError) return <Feedback kind="error" title={me.error.message} retry={() => void me.refetch()}><Link to="/login">Return to sign in</Link></Feedback>;
  if (!me.data.organization && !["/organization", "/settings"].includes(location.pathname) && !(me.data.role === "ADMIN" && location.pathname.startsWith("/admin"))) return <Navigate to="/organization" replace />;
  return children;
}
export function useAppPath() {
  const preview = usePreview();
  return (path: string) => (preview ? "/preview" : "") + path;
}
