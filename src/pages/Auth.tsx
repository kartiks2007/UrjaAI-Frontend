import { useEffect, useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { safeRedirect } from "../lib/utils";
import { useAuth } from "../auth/AuthProvider";
import { Brand, Button, Feedback, Field } from "../components/ui";
export default function Auth() {
  const location = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const mode = location.pathname;
  const redirectBase = import.meta.env.VITE_AUTH_REDIRECT_URL || window.location.origin;
  const signup = mode === "/signup",
    forgot = mode === "/forgot-password",
    reset = mode === "/reset-password";
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    setError("");
    setSuccess("");
  }, [mode]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!supabase) {
      setError(
        "Authentication is not connected yet. Configure the Supabase URL and public key to enable sign-in.",
      );
      return;
    }
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    if (!reset && !z.email().safeParse(email).success) {
      setError("Enter a valid email address.");
      return;
    }
    if (!forgot && password.length < 8) {
      setError("Use a password of at least 8 characters.");
      return;
    }
    if ((signup || reset) && password !== String(data.get("confirm"))) {
      setError("The passwords do not match.");
      return;
    }
    setPending(true);
    try {
      if (forgot) {
        const result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectBase + "/reset-password",
        });
        if (result.error) throw result.error;
        setSuccess(
          "If an account exists for this email, you will receive a password reset link.",
        );
      } else if (reset) {
        if (!session)
          throw new Error(
            "Open the secure reset link in your email before choosing a new password.",
          );
        const result = await supabase.auth.updateUser({ password });
        if (result.error) throw result.error;
        setSuccess(
          "Password updated. You can now sign in with your new password.",
        );
      } else if (signup) {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(data.get("name") ?? "") },
            emailRedirectTo: redirectBase + "/dashboard",
          },
        });
        if (result.error) throw result.error;
        if (result.data.session) navigate("/organization");
        else
          setSuccess("Check your email to verify your account, then sign in.");
      } else {
        const result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (result.error) throw result.error;
        navigate(safeRedirect(params.get("next")), { replace: true });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete authentication. Please retry.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Link to="/">
          <Brand />
        </Link>
        <div>
          <div className="eyebrow">YOUR OPERATIONS, IN FOCUS</div>
          <h1>
            Every machine
            <br />
            has a story.
            <br />
            <span>Understand yours.</span>
          </h1>
          <p>
            One workspace for machine monitoring, energy insights and
            owner-controlled sharing.
          </p>
        </div>
        <span className="auth-trust">
          <ShieldCheck size={18} />
          Built around real data and your decisions.
        </span>
      </div>
      <main className="auth-main">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Back to UrjaAI
        </Link>
        <div className="auth-form-wrap">
          <div className="eyebrow">URJAAI WORKSPACE</div>
          <h1>
            {signup
              ? "Create your account"
              : forgot
                ? "Reset your password"
                : reset
                  ? "Choose a new password"
                  : "Welcome back."}
          </h1>
          <p>
            {signup
              ? "Start with your account. Set up your organization next."
              : forgot
                ? "We’ll send you a secure link to get back in."
                : reset
                  ? "Choose a strong password for your account."
                  : "Sign in to see what’s happening on your factory floor."}
          </p>
          {!supabase && (
            <Feedback kind="info" title="Authentication setup required">
              This frontend is ready for your Supabase project. Sign-in is
              available once configured.
            </Feedback>
          )}
          <form onSubmit={submit} noValidate>
            {signup && (
              <Field label="Full name">
                {(id) => (
                  <input id={id} name="name" autoComplete="name" required />
                )}
              </Field>
            )}
            {!reset && (
              <Field label="Work email">
                {(id) => (
                  <input
                    id={id}
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@business.com"
                    required
                  />
                )}
              </Field>
            )}
            {!forgot && (
              <Field label="Password">
                {(id) => (
                  <div className="password-input">
                    <input
                      id={id}
                      name="password"
                      type={visible ? "text" : "password"}
                      autoComplete={
                        signup || reset ? "new-password" : "current-password"
                      }
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      aria-label={visible ? "Hide password" : "Show password"}
                    >
                      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                )}
              </Field>
            )}
            {(signup || reset) && (
              <Field label="Confirm password">
                {(id) => (
                  <input
                    id={id}
                    name="confirm"
                    type={visible ? "text" : "password"}
                    autoComplete="new-password"
                    required
                  />
                )}
              </Field>
            )}
            {!signup && !forgot && !reset && (
              <Link className="forgot-link" to="/forgot-password">
                Forgot password?
              </Link>
            )}
            {error && <Feedback kind="error" title={error} />}{" "}
            {success && <Feedback kind="success" title={success} />}
            <Button
              type="submit"
              disabled={pending || !supabase}
              className="full-width"
            >
              {pending
                ? "Please wait…"
                : signup
                  ? "Create account"
                  : forgot
                    ? "Send reset link"
                    : reset
                      ? "Update password"
                      : "Sign in"}
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? (
              <>
                Already have an account? <Link to="/login">Sign in</Link>
              </>
            ) : forgot || reset ? (
              <Link to="/login">Return to sign in</Link>
            ) : (
              <>
                New to UrjaAI? <Link to="/signup">Create an account</Link>
              </>
            )}
          </p>
          {import.meta.env.DEV && (
            <Link className="developer-preview" to="/preview/dashboard">
              Preview the frontend without signing in →
            </Link>
          )}
        </div>
        <p className="auth-footnote">
          UrjaAI · Monitor. Analyze. Share. Optimize.
        </p>
      </main>
    </div>
  );
}
