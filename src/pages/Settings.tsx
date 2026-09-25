import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { useMe, usePreview } from "../auth/AuthProvider";
import { useResource } from "../api/hooks";
import { supabase } from "../lib/supabase";
import { organizationSchema } from "../lib/schemas";
import type { AdminEntry, Page } from "../types/domain";
import { date, label } from "../lib/utils";
import { DataForm } from "../components/DataForm";
import { ResourceState } from "../components/ResourceState";
import { NotificationForm } from "../components/NotificationForm";
import {
  Button,
  Empty,
  Feedback,
  Field,
  PageHeader,
  Panel,
} from "../components/ui";
export function OrganizationPage() {
  const navigate = useNavigate();
  const me = useMe();
  const preview = usePreview();
  const org = me.data?.organization;
  const owner = me.data?.role === "BUSINESS_OWNER" || me.data?.role === "ADMIN";
  return (
    <>
      <PageHeader
        eyebrow="WORKSPACE CONFIGURATION"
        title={org ? "Your organization" : "Set up your organization"}
        description="Give your workspace context. Use your own tariff and documented emission factors."
      />
      {!preview && me.isError && (
        <Feedback
          kind="error"
          title={me.error.message}
          retry={() => void me.refetch()}
        />
      )}
      <div className="form-layout">
        <Panel title="Business and calculation settings">
          <div className="padded">
            <DataForm
              key={org?.id ?? "new"}
              path={org ? "/organizations/" + org.id : "/organizations"}
              method={org ? "PATCH" : "POST"}
              disabled={
                !preview && (me.isPending || me.isError || (!!org && !owner))
              }
              schema={organizationSchema}
              onSaved={() => { if (!org) navigate("/dashboard"); }}
              fields={[
                {
                  name: "name",
                  label: "Organization name",
                  required: true,
                  value: org?.name,
                },
                { name: "location", label: "Location", value: org?.location },
                {
                  name: "business_details",
                  label: "Business information",
                  type: "textarea",
                  value: org?.business_details,
                },
                {
                  name: "electricity_tariff_per_kwh",
                  label: "Electricity tariff per kWh",
                  type: "number",
                  min: 0,
                  value: org?.electricity_tariff_per_kwh,
                  hint: "Leave blank until you know your applicable tariff.",
                },
                {
                  name: "currency",
                  label: "Currency",
                  value: org?.currency ?? "INR",
                  hint: "ISO currency code, for example INR.",
                },
                {
                  name: "emission_factor",
                  label: "Emission factor (kg CO₂e / kWh)",
                  type: "number",
                  min: 0,
                  value: org?.emission_factor,
                },
                {
                  name: "factor_source",
                  label: "Emission factor source and version/date",
                  value: org?.factor_source,
                },
              ]}
            />
          </div>
        </Panel>
        <aside className="explanation">
          <h2>Estimates with a basis.</h2>
          <p>
            Electricity cost is calculated from recorded energy and your
            configured tariff. A missing tariff means no cost estimate.
          </p>
          <p>
            Carbon estimates require an emission factor and a documented source.
            They do not represent verified savings.
          </p>
          <ShieldCheck size={25} />
          <p>Only authorized organization owners can update these settings.</p>
        </aside>
      </div>
    </>
  );
}
function SecurityForm() {
  const preview = usePreview();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  async function update(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8 || password !== form.get("confirm")) {
      setError("Use at least 8 characters and make sure both passwords match.");
      return;
    }
    if (!supabase) return;
    setPending(true);
    try {
      const result = await supabase.auth.updateUser({ password });
      if (result.error) throw result.error;
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update password.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={update}>
      <div className="form-grid">
        <Field label="New password">
          {(id) => (
            <input
              id={id}
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          )}
        </Field>
        <Field label="Confirm password">
          {(id) => (
            <input
              id={id}
              type="password"
              name="confirm"
              autoComplete="new-password"
              required
            />
          )}
        </Field>
      </div>
      {error && <Feedback kind="error" title={error} />}{" "}
      {success && <Feedback kind="success" title="Password updated" />}
      <div className="form-footer">
        <Button type="submit" disabled={preview || pending || !supabase}>
          Update password
        </Button>
      </div>
    </form>
  );
}
export function SettingsPage() {
  const me = useMe();
  const preview = usePreview();
  const [tab, setTab] = useState("Profile");
  return (
    <>
      <PageHeader
        eyebrow="PERSONAL WORKSPACE"
        title="Settings"
        description="Manage your profile, account security and notification preferences."
      />
      <div className="tabs">
        {["Profile", "Security", "Notifications", "Preferences"].map((name) => (
          <button
            key={name}
            className={tab === name ? "selected" : ""}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <Panel title={tab}>
        <div className="padded settings-panel">
          {tab === "Profile" && (
            <>
              <p className="muted">
                {me.data?.email ??
                  (preview ? "No account connected" : "Loading account…")}
              </p>
              <DataForm
                key={me.data?.id ?? "preview"}
                path="/users/me"
                method="PATCH"
                schema={z.object({ name: z.string().trim().min(2).max(100) })}
                fields={[
                  { name: "name", label: "Full name", value: me.data?.name },
                ]}
              />
            </>
          )}
          {tab === "Security" && <SecurityForm />}
          {tab === "Notifications" && <NotificationForm />}
          {tab === "Preferences" && (
            <>
              <p>
                Dates and times are displayed in your browser’s local time zone:{" "}
                <strong>
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </strong>
                .
              </p>
              <p>
                Reduced-motion preferences follow your operating system.
                Currency and tariff are managed in Organization settings.
              </p>
            </>
          )}
        </div>
      </Panel>
    </>
  );
}
export function AdminPage() {
  const me = useMe();
  const [tab, setTab] = useState("users");
  const query = useResource<Page<AdminEntry>>(
    "/admin/" + tab + "?page_size=50",
    false,
    me.data?.role === "ADMIN",
  );
  if (me.data?.role !== "ADMIN")
    return (
      <>
        <PageHeader
          title="Administrator access"
          description="This area is restricted to authorized platform administrators."
        />
        <Feedback kind="info" title="Administrator authorization required">
          Your role is verified by the server. Access is not granted by this
          page.
        </Feedback>
      </>
    );
  return (
    <>
      <PageHeader
        eyebrow="PLATFORM OPERATIONS"
        title="Administration"
        description="Review platform resources and security-sensitive activity."
      />
      <div className="tabs">
        {[
          "users",
          "organizations",
          "machines",
          "devices",
          "listings",
          "bookings",
          "audit-logs",
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {label(t.replace("-", " "))}
          </button>
        ))}
      </div>
      <Panel>
        <ResourceState query={query}>
          {query.data?.items.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Status / action</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name ?? row.email ?? row.resource ?? row.id}</td>
                      <td>{row.status ?? row.action ?? "—"}</td>
                      <td>{date(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No records returned"
              description="Records appear here when the configured backend provides them."
            />
          )}
        </ResourceState>
      </Panel>
    </>
  );
}
