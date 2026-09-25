import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { request } from "../api/client";
import { useMe, usePreview, useAppPath } from "../auth/AuthProvider";
import { Button, PageHeader } from "../components/ui";
import "./assistant.css";
interface Result {
  answer: string;
  observations: string[];
  anomalies: string[];
  predictions: string[];
  recommendations: string[];
  limitations: string[];
  risk_level: string;
  confidence: string;
  evidence_ids: string[];
}
interface Job {
  id: string;
  question?: string;
  status: string;
  result: Result | null;
  error_code: string | null;
  model: string;
  created_at: string;
  context_meta: {
    as_of: string;
    from: string;
    to: string;
    mode: string;
  } | null;
}
export default function Assistant() {
  const preview = usePreview(),
    path = useAppPath(),
    me = useMe(),
    cache = useQueryClient();
  const [session, setSession] = useState(""),
    [question, setQuestion] = useState(""),
    [machine, setMachine] = useState(""),
    [days, setDays] = useState(7);
  const status = useQuery({
    queryKey: ["ai-status"],
    queryFn: () =>
      request<{ mode: string; model: string; enabled: boolean }>("/ai/status"),
    enabled: !preview,
    retry: false,
  });
  const sessions = useQuery({
    queryKey: ["ai-sessions"],
    queryFn: () =>
      request<{ id: string; created_at: string }[]>("/ai/sessions"),
    enabled: !preview,
    retry: false,
  });
  const machines = useQuery({
    queryKey: ["ai-machines"],
    queryFn: () =>
      request<{ items: { id: string; name: string }[] }>(
        "/machines?page_size=100",
      ),
    enabled: !preview,
  });
  const messages = useQuery({
    queryKey: ["ai-messages", session],
    queryFn: () => request<Job[]>(`/ai/sessions/${session}/messages`),
    enabled: !!session && !preview,
    refetchInterval: 3000,
    retry: false,
  });
  const insights = useQuery({
    queryKey: ["ai-insights"],
    queryFn: () => request<Job[]>("/ai/insights"),
    enabled: !preview,
    refetchInterval: 10000,
    retry: false,
  });
  const refresh = () =>
    cache.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).startsWith("ai-"),
    });
  const consent = useMutation({
    mutationFn: (enabled: boolean) =>
      request("/ai/settings", {
        method: "PUT",
        body: JSON.stringify({ enabled }),
      }),
    onSuccess: refresh,
  });
  const send = useMutation({
    mutationFn: async () => {
      let id = session;
      if (!id) {
        const s = await request<{ id: string }>("/ai/sessions", {
          method: "POST",
          body: "{}",
        });
        id = s.id;
        setSession(id);
      }
      return request(`/ai/sessions/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          question,
          machine_id: machine || null,
          days,
          request_id: crypto.randomUUID(),
        }),
      });
    },
    onSuccess: () => {
      setQuestion("");
      void refresh();
    },
  });
  const analyze = useMutation({
    mutationFn: () =>
      request("/ai/analysis", {
        method: "POST",
        body: JSON.stringify({
          machine_id: machine || null,
          days,
          request_id: crypto.randomUUID(),
        }),
      }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: () => request(`/ai/sessions/${session}`, { method: "DELETE" }),
    onSuccess: () => {
      setSession("");
      void refresh();
    },
  });
  const feedback = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      request(`/ai/jobs/${id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      }),
  });
  const error =
    status.error ??
    sessions.error ??
    machines.error ??
    messages.error ??
    insights.error ??
    send.error ??
    consent.error ??
    analyze.error ??
    remove.error ??
    feedback.error;
  const busy =
    send.isPending ||
    messages.data?.some((j) => ["pending", "running"].includes(j.status));
  const ready = status.data?.enabled && status.data.mode === "live";
  function renderJob(j: Job) {
    return (
      <article className="ai-card" key={j.id}>
        {j.question && (
          <p>
            <strong>You:</strong> {j.question}
          </p>
        )}
        {j.status === "pending" || j.status === "running" ? (
          <p role="status">Analyzing your selected data…</p>
        ) : j.status === "failed" ? (
          <p role="alert">
            Analysis could not finish ({j.error_code}). You can submit again
            when the service is available.
          </p>
        ) : (
          j.result && (
            <>
              <p className="ai-answer">{j.result.answer}</p>
              {(
                [
                  "observations",
                  "anomalies",
                  "predictions",
                  "recommendations",
                  "limitations",
                ] as const
              ).map(
                (k) =>
                  j.result![k].length > 0 && (
                    <div key={k}>
                      <strong>{k[0].toUpperCase() + k.slice(1)}</strong>
                      <ul>
                        {j.result![k].map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  ),
              )}
              <p className="ai-meta">
                AI-generated · {j.model} · Risk: {j.result.risk_level} ·
                Confidence (self-assessed): {j.result.confidence}
              </p>
              {j.context_meta && (
                <p className="ai-meta">
                  Data snapshot:{" "}
                  {new Date(j.context_meta.as_of).toLocaleString()} ·{" "}
                  {j.context_meta.from} to {j.context_meta.to}
                </p>
              )}
              <div className="ai-evidence">
                {j.result.evidence_ids.map((e) => (
                  <Link
                    key={e}
                    to={path(
                      e.startsWith("machine:")
                        ? `/machines/${e.slice(8)}`
                        : e.startsWith("alert:")
                          ? "/alerts"
                          : "/energy",
                    )}
                  >
                    {e}
                  </Link>
                ))}
              </div>
              <div className="ai-actions">
                <Button
                  variant="outline"
                  onClick={() => feedback.mutate({ id: j.id, rating: 1 })}
                  disabled={feedback.isPending}
                >
                  Helpful
                </Button>
                <Button
                  variant="outline"
                  onClick={() => feedback.mutate({ id: j.id, rating: -1 })}
                  disabled={feedback.isPending}
                >
                  Not helpful
                </Button>
              </div>
            </>
          )
        )}
      </article>
    );
  }
  return (
    <section className="ai-page">
      <PageHeader
        title="AI Assistant"
        description="Explore machine activity, energy usage and operational insights."
      />
      {preview ? (
        <p>Sign in to use AI analysis with your workspace data.</p>
      ) : (
        <>
          {status.isPending && <p role="status">Checking AI availability…</p>}
          {error && (
            <p className="ai-error" role="alert">
              {error.message}{" "}
              <Button variant="outline" onClick={() => void refresh()}>
                Refresh
              </Button>
            </p>
          )}
          {status.data?.mode === "disabled" && (
            <p>AI is not configured on this server yet.</p>
          )}
          <div className="ai-card">
            <p>
              When enabled, selected operational summaries and your questions
              are sent to Google's Gemini API. AI recommendations need human
              review. Conversations are retained according to the server's
              retention setting.
            </p>
            {(me.data?.role === "BUSINESS_OWNER" ||
              me.data?.role === "ADMIN") && (
              <Button
                disabled={consent.isPending || status.isPending}
                onClick={() => consent.mutate(!status.data?.enabled)}
              >
                {status.data?.enabled
                  ? "Disable external AI analysis"
                  : "Enable external AI analysis"}
              </Button>
            )}
            {!status.data?.enabled && (
              <p>
                Your workspace owner must enable AI before you can ask
                questions.
              </p>
            )}
          </div>
          <div className="ai-actions">
            <label>
              Machine
              <select
                value={machine}
                onChange={(e) => setMachine(e.target.value)}
              >
                <option value="">All workspace machines</option>
                {machines.data?.items.map((m) => (
                  <option value={m.id} key={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Period
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              >
                {[1, 7, 30].map((d) => (
                  <option key={d} value={d}>
                    Last {d} days
                  </option>
                ))}
              </select>
            </label>
            <Button
              disabled={!ready || analyze.isPending}
              onClick={() => analyze.mutate()}
            >
              Analyze selected data
            </Button>
          </div>
          <div className="ai-actions">
            <label>
              Conversation
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
              >
                <option value="">New conversation</option>
                {sessions.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.created_at).toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="outline" onClick={() => setSession("")}>
              New chat
            </Button>
            {session && (
              <Button
                variant="outline"
                disabled={remove.isPending}
                onClick={() => {
                  if (
                    window.confirm("Delete this conversation and its messages?")
                  )
                    remove.mutate();
                }}
              >
                Delete conversation
              </Button>
            )}
          </div>
          <div aria-live="polite">
            {messages.isPending && session ? (
              <p>Loading conversation…</p>
            ) : (
              messages.data?.slice().reverse().map(renderJob)
            )}
            {!session && (
              <p>
                Ask about energy usage, idle time, alerts or maintenance
                priorities.
              </p>
            )}
          </div>
          <form
            className="ai-card"
            onSubmit={(e) => {
              e.preventDefault();
              if (ready && !busy && question.trim()) send.mutate();
            }}
          >
            <label htmlFor="ai-question">Your question</label>
            <textarea
              id="ai-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={4000}
              rows={4}
              placeholder="What should I investigate in this week's machine activity?"
            />
            <Button
              type="submit"
              disabled={!ready || !!busy || !question.trim()}
            >
              {busy ? "Analyzing…" : "Ask UrjaAI"}
            </Button>
          </form>
          <h2>Recent analyses</h2>
          {insights.data?.length ? (
            insights.data.map(renderJob)
          ) : (
            <p>
              No analyses yet. Select a machine and choose Analyze selected
              data.
            </p>
          )}
        </>
      )}
    </section>
  );
}
