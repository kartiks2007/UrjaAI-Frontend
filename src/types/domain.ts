export type MachineState = "OFF" | "IDLE" | "RUNNING" | "UNKNOWN";
export type DeviceStatus =
  "ONLINE" | "OFFLINE" | "SENSOR_ERROR" | "REVOKED" | "UNLINKED";
export type Role = "BUSINESS_OWNER" | "BUSINESS_USER" | "ADMIN";
export interface Organization {
  id: string;
  name: string;
  location?: string;
  business_details?: string;
  electricity_tariff_per_kwh: number | null;
  currency: string;
  emission_factor?: number | null;
  factor_source?: string;
  whatsapp_enabled?: boolean;
  whatsapp_number?: string;
}
export interface Me {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization: Organization | null;
}
export interface Device {
  id: string;
  device_uid: string;
  firmware_version: string | null;
  status: DeviceStatus;
  last_seen_at: string | null;
  last_telemetry_at: string | null;
}
export interface Machine {
  id: string;
  name: string;
  machine_type: string;
  manufacturer?: string;
  model?: string;
  description?: string;
  location?: string;
  machine_state: MachineState;
  state_is_stale: boolean;
  device_status: DeviceStatus;
  latest_power_w: number | null;
  energy_today_kwh: number | null;
  utilization_percent: number | null;
  last_seen_at: string | null;
  device?: Device | null;
  calibration?: Calibration | null;
}
export interface Telemetry {
  recorded_at: string;
  voltage_v: number | null;
  current_a: number | null;
  power_w: number | null;
  energy_kwh: number | null;
  frequency_hz: number | null;
  power_factor: number | null;
  data_quality: "VALID" | "STALE" | "SENSOR_ERROR" | "OUT_OF_RANGE";
}
export interface StatePeriod {
  id: string;
  state: MachineState;
  started_at: string;
  ended_at: string | null;
}
export interface Calibration {
  off_max_w: number;
  idle_max_w: number;
  hysteresis_w: number;
  minimum_duration_s: number;
  minimum_idle_s: number;
  version?: number;
  calibrated_at?: string;
}
export interface Summary {
  total_machines: number;
  running: number;
  idle: number;
  off: number;
  offline_devices: number;
  active_alerts: number;
  energy_today_kwh: number | null;
  current_load_w: number | null;
  estimated_cost: number | null;
  currency: string;
  utilization_percent: number | null;
  updated_at: string | null;
  power_history: Telemetry[];
  machines: Machine[];
}
export interface Alert {
  id: string;
  machine_id: string;
  machine_name: string;
  type: "SUSTAINED_IDLE" | "DEVICE_OFFLINE" | "SENSOR_ERROR";
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  started_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  notification_status: "PENDING" | "SENT" | "FAILED" | "DISABLED";
}
export interface Listing {
  id: string;
  machine_id?: string;
  can_manage: boolean;
  title: string;
  machine_type: string;
  description: string;
  location: string;
  owner_name: string;
  pricing_model: "ON_REQUEST" | "HOURLY";
  price: number | null;
  currency: string;
  status: "DRAFT" | "PUBLISHED" | "PAUSED" | "ARCHIVED";
  availability: Availability[];
}
export interface Availability {
  id: string;
  start_at: string;
  end_at: string;
}
export interface Booking {
  id: string;
  listing_id: string;
  machine_name: string;
  organization_name: string;
  requested_start: string;
  requested_end: string;
  status:
    | "REQUESTED"
    | "ACCEPTED"
    | "REJECTED"
    | "CONFIRMED"
    | "COMPLETED"
    | "CANCELLED";
  direction: "RECEIVED" | "SENT";
  can_accept: boolean;
  can_reject: boolean;
  can_cancel: boolean;
}
export interface Energy {
  energy_kwh: number | null;
  runtime_hours: number | null;
  idle_hours: number | null;
  utilization_percent: number | null;
  estimated_cost: number | null;
  currency: string;
  tariff: number | null;
  history: Telemetry[];
  by_machine: {
    id: string;
    name: string;
    energy_kwh: number;
    runtime_hours: number;
    idle_hours: number;
    utilization_percent: number | null;
  }[];
  carbon_kg?: number | null;
  factor_source?: string;
}
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
export interface AdminEntry {
  id: string;
  name?: string;
  email?: string;
  status?: string;
  action?: string;
  resource?: string;
  created_at?: string;
}
