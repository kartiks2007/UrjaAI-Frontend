import { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  ChevronRight,
  Bot,
  Clock,
  Layers,
} from "lucide-react";
import { useLatestAiReport, useRunAiReanalysis } from "../api/ai";
import { usePreview } from "../auth/AuthProvider";
import { Button } from "./ui/button";
import { date, money, number } from "../lib/utils";

interface AiInsightsBannerProps {
  onOpenChat?: () => void;
}

export function AiInsightsBanner({ onOpenChat }: AiInsightsBannerProps) {
  const preview = usePreview();
  const { data: report, isLoading, refetch } = useLatestAiReport();
  const reanalysis = useRunAiReanalysis();
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRunReanalysis = async () => {
    if (preview) {
      setActionError("Design review is read-only. Connect live backend for AI re-analysis.");
      return;
    }
    setActionError(null);
    try {
      await reanalysis.mutateAsync({ trigger_type: "ON_DEMAND" });
      await refetch();
    } catch (err) {
      setActionError((err as Error).message || "Failed to trigger AI re-analysis.");
    }
  };

  const healthScore = report?.overall_health_score ?? 0;
  const scoreColor =
    healthScore >= 80 ? "text-[#2e7d32]" : healthScore >= 60 ? "text-[#f57c00]" : "text-[#d32f2f]";
  const scoreBg =
    healthScore >= 80 ? "bg-[#edf7ed] border-[#c8e6c9]" : healthScore >= 60 ? "bg-[#fff8e1] border-[#ffe082]" : "bg-[#fdecea] border-[#ffcdd2]";

  if (isLoading) {
    return (
      <div className="ai-banner-card loading">
        <div className="flex items-center gap-3">
          <div className="ai-brand-badge animate-pulse">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Evaluating Multi-Dimensional Plant Telemetry…</h3>
            <p className="text-xs text-muted">Synthesizing power factor, idle durations, and tariff impacts with Gemini 3.5 Flash-Lite</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="ai-banner-card empty">
        <div className="ai-banner-header">
          <div className="flex items-center gap-2.5">
            <div className="ai-brand-badge">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="ai-banner-title">Zero-RAG AI Diagnostic Engine</h3>
                <span className="ai-model-pill">Gemini 3.5 Flash-Lite</span>
              </div>
              <p className="ai-banner-sub">
                Execute deep multi-dimensional telemetry re-analysis for power factor losses, flapping, and idle waste.
              </p>
            </div>
          </div>

          <Button
            onClick={handleRunReanalysis}
            disabled={reanalysis.isPending}
            className="ai-reanalyze-btn"
          >
            <RefreshCw size={14} className={reanalysis.isPending ? "spin" : ""} />
            {reanalysis.isPending ? "Analyzing Telemetry…" : "Run Initial AI Diagnostic"}
          </Button>
        </div>
      </div>
    );
  }

  const allAnomalies = Array.isArray(report.anomalies_detected) ? report.anomalies_detected : [];
  const criticalAnomalies = allAnomalies.filter((a) => a && a.severity === "CRITICAL");
  const warningAnomalies = allAnomalies.filter((a) => a && a.severity === "WARNING");

  return (
    <section className="ai-banner-card" aria-label="AI Diagnostics & Plant Intelligence">
      {/* Header Bar */}
      <div className="ai-banner-header">
        <div className="flex items-start gap-3">
          <div className="ai-brand-badge">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="ai-banner-eyebrow">INTELLIGENT DIAGNOSTICS</span>
              <span className="ai-model-pill">Gemini 3.5 Flash-Lite</span>
              <span className="ai-report-badge">
                <Clock size={11} />
                {report.report_type.replace("_", " ")} · {date(report.created_at)}
              </span>
            </div>
            <h2 className="ai-banner-headline">{report.headline}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {onOpenChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenChat}
              className="ai-copilot-launch-btn"
            >
              <Bot size={14} />
              <span>Ask Copilot</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleRunReanalysis}
            disabled={reanalysis.isPending}
            className="ai-reanalyze-btn"
            title="Trigger full plant telemetry re-evaluation"
          >
            <RefreshCw size={13} className={reanalysis.isPending ? "spin" : ""} />
            <span>{reanalysis.isPending ? "Re-evaluating…" : "Re-analyze"}</span>
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="ai-error-banner mt-3">
          <AlertTriangle size={15} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Primary Diagnostic Metrics Grid */}
      <div className="ai-metrics-row">
        {/* Health Score Card */}
        <div className={`ai-metric-pill ${scoreBg}`}>
          <div className="ai-metric-pill-label">PLANT HEALTH SCORE</div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {healthScore}
            </span>
            <span className="text-xs text-muted">/ 100</span>
          </div>
          <div className="ai-metric-pill-sub">
            {healthScore >= 80
              ? "Optimal Efficiency"
              : healthScore >= 60
                ? "Sub-optimal Baselines"
                : "Urgent Action Required"}
          </div>
        </div>

        {/* Power Factor Loss */}
        <div className="ai-metric-pill">
          <div className="ai-metric-pill-label">EST. POWER FACTOR LOSS</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#b71c1c]">
              {money(report.total_power_factor_loss, report.currency)}
            </span>
            <span className="text-xs text-muted">/ mo</span>
          </div>
          <div className="ai-metric-pill-sub text-[#c62828]">
            <TrendingDown size={12} className="inline mr-1" />
            Reactive power penalty risk
          </div>
        </div>

        {/* Idle Waste */}
        <div className="ai-metric-pill">
          <div className="ai-metric-pill-label">SUSTAINED IDLE WASTE</div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#e65100]">
              {number(report.sustained_idle_waste_kwh, 1)}
            </span>
            <span className="text-xs text-muted">kWh</span>
          </div>
          <div className="ai-metric-pill-sub">
            From uncalibrated idle states
          </div>
        </div>

        {/* Anomaly Summary */}
        <div className="ai-metric-pill">
          <div className="ai-metric-pill-label">ANOMALIES DETECTED</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold">
              {report.anomalies_detected.length}
            </span>
            <span className="text-xs text-muted">
              ({criticalAnomalies.length} Critical · {warningAnomalies.length} Warning)
            </span>
          </div>
          <div className="ai-metric-pill-sub">
            Telemetry & threshold flags
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      {report.anomalies_detected.length > 0 && (
        <div className="ai-anomalies-section">
          <div className="ai-section-title">
            <Layers size={13} />
            DETECTED ANOMALIES & RECOMMENDED ACTIONS
          </div>
          <div className="ai-anomaly-list">
            {report.anomalies_detected.map((anomaly, i) => {
              const isCrit = anomaly.severity === "CRITICAL";
              return (
                <div
                  key={i}
                  className={`ai-anomaly-item ${isCrit ? "critical" : anomaly.severity === "WARNING" ? "warning" : "info"}`}
                >
                  <div className="ai-anomaly-badge-wrap">
                    <span className={`ai-severity-badge ${anomaly.severity.toLowerCase()}`}>
                      {anomaly.severity}
                    </span>
                    <span className="ai-anomaly-type">{anomaly.type}</span>
                  </div>
                  <div className="ai-anomaly-content">
                    <p className="ai-anomaly-msg">{anomaly.message}</p>
                    {anomaly.suggested_action && (
                      <p className="ai-anomaly-action">
                        <strong>Action:</strong> {anomaly.suggested_action}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Executive Summary Markdown Excerpt */}
      {report.summary_markdown && (
        <div className="ai-summary-collapsible">
          <button
            type="button"
            className="ai-summary-toggle"
            onClick={() => setShowFullSummary(!showFullSummary)}
          >
            <span>{showFullSummary ? "Hide Detailed Diagnostic Summary" : "View Full AI Analysis Report"}</span>
            <ChevronRight size={14} className={showFullSummary ? "rotate-90" : ""} />
          </button>

          {showFullSummary && (
            <div className="ai-summary-body">
              <div className="prose prose-sm max-w-none text-xs text-foreground/90 whitespace-pre-line leading-relaxed">
                {report.summary_markdown}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
