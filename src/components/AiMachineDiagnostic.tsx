import { useState } from "react";
import {
  Sparkles,
  Bot,
  Sliders,
  Zap,
  Check,
  Loader2,
} from "lucide-react";
import { useMachineAiInsights } from "../api/ai";
import { useAction } from "../api/hooks";
import { usePreview } from "../auth/AuthProvider";
import { Button } from "./ui/button";
import { Feedback } from "./ui";
import type { Machine } from "../types/domain";
import { number } from "../lib/utils";

interface AiMachineDiagnosticProps {
  machine: Machine;
  onOpenChat?: (machineId: string, machineName: string) => void;
}

export function AiMachineDiagnostic({
  machine,
  onOpenChat,
}: AiMachineDiagnosticProps) {
  const preview = usePreview();
  const { data: insight, isLoading, error } = useMachineAiInsights(machine.id);
  const updateCalibration = useAction(`/machines/${machine.id}/calibration`);

  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const recCal = insight?.recommended_calibration;

  const handleApplyCalibration = async () => {
    if (!recCal) return;
    if (preview) {
      setApplyError("Design review is read-only. Connect live backend to apply calibrations.");
      return;
    }

    setApplyError(null);
    try {
      await updateCalibration.mutateAsync({
        off_max_w: recCal.off_max_w ?? 50,
        idle_max_w: recCal.idle_max_w ?? 250,
        hysteresis_w: recCal.hysteresis_w ?? 2,
        minimum_duration_s: recCal.minimum_duration_s ?? 3,
        minimum_idle_s: recCal.minimum_idle_s ?? 300,
      });
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 5000);
    } catch (err) {
      setApplyError((err as Error).message || "Failed to update machine calibration.");
    }
  };

  if (isLoading) {
    return (
      <div className="ai-diagnostic-card loading">
        <Loader2 size={20} className="spin text-green" />
        <div>
          <h4 className="font-semibold text-sm">Evaluating Machine Baselines with Gemini…</h4>
          <p className="text-xs text-muted">Calculating power factor loss, flapping risk, and threshold recommendations.</p>
        </div>
      </div>
    );
  }

  const isValidInsight =
    Boolean(insight) &&
    typeof insight === "object" &&
    !Array.isArray(insight) &&
    (Array.isArray((insight as any).key_findings) || typeof (insight as any).health_score === "number");

  if (error || !isValidInsight) {
    return (
      <div className="ai-diagnostic-card empty">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-green" />
            <span className="text-xs font-semibold">AI Machine Diagnostic</span>
          </div>
          <span className="text-xs text-muted">Awaiting telemetry sample aggregation</span>
        </div>
      </div>
    );
  }

  const efficiencyGrade = insight?.efficiency_grade || "B";
  const flappingRisk = insight?.flapping_risk || "LOW";
  const healthScore = typeof insight?.health_score === "number" ? insight.health_score : 100;
  const avgPf = typeof insight?.avg_power_factor === "number" ? insight.avg_power_factor : 0.95;
  const idleWasteRatio = typeof insight?.idle_waste_ratio === "number" ? insight.idle_waste_ratio : 0;
  const keyFindings = Array.isArray(insight?.key_findings) ? insight.key_findings : [];
  const actionableSteps = Array.isArray(insight?.actionable_steps) ? insight.actionable_steps : [];

  const gradeColor =
    efficiencyGrade === "A"
      ? "bg-[#edf7ed] text-[#2e7d32] border-[#c8e6c9]"
      : efficiencyGrade === "B"
        ? "bg-[#e8f5e9] text-[#388e3c] border-[#a5d6a7]"
        : efficiencyGrade === "C"
          ? "bg-[#fff8e1] text-[#f57c00] border-[#ffe082]"
          : "bg-[#fdecea] text-[#d32f2f] border-[#ffcdd2]";

  const flappingBadge =
    flappingRisk === "HIGH"
      ? "bg-[#fdecea] text-[#d32f2f] border-[#ffcdd2]"
      : flappingRisk === "MODERATE"
        ? "bg-[#fff8e1] text-[#f57c00] border-[#ffe082]"
        : "bg-[#edf7ed] text-[#2e7d32] border-[#c8e6c9]";

  return (
    <div className="ai-machine-diagnostic-wrap">
      <div className="ai-diagnostic-header">
        <div className="flex items-center gap-2.5">
          <div className="ai-brand-badge">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">AI Intelligence & Calibration</h3>
              <span className="ai-model-pill">Gemini 3.5 Flash-Lite</span>
            </div>
            <p className="text-xs text-muted">Multi-dimensional diagnostic for {machine.name}</p>
          </div>
        </div>

        {onOpenChat && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChat(machine.id, machine.name)}
            className="ai-machine-chat-btn"
          >
            <Bot size={13} />
            <span>Consult Copilot</span>
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="ai-diagnostic-metrics">
        <div className="ai-diag-pill">
          <span className="ai-diag-pill-label">EFFICIENCY GRADE</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`ai-grade-badge ${gradeColor}`}>
              Grade {efficiencyGrade}
            </span>
            <span className="text-xs font-semibold">{healthScore}/100</span>
          </div>
        </div>

        <div className="ai-diag-pill">
          <span className="ai-diag-pill-label">FLAPPING RISK</span>
          <div className="mt-1">
            <span className={`ai-severity-badge ${flappingBadge}`}>
              {flappingRisk} RISK
            </span>
          </div>
        </div>

        <div className="ai-diag-pill">
          <span className="ai-diag-pill-label">AVG POWER FACTOR</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-base font-bold ${avgPf < 0.9 ? "text-[#c62828]" : "text-foreground"}`}>
              {number(avgPf, 2)}
            </span>
            {avgPf < 0.9 && (
              <span className="text-[10px] text-[#c62828] font-medium">(Penalty zone)</span>
            )}
          </div>
        </div>

        <div className="ai-diag-pill">
          <span className="ai-diag-pill-label">IDLE WASTE RATIO</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-base font-bold text-[#e65100]">
              {number(idleWasteRatio * 100, 1)}%
            </span>
            <span className="text-[10px] text-muted">of runtime</span>
          </div>
        </div>
      </div>

      {/* Findings & Steps */}
      <div className="ai-findings-grid">
        <div className="ai-findings-card">
          <h4 className="ai-findings-heading">Key Diagnostic Observations</h4>
          <ul className="ai-findings-list">
            {keyFindings.length > 0 ? (
              keyFindings.map((finding, idx) => (
                <li key={idx}>
                  <span className="ai-bullet">•</span>
                  <span>{finding}</span>
                </li>
              ))
            ) : (
              <li>
                <span className="ai-bullet">•</span>
                <span>Telemetry parameters within standard tolerances.</span>
              </li>
            )}
          </ul>
        </div>

        <div className="ai-findings-card">
          <h4 className="ai-findings-heading">Optimization Checklist</h4>
          <ul className="ai-findings-list">
            {actionableSteps.length > 0 ? (
              actionableSteps.map((step, idx) => (
                <li key={idx}>
                  <span className="ai-num">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))
            ) : (
              <li>
                <span className="ai-num">1.</span>
                <span>Continue ongoing monitoring of operational state transitions.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Recommended Calibration Box */}
      {recCal && (
        <div className="ai-calibration-box">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sliders size={15} className="text-green" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-green-dark">
                AI-Calculated Calibration Baselines
              </h4>
            </div>

            <Button
              size="sm"
              onClick={handleApplyCalibration}
              disabled={updateCalibration.isPending || preview}
              className="ai-apply-cal-btn"
            >
              {updateCalibration.isPending ? (
                <>
                  <Loader2 size={13} className="spin" />
                  Applying…
                </>
              ) : appliedSuccess ? (
                <>
                  <Check size={13} />
                  Calibration Applied!
                </>
              ) : (
                <>
                  <Zap size={13} />
                  1-Click Apply AI Baselines
                </>
              )}
            </Button>
          </div>

          {recCal.rationale && (
            <p className="ai-calibration-rationale">
              <strong>Rationale:</strong> {recCal.rationale}
            </p>
          )}

          <div className="ai-calibration-table-wrap">
            <table className="ai-cal-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Current Value</th>
                  <th>AI Recommended</th>
                  <th>Delta / Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>OFF Upper Threshold (off_max_w)</td>
                  <td>{machine.calibration?.off_max_w ?? "—"} W</td>
                  <td className="font-semibold text-green-dark">
                    {recCal.off_max_w ?? "—"} W
                  </td>
                  <td>
                    {machine.calibration?.off_max_w != null && recCal.off_max_w != null
                      ? `${recCal.off_max_w - machine.calibration.off_max_w > 0 ? "+" : ""}${recCal.off_max_w - machine.calibration.off_max_w} W`
                      : "New baseline"}
                  </td>
                </tr>
                <tr>
                  <td>IDLE Upper Threshold (idle_max_w)</td>
                  <td>{machine.calibration?.idle_max_w ?? "—"} W</td>
                  <td className="font-semibold text-green-dark">
                    {recCal.idle_max_w ?? "—"} W
                  </td>
                  <td>
                    {machine.calibration?.idle_max_w != null && recCal.idle_max_w != null
                      ? `${recCal.idle_max_w - machine.calibration.idle_max_w > 0 ? "+" : ""}${recCal.idle_max_w - machine.calibration.idle_max_w} W`
                      : "New baseline"}
                  </td>
                </tr>
                <tr>
                  <td>Hysteresis Buffer (hysteresis_w)</td>
                  <td>{machine.calibration?.hysteresis_w ?? "—"} W</td>
                  <td className="font-semibold text-green-dark">
                    {recCal.hysteresis_w ?? "—"} W
                  </td>
                  <td>Eliminates noise flapping</td>
                </tr>
                <tr>
                  <td>Transition Duration (minimum_duration_s)</td>
                  <td>{machine.calibration?.minimum_duration_s ?? "—"} s</td>
                  <td className="font-semibold text-green-dark">
                    {recCal.minimum_duration_s ?? "—"} s
                  </td>
                  <td>Transient suppression</td>
                </tr>
                <tr>
                  <td>Sustained Idle Alert (minimum_idle_s)</td>
                  <td>{machine.calibration?.minimum_idle_s ?? "—"} s</td>
                  <td className="font-semibold text-green-dark">
                    {recCal.minimum_idle_s ?? "—"} s
                  </td>
                  <td>ISO 50001 Waste Alarm</td>
                </tr>
              </tbody>
            </table>
          </div>

          {appliedSuccess && (
            <div className="mt-3">
              <Feedback kind="success" title="Machine Calibration Baselines Updated Successfully">
                The machine state evaluation engine will immediately use these new thresholds for state transitions and alert triggers.
              </Feedback>
            </div>
          )}

          {applyError && (
            <div className="mt-3">
              <Feedback kind="error" title={applyError} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
