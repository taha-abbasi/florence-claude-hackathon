import Link from "next/link";
import Calculator from "@/components/home/Calculator";
import WaitlistForm from "@/components/home/WaitlistForm";

function Wordmark() {
  return (
    <span className="af-wordmark">
      Ask<b>Florence</b>
      <i className="dot" />
    </span>
  );
}

export default function Home() {
  return (
    <>
      <nav className="af-nav">
        <div className="af-nav__inner">
          <Link href="/">
            <Wordmark />
          </Link>
          <div className="af-nav__links">
            <a href="#calculator">Price calculator</a>
            <a href="#how">How it works</a>
            <a href="#stories">Stories</a>
            <a href="#namesake">Namesake</a>
            <Link href="/florence" className="af-nav__cta af-btn af-btn--ghost">
              Talk to Florence
            </Link>
            <a href="#calculator" className="af-nav__cta af-btn af-btn--ghost">
              See your price
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="af-hero">
        <div>
          <span className="af-eyebrow">
            The subsidy Healthcare.gov didn&apos;t show you
          </span>
          <h1 className="af-h1" style={{ marginTop: 22 }}>
            Healthcare.gov showed me $960/mo. <em>I&apos;m paying $7.</em>
          </h1>
          <p className="af-hero__sub">
            Thousands of real ACA plans, matched to your doctors and your
            medications, with subsidies already applied. In seconds.
          </p>
          <div className="af-hero__actions">
            <a href="#calculator" className="af-btn af-btn--primary">
              See your real price →
            </a>
            <Link href="/florence" className="af-btn af-btn--ghost">
              Talk to Florence
            </Link>
          </div>
          <p className="af-hero__reassure">
            Zip, age, income. 30 seconds. No spam calls.
          </p>

          <div className="af-trust">
            <div>
              <div className="af-trust__n">3M+ providers</div>
              <div className="af-trust__l">On the plans we show</div>
            </div>
            <div>
              <div className="af-trust__n">35,000+ meds</div>
              <div className="af-trust__l">Brand and generic</div>
            </div>
            <div>
              <div className="af-trust__n">4,847 plans</div>
              <div className="af-trust__l">151 carriers, 34 states</div>
            </div>
            <div>
              <div className="af-trust__n">HIPAA-compliant</div>
              <div className="af-trust__l">Federal privacy standard</div>
            </div>
          </div>
        </div>

        <aside className="af-card af-proofcard">
          <div className="af-proofcard__row">
            <div>
              <div style={{ fontSize: 12, color: "var(--af-stone)" }}>
                Select Health · Silver · HMO
              </div>
              <div style={{ fontFamily: "var(--af-font-serif)", fontSize: 18 }}>
                Signature Benchmark Silver
              </div>
            </div>
            <span className="af-pill" style={{ background: "var(--af-glow)", color: "var(--af-gold-2)" }}>
              $0 deductible
            </span>
          </div>
          <div className="af-proofcard__row" style={{ marginTop: 18 }}>
            <span className="af-proofcard__price">$9.95</span>
            <span>
              /mo <span className="af-proofcard__strike">$1,051</span>
            </span>
          </div>
          <div className="af-proofcard__stats">
            <div className="af-proofcard__stat">
              <b>$0</b>
              <span>Deductible</span>
            </div>
            <div className="af-proofcard__stat">
              <b>$5</b>
              <span>Copay</span>
            </div>
            <div className="af-proofcard__stat">
              <b>$3k</b>
              <span>Max OOP</span>
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--af-stone)", marginTop: 16 }}>
            $29,729 saved per year · Utah couple
          </p>
        </aside>
      </header>

      {/* FEATURE STRIP */}
      <section className="af-section">
        <div className="af-section-head">
          <span className="af-eyebrow">Why Florence</span>
          <h2 className="af-h2" style={{ marginTop: 18 }}>
            You shouldn&apos;t need a PhD to get health insurance.{" "}
            <em>Or a medical degree to understand it.</em>
          </h2>
        </div>
        <div className="af-compare">
          <div className="af-card af-compare__col">
            <span className="af-eyebrow">Free to use</span>
            <div className="af-compare__big af-compare__big--good">$0–$7/mo</div>
            <p style={{ color: "var(--af-body)" }}>
              For most people who qualify for subsidies. No fee to use Florence,
              ever.
            </p>
          </div>
          <div className="af-card af-compare__col">
            <span className="af-eyebrow">Proof not promise</span>
            <div className="af-compare__big af-compare__big--good">$960 → $7</div>
            <p style={{ color: "var(--af-body)" }}>
              We show the real subsidized price against the sticker, and prove the
              plan covers your doctor and your prescription.
            </p>
          </div>
        </div>
        <div className="af-pillrow">
          {["Self-employed", "Freelancers", "Gig workers", "Recently unemployed"].map(
            (p) => (
              <span className="af-pill" key={p}>
                {p}
              </span>
            ),
          )}
        </div>
      </section>

      {/* PROOF BLOCK */}
      <section className="af-section">
        <div className="af-section-head">
          <span className="af-eyebrow">The difference</span>
          <h2 className="af-h2" style={{ marginTop: 18 }}>
            The discounted plan price{" "}
            <em>Healthcare.gov doesn&apos;t show you.</em>
          </h2>
        </div>
        <div className="af-compare">
          <div className="af-card af-compare__col af-compare__col--bad">
            <span className="af-eyebrow">Healthcare.gov shows you</span>
            <div className="af-compare__big af-compare__big--bad">$960.21/mo</div>
            <div className="af-compare__line">
              <span>Metal</span>
              <span>Bronze</span>
            </div>
            <div className="af-compare__line">
              <span>Deductible</span>
              <span>$18,300</span>
            </div>
            <div className="af-compare__line">
              <span>Max out-of-pocket</span>
              <span>$20,000</span>
            </div>
          </div>
          <div className="af-card af-compare__col af-compare__col--good">
            <span className="af-eyebrow">AskFlorence, subsidies applied</span>
            <div className="af-compare__big af-compare__big--good">
              $7.78/mo{" "}
              <span
                style={{
                  fontSize: 16,
                  color: "var(--af-stone)",
                  textDecoration: "line-through",
                }}
              >
                $1,051.30
              </span>
            </div>
            <div className="af-compare__line">
              <span>Metal</span>
              <span>Silver</span>
            </div>
            <div className="af-compare__line">
              <span>Deductible</span>
              <span>$0</span>
            </div>
            <div className="af-compare__line">
              <span>Max out-of-pocket</span>
              <span>$6,000</span>
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 24, color: "var(--af-green-d)", fontWeight: 600 }}>
          Save about $29,729/yr.
        </p>
        <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--af-stone)" }}>
          Example: Utah couple, ages 35 and 30, ~$30,000 household income.
        </p>
      </section>

      {/* COVERAGE PROOF */}
      <section className="af-section">
        <div className="af-section-head">
          <span className="af-eyebrow">Real plans. Real coverage.</span>
          <h2 className="af-h2" style={{ marginTop: 18 }}>
            The plans we show cover the doctors you see.{" "}
            <em>And the medications you actually take.</em>
          </h2>
        </div>
        <div className="af-statgrid">
          {[
            ["3M+", "providers"],
            ["35,000+", "medications"],
            ["4,847", "plans"],
            ["34", "states"],
          ].map(([n, l]) => (
            <div className="af-statgrid__cell" key={l}>
              <div className="af-statgrid__n">{n}</div>
              <div className="af-statgrid__l">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="af-section" id="how">
        <div className="af-section-head">
          <span className="af-eyebrow">How it works</span>
          <h2 className="af-h2" style={{ marginTop: 18 }}>
            Getting affordable health insurance is now{" "}
            <em>as easy as booking an Airbnb.</em>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          {[
            ["01", "Share a few basics", "ZIP, ages, income. 30 seconds."],
            ["02", "See what you qualify for", "Sticker price becomes your real subsidized price."],
            ["03", "Doctors and meds, matched", "In-network status and drug tier, per plan."],
            ["04", "Submitted to your carrier", "Through the ACA marketplace."],
            ["05", "Member portal live", "Covered, and the light is on."],
          ].map(([n, h, b]) => (
            <div className="af-card" style={{ padding: 22 }} key={n}>
              <div
                style={{
                  fontFamily: "var(--af-font-label)",
                  color: "var(--af-gold-2)",
                  fontSize: 18,
                }}
              >
                {n}
              </div>
              <h4
                style={{
                  fontFamily: "var(--af-font-serif)",
                  fontSize: 20,
                  margin: "8px 0",
                }}
              >
                {h}
              </h4>
              <p style={{ fontSize: 14, color: "var(--af-body)", margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <a href="#calculator" className="af-btn af-btn--primary">
            Find your plan →
          </a>
        </div>
      </section>

      {/* CALCULATOR (Surface 2) */}
      <Calculator />

      {/* STORIES */}
      <section className="af-section" id="stories">
        <div className="af-section-head">
          <span className="af-eyebrow">Common cases, hidden coverage</span>
          <h2 className="af-h2" style={{ marginTop: 18 }}>
            They all had affordable insurance available.{" "}
            <em>None of them knew.</em>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          {[
            ["Maria, 34, self-employed", "$612 → $0/mo", "Made too much for Medicaid, not enough to afford the sticker."],
            ["Marcus, 28, gig worker", "$478 → $14/mo", "Denied Medicaid on variable income. The ACA price looked impossible."],
            ["Raj's father, 67, green card", "$905 → $9/mo", "Medicare and Medicaid ineligible. A Silver plan covered him."],
            ["Sarah, 41, small business", "$1,120 → $22/mo", "Business income disqualified her from Medicaid. The subsidy still applied."],
            ["Robert, 61, fixed income", "$1,340 → $31/mo", "Too young for Medicare, paying full price he didn't have to."],
          ].map(([who, price, line]) => (
            <div className="af-card" style={{ padding: 22 }} key={who}>
              <div style={{ fontSize: 13, color: "var(--af-stone)" }}>{who}</div>
              <div
                className="af-compare__big af-compare__big--good"
                style={{ fontSize: 28, margin: "6px 0 10px" }}
              >
                {price}
              </div>
              <p style={{ fontSize: 14, color: "var(--af-body)", margin: 0 }}>{line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NAMESAKE */}
      <section className="af-section" id="namesake">
        <div className="af-section-head">
          <span className="af-eyebrow">Our namesake</span>
          <h2 className="af-h2" style={{ marginTop: 18 }}>
            Florence Nightingale used light and data to reveal{" "}
            <em>what a broken system hid.</em>
          </h2>
        </div>
        <blockquote
          style={{
            fontFamily: "var(--af-font-serif)",
            fontStyle: "italic",
            fontSize: "clamp(22px, 3vw, 32px)",
            color: "var(--af-ink)",
            maxWidth: 760,
            lineHeight: 1.3,
            borderLeft: "3px solid var(--af-gold-2)",
            paddingLeft: 24,
            margin: 0,
          }}
        >
          She fixed how care was delivered. We&apos;re fixing how coverage is
          found.
        </blockquote>
      </section>

      {/* FOOTER / EARLY ACCESS */}
      <footer className="af-footer" id="early-access">
        <div className="af-footer__inner">
          <span className="af-eyebrow">Early access</span>
          <h2 className="af-h2" style={{ margin: "18px 0 24px", maxWidth: 700 }}>
            Free for consumers. <em>Built to help, not to harvest leads.</em>
          </h2>
          <WaitlistForm />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 14,
              marginTop: 36,
            }}
          >
            {[
              ["HIPAA", "Federal privacy standard"],
              ["AES-256", "Encryption at rest"],
              ["TLS", "Encryption in transit"],
              ["US data residency", "Your data stays here"],
            ].map(([h, b]) => (
              <div key={h}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{h}</div>
                <div style={{ fontSize: 12.5, color: "var(--af-stone)" }}>{b}</div>
              </div>
            ))}
          </div>
          <div className="af-byline">
            <span>Built with Claude and Opus 4.8.</span>
            <span>© 2026 · Not a government website.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
