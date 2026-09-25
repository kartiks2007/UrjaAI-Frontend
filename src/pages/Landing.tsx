import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircuitBoard,
  Cloud,
  Factory,
  Gauge,
  Network,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Brand, buttonVariants } from "../components/ui";
const steps = [
  ["01", "Sense", "Electrical telemetry from PZEM and ESP32."],
  ["02", "Monitor", "A clear view of your connected machines."],
  ["03", "Analyze", "Machine states calibrated to your equipment."],
  ["04", "Alert", "Know when a machine needs your attention."],
  ["05", "Share", "Choose when to offer your spare capacity."],
  ["06", "Utilize", "Receive requests for available machine time."],
];
export default function Landing() {
  return (
    <div className="landing">
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <header className="landing-nav">
        <Link to="/" aria-label="UrjaAI home">
          <Brand />
        </Link>
        <nav aria-label="Public navigation">
          <a href="#product">Product</a>
          <a href="#how-it-works">How it works</a>
          <a href="#share">UrjaAI Share</a>
          <a href="#technology">Technology</a>
          <a href="#impact">Impact</a>
        </nav>
        <div>
          <Link className="login-link" to="/login">
            Log in
          </Link>
          <Link className={buttonVariants()} to="/signup">
            Get started
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <main id="content">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-line" /> INTELLIGENCE FOR INDUSTRY
            </div>
            <h1>
              Turn machine data into <span>better utilization.</span>
            </h1>
            <p>
              Understand the energy your machines consume. See how they’re used.
              Put spare capacity to work—on your terms.
            </p>
            <div className="hero-actions">
              <Link className={buttonVariants()} to="/signup">
                Get started
                <ArrowRight size={17} />
              </Link>
              <a
                className={buttonVariants({ variant: "outline" })}
                href="#how-it-works"
              >
                See how it works
                <ArrowDown size={16} />
              </a>
            </div>
            <div className="hero-principles">
              <span>
                <Check size={15} />
                Machine-level visibility
              </span>
              <span>
                <Check size={15} />
                Owner-controlled sharing
              </span>
            </div>
          </div>
          <div
            className="system-visual"
            aria-label="Conceptual architecture: machine to device to cloud to dashboard. No live measurements shown."
          >
            <div className="visual-heading">
              <span>THE URJAAI CONNECTION</span>
              <span className="small muted">SYSTEM OVERVIEW</span>
            </div>
            <div className="equipment-drawing">
              <div className="equipment-top">
                <span />
                <span />
                <span />
              </div>
              <div className="equipment-body">
                <div className="equipment-window">
                  <Factory size={64} strokeWidth={1} />
                  <span>INDUSTRIAL MACHINE</span>
                </div>
                <div className="equipment-controls">
                  <i />
                  <i />
                  <i />
                  <div />
                  <div />
                </div>
              </div>
              <div className="equipment-base" />
              <div className="diagram-line" />
              <div className="edge-device">
                <CircuitBoard size={22} />
                <div>
                  <strong>UrjaAI device</strong>
                  <span>ESP32 + PZEM-004T V3</span>
                </div>
                <Radio size={17} />
              </div>
            </div>
            <div className="signal-path">
              <span>MEASURE</span>
              <span>CONNECT</span>
              <span>UNDERSTAND</span>
            </div>
            <div className="diagram-nodes">
              <div>
                <Cloud size={22} />
                <strong>Secure API</strong>
                <small>Validated telemetry</small>
              </div>
              <ArrowRight size={18} />
              <div>
                <Gauge size={22} />
                <strong>Your workspace</strong>
                <small>Insights, alerts & sharing</small>
              </div>
            </div>
            <div className="diagram-caption">
              <ShieldCheck size={14} /> Your machines. Your data. Your decision.
            </div>
          </div>
        </section>
        <div className="principle-strip">
          <span>ONE CONNECTED SYSTEM</span>
          <strong>
            Monitor <ArrowRight /> Analyze <ArrowRight /> Share <ArrowRight />{" "}
            Optimize
          </strong>
          <span>BUILT AROUND YOUR MACHINES</span>
        </div>
        <section id="product" className="landing-section">
          <div className="section-title">
            <div>
              <div className="eyebrow">THE OPPORTUNITY</div>
              <h2>
                Better visibility.
                <br />
                Better decisions.
              </h2>
            </div>
            <p>
              Energy and equipment are valuable resources. UrjaAI helps you
              understand where they go—and where there’s room to do more.
            </p>
          </div>
          <div className="value-grid">
            <article>
              <Zap />
              <span className="index">01 / ENERGY</span>
              <h3>See beyond the electricity bill.</h3>
              <p>
                Understand voltage, current, power and energy at the machine
                level. Find idle periods using calibration specific to your
                equipment.
              </p>
              <Link to="/signup">
                Explore monitoring <ArrowUpRight size={17} />
              </Link>
            </article>
            <article>
              <Network />
              <span className="index">02 / CAPACITY</span>
              <h3>Make room for more productive work.</h3>
              <p>
                Review underutilized machine time and choose whether to share it
                with another business. You define availability and approve
                requests.
              </p>
              <a href="#share">
                Explore UrjaAI Share <ArrowUpRight size={17} />
              </a>
            </article>
          </div>
        </section>
        <section id="how-it-works" className="landing-section workflow-section">
          <div className="eyebrow">FROM MEASUREMENT TO OPPORTUNITY</div>
          <h2>
            A complete loop.
            <br />A considered decision at every step.
          </h2>
          <div className="workflow">
            {steps.map(([n, title, body]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="share" className="share-feature landing-section">
          <div>
            <div className="eyebrow">URJAAI SHARE</div>
            <h2>
              Your spare capacity.
              <br />
              Someone’s next possibility.
            </h2>
            <p>
              Make selected machine time discoverable to other businesses,
              without exposing your private operational data.
            </p>
            <Link to="/signup" className={buttonVariants()}>
              Explore sharing
              <ArrowRight size={16} />
            </Link>
          </div>
          <ol className="share-process">
            <li>
              <span>01</span>
              <div>
                <h3>Review the opportunity</h3>
                <p>
                  Consider a recommendation based on your configured monitoring
                  rules.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Decide what to share</h3>
                <p>
                  Set the listing, availability and pricing. Publish only when
                  you’re ready.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Stay in control</h3>
                <p>
                  Review each request and accept the bookings that work for your
                  business.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section id="technology" className="landing-section technology-section">
          <div className="section-title">
            <div>
              <div className="eyebrow">BUILT ON REAL MEASUREMENTS</div>
              <h2>Connected from the factory floor.</h2>
            </div>
            <p>
              A straightforward hardware-to-software architecture. Designed for
              useful information, not unnecessary complexity.
            </p>
          </div>
          <div className="tech-grid">
            <div>
              <CircuitBoard />
              <h3>At the edge</h3>
              <p>ESP32 · PZEM-004T V3 · CT</p>
              <small>16×2 I²C LCD for local visibility</small>
            </div>
            <div>
              <Cloud />
              <h3>In the platform</h3>
              <p>HTTPS REST API · PostgreSQL</p>
              <small>Target backend: Express, Render & Supabase</small>
            </div>
            <div>
              <Gauge />
              <h3>At your desk</h3>
              <p>React · TypeScript · Tailwind</p>
              <small>Responsive frontend, prepared for Vercel</small>
            </div>
          </div>
          <p className="technology-note">
            Live monitoring and WhatsApp alerts require connected hardware, a
            configured backend and Twilio integration.
          </p>
        </section>
        <section id="impact" className="impact-section">
          <div className="eyebrow">MEASURE FIRST. IMPROVE WITH CONFIDENCE.</div>
          <h2>
            Real insights.
            <br />
            No invented impact.
          </h2>
          <p>
            Energy comes from telemetry. Cost estimates use your tariff. Carbon
            estimates require a documented emission factor. The difference is
            always clear.
          </p>
          <Link className={buttonVariants()} to="/signup">
            Set up your workspace
            <ArrowRight size={17} />
          </Link>
          {import.meta.env.DEV && (
            <Link className="developer-preview" to="/preview/dashboard">
              Open frontend design review <ArrowUpRight size={14} />
            </Link>
          )}
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <span>Monitor. Analyze. Share. Optimize.</span>
        <a href="#content">Back to top ↑</a>
      </footer>
    </div>
  );
}
