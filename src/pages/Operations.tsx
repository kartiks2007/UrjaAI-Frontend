import { lazy, Suspense, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bell, Download, FileText, Zap } from "lucide-react";
import { useAction, useResource } from "../api/hooks";
import { queryString } from "../api/client";
import { useAppPath, useMe, usePreview } from "../auth/AuthProvider";
import type { Alert, Energy, Page, Machine } from "../types/domain";
import { date, label, money, number } from "../lib/utils";
import {
  Button,
  Empty,
  Feedback,
  Metric,
  PageHeader,
  Panel,
  Status,
} from "../components/ui";
import { ResourceState } from "../components/ResourceState";
import { DateFilter, useRange } from "../components/DateFilter";
const Chart = lazy(() => import("../components/TelemetryChart"));
export function EnergyPage() {
  const range = useRange();
  const query = useResource<Energy>("/energy?" + queryString(range));
  const data = query.data;
  return (
    <>
      <PageHeader
        eyebrow="ENERGY INTELLIGENCE"
        title="Every kilowatt, understood."
        description="See consumption, operating time and estimated costs across your organization."
        action={<DateFilter />}
      />
      <ResourceState query={query}>
        <div className="metric-grid">
          <Metric
            label="ENERGY CONSUMED"
            value={number(data?.energy_kwh)}
            unit="kWh"
            note="From recorded measurements"
          />
          <Metric
            label="PRODUCTIVE RUNTIME"
            value={number(data?.runtime_hours)}
            unit="hrs"
          />
          <Metric
            label="IDLE DURATION"
            value={number(data?.idle_hours)}
            unit="hrs"
          />
          <Metric
            label="ESTIMATED COST"
            value={money(data?.estimated_cost, data?.currency)}
            note={
              data?.tariff != null
                ? `${money(data.tariff, data.currency)} per kWh`
                : "Configure your electricity tariff"
            }
          />
        </div>
        <Panel
          title="Energy consumption"
          description="Measured energy increments per hour, calculated from your devices"
        >
          <Suspense fallback={<p>Loading chart…</p>}>
            <Chart data={data?.history ?? []} metric="energy_kwh" unit="kWh" />
          </Suspense>
        </Panel>
        <Panel
          title="Energy by machine"
          description="Compare consumption across monitored equipment"
        >
          {data?.by_machine.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>Energy (kWh)</th>
                    <th>Runtime (hrs)</th>
                    <th>Idle (hrs)</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {data.by_machine.map((m) => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{number(m.energy_kwh)}</td>
                      <td>{number(m.runtime_hours)}</td>
                      <td>{number(m.idle_hours)}</td>
                      <td>{number(m.utilization_percent)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon={Zap}
              title="Energy insights need measurements"
              description="Connect a calibrated machine to see consumption and operating time here."
            />
          )}
        </Panel>
        {data?.carbon_kg != null && data.factor_source && (
          <Feedback
            kind="info"
            title={`Calculated carbon estimate: ${number(data.carbon_kg)} kg CO₂e`}
          >
            Factor source: {data.factor_source}. This is a calculated estimate,
            not a verified emissions reduction.
          </Feedback>
        )}
      </ResourceState>
    </>
  );
}
function AlertActions({ alert }: { alert: Alert }) {
  const ack = useAction(`/alerts/${alert.id}/acknowledge`);
  const resolve = useAction(`/alerts/${alert.id}/resolve`);
  const me = useMe();
  const authorized =
    me.data?.role === "BUSINESS_OWNER" || me.data?.role === "ADMIN";
  return (
    <>
      <div className="row-actions">
        {!alert.acknowledged_at && (
          <Button
            size="sm"
            variant="outline"
            disabled={!authorized || ack.isPending}
            onClick={() => ack.mutate({})}
          >
            Acknowledge
          </Button>
        )}
        {!alert.resolved_at && (
          <Button
            size="sm"
            variant="ghost"
            disabled={!authorized || resolve.isPending}
            onClick={() => resolve.mutate({})}
          >
            Resolve
          </Button>
        )}
      </div>
      {(ack.error || resolve.error) && (
        <span role="alert" className="field-error">
          {(ack.error || resolve.error)?.message}
        </span>
      )}
    </>
  );
}
export function AlertsPage() {
  const path = useAppPath();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "ACTIVE";
  const query = useResource<Page<Alert>>(
    "/alerts?" + queryString({ status, page_size: 50 }),
    true,
  );
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONAL ATTENTION"
        title="Alerts"
        description="Useful signals from your equipment, without the noise."
      />
      <div className="tabs" aria-label="Alert filters">
        {["ACTIVE", "ACKNOWLEDGED", "RESOLVED", "ALL"].map((s) => (
          <button
            key={s}
            className={s === status ? "selected" : ""}
            onClick={() => setParams({ status: s })}
          >
            {label(s)}
          </button>
        ))}
      </div>
      <Panel
        title="Machine alerts"
        description="Sustained idle · Device offline · Sensor error"
      >
        <ResourceState query={query}>
          {query.data?.items.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Alert</th>
                    <th>Machine</th>
                    <th>Started</th>
                    <th>Notification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Status value={a.severity} />
                        <strong>{label(a.type)}</strong>
                        <p>{a.message}</p>
                      </td>
                      <td>
                        <Link to={path("/machines/" + a.machine_id)}>
                          {a.machine_name}
                        </Link>
                      </td>
                      <td>{date(a.started_at)}</td>
                      <td>
                        <Status value={a.notification_status} />
                      </td>
                      <td>
                        <AlertActions alert={a} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon={Bell}
              title="Nothing needs your attention here"
              description="Alerts appear when monitored machines meet your configured rules. Device connection loss never means machine OFF."
            />
          )}
        </ResourceState>
      </Panel>
      <Feedback kind="info" title="Owner decisions stay with the owner">
        An idle alert is a suggestion to review capacity. It never publishes a
        machine automatically.
      </Feedback>
    </>
  );
}
export function ReportsPage() {
  const range = useRange();
  const preview = usePreview();
  const [params, setParams] = useSearchParams();
  const machines = useResource<Page<Machine>>("/machines?page_size=100");
  const [generated, setGenerated] = useState<{
    from: string;
    to: string;
    machine_id: string;
  } | null>(null);
  const report = useResource<Energy>(
    "/reports?" +
      queryString(
        generated ?? { ...range, machine_id: params.get("machine_id") ?? "" },
      ),
    false,
    generated !== null,
  );
  const data = report.data;
  function exportCsv() {
    if (!data) return;
    const escape = (value: unknown) => {
      let s = String(value ?? "");
      if (/^[=+@-]/.test(s)) s = "'" + s;
      return '"' + s.replaceAll('"', '""') + '"';
    };
    const rows = [
      [
        "Machine",
        "Energy kWh",
        "Runtime hours",
        "Idle hours",
        "Utilization percent",
      ],
      ...data.by_machine.map((m) => [
        m.name,
        m.energy_kwh,
        m.runtime_hours,
        m.idle_hours,
        m.utilization_percent,
      ]),
    ];
    const blob = new Blob(
      [rows.map((r) => r.map(escape).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urjaai-report-${generated?.from}-${generated?.to}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <PageHeader
        eyebrow="OPERATIONAL REPORTING"
        title="From data to decisions."
        description="Review recorded energy, runtime and utilization for the period that matters."
      />
      <Panel title="Report period">
        <div className="toolbar report-toolbar">
          <DateFilter />
          <label className="compact-field">
            Machine
            <select
              value={params.get("machine_id") ?? ""}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                next.set("machine_id", e.target.value);
                setParams(next);
              }}
            >
              <option value="">All machines</option>
              {machines.data?.items.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={preview || range.from > range.to}
            onClick={() => {
              const next = {
                ...range,
                machine_id: params.get("machine_id") ?? "",
              };
              if (JSON.stringify(next) === JSON.stringify(generated)) {
                void report.refetch();
              } else {
                setGenerated(next);
              }
            }}
          >
            <FileText size={15} />
            Generate report
          </Button>
          <Button
            variant="outline"
            disabled={!data || !data.by_machine.length}
            onClick={exportCsv}
          >
            <Download size={15} />
            Export CSV
          </Button>
        </div>
      </Panel>
      {!generated && !preview ? (
        <Panel>
          <Empty
            icon={FileText}
            title="Choose a period and generate a report"
            description="Reports use only recorded measurements from your organization."
          />
        </Panel>
      ) : (
        <ResourceState query={report}>
          {data?.by_machine.length ? (
            <>
              <div className="metric-grid">
                <Metric
                  label="MEASURED ENERGY"
                  value={number(data.energy_kwh)}
                  unit="kWh"
                />
                <Metric
                  label="PRODUCTIVE RUNTIME"
                  value={number(data.runtime_hours)}
                  unit="hrs"
                />
                <Metric
                  label="IDLE TIME"
                  value={number(data.idle_hours)}
                  unit="hrs"
                />
                <Metric
                  label="ESTIMATED COST"
                  value={money(data.estimated_cost, data.currency)}
                />
              </div>
              <Panel title="Report results">
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th>Energy kWh</th>
                        <th>Runtime hrs</th>
                        <th>Idle hrs</th>
                        <th>Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.by_machine.map((m) => (
                        <tr key={m.id}>
                          <td>{m.name}</td>
                          <td>{number(m.energy_kwh)}</td>
                          <td>{number(m.runtime_hours)}</td>
                          <td>{number(m.idle_hours)}</td>
                          <td>{number(m.utilization_percent)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          ) : (
            <Panel>
              <Empty
                icon={FileText}
                title="Your next report starts with real data"
                description="Choose a reporting period. Once machines send telemetry, measured energy and calculated utilization will be available here."
              />
            </Panel>
          )}
        </ResourceState>
      )}
      <div className="report-legend">
        <span>
          <i className="state-dot running" />
          Measured: sensor telemetry
        </span>
        <span>
          <i className="state-dot idle" />
          Calculated: runtime and utilization
        </span>
        <span>
          <i className="state-dot off" />
          Estimated: electricity cost
        </span>
      </div>
    </>
  );
}
