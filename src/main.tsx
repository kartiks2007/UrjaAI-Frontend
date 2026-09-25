import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, Protected } from "./auth/AuthProvider";
import { Feedback, PageHeader, buttonVariants } from "./components/ui";
import "./styles.css";
import "./mobile.css";
import { NativeSupport } from "./components/NativeSupport";
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Shell = lazy(() => import("./layouts/AppShell"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MachineList = lazy(() =>
  import("./pages/Machines").then((m) => ({ default: m.MachineList })),
);
const NewMachine = lazy(() =>
  import("./pages/Machines").then((m) => ({ default: m.NewMachine })),
);
const MachineDetail = lazy(() =>
  import("./pages/Machines").then((m) => ({ default: m.MachineDetail })),
);
const Energy = lazy(() =>
  import("./pages/Operations").then((m) => ({ default: m.EnergyPage })),
);
const Alerts = lazy(() =>
  import("./pages/Operations").then((m) => ({ default: m.AlertsPage })),
);
const Reports = lazy(() =>
  import("./pages/Operations").then((m) => ({ default: m.ReportsPage })),
);
const Share = lazy(() =>
  import("./pages/Sharing").then((m) => ({ default: m.SharePage })),
);
const Listing = lazy(() =>
  import("./pages/Sharing").then((m) => ({ default: m.ListingDetail })),
);
const Bookings = lazy(() =>
  import("./pages/Sharing").then((m) => ({ default: m.BookingsPage })),
);
const Organization = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.OrganizationPage })),
);
const Settings = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.SettingsPage })),
);
const Admin = lazy(() =>
  import("./pages/Settings").then((m) => ({ default: m.AdminPage })),
);
const client = new QueryClient({
  defaultOptions: { queries: { staleTime: 20000, refetchOnWindowFocus: true } },
});
function workspace(prefix = "") {
  return (
    <Route
      key={prefix}
      element={
        <Protected>
          <Shell />
        </Protected>
      }
    >
      <Route path={`${prefix}/dashboard`} element={<Dashboard />} />
      <Route path={`${prefix}/machines`} element={<MachineList />} />
      <Route path={`${prefix}/machines/new`} element={<NewMachine />} />
      <Route path={`${prefix}/machines/:id`} element={<MachineDetail />} />
      <Route path={`${prefix}/energy`} element={<Energy />} />
      <Route path={`${prefix}/alerts`} element={<Alerts />} />
      <Route path={`${prefix}/reports`} element={<Reports />} />
      <Route path={`${prefix}/share`} element={<Share />} />
      <Route path={`${prefix}/share/:listingId`} element={<Listing />} />
      <Route path={`${prefix}/bookings`} element={<Bookings />} />
      <Route path={`${prefix}/organization`} element={<Organization />} />
      <Route path={`${prefix}/settings`} element={<Settings />} />
      <Route path={`${prefix}/admin`} element={<Admin />} />
    </Route>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <NativeSupport />
          <Suspense
            fallback={
              <div className="app-loading">
                <Feedback kind="loading" title="Opening UrjaAI" />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Landing />} />
              {["/login", "/signup", "/forgot-password", "/reset-password"].map(
                (path) => (
                  <Route key={path} path={path} element={<Auth />} />
                ),
              )}
              {workspace()}
              {import.meta.env.DEV && workspace("/preview")}
              <Route
                path="*"
                element={
                  <main className="not-found">
                    <PageHeader
                      title="This page isn’t here."
                      description="Check the address or return to UrjaAI."
                    />
                    <Link className={buttonVariants()} to="/">
                      Back to home
                    </Link>
                  </main>
                }
              />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
