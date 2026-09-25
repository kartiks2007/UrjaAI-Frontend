import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Network,
  Plus,
  Search,
} from "lucide-react";
import { useAction, useResource } from "../api/hooks";
import { queryString } from "../api/client";
import { useAppPath, usePreview } from "../auth/AuthProvider";
import type { Booking, Listing, Page } from "../types/domain";
import { date, label, money } from "../lib/utils";
import { intervalSchema } from "../lib/schemas";
import { DataForm } from "../components/DataForm";
import {
  Button,
  Empty,
  Feedback,
  Modal,
  PageHeader,
  Panel,
  Status,
  buttonVariants,
} from "../components/ui";
import { ResourceState } from "../components/ResourceState";
export function SharePage() {
  const path = useAppPath();
  const [params, setParams] = useSearchParams();
  const mine = params.get("view") === "mine";
  const query = useResource<Page<Listing>>(
    "/share/listings?" +
      queryString({
        view: mine ? "mine" : "published",
        search: params.get("search") ?? "",
        location: params.get("location") ?? "",
        machine_type: params.get("machine_type") ?? "",
        date: params.get("date") ?? "",
        page_size: 30,
      }),
  );
  function filter(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  }
  return (
    <>
      <PageHeader
        eyebrow="URJAAI SHARE"
        title={
          mine
            ? "Your capacity. Your terms."
            : "Find capacity. Create possibility."
        }
        description={
          mine
            ? "Manage your listings, availability and publication."
            : "Discover machine time shared by businesses. Request what you need."
        }
        action={
          <Link
            className={buttonVariants({ variant: "outline" })}
            to={path("/machines")}
          >
            <Plus size={16} />
            Share your machine
          </Link>
        }
      />
      <div className="tabs">
        <button
          className={!mine ? "selected" : ""}
          onClick={() => filter("view", "discover")}
        >
          Discover machines
        </button>
        <button
          className={mine ? "selected" : ""}
          onClick={() => filter("view", "mine")}
        >
          My listings
        </button>
      </div>
      <div className="share-search">
        <div className="search-input">
          <Search size={17} />
          <input
            aria-label="Search shared machines"
            placeholder="Search machines or capabilities…"
            value={params.get("search") ?? ""}
            onChange={(e) => filter("search", e.target.value)}
          />
        </div>
        <input
          aria-label="Filter location"
          placeholder="Location"
          value={params.get("location") ?? ""}
          onChange={(e) => filter("location", e.target.value)}
        />
        <input
          aria-label="Filter machine type"
          placeholder="Machine type"
          value={params.get("machine_type") ?? ""}
          onChange={(e) => filter("machine_type", e.target.value)}
        />
        <input
          aria-label="Available date"
          type="date"
          value={params.get("date") ?? ""}
          onChange={(e) => filter("date", e.target.value)}
        />
      </div>
      <ResourceState query={query}>
        {query.data?.items.length ? (
          <div className="listing-grid">
            {query.data.items.map((item) => (
              <article className="listing-card" key={item.id}>
                <div className="listing-category">
                  <Network size={25} />
                  <span>{item.machine_type}</span>
                  {mine && <Status value={item.status} />}
                </div>
                <div>
                  <h2>
                    <Link
                      to={path("/share/" + item.id) + (mine ? "?owner=1" : "")}
                    >
                      {item.title}
                    </Link>
                  </h2>
                  <p>{item.description}</p>
                  <span className="location">
                    <MapPin size={14} />
                    {item.location}
                  </span>
                  <div className="listing-footer">
                    <strong>
                      {item.pricing_model === "HOURLY"
                        ? `${money(item.price, item.currency)} / hr`
                        : "Price on request"}
                    </strong>
                    <Link
                      to={path("/share/" + item.id) + (mine ? "?owner=1" : "")}
                      aria-label={"View " + item.title}
                    >
                      <ArrowRight size={19} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Panel>
            <Empty
              icon={Network}
              title={
                mine
                  ? "Make your spare capacity discoverable"
                  : "No shared machines available yet"
              }
              description={
                mine
                  ? "Open a machine, create a listing draft, add availability and publish when you’re ready."
                  : "Try another location or availability filter. Only owner-published listings appear here."
              }
              action={
                mine ? (
                  <Link
                    to={path("/machines")}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Choose a machine
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setParams({ view: "discover" })}
                  >
                    Clear filters
                  </Button>
                )
              }
            />
          </Panel>
        )}
      </ResourceState>
      <div className="share-principles">
        <span>Owner-approved listings</span>
        <span>Private telemetry stays private</span>
        <span>Every booking requires a decision</span>
      </div>
    </>
  );
}
const availabilitySchema = intervalSchema.transform((v) => ({
  start_at: v.requested_start,
  end_at: v.requested_end,
}));
export function ListingDetail() {
  const { listingId } = useParams();
  const path = useAppPath();
  const preview = usePreview();
  const query = useResource<Listing>("/share/listings/" + listingId);
  const item = query.data;
  const owner = item?.can_manage === true;
  const publish = useAction("/share/listings/" + listingId, "PATCH");
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Link className="back-link" to={path("/share")}>
        <ArrowLeft size={15} />
        UrjaAI Share
      </Link>
      <PageHeader
        eyebrow="SHARED CAPACITY"
        title={item?.title ?? "Listing details"}
        description={item?.machine_type}
      />
      <ResourceState query={query}>
        {item ? (
          <div className="form-layout">
            <Panel title="Machine information">
              <div className="padded">
                <p>{item.description}</p>
                <dl className="detail-list">
                  <div>
                    <dt>General location</dt>
                    <dd>{item.location}</dd>
                  </div>
                  <div>
                    <dt>Business</dt>
                    <dd>{item.owner_name}</dd>
                  </div>
                  <div>
                    <dt>Pricing</dt>
                    <dd>
                      {item.pricing_model === "HOURLY"
                        ? money(item.price, item.currency) + " / hour"
                        : "On request"}
                    </dd>
                  </div>
                </dl>
                <h3>Available time</h3>
                {item.availability.length ? (
                  <ul className="availability-list">
                    {item.availability.map((slot) => (
                      <li key={slot.id}>
                        <CalendarDays size={17} />
                        {date(slot.start_at)} — {date(slot.end_at)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No availability has been published.</p>
                )}
                {owner && (
                  <>
                    <h3>Add availability</h3>
                    <DataForm
                      path={`/share/listings/${listingId}/availability`}
                      schema={availabilitySchema}
                      fields={[
                        {
                          name: "requested_start",
                          label: "Start (your local time)",
                          type: "datetime-local",
                        },
                        {
                          name: "requested_end",
                          label: "End (your local time)",
                          type: "datetime-local",
                        },
                      ]}
                      submit="Save availability"
                    />
                    <div className="form-footer">
                      <Button
                        onClick={() => setConfirm(true)}
                        disabled={
                          preview ||
                          publish.isPending ||
                          (!item.availability.length &&
                            item.status !== "PUBLISHED")
                        }
                      >
                        {item.status === "PUBLISHED"
                          ? "Pause listing"
                          : "Preview & publish"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Panel>
            {!owner ? (
              <Panel
                title="Request machine time"
                description="The owner reviews every request. A request does not confirm a booking."
              >
                <div className="padded">
                  <DataForm
                    path={`/share/listings/${listingId}/requests`}
                    schema={intervalSchema}
                    disabled={!item.availability.length}
                    fields={[
                      {
                        name: "requested_start",
                        label: "Start (your local time)",
                        type: "datetime-local",
                      },
                      {
                        name: "requested_end",
                        label: "End (your local time)",
                        type: "datetime-local",
                      },
                      {
                        name: "message",
                        label: "Tell the owner what you need",
                        type: "textarea",
                      },
                    ]}
                    submit="Send booking request"
                  />
                </div>
              </Panel>
            ) : (
              <aside className="explanation">
                <h2>Publishing is your decision.</h2>
                <p>
                  Your listing includes only its description, general location,
                  business name, pricing and availability. Private telemetry
                  stays in your workspace.
                </p>
                <Status value={item.status} />
              </aside>
            )}
          </div>
        ) : (
          <Empty
            title="Choose a published listing"
            description="Open a machine from discovery to view availability and request time."
          />
        )}
      </ResourceState>
      <Modal
        open={confirm}
        onOpenChange={setConfirm}
        title={
          item?.status === "PUBLISHED"
            ? "Pause this listing?"
            : "Publish this listing?"
        }
        description="You control whether this machine’s capacity is discoverable. Review its public details and availability before confirming."
      >
        <h3>{item?.title}</h3>
        <p>{item?.description}</p>
        <p>
          {item?.location} · {item?.availability.length ?? 0} availability slots
        </p>
        {publish.error && (
          <Feedback kind="error" title={publish.error.message} />
        )}
        <div className="form-footer">
          <Button variant="outline" onClick={() => setConfirm(false)}>
            Back
          </Button>
          <Button
            disabled={publish.isPending}
            onClick={async () => {
              try {
                await publish.mutateAsync({
                  status: item?.status === "PUBLISHED" ? "PAUSED" : "PUBLISHED",
                });
                setConfirm(false);
              } catch {
                /* error shown */
              }
            }}
          >
            Confirm {item?.status === "PUBLISHED" ? "pause" : "publication"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
function BookingActions({ booking }: { booking: Booking }) {
  const [action, setAction] = useState<string | null>(null);
  const mutation = useAction(`/bookings/${booking.id}/${action}`);
  return (
    <>
      <div className="row-actions">
        {[
          ["accept", booking.can_accept],
          ["reject", booking.can_reject],
          ["cancel", booking.can_cancel],
        ].map(
          ([name, allowed]) =>
            allowed && (
              <Button
                key={String(name)}
                size="sm"
                variant="outline"
                onClick={() => setAction(String(name))}
              >
                {label(String(name))}
              </Button>
            ),
        )}
      </div>
      <Modal
        open={!!action}
        onOpenChange={(v) => {
          if (!v) setAction(null);
        }}
        title={`${label(action ?? "Update")} booking?`}
        description={`${booking.machine_name}: ${date(booking.requested_start)} to ${date(booking.requested_end)}. Availability is checked by the server before acceptance.`}
      >
        {mutation.error && (
          <Feedback kind="error" title={mutation.error.message} />
        )}
        <div className="form-footer">
          <Button variant="outline" onClick={() => setAction(null)}>
            Go back
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={async () => {
              try {
                await mutation.mutateAsync({});
                setAction(null);
              } catch {
                /* error shown */
              }
            }}
          >
            Confirm {action}
          </Button>
        </div>
      </Modal>
    </>
  );
}
export function BookingsPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") ?? "received";
  const query = useResource<Page<Booking>>(
    "/bookings?" + queryString({ view, page_size: 50 }),
  );
  return (
    <>
      <PageHeader
        eyebrow="CAPACITY COORDINATION"
        title="Bookings"
        description="Requests, decisions and scheduled machine time in one place."
      />
      <div className="tabs">
        {[
          ["received", "Requests received"],
          ["sent", "My requests"],
          ["upcoming", "Upcoming"],
          ["history", "History"],
        ].map(([value, caption]) => (
          <button
            key={value}
            className={view === value ? "selected" : ""}
            onClick={() => setParams({ view: value })}
          >
            {caption}
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
                    <th>Machine</th>
                    <th>Organization</th>
                    <th>Requested time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((b) => (
                    <tr key={b.id}>
                      <td>{b.machine_name}</td>
                      <td>{b.organization_name}</td>
                      <td>
                        {date(b.requested_start)}
                        <small>to {date(b.requested_end)}</small>
                      </td>
                      <td>
                        <Status value={b.status} />
                      </td>
                      <td>
                        <BookingActions booking={b} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon={CalendarDays}
              title="Room for your next opportunity"
              description="Booking requests will appear here. Confirmed time is reserved only after the owner accepts and the backend checks for conflicts."
            />
          )}
        </ResourceState>
      </Panel>
    </>
  );
}
