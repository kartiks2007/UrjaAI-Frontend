import { useState, useEffect, useRef, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Bot,
  Send,
  Sparkles,
  X,
  Plus,
  MessageSquare,
  Zap,
  Square,
  Loader2,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import {
  useAiChatSessions,
  useCreateAiChatSession,
  useAiChatMessages,
  streamChatMessage,
} from "../api/ai";
import { usePreview } from "../auth/AuthProvider";
import { Button } from "./ui/button";
import type { AiChatMessage } from "../types/ai";
import { date } from "../lib/utils";

interface AiChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId?: string | null;
  machineName?: string | null;
}

const GLOBAL_SUGGESTIONS = [
  "Summarize plant energy waste and power factor penalties.",
  "Which machines are running with low efficiency or flapping?",
  "How much cost can we save by eliminating sustained idle waste?",
  "Explain how ISO 50001 energy baselines apply to our facility.",
];

const MACHINE_SUGGESTIONS = [
  "Analyze this machine's power factor and calibration baselines.",
  "What is the recommended idle_max_w and hysteresis threshold?",
  "Are there flapping state transitions detected for this machine?",
  "Calculate the estimated monthly idle waste cost for this unit.",
];

export function AiChatDrawer({
  open,
  onOpenChange,
  machineId,
  machineName,
}: AiChatDrawerProps) {
  const preview = usePreview();
  const { data: sessions = [], isLoading: sessionsLoading } = useAiChatSessions();
  const createSession = useCreateAiChatSession();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionListOpen, setSessionListOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages for currently selected session
  const {
    data: persistedMessages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useAiChatMessages(selectedSessionId);

  // Auto-select latest session or create one if none exists
  useEffect(() => {
    if (!open) return;
    if (sessions.length > 0 && !selectedSessionId) {
      // If machineId is provided, prefer a session linked to this machine
      if (machineId) {
        const matching = sessions.find((s) => s.machine_id === machineId);
        if (matching) {
          setSelectedSessionId(matching.id);
          return;
        }
      }
      setSelectedSessionId(sessions[0].id);
    }
  }, [open, sessions, selectedSessionId, machineId]);

  // Combine persisted messages with currently streaming chunks
  const displayMessages = useMemo(() => {
    const list: Array<Partial<AiChatMessage>> = [...persistedMessages];
    if (isStreaming && streamedText) {
      list.push({
        id: "streaming-temp",
        sender: "ASSISTANT",
        content: streamedText,
        created_at: new Date().toISOString(),
      });
    }
    return list;
  }, [persistedMessages, isStreaming, streamedText]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, streamedText]);

  // Auto-resize input textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Create new session
  const handleCreateNewSession = async () => {
    if (preview) return;
    try {
      const title = machineName
        ? `${machineName} Diagnostic`
        : `Plant Analysis ${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;
      const newSession = await createSession.mutateAsync({
        title,
        machine_id: machineId || null,
      });
      setSelectedSessionId(newSession.id);
      setSessionListOpen(false);
      setStreamedText("");
      setStreamError(null);
    } catch (err) {
      setStreamError((err as Error).message || "Failed to create session");
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || isStreaming) return;

    if (preview) {
      setStreamError("Design preview mode is read-only. Connect backend for live AI copilot.");
      return;
    }

    let sessionId = selectedSessionId;
    if (!sessionId) {
      try {
        const title = machineName ? `${machineName} Inquiry` : message.slice(0, 36) + "…";
        const newSession = await createSession.mutateAsync({
          title,
          machine_id: machineId || null,
        });
        sessionId = newSession.id;
        setSelectedSessionId(sessionId);
      } catch (err) {
        setStreamError((err as Error).message || "Could not start chat session.");
        return;
      }
    }

    setInputMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setStreamError(null);
    setStreamedText("");
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await streamChatMessage(
        sessionId,
        message,
        (chunk) => {
          setStreamedText((prev) => prev + chunk);
        },
        abortController.signal,
      );
      // Finished streaming, refresh full message history from server
      await refetchMessages();
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setStreamError((err as Error).message || "Streaming failed.");
      }
    } finally {
      setIsStreaming(false);
      setStreamedText("");
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const currentSession = sessions.find((s) => s.id === selectedSessionId);
  const suggestions = machineId ? MACHINE_SUGGESTIONS : GLOBAL_SUGGESTIONS;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ai-chat-overlay" />
        <Dialog.Content className="ai-chat-drawer" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">UrjaAI Energy Copilot</Dialog.Title>

          {/* Drawer Header */}
          <div className="ai-drawer-header">
            <div className="ai-drawer-title-wrap">
              <div className="ai-brand-badge">
                <Sparkles size={16} className="text-green-light" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="ai-drawer-title">UrjaAI Copilot</h2>
                  <span className="ai-model-pill">Gemini 3.5 Flash-Lite</span>
                </div>
                <div className="ai-grounding-sub">
                  <span className="ai-pulse-dot" />
                  Zero-RAG Real-time SQL Grounded
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateNewSession}
                disabled={createSession.isPending || isStreaming}
                className="ai-new-chat-btn"
                title="Start new chat session"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
              <Dialog.Close asChild>
                <button className="ai-close-btn" aria-label="Close copilot">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Session Switcher Bar */}
          <div className="ai-session-bar">
            <button
              className="ai-session-selector"
              onClick={() => setSessionListOpen(!sessionListOpen)}
              type="button"
            >
              <MessageSquare size={13} />
              <span className="truncate">
                {currentSession
                  ? currentSession.title
                  : sessionsLoading
                    ? "Loading sessions…"
                    : "Select a chat session"}
              </span>
              <ChevronDown size={14} className={sessionListOpen ? "rotate-180" : ""} />
            </button>
            {machineName && (
              <span className="ai-machine-tag">
                <Zap size={11} />
                {machineName}
              </span>
            )}
          </div>

          {/* Session List Dropdown */}
          {sessionListOpen && (
            <div className="ai-session-dropdown">
              <div className="ai-dropdown-header">
                <span>Recent Sessions</span>
                <button onClick={handleCreateNewSession} className="text-link text-xs">
                  + New
                </button>
              </div>
              {sessions.length === 0 ? (
                <p className="p-3 text-xs text-muted">No past sessions found.</p>
              ) : (
                <div className="ai-session-list">
                  {sessions.map((sess) => (
                    <button
                      key={sess.id}
                      className={`ai-session-item ${sess.id === selectedSessionId ? "active" : ""}`}
                      onClick={() => {
                        setSelectedSessionId(sess.id);
                        setSessionListOpen(false);
                      }}
                    >
                      <div className="truncate font-medium">{sess.title}</div>
                      <div className="text-[10px] text-muted">{date(sess.created_at)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="ai-chat-messages">
            {displayMessages.length === 0 && !messagesLoading && (
              <div className="ai-welcome-box">
                <div className="ai-welcome-icon">
                  <Bot size={28} />
                </div>
                <h3>Intelligent Industrial Energy Copilot</h3>
                <p>
                  Ask questions about real-time machine telemetry, power factor penalties,
                  sustained idle waste, state calibrations, and ISO 50001 energy standards.
                </p>

                <div className="ai-suggestions-title">SUGGESTED INQUIRIES</div>
                <div className="ai-suggestions-grid">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      className="ai-suggestion-chip"
                      onClick={() => handleSendMessage(sug)}
                    >
                      <span>{sug}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messagesLoading && (
              <div className="ai-loading-messages">
                <Loader2 size={24} className="spin text-green" />
                <span>Fetching ground-truth telemetry history…</span>
              </div>
            )}

            {displayMessages.map((msg, index) => {
              const isUser = msg.sender === "USER";
              return (
                <div
                  key={msg.id || `msg-${index}`}
                  className={`ai-message-row ${isUser ? "user" : "assistant"}`}
                >
                  {!isUser && (
                    <div className="ai-avatar assistant">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className={`ai-message-bubble ${isUser ? "user" : "assistant"}`}>
                    <div className="ai-message-text">
                      <MarkdownFormatter content={msg.content || ""} />
                    </div>
                    <div className="ai-message-footer">
                      <span>{msg.created_at ? date(msg.created_at) : "Just now"}</span>
                      {!isUser && msg.tokens_used ? (
                        <span>· {msg.tokens_used} tokens</span>
                      ) : null}
                    </div>
                  </div>
                  {isUser && (
                    <div className="ai-avatar user">
                      <span>U</span>
                    </div>
                  )}
                </div>
              );
            })}

            {isStreaming && (
              <div className="ai-streaming-indicator">
                <span className="ai-stream-dot" />
                <span>Gemini is synthesizing multi-dimensional plant metrics…</span>
              </div>
            )}

            {streamError && (
              <div className="ai-error-banner">
                <AlertCircle size={16} />
                <div>
                  <strong>AI Response Error</strong>
                  <p>{streamError}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (when messages exist) */}
          {displayMessages.length > 0 && !isStreaming && (
            <div className="ai-chips-bar">
              {suggestions.slice(0, 2).map((sug) => (
                <button
                  key={sug}
                  className="ai-mini-chip"
                  onClick={() => handleSendMessage(sug)}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Footer */}
          <div className="ai-chat-input-wrap">
            {preview && (
              <div className="ai-preview-warning">
                Preview Mode: Read-only visual inspection. Live AI backend is simulated.
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="ai-input-form"
            >
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleTextareaChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  machineName
                    ? `Ask about ${machineName}'s calibration, power factor, or state…`
                    : "Ask about plant telemetry, idle waste, power factor, calibration…"
                }
                rows={1}
                disabled={isStreaming}
                className="ai-chat-textarea"
              />

              <div className="ai-input-actions">
                {isStreaming ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStopStreaming}
                    className="ai-stop-btn"
                  >
                    <Square size={13} fill="currentColor" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputMessage.trim() || isStreaming}
                    className="ai-send-btn"
                  >
                    <Send size={15} />
                  </Button>
                )}
              </div>
            </form>
            <div className="ai-input-disclaimer">
              Powered by Google Gemini 3.5 Flash-Lite. Grounded with live PostgreSQL telemetry data.
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/**
 * Clean markdown formatter for AI assistant responses
 */
function MarkdownFormatter({ content }: { content: string }) {
  const parts = useMemo(() => {
    if (!content) return [];
    // Split by code blocks first
    const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g;
    const tokens: Array<{ type: "code" | "text"; content: string; lang?: string }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({
          type: "text",
          content: content.slice(lastIndex, match.index),
        });
      }
      tokens.push({
        type: "code",
        lang: match[1],
        content: match[2],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      tokens.push({
        type: "text",
        content: content.slice(lastIndex),
      });
    }

    return tokens;
  }, [content]);

  return (
    <div className="ai-markdown-content">
      {parts.map((token, idx) => {
        if (token.type === "code") {
          return (
            <pre key={idx} className="ai-code-block">
              {token.lang && <div className="ai-code-lang">{token.lang}</div>}
              <code>{token.content}</code>
            </pre>
          );
        }

        // Parse paragraphs, headers, and bullet points
        const lines = token.content.split("\n");
        return (
          <div key={idx} className="ai-text-block">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={lineIdx} className="h-2" />;
              }

              // Headers
              if (trimmed.startsWith("### ")) {
                return (
                  <h4 key={lineIdx} className="ai-md-h3">
                    {formatInline(trimmed.replace(/^###\s+/, ""))}
                  </h4>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h3 key={lineIdx} className="ai-md-h2">
                    {formatInline(trimmed.replace(/^##\s+/, ""))}
                  </h3>
                );
              }
              if (trimmed.startsWith("# ")) {
                return (
                  <h2 key={lineIdx} className="ai-md-h1">
                    {formatInline(trimmed.replace(/^#\s+/, ""))}
                  </h2>
                );
              }

              // Bullet points
              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lineIdx} className="ai-md-bullet">
                    <span className="ai-bullet-dot">•</span>
                    <span>{formatInline(trimmed.replace(/^[-*]\s+/, ""))}</span>
                  </div>
                );
              }

              // Numbered list
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lineIdx} className="ai-md-numbered">
                    <span className="ai-num-label">{numMatch[1]}.</span>
                    <span>{formatInline(numMatch[2])}</span>
                  </div>
                );
              }

              return (
                <p key={lineIdx} className="ai-md-p">
                  {formatInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Parses bold **text**, inline `code`, and highlighting
 */
function formatInline(text: string) {
  const inlineRegex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(inlineRegex);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="ai-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
