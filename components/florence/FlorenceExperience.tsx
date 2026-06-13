"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FlorenceConversation } from "@/lib/florence/useFlorenceConversation";
import type { PlanDisplay } from "@/lib/types";
import { EYEBROWS } from "@/lib/florence/scene";
import { formatCurrency, formatCurrencyWhole, savingsPct } from "@/lib/format";

function Flame({ level }: { level: number }) {
  const scale = 1 + Math.min(level, 1) * 0.12;
  return (
    <svg className="af-l2-flo__flame" viewBox="0 0 40 56" style={{ transform: `scale(${scale})` }}>
      <path
        d="M20 2C20 14 32 18 32 34a12 12 0 0 1-24 0C8 24 16 22 16 14c4 4 4 8 4 8s4-6 0-20z"
        fill="url(#fl)"
      />
      <defs>
        <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8C879" />
          <stop offset="1" stopColor="#B8903F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Presence({ level }: { level: number }) {
  return (
    <div className="af-l2-flo__presence">
      <div className="af-l2-flo__shimmer" />
      <Flame level={level} />
    </div>
  );
}

function Bars({ level, active }: { level: number; active: boolean }) {
  const center = [0.4, 0.7, 0.9, 1, 0.9, 0.7, 0.4];
  return (
    <div className="af-l2-flo__bars" aria-hidden>
      {center.map((c, i) => (
        <span
          key={i}
          className="af-l2-flo__bar"
          style={
            active
              ? { transform: `scaleY(${Math.min(1, 0.22 + c * 0.5 + Math.min(level, 1) * 0.85)})` }
              : undefined
          }
        />
      ))}
    </div>
  );
}

function BestPlanCard({
  s,
}: {
  s: FlorenceConversation["scene"];
}) {
  const plan = s.bestPlan as PlanDisplay | null;
  if (!plan) return null;
  const hasChecks = s.coverage.length > 0;
  const pct = savingsPct(plan.realPrice, plan.premium);
  return (
    <div className="flo-card">
      <div className="flo-card__head">
        {hasChecks ? (
          s.coverageSummary || `${s.totalPlans} plans available.`
        ) : (
          <>
            {s.totalPlans} plans available. <em>Let&apos;s narrow it down.</em>
          </>
        )}
      </div>
      <div className="flo-card__eyebrow">Your best match</div>
      <div className="flo-card__issuer">{plan.issuer}</div>
      <div className="flo-card__name">{plan.name}</div>
      <div style={{ fontSize: 11, color: "var(--af-stone)", fontFamily: "var(--af-font-label)" }}>
        Plan ID: <span style={{ userSelect: "all" }}>{plan.id}</span>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--af-stone)" }}>
        {plan.metalLevel} · {plan.planType}
        {plan.rating > 0 ? ` · ${"★".repeat(Math.round(plan.rating))} ${plan.rating}` : ""}
      </div>

      <div className="flo-card__price">
        <b>{formatCurrency(plan.realPrice)}</b>
        <span style={{ color: "var(--af-stone)", fontSize: 13 }}>/mo</span>
        {plan.premium > plan.realPrice && (
          <span className="flo-card__strike">was {formatCurrencyWhole(plan.premium)}</span>
        )}
        {pct > 0 && <span className="flo-card__savepill">Save {pct}%</span>}
      </div>

      <div className="flo-card__ded">
        <small>Deductible</small>
        <b>{formatCurrencyWhole(plan.deductible)}</b>
        {plan.baseDeductible > plan.deductible && (
          <span style={{ color: "var(--af-red)", textDecoration: "line-through", marginLeft: 8, fontSize: 12 }}>
            was {formatCurrencyWhole(plan.baseDeductible)}
          </span>
        )}
      </div>

      <div className="flo-card__visit">
        <span>What a visit costs</span>
        <div className="flo-card__grid">
          <div>
            <small>Doctor visit</small>
            <b>{plan.copays.primaryCare}</b>
          </div>
          <div>
            <small>Medications starting at</small>
            <b>{plan.copays.genericDrugs}</b>
          </div>
          <div>
            <small>ER visit</small>
            <b>{plan.copays.emergency}</b>
          </div>
          <div>
            <small>Therapy</small>
            <b>{plan.copays.therapy}</b>
          </div>
        </div>
      </div>

      {!hasChecks && s.breadthTotals && (
        <div className="flo-card__breadth">
          <span>~{s.breadthTotals.providers.toLocaleString()} doctors</span>
          <span>~{s.breadthTotals.drugs.toLocaleString()} meds</span>
        </div>
      )}

      {hasChecks && (
        <div className="flo-rows">
          <span>Your doctors and medications on this plan</span>
          {s.coverage.map((c) => {
            const onBest = c.byPlan[plan.id];
            return (
              <div className="flo-row" key={`${c.kind}-${c.query}`}>
                <div className="flo-row__glyph">{c.kind === "doctor" ? "⚕" : "℞"}</div>
                <div className="flo-row__name">
                  {c.matchedName ?? c.query}
                  <i>{c.subtitle}</i>
                </div>
                <div className="flo-row__stat">
                  <b style={onBest === "not_covered" ? { color: "var(--af-red)", fontStyle: "italic" } : {}}>
                    {onBest === "not_covered" ? "Not on plan" : "Covered"}
                  </b>
                  <small>
                    {c.coveredCount} of {c.totalPlans} plans
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link className="af-btn af-btn--primary flo-card__cta" href={`/plans/${plan.id}`}>
        Continue to enroll
      </Link>
      <div className="flo-card__cta2">
        <button className="af-btn af-btn--ghost" disabled style={{ opacity: 0.5 }}>
          Plan details
        </button>
        <Link className="af-btn af-btn--ghost" href="/#calculator">
          Other plans
        </Link>
      </div>
    </div>
  );
}

export default function FlorenceExperience({
  f,
  debug = false,
}: {
  f: FlorenceConversation;
  debug?: boolean;
}) {
  const router = useRouter();
  const s = f.scene;
  const live = debug || f.phase !== "ready";

  const stateClass =
    s.presence === "thinking"
      ? "is-thinking"
      : s.presence === "speaking"
        ? "is-speaking"
        : s.presence === "listening"
          ? "is-listening"
          : "is-idle";

  const statusLabel =
    s.presence === "speaking"
      ? "Florence is talking"
      : s.presence === "thinking"
        ? "Working on it"
        : s.presence === "listening"
          ? "Listening"
          : "";

  // ----- BEGIN SCREEN -----
  if (!live) {
    return (
      <div className="af-l2-flo is-idle">
        <div className="af-l2-flo__top">
          <span className="af-l2-flo__eyebrow">AskFlorence</span>
          <button className="af-l2-flo__close" onClick={() => router.push("/")}>
            ← Home
          </button>
        </div>
        <div className="af-l2-flo__scene">
          <div className="af-l2-flo__begin">
            <Presence level={0} />
            <span className="af-l2-flo__eyebrow">
              The subsidy Healthcare.gov did not show you
            </span>
            <h1>
              Healthcare.gov showed me <span className="strike">$960/mo.</span>
              <br />
              <span className="green">I&apos;m paying $7.</span>
            </h1>
            <p>
              Talk to Florence. She finds the real, subsidized plan you actually
              qualify for - by voice, in about a minute.
            </p>
            <button
              className="af-btn af-btn--primary"
              style={{ marginTop: 22, minWidth: 260 }}
              onClick={f.begin}
              disabled={f.phase === "connecting"}
            >
              {f.phase === "connecting" ? "Waking Florence…" : "Tap to talk to Florence"}
            </button>
            <p className="af-l2-flo__mic">
              Uses your microphone. No SSN, no spam, just real numbers.
            </p>
            {f.fatal && (
              <p style={{ color: "var(--af-red-d)", marginTop: 14 }}>{f.fatal}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----- LIVE SCENE -----
  return (
    <div className={`af-l2-flo ${stateClass}`}>
      <div className="af-l2-flo__top">
        <span className="af-l2-flo__eyebrow">{EYEBROWS[s.step]}</span>
        <button className="af-l2-flo__close" onClick={f.end}>
          End call
        </button>
      </div>

      <div className="af-l2-flo__scene">
        {(s.step === "greeting" || s.step === "idle") && (
          <>
            <Presence level={f.level} />
            <div style={{ textAlign: "center", maxWidth: 460 }}>
              <h2 className="af-h3" style={{ fontSize: 28 }}>
                Real ACA plans <em>with subsidies already applied.</em>
              </h2>
              <p style={{ color: "var(--af-body)", marginTop: 12 }}>
                Typically $0 to $7 a month, often with no deductible. Florence is
                introducing herself - let her finish, then it&apos;s your turn.
              </p>
            </div>
          </>
        )}

        {(s.step === "collect_zip" ||
          s.step === "collect_household" ||
          s.step === "collect_income") && (
          <>
            <Presence level={f.level} />
            <div style={{ textAlign: "center", maxWidth: 440 }}>
              <h2 className="af-h3" style={{ fontSize: 30 }}>
                {s.step === "collect_zip"
                  ? "Where do you live?"
                  : s.step === "collect_household"
                    ? "Who is on the plan?"
                    : "Roughly, your yearly household income?"}
              </h2>
              <p style={{ color: "var(--af-stone)", marginTop: 12 }}>
                Just say it out loud. An estimate is fine.
              </p>
              {s.location && (
                <p style={{ marginTop: 16, color: "var(--af-green-d)" }}>
                  {s.location.countyName}, {s.location.state}
                </p>
              )}
              {s.householdSummary && (
                <p style={{ color: "var(--af-body)" }}>{s.householdSummary}</p>
              )}
            </div>
          </>
        )}

        {s.step === "searching" && (
          <div className="af-l2-flo__searching">
            <Presence level={f.level} />
            <h2>Pulling your real plans</h2>
            <p style={{ color: "var(--af-stone)" }}>
              the same federal data Healthcare.gov uses.
            </p>
            <div className="af-l2-flo__checklist">
              {s.searchProgress.map((step, i) => (
                <div key={i} className={`af-l2-flo__check${step.done ? " done" : ""}`}>
                  <span className="mark">{step.done ? "✓" : "…"}</span>
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {s.step === "reveal" && s.bestPlan && (
          <div style={{ textAlign: "center" }}>
            <div className="af-l2-flo__eyebrow" style={{ justifyContent: "center" }}>
              The real price
            </div>
            <div className="pr__sticker is-struck" style={{ marginTop: 14 }}>
              {formatCurrency(s.bestPlan.premium)}
            </div>
            <div className="pr__real">{formatCurrency(s.bestPlan.realPrice)}</div>
            <p style={{ color: "var(--af-stone)" }}>per month, with your subsidy applied</p>
          </div>
        )}

        {(s.step === "plans" || s.step === "coverage") && (
          <>
            <BestPlanCard s={s} />
          </>
        )}

        {s.step === "waitlist" && (
          <div className="flo-confirm">
            <span className="af-l2-flo__eyebrow">Save your spot</span>
            <h3 style={{ marginTop: 10 }}>Saving your spot.</h3>
            {s.pendingEmailConfirm ? (
              <>
                <p style={{ color: "var(--af-body)" }}>Does this look right?</p>
                <div className="email">{s.pendingEmailConfirm.email}</div>
                <p style={{ fontSize: 13, color: "var(--af-stone)" }}>
                  Say &quot;yes, send&quot; or tell Florence the correct email.
                </p>
              </>
            ) : (
              <p style={{ color: "var(--af-body)" }}>
                Tell Florence your best email and she&apos;ll save your spot.
              </p>
            )}
          </div>
        )}

        {s.step === "done" && (
          <div className="flo-done">
            <Presence level={f.level} />
            <h2>
              You are <em>on the list.</em>
            </h2>
            <p style={{ color: "var(--af-body)", marginTop: 12 }}>
              We will reach out the moment enrollment opens, in a few weeks.
            </p>
            <div className="flo-pill">
              <b>Confirmation sent to {s.waitlistEmail}</b>
              <span>from hello@updates.askflorence.health</span>
              <br />
              <span>Add us to your contacts so it doesn&apos;t slip into spam.</span>
            </div>
          </div>
        )}

        {s.step === "state_marketplace" && (
          <div style={{ textAlign: "center", maxWidth: 460 }}>
            <h2 className="af-h3">Your state runs its own marketplace</h2>
            <p style={{ color: "var(--af-body)", marginTop: 12 }}>{s.notice}</p>
          </div>
        )}

        {s.step === "error" && (
          <div style={{ textAlign: "center", maxWidth: 440 }}>
            <h2 className="af-h3">One moment.</h2>
            <p style={{ color: "var(--af-body)" }}>{s.errorMsg || f.fatal}</p>
            <button className="af-btn af-btn--primary" style={{ marginTop: 16 }} onClick={f.restart}>
              Try again
            </button>
          </div>
        )}
      </div>

      <div className="af-l2-flo__foot">
        {statusLabel && (
          <div className="af-l2-flo__status" aria-live="polite">
            {statusLabel}
          </div>
        )}
        <Bars level={f.level} active={s.presence === "speaking" || s.presence === "listening"} />
        <div className="af-l2-flo__controls">
          <button className="af-l2-flo__ctrl" onClick={f.toggleMute}>
            {f.muted ? "Muted" : "Mute"}
          </button>
          <button className="af-l2-flo__ctrl af-l2-flo__ctrl--end" onClick={f.end}>
            End call
          </button>
        </div>
      </div>
    </div>
  );
}
