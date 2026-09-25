export interface AiAnalysisReport {
  id: string;
  organization_id: string;
  report_type: "ON_DEMAND" | "SCHEDULED_HOURLY" | "SCHEDULED_DAILY" | "ALERT_TRIGGERED";
  headline: string;
  overall_health_score: number;
  total_power_factor_loss: number;
  sustained_idle_waste_kwh: number;
  currency: string;
  summary_markdown: string;
  anomalies_detected: Array<{
    type: string;
    machine_id?: string;
    severity: "CRITICAL" | "WARNING" | "INFO";
    message: string;
    suggested_action: string;
  }>;
  created_at: string;
}

export interface AiMachineInsight {
  id?: string;
  machine_id: string;
  machine_name?: string;
  health_score: number;
  efficiency_grade: "A" | "B" | "C" | "D";
  idle_waste_ratio: number;
  avg_power_factor: number;
  power_factor_loss_cost: number;
  flapping_risk: "LOW" | "MODERATE" | "HIGH";
  recommended_calibration: {
    off_max_w: number;
    idle_max_w: number;
    hysteresis_w: number;
    minimum_duration_s: number;
    minimum_idle_s: number;
    rationale: string;
  };
  key_findings: string[];
  actionable_steps: string[];
}

export interface AiChatSession {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  machine_id: string | null;
  machine_name?: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiChatMessage {
  id: string;
  session_id: string;
  sender: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  context_snapshot?: unknown;
  tokens_used: number;
  created_at: string;
}

export interface AiReanalysisTriggerRequest {
  trigger_type?: "ON_DEMAND" | "SCHEDULED_HOURLY" | "SCHEDULED_DAILY" | "ALERT_TRIGGERED";
  time_window?: {
    start_iso: string;
    end_iso: string;
  };
}
