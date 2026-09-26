import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  Bell,
  Building2,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Factory,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Settings,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAppPath, useMe, usePreview } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";
import { Brand, Button, Feedback, Modal } from "../components/ui";
import { AiChatDrawer } from "../components/AiChatDrawer";
import { ErrorBoundary } from "../components/ErrorBoundary";

const nav = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Machines", "/machines", Factory],
  ["Energy", "/energy", Zap],
  ["Alerts", "/alerts", Bell],
  ["Reports", "/reports", ClipboardList],
  ["UrjaAI Share", "/share", Network],
  ["Bookings", "/bookings", Gauge],
  ["Organization", "/organization", Building2],
  ["Settings", "/settings", Settings],
] as const;

export default function AppShell() {
  const path = useAppPath();
  const me = useMe();
  const preview = usePreview();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMachineContext, setAiMachineContext] = useState<{
    machineId?: string | null;
    machineName?: string | null;
  }>({});

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Global listener for opening AI Copilot with optional machine context
  useEffect(() => {
    const handleOpenAiChat = (
      e: Event & { detail?: { machineId?: string; machineName?: string } },
    ) => {
      setAiMachineContext({
        machineId: e.detail?.machineId ?? null,
        machineName: e.detail?.machineName ?? null,
      });
      setAiChatOpen(true);
    };

    window.addEventListener("urjaai:open-ai-chat", handleOpenAiChat as EventListener);
    return () => {
      window.removeEventListener("urjaai:open-ai-chat", handleOpenAiChat as EventListener);
    };
  }, []);

  const current =
    nav.find(([, url]) =>
      location.pathname.replace("/preview", "").startsWith(url),
    )?.[0] ?? "Workspace";
  const navigation = (
    <>
      <Link to="/" className="sidebar-brand" aria-label="UrjaAI home">
        <Brand />
      </Link>
      <div className="workspace-select">
        <span className="org-icon">
          <Building2 size={18} />
        </span>
        <div>
          <strong>{me.data?.organization?.name ?? "Your workspace"}</strong>
          <small>{preview ? "Design review" : "Organization workspace"}</small>
        </div>
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        {nav.map(([title, url, Icon], i) => (
          <NavLink
            key={url}
            to={path(url)}
            className={({ isActive }) =>
              `nav-link ${isActive ? "active" : ""} ${i === 5 ? "nav-divider" : ""}`
            }
          >
            <Icon size={18} />
            {title}
            {title === "UrjaAI Share" && <span className="nav-dot" />}
          </NavLink>
        ))}
        {me.data?.role === "ADMIN" && (
          <NavLink to={path("/admin")} className="nav-link">
            <ShieldCheck size={18} />
            Admin
          </NavLink>
        )}
      </nav>
      <div className="sidebar-bottom">
        <Link to="/#how-it-works" className="help-link">
          <CircleHelp size={17} />
          How UrjaAI works
          <ChevronRight size={15} />
        </Link>
        <div className="user-summary">
          <span className="user-initial">
            {me.data?.name?.charAt(0) ?? "U"}
          </span>
          <div>
            <strong>{me.data?.name ?? "UrjaAI workspace"}</strong>
            <small>
              {preview ? "Read-only preview" : (me.data?.email ?? "Signed in")}
            </small>
          </div>
          {!preview && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                const result = await supabase?.auth.signOut();
                if (result?.error) setError(result.error.message);
              }}
            >
              <LogOut size={16} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">{navigation}</aside>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Navigation"
        description="Move between your UrjaAI workspace screens."
      >
        <div className="mobile-nav">{navigation}</div>
      </Modal>
      <div className="workspace-main">
        <header className="topbar">
          <div>
            <Button
              className="mobile-menu"
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={13} /> <strong>{current}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAiMachineContext({});
                setAiChatOpen(true);
              }}
              className="ai-copilot-launch-btn"
              title="Open UrjaAI Intelligent Copilot"
            >
              <Sparkles size={14} />
              <span>AI Copilot</span>
            </Button>
            <span className="connection">
              <span />
              {preview ? "Not connected" : "Secure workspace"}
            </span>
            <Link
              to={path("/alerts")}
              className="notification-button"
              aria-label="View alerts"
            >
              <Bell size={19} />
            </Link>
            <Link
              to={path("/settings")}
              className="user-initial small-avatar"
              aria-label="Profile settings"
            >
              {me.data?.name?.charAt(0) ?? "U"}
            </Link>
          </div>
        </header>
        {preview && (
          <div className="preview-banner">
            <Activity size={15} />
            <span>
              <strong>Frontend design review.</strong> No live data. Saving is
              disabled.
            </span>
            <Link to="/login">
              Connect your workspace <ChevronRight size={13} />
            </Link>
          </div>
        )}
        <main id="main" className="page-content">
          {error && <Feedback kind="error" title={error} />}
          <ErrorBoundary fallbackTitle="Unable to display workspace page">
            <Outlet />
          </ErrorBoundary>
        </main>
        <AiChatDrawer
          open={aiChatOpen}
          onOpenChange={setAiChatOpen}
          machineId={aiMachineContext.machineId}
          machineName={aiMachineContext.machineName}
        />
        <footer className="workspace-footer">
          <span>
            UrjaAI <span className="muted">/</span> Machine intelligence,
            grounded in data.
          </span>
          <span>Monitor. Analyze. Share. Optimize.</span>
        </footer>
      </div>
    </div>
  );
}
