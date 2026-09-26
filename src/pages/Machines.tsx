import { lazy, Suspense, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus, Search } from "lucide-react";
import { useAction, useResource } from "../api/hooks";
import { queryString } from "../api/client";
import { useAppPath, useMe, usePreview } from "../auth/AuthProvider";
import type {
  Machine,
  Page,
  Telemetry,
  StatePeriod,
  Alert,
} from "../types/domain";
import { date, number } from "../lib/utils";
import {
  calibrationSchema,
  deviceSchema,
  listingSchema,
  machineSchema,
} from "../lib/schemas";
import { DataForm } from "../components/DataForm";
import { ResourceState } from "../components/ResourceState";
import {
  Button,
  Empty,
  Feedback,
  Metric,
  Modal,
  PageHeader,
  Panel,
  Status,
  buttonVariants,
} from "../components/ui";
import { DateFilter, useRange } from "../components/DateFilter";
import { AiMachineDiagnostic } from "../components/AiMachineDiagnostic";
import { ErrorBoundary } from "../components/ErrorBoundary";
const Chart = lazy(() => import("../components/TelemetryChart"));
export function MachineList() {
  const path = useAppPath();
  const [params, setParams] = useSearchParams();
  const me = useMe();
  const preview = usePreview();
  const query = useResource<Page<Machine>>(
    "/machines?" +
      queryString({
        search: params.get("search") ?? "",
        state: params.get("state") ?? "",
        connectivity: params.get("connectivity") ?? "",
        page: params.get("page") ?? "1",
        page_size: 20,
        sort: params.get("sort") ?? "name",
      }),
    true,
  );
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    next.set("page", "1");
    setParams(next, { replace: true });
  }
  const page = Number(params.get("page") ?? 1);
  return (
    <>
      <PageHeader
        eyebrow="MACHINE MANAGEMENT"
        title="Your machines"
        description="Know what’s running, what’s idle and what needs attention."
        action={
          (preview ||
            me.data?.role === "BUSINESS_OWNER" ||
            me.data?.role === "ADMIN") && (
            <Link className={buttonVariants()} to={path("/machines/new")}>
              <Plus size={16} />
              Add machine
            </Link>
          )
        }
      />
      <Panel>
        <div className="toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="Search machines"
              placeholder="Search machines…"
              value={params.get("search") ?? ""}
              onChange={(e) => filter("search", e.target.value)}
            />
          </div>
          <select
            aria-label="Filter by state"
            value={params.get("state") ?? ""}
            onChange={(e) => filter("state", e.target.value)}
          >
            <option value="">All states</option>
            {["RUNNING", "IDLE", "OFF", "UNKNOWN"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="Filter connectivity"
            value={params.get("connectivity") ?? ""}
            onChange={(e) => filter("connectivity", e.target.value)}
          >
            <option value="">All connections</option>
            {["ONLINE", "OFFLINE", "SENSOR_ERROR", "UNLINKED"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            aria-label="Sort machines"
            value={params.get("sort") ?? "name"}
            onChange={(e) => filter("sort", e.target.value)}
          >
            <option value="name">Name A–Z</option>
            <option value="last_seen_desc">Recently seen</option>
          </select>
        </div>
        <ResourceState query={query}>
          {query.data?.items.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>State</th>
                    <th>Device</th>
                    <th>Power</th>
                    <th>Energy today</th>
                    <th>Utilization</th>
                    <th>Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((m) => (
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
                      <td>{number(m.utilization_percent)}%</td>
                      <td>{date(m.last_seen_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title={
                params.get("search")
                  ? "No matching machines"
                  : "Your machines belong here"
              }
              description={
                params.get("search")
                  ? "Try a different search or clear your filters."
                  : "Register your first machine to begin building a useful view of your operations."
              }
              action={
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  to={path("/machines/new")}
                >
                  <Plus size={16} />
                  Add machine
                </Link>
              }
            />
          )}
        </ResourceState>
        {query.data && query.data.total > 20 && (
          <div className="pagination">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(page - 1));
                setParams(next);
              }}
            >
              Previous
            </Button>
            <span>
              Page {page} · {query.data.total} machines
            </span>
            <Button
              variant="outline"
              disabled={page * 20 >= query.data.total}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set("page", String(page + 1));
                setParams(next);
              }}
            >
              Next
            </Button>
          </div>
        )}
      </Panel>
    </>
  );
}
export function NewMachine() {
  const path = useAppPath();
  const navigate = useNavigate();
  const me = useMe();
  const preview = usePreview();
  const canWrite =
    preview || me.data?.role === "BUSINESS_OWNER" || me.data?.role === "ADMIN";
  return (
    <>
      <Link className="back-link" to={path("/machines")}>
        <ArrowLeft size={15} />
        All machines
      </Link>
      <PageHeader
        eyebrow="MACHINE MANAGEMENT"
        title="Add a machine"
        description="Start with the basics. You’ll link a device and calibrate it next."
      />
      <div className="form-layout">
        <Panel title="Machine information">
          <div className="padded">
            {!canWrite ? (
              <Feedback
                kind="info"
                title="An organization owner must register machines."
              />
            ) : (
              <DataForm
                schema={machineSchema}
                path="/machines"
                submit="Create machine"
                onSaved={(result) =>
                  navigate(path("/machines/" + (result as Machine).id))
                }
                fields={[
                  {
                    name: "name",
                    label: "Machine name",
                    required: true,
                    hint: "A name your team recognizes.",
                  },
                  {
                    name: "machine_type",
                    label: "Machine type",
                    required: true,
                  },
                  { name: "manufacturer", label: "Manufacturer" },
                  { name: "model", label: "Model" },
                  { name: "location", label: "Location" },
                  {
                    name: "description",
                    label: "Description",
                    type: "textarea",
                  },
                ]}
              />
            )}
          </div>
        </Panel>
        <aside className="explanation">
          <span className="eyebrow">WHAT HAPPENS NEXT</span>
          <h2>From equipment to insight.</h2>
          <ol>
            <li>Register the machine.</li>
            <li>Link a securely provisioned ESP32.</li>
            <li>Calibrate OFF, IDLE and RUNNING states.</li>
            <li>Watch real measurements arrive.</li>
          </ol>
          <p>
            Adding a machine does not publish it on UrjaAI Share. Only an
            explicit owner action can do that.
          </p>
        </aside>
      </div>
    </>
  );
}
export function MachineDetail() {
  const { id } = useParams();
  const path = useAppPath();
  const me = useMe();
  const preview = usePreview();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "Overview";
  const query = useResource<Machine>(`/machines/${id}`, 4000);
  const latest = useResource<Telemetry | null>(
    `/machines/${id}/latest`,
    4000,
    tab === "Overview",
  );
  const range = useRange();
  const history = useResource<Page<Telemetry>>(
    `/machines/${id}/telemetry?${queryString({ ...range, interval: "hour", page_size: 500 })}`,
    false,
    tab === "Overview" || tab === "Analytics",
  );
  const states = useResource<Page<StatePeriod>>(
    `/machines/${id}/states?${queryString({ ...range, page_size: 100 })}`,
    false,
    tab === "State History",
  );
  const alerts = useResource<Page<Alert>>(
    `/machines/${id}/alerts?page_size=50`,
    false,
    tab === "Alerts",
  );
  const m = query.data;
  const canWrite =
    me.data?.role === "BUSINESS_OWNER" || me.data?.role === "ADMIN";
  const [revoke, setRevoke] = useState(false);
  const revokeAction = useAction(m?.device?.id ? `/devices/${m.device.id}/revoke` : "");
  const [provisioned, setProvisioned] = useState<string | null>(null);
  return (
    <>
      <Link className="back-link" to={path("/machines")}>
        <ArrowLeft size={15} />
        All machines
      </Link>
      <PageHeader
        eyebrow={m?.machine_type ?? "MACHINE DETAIL"}
        title={m?.name ?? "Machine details"}
        description={
          m?.location ?? "Telemetry, operating history and owner controls."
        }
      />
      <ResourceState query={query}>
        {!m ? (
          <Empty
            title="Select a connected machine"
            description="Register a machine to inspect its measurements, calibration and sharing options."
            action={
              <Link className={buttonVariants()} to={path("/machines/new")}>
                Add machine
              </Link>
            }
          />
        ) : (
          <>
            <div className="detail-status">
              <Status value={m.machine_state} stale={m.state_is_stale} />
              <Status value={m.device_status} />
              <span className="muted">Last seen: {date(m.last_seen_at)}</span>
              <span className="live-pill" title="Telemetry auto-refreshes every 4 seconds">
                <span className="live-dot" />
                Live 4s
              </span>
            </div>
            {m.state_is_stale && (
              <Feedback
                kind="info"
                title="Last known state — telemetry is stale"
              >
                An offline device does not mean the machine is OFF.
              </Feedback>
            )}
            <div
              className="tabs"
              role="navigation"
              aria-label="Machine sections"
            >
              {[
                "Overview",
                "AI Diagnostic",
                "Analytics",
                "State History",
                "Alerts",
                "Calibration",
                "Device",
                "Share",
                "Reports",
              ].map((name) => (
                <button
                  key={name}
                  className={tab === name ? "selected" : ""}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set("tab", name);
                    setParams(next);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
            {tab === "Overview" && (
              <>
                <ResourceState query={latest}>
                  {latest.data && latest.data.data_quality !== "VALID" && (
                    <Feedback
                      kind="info"
                      title={"Telemetry quality: " + latest.data.data_quality}
                    />
                  )}
                  <div className="telemetry-grid">
                    {[
                      ["Voltage", "voltage_v", "V"],
                      ["Current", "current_a", "A"],
                      ["Active power", "power_w", "W"],
                      ["Accumulated energy", "energy_kwh", "kWh"],
                      ["Frequency", "frequency_hz", "Hz"],
                      ["Power factor", "power_factor", ""],
                    ].map(([caption, key, unit]) => (
                      <Metric
                        key={key}
                        label={caption}
                        value={number(
                          latest.data?.[key as keyof Telemetry] as
                            number | null,
                        )}
                        unit={unit}
                        note={
                          m.state_is_stale
                            ? "Last known reading"
                            : "Device measurement"
                        }
                      />
                    ))}
                  </div>
                </ResourceState>
                <ErrorBoundary fallbackTitle="AI Machine Diagnostic unavailable">
                  <AiMachineDiagnostic
                    machine={m}
                    onOpenChat={(machineId, machineName) =>
                      window.dispatchEvent(
                        new CustomEvent("urjaai:open-ai-chat", {
                          detail: { machineId, machineName },
                        }),
                      )
                    }
                  />
                </ErrorBoundary>
                <Panel title="Power history">
                  <ResourceState query={history}>
                    <Suspense fallback={<p>Loading chart…</p>}>
                      <Chart data={history.data?.items ?? []} />
                    </Suspense>
                  </ResourceState>
                </Panel>
              </>
            )}
            {tab === "AI Diagnostic" && (
              <ErrorBoundary fallbackTitle="AI Machine Diagnostic unavailable">
                <AiMachineDiagnostic
                  machine={m}
                  onOpenChat={(machineId, machineName) =>
                    window.dispatchEvent(
                      new CustomEvent("urjaai:open-ai-chat", {
                        detail: { machineId, machineName },
                      }),
                    )
                  }
                />
              </ErrorBoundary>
            )}
            {tab === "Analytics" && (
              <>
                <DateFilter />
                <ResourceState query={history}>
                  <div className="two-column">
                    {(["power_w", "current_a"] as const).map((metric) => (
                      <Panel
                        key={metric}
                        title={
                          metric === "power_w"
                            ? "Power over time"
                            : "Current over time"
                        }
                      >
                        <Suspense fallback={<p>Loading chart…</p>}>
                          <Chart
                            data={history.data?.items ?? []}
                            metric={metric}
                            unit={metric === "power_w" ? "W" : "A"}
                          />
                        </Suspense>
                      </Panel>
                    ))}
                  </div>
                </ResourceState>
              </>
            )}
            {tab === "State History" && (
              <Panel title="Machine-state history" action={<DateFilter />}>
                <ResourceState query={states}>
                  {states.data?.items.length ? (
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>State</th>
                            <th>Started</th>
                            <th>Ended</th>
                          </tr>
                        </thead>
                        <tbody>
                          {states.data.items.map((s) => (
                            <tr key={s.id}>
                              <td>
                                <Status value={s.state} />
                              </td>
                              <td>{date(s.started_at)}</td>
                              <td>
                                {s.ended_at
                                  ? date(s.ended_at)
                                  : "Current period"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Empty
                      title="No state transitions yet"
                      description="State history appears after a calibrated machine receives valid telemetry."
                    />
                  )}
                </ResourceState>
              </Panel>
            )}
            {tab === "Alerts" && (
              <Panel title="Machine alerts">
                <ResourceState query={alerts}>
                  {alerts.data?.items.length ? (
                    alerts.data.items.map((a) => (
                      <div className="alert-row" key={a.id}>
                        <Status value={a.type} />
                        <p>{a.message}</p>
                        <span>{date(a.started_at)}</span>
                      </div>
                    ))
                  ) : (
                    <Empty
                      title="No alerts recorded"
                      description="Operational alerts for this machine will appear here."
                    />
                  )}
                </ResourceState>
              </Panel>
            )}
            {tab === "Calibration" && (
              <>
                <ErrorBoundary fallbackTitle="AI Machine Diagnostic unavailable">
                  <AiMachineDiagnostic
                    machine={m}
                    onOpenChat={(machineId, machineName) =>
                      window.dispatchEvent(
                        new CustomEvent("urjaai:open-ai-chat", {
                          detail: { machineId, machineName },
                        }),
                      )
                    }
                  />
                </ErrorBoundary>
                <Panel
                  title="Machine-specific calibration"
                  description="Record known OFF, IDLE and productive RUNNING baselines before setting thresholds."
                >
                <div className="padded">
                  <Feedback kind="info" title="Use measured baselines">
                    The frontend does not infer universal thresholds. Values
                    below must come from measurements of this machine.
                    Calibration version:{" "}
                    {m.calibration?.version ?? "Not calibrated"}.
                  </Feedback>
                  <DataForm
                    disabled={!canWrite}
                    schema={calibrationSchema}
                    path={`/machines/${id}/calibration`}
                    method="PUT"
                    fields={[
                      {
                        name: "off_max_w",
                        label: "OFF upper threshold (W)",
                        type: "number",
                        value: m.calibration?.off_max_w,
                        min: 0,
                      },
                      {
                        name: "idle_max_w",
                        label: "IDLE upper threshold (W)",
                        type: "number",
                        value: m.calibration?.idle_max_w,
                        min: 0,
                      },
                      {
                        name: "hysteresis_w",
                        label: "Hysteresis (W)",
                        type: "number",
                        value: m.calibration?.hysteresis_w,
                        min: 0,
                      },
                      {
                        name: "minimum_duration_s",
                        label: "State transition duration (seconds)",
                        type: "number",
                        value: m.calibration?.minimum_duration_s,
                        min: 1,
                      },
                      {
                        name: "minimum_idle_s",
                        label: "Sustained idle alert duration (seconds)",
                        type: "number",
                        value: m.calibration?.minimum_idle_s,
                        min: 1,
                      },
                    ]}
                  />
                </div>
              </Panel>
            </>
            )}
            {tab === "Device" && (
              <Panel title="Device connection">
                <div className="padded">
                  {m.device ? (
                    <>
                      <dl className="detail-list">
                        <div>
                          <dt>Device ID</dt>
                          <dd>{m.device.device_uid}</dd>
                        </div>
                        <div>
                          <dt>Firmware</dt>
                          <dd>{m.device.firmware_version ?? "Not reported"}</dd>
                        </div>
                        <div>
                          <dt>Last successful telemetry</dt>
                          <dd>{date(m.device.last_telemetry_at)}</dd>
                        </div>
                        <div>
                          <dt>Connection</dt>
                          <dd>
                            <Status value={m.device.status} />
                          </dd>
                        </div>
                      </dl>
                      {canWrite && (
                        <Button
                          variant="destructive"
                          disabled={m.device.status === "REVOKED"}
                          onClick={() => setRevoke(true)}
                        >
                          Revoke device
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <p>
                        Provision a device to receive measurements. Its
                        credential will be shown only once.
                      </p>
                      <DataForm
                        disabled={!canWrite}
                        path={`/machines/${id}/devices`}
                        schema={deviceSchema}
                        submit="Provision device"
                        fields={[
                          {
                            name: "device_uid",
                            label: "Device identifier",
                            required: true,
                          },
                          {
                            name: "name",
                            label: "Device name",
                            required: true,
                          },
                        ]}
                        onSaved={(result) =>
                          setProvisioned(
                            (result as { credential: string }).credential,
                          )
                        }
                      />
                    </>
                  )}
                  {provisioned && (
                    <Feedback
                      kind="success"
                      title="Save this credential securely now"
                    >
                      <code className="secret">{provisioned}</code>
                      <Button
                        variant="outline"
                        onClick={() => setProvisioned(null)}
                      >
                        I’ve saved it — hide credential
                      </Button>
                    </Feedback>
                  )}
                </div>
              </Panel>
            )}
            {tab === "Share" && (
              <Panel
                title="Share this machine’s capacity"
                description="Creating a listing saves a draft. Publishing requires your explicit approval."
              >
                <div className="padded">
                  <DataForm
                    disabled={!canWrite}
                    path="/share/listings"
                    schema={listingSchema}
                    extra={{ machine_id: id }}
                    submit="Save listing draft"
                    fields={[
                      { name: "title", label: "Listing title", value: m.name },
                      {
                        name: "description",
                        label: "Public description",
                        type: "textarea",
                      },
                      {
                        name: "location",
                        label: "General location",
                        value: m.location,
                      },
                      {
                        name: "pricing_model",
                        label: "Pricing model",
                        type: "select",
                        options: ["ON_REQUEST", "HOURLY"],
                      },
                      {
                        name: "price",
                        label: "Hourly price (optional)",
                        type: "number",
                        min: 0,
                      },
                      {
                        name: "currency",
                        label: "Currency",
                        value: me.data?.organization?.currency ?? "INR",
                      },
                    ]}
                  />
                  <Link className="text-link" to={path("/share?view=mine")}>
                    Manage drafts and publish
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </Panel>
            )}
            {tab === "Reports" && (
              <Panel title="Machine reports">
                <div className="padded">
                  <p>
                    Generate a report for this machine from stored telemetry.
                  </p>
                  <Link
                    className={buttonVariants()}
                    to={path("/reports?machine_id=" + id)}
                  >
                    Open report filters
                  </Link>
                </div>
              </Panel>
            )}
          </>
        )}
      </ResourceState>
      <Modal
        open={revoke}
        onOpenChange={setRevoke}
        title="Revoke this device?"
        description="This device will no longer be authorized to submit telemetry. The machine’s historical data will remain available."
      >
        {revokeAction.isError && (
          <Feedback kind="error" title={revokeAction.error.message} />
        )}
        <div className="form-footer">
          <Button variant="outline" onClick={() => setRevoke(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={preview || revokeAction.isPending}
            onClick={async () => {
              try {
                await revokeAction.mutateAsync({});
                setRevoke(false);
              } catch {
                /* error displayed */
              }
            }}
          >
            Revoke device
          </Button>
        </div>
      </Modal>
    </>
  );
}
