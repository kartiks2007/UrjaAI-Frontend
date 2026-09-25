import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request, ApiError } from "./client";
import { supabase } from "../lib/supabase";
import { API_BASE_URL, SESSION_EXPIRED_EVENT } from "../lib/config";
import { useAuth, usePreview } from "../auth/AuthProvider";
import type {
  AiAnalysisReport,
  AiMachineInsight,
  AiChatSession,
  AiChatMessage,
  AiReanalysisTriggerRequest,
} from "../types/ai";

/**
 * Fetch the latest AI multi-dimensional analysis report.
 */
export function useLatestAiReport(refresh = false) {
  const preview = usePreview();
  const { session } = useAuth();
  return useQuery<AiAnalysisReport | null>({
    queryKey: ["/ai/reports/latest", session?.user.id],
    queryFn: ({ signal }) => request<AiAnalysisReport | null>("/ai/reports/latest", { signal }),
    enabled: !!session && !preview,
    refetchInterval: refresh ? 60000 : false,
  });
}

/**
 * Trigger an on-demand AI diagnostic re-analysis.
 */
export function useRunAiReanalysis() {
  const cache = useQueryClient();
  const preview = usePreview();
  return useMutation({
    mutationFn: (body?: AiReanalysisTriggerRequest) => {
      if (preview) {
        throw new ApiError("Design review is read-only. Connect the backend to trigger AI re-analysis.");
      }
      return request<AiAnalysisReport>("/ai/reanalysis", {
        method: "POST",
        body: JSON.stringify(body || { trigger_type: "ON_DEMAND" }),
      });
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["/ai/reports/latest"] });
      cache.invalidateQueries({ queryKey: ["/dashboard"] });
      cache.invalidateQueries({ queryKey: ["/machines"] });
    },
  });
}

/**
 * Fetch AI machine-specific diagnostic insights.
 */
export function useMachineAiInsights(machineId: string | undefined, enabled = true) {
  const preview = usePreview();
  const { session } = useAuth();
  return useQuery<AiMachineInsight>({
    queryKey: [`/ai/machines/${machineId}/insights`, session?.user.id],
    queryFn: ({ signal }) => request<AiMachineInsight>(`/ai/machines/${machineId}/insights`, { signal }),
    enabled: enabled && !!session && !preview && !!machineId,
  });
}

/**
 * List active AI chat sessions.
 */
export function useAiChatSessions() {
  const preview = usePreview();
  const { session } = useAuth();
  return useQuery<AiChatSession[]>({
    queryKey: ["/ai/chat/sessions", session?.user.id],
    queryFn: ({ signal }) => request<AiChatSession[]>("/ai/chat/sessions", { signal }),
    enabled: !!session && !preview,
  });
}

/**
 * Create a new AI chat session.
 */
export function useCreateAiChatSession() {
  const cache = useQueryClient();
  const preview = usePreview();
  return useMutation({
    mutationFn: (params: { title?: string; machine_id?: string | null }) => {
      if (preview) {
        throw new ApiError("Design review is read-only.");
      }
      return request<AiChatSession>("/ai/chat/sessions", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["/ai/chat/sessions"] });
    },
  });
}

/**
 * Fetch messages for an AI chat session.
 */
export function useAiChatMessages(sessionId: string | null | undefined) {
  const preview = usePreview();
  const { session } = useAuth();
  return useQuery<AiChatMessage[]>({
    queryKey: [`/ai/chat/sessions/${sessionId}/messages`, session?.user.id],
    queryFn: ({ signal }) =>
      sessionId
        ? request<AiChatMessage[]>(`/ai/chat/sessions/${sessionId}/messages`, { signal })
        : Promise.resolve([]),
    enabled: !!sessionId && !!session && !preview,
  });
}

/**
 * Stream an interactive chat response from the zero-RAG AI endpoint via SSE.
 */
export async function streamChatMessage(
  sessionId: string,
  message: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<{ messageId?: string; responseText?: string; tokensUsed?: number }> {
  const base = API_BASE_URL;
  if (!base) throw new ApiError("API URL is not configured.", 0, "NOT_CONFIGURED");

  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  if (!session) {
    throw new ApiError("Your session has expired. Please sign in again.", 401, "UNAUTHENTICATED");
  }

  const response = await fetch(`${base}/ai/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    let errBody: { error?: { message?: string } } | null = null;
    try {
      errBody = await response.json();
    } catch {
      // ignore
    }
    throw new ApiError(
      errBody?.error?.message ?? "Failed to stream chat message.",
      response.status,
      "STREAM_ERROR",
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new ApiError("No readable stream in response.", 0, "STREAM_ERROR");

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: { messageId?: string; responseText?: string; tokensUsed?: number } = {};

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, "");
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.chunk) {
            onChunk(parsed.chunk);
          }
          if (parsed.done) {
            finalResult = {
              messageId: parsed.messageId,
              responseText: parsed.responseText,
              tokensUsed: parsed.tokensUsed,
            };
          }
          if (parsed.error) {
            throw new Error(parsed.error);
          }
        } catch (e) {
          if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
            // Re-throw genuine errors
            if (e.message.startsWith("I encountered") || !e.message.includes("JSON")) {
              throw e;
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return finalResult;
}
