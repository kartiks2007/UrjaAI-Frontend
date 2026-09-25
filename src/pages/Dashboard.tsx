import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Circle,
  Factory,
  Plus,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useResource } from "../api/hooks";
import { useAppPath, useMe, usePreview } from "../auth/AuthProvider";
import type { Summary, Page, Alert } from "../types/domain";
import { date, money, number } from "../lib/utils";
import {
  Empty,
  Metric,
  PageHeader,
  Panel,
  Status,
  TextLink,
  buttonVariants,
} from "../components/ui";
import { ResourceState } from "../components/ResourceState";
import { AiInsightsBanner } from "../components/AiInsightsBanner";

const TelemetryChart = lazy(() => import("../components/TelemetryChart"));
export default function Dashboard() {
  const path = useAppPath();
  const me = useMe();
  const preview = usePreview();
  const query = useResource<Summary>("/dashboard", true);
  const alerts = useResource<Page<Alert>>(
    "/alerts?status=ACTIVE&page_size=3",
    true,
  );
  const data = query.data;
  const hour = new Date().getHours();
  return (
    <>
      <PageHeader
        eyebrow="YOUR OPERATIONS AT A GLANCE"
        title={`Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}${me.data?.name ? ", " + me.data.name.split(" ")[0] : ""}.`}
        description="A clearer view of your machines. A better use of your resources."
        action={
          <Link className={buttonVariants()} to={path("/machines/new")}>
            <Plus size={17} />
            Add machine
          </Link>
        }
      />
      <ResourceState query={query}>
        <div className="overview-status">
          <span>
            <Circle size={9} fill="currentColor" />
            {data?.updated_at
              ? "Last updated " + date(data.updated_at)
              : "Waiting for your first connection"}
          </span>
          <span>
            {preview
              ? "Design review · no operational data"
              : "Updates every 30 seconds"}
          </span>
        </div>
        <section
          className="operational-strip"
          aria-label="Machine status summary"
        >
          {[
            ["Total machines", data?.total_machines, "total"],
            ["Running", data?.running, "running"],
            ["Idle", data?.idle, "idle"],
            ["Off", data?.off, "off"],
            ["Offline devices", data?.offline_devices, "offline"],
            ["Active alerts", data?.active_alerts, "alerts"],
          ].map(([title, value, state]) => (
            <div key={String(title)}>
              <span>
                <i className={`state-dot ${state}`} />
                {title}
              </span>
              <strong>{number(value as number | undefined, 0)}</strong>
            </div>
          ))}
        </section>
        <AiInsightsBanner
          onOpenChat={() =>
            window.dispatchEvent(
              new CustomEvent("urjaai:open-ai-chat", { detail: {} }),
            )
          }
        />
        <div className="metric-grid">
          <Metric
            label="ENERGY TODAY"
            value={number(data?.energy_today_kwh)}
            unit="kWh"
            note="Measured energy consumption"
          />
          <Metric
            label="CURRENT TOTAL LOAD"
            value={number(
              data?.current_load_w == null ? null : data.current_load_w / 1000,
            )}
            unit="kW"
            note="From connected, live devices"
          />
          <Metric
            label="ESTIMATED COST TODAY"
            value={money(data?.estimated_cost, data?.currency)}
            note="Based on your organization tariff"
          />
          <Metric
            label="MACHINE UTILIZATION"
            value={number(data?.utilization_percent)}
            unit="%"
            note="Productive / monitored available time"
          />
        </div>
        <div className="dashboard-charts">
          <Panel
            title="Power consumption"
            description="How your machines use power over time"
            action={<span className="period-label">Today</span>}
          >
            <Suspense fallback={<p className="padded">Loading chart…</p>}>
              <TelemetryChart data={data?.power_history ?? []} />
            </Suspense>
          </Panel>
          <Panel
            title="Getting connected"
            description="Your monitoring workspace, step by step"
          >
            <ol className="onboarding">
              <li>
                <span className="step-number">1</span>
                <div>
                  <h3>Add your first machine</h3>
                  <p>Give your equipment a name and a place.</p>
                  <TextLink to={path("/machines/new")}>Add machine</TextLink>
                </div>
              </li>
              <li>
                <span className="step-number">2</span>
                <div>
                  <h3>Link an UrjaAI device</h3>
                  <p>Connect your ESP32 and PZEM setup.</p>
                </div>
              </li>
              <li>
                <span className="step-number">3</span>
                <div>
                  <h3>Calibrate & start monitoring</h3>
                  <p>Teach UrjaAI your machine’s operating states.</p>
                </div>
              </li>
            </ol>
            <div className="panel-note">
              <ShieldCheck size={17} />
              Your data stays private. Sharing is always your choice.
            </div>
          </Panel>
        </div>
        <Panel
          title="Your machines"
          description="Operating state and connectivity, side by side"
          action={<TextLink to={path("/machines")}>View all machines</TextLink>}
        >
          {data?.machines.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>State</th>
                    <th>Device</th>
                    <th>Power</th>
                    <th>Energy today</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.machines.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <Link to={path("/machines/" + m.id)}>{m.name}</Link>
                        <small>{m.machine_type}</small>
                      </td>
                      <td>
                        <Status
                          value={m.machine_state}
                          stale={m.state_is_stale}
                        />
                      </td>
                      <td>
                        <Status value={m.device_status} />
                      </td>
                      <td>{number(m.latest_power_w)} W</td>
                      <td>{number(m.energy_today_kwh)} kWh</td>
                      <td>
                        <Link
                          aria-label={`View ${m.name}`}
                          to={path("/machines/" + m.id)}
                        >
                          <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="Meet your next connected machine"
              description="Add a machine, link its device and start turning measurements into useful insights."
              action={
                <Link
                  to={path("/machines/new")}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <Plus size={15} />
                  Add your first machine
                </Link>
              }
            />
          )}
        </Panel>
        <div className="two-column">
          <Panel
            title="Recent alerts"
            action={<TextLink to={path("/alerts")}>All alerts</TextLink>}
          >
            <ResourceState query={alerts}>
              {alerts.data?.items.length ? (
                alerts.data.items.map((a) => (
                  <Link
                    className="alert-row"
                    key={a.id}
                    to={path("/machines/" + a.machine_id)}
                  >
                    <Bell size={18} />
                    <div>
                      <strong>{a.machine_name}</strong>
                      <p>{a.message}</p>
                    </div>
                    <Status value={a.type} />
                  </Link>
                ))
              ) : (
                <Empty
                  icon={Bell}
                  title={
                    preview ? "Alerts will appear here" : "No alerts to display"
                  }
                  description="Monitor sustained idle time, device connectivity and sensor health."
                />
              )}
            </ResourceState>
          </Panel>
          <section className="share-callout">
            <div className="eyebrow">
              <Radio size={14} /> URJAAI SHARE
            </div>
            <h2>
              More possibilities
              <br />
              for your spare capacity.
            </h2>
            <p>
              When the time is right, make machine availability discoverable to
              other businesses. You stay in control.
            </p>
            <TextLink to={path("/share")}>Explore UrjaAI Share</TextLink>
            <div className="share-callout-icons">
              <Factory />
              <span />
              <Zap />
            </div>
          </section>
        </div>
      </ResourceState>
    </>
  );
}
