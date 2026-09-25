import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Activity } from "lucide-react";
import type { Telemetry } from "../types/domain";
export default function TelemetryChart({
  data,
  metric = "power_w",
  unit = "W",
}: {
  data: Telemetry[];
  metric?: "power_w" | "current_a" | "energy_kwh";
  unit?: string;
}) {
  const valid = data.filter((row) => row.data_quality === "VALID");
  if (!valid.length)
    return (
      <div className="chart-empty">
        <div className="chart-grid" />
        <div>
          <span className="chart-empty-icon">
            <Activity size={24} />
          </span>
          <h3>Your machine’s story starts here</h3>
          <p>
            Connect a device to see measured{" "}
            {metric === "power_w"
              ? "power"
              : metric === "current_a"
                ? "current"
                : "energy"}{" "}
            over time.
          </p>
          <span>Awaiting telemetry</span>
        </div>
        <div className="chart-axis">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>
    );
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={valid}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e8ece8"
          />
          <XAxis
            dataKey="recorded_at"
            tickFormatter={(v) =>
              new Date(v).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            }
            tick={{ fontSize: 11 }}
            minTickGap={40}
          />
          <YAxis unit={` ${unit}`} tick={{ fontSize: 11 }} width={70} />
          <Tooltip
            labelFormatter={(v) => new Date(String(v)).toLocaleString()}
          />
          <Area
            type="linear"
            dataKey={metric}
            name={unit}
            stroke="#26715a"
            fill="#e5eee8"
            connectNulls={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      <details>
        <summary className="small">View chart data as a table</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Recorded</th>
                <th>{unit}</th>
              </tr>
            </thead>
            <tbody>
              {valid.map((row, i) => (
                <tr key={i}>
                  <td>{new Date(row.recorded_at).toLocaleString()}</td>
                  <td>{row[metric] ?? "Unavailable"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
