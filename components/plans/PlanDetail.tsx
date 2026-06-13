"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/components/home/home.css";
import type { PlanDisplay } from "@/lib/types";
import { normalizePlan } from "@/lib/calculator/pricing";
import { formatCurrency, formatCurrencyWhole, savingsPct } from "@/lib/format";

async function postJson(path: string, body: unknown) {
  const res = await fetch(`/api/florence${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function PlanDetail({
  planId,
  sp,
}: {
  planId: string;
  sp: Record<string, string | undefined>;
}) {
  const [plan, setPlan] = useState<PlanDisplay | null>(null);
  const [loading, setLoading] = useState(true);

  const zip = sp.zip ?? "84094";
  const state = sp.state ?? "UT";
  const countyFips = sp.county_fips ?? "49035";
  const income = Number(sp.income ?? 21000);
  const householdSize = Number(sp.household_size ?? 2);
  const aptcParam = Number(sp.aptc ?? 0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const household = {
        income,
        people: Array.from({ length: householdSize }, (_, i) => ({
          age: i === 0 ? 35 : 30,
          gender: i === 0 ? "Male" : "Female",
        })),
        has_married_couple: sp.married === "true",
      };
      const place = { zipcode: zip, state, countyfips: countyFips };
      const elig = await postJson("/eligibility", { household, place });
      const aptc = aptcParam || Number(elig?.estimates?.[0]?.aptc ?? 0);
      const csr = String(elig?.estimates?.[0]?.csr ?? "");
      const csrApplies = Boolean(csr) || Boolean(elig?.is_medicaid_adjusted);
      const planRes = await postJson("/plans", {
        household,
        place,
        fetch_base: true,
        ...(csrApplies ? { filters: { metal_levels: ["Silver"] } } : {}),
        limit: 200,
      });
      const raw: Record<string, unknown>[] = planRes?.plans ?? [];
      const found = raw.find((p) => String(p.id) === planId);
      if (alive) {
        setPlan(found ? normalizePlan(found, aptc) : null);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  if (loading) {
    return (
      <div className="af-section" style={{ paddingTop: 80, textAlign: "center" }}>
        <span className="tk__dot" style={{ margin: "0 auto 20px" }} />
        <p style={{ color: "var(--af-stone)" }}>Loading plan {planId}…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="af-section" style={{ paddingTop: 80 }}>
        <h1 className="af-h2">We couldn&apos;t find that plan.</h1>
        <p style={{ color: "var(--af-body)" }}>
          Plan {planId} is not in the current result set for this household.
        </p>
        <Link href="/#calculator" className="af-btn af-btn--primary">
          ← Back to the calculator
        </Link>
      </div>
    );
  }

  const pct = savingsPct(plan.realPrice, plan.premium);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 120px" }}>
      {/* context strip */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "var(--af-cream)",
          borderBottom: "1px solid var(--af-line)",
          padding: "14px 0",
          fontSize: 13,
          color: "var(--af-stone)",
          display: "flex",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <span>
          {state} · {householdSize} {householdSize === 1 ? "person" : "people"} ·
          ${income.toLocaleString()}/yr
          {plan.aptc > 0 ? ` · $${Math.round(plan.aptc)}/mo tax credit` : ""}
        </span>
        <Link href="/#calculator" style={{ color: "var(--af-gold-2)" }}>
          ← All plans
        </Link>
      </div>

      {/* hero card */}
      <div className="af-card" style={{ padding: 28, marginTop: 28 }}>
        <div className="pc__issuer">{plan.issuer}</div>
        <h1 className="af-h2" style={{ fontSize: "clamp(28px,4vw,44px)", margin: "6px 0 10px" }}>
          {plan.name}
        </h1>
        <div className="pc__pills">
          <span className="pc__pill">{plan.metalLevel}</span>
          <span className="pc__pill pc__pill--type">{plan.planType}</span>
          {plan.rating > 0 && <span className="pc__stars">{"★".repeat(Math.round(plan.rating))} {plan.rating}</span>}
        </div>
        <div className="pc__id">Plan ID: {plan.id}</div>
        <hr style={{ border: 0, borderTop: "1px solid var(--af-line)", margin: "16px 0" }} />
        <div className="pc__price" style={{ background: "var(--af-cream)" }}>
          <span className="pc__priceN" style={{ fontSize: 40 }}>
            {formatCurrency(plan.realPrice)}
          </span>
          <span className="pc__mo">/month</span>
          {plan.premium > plan.realPrice && (
            <span className="pc__strike">{formatCurrencyWhole(plan.premium)}</span>
          )}
          {pct > 0 && <span className="pc__save">Save {pct}%</span>}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <Link href="/florence" className="af-btn af-btn--primary">
            Continue to enroll →
          </Link>
          <button className="af-btn af-btn--ghost" disabled style={{ opacity: 0.5 }}>
            + Add to compare
          </button>
        </div>
      </div>

      {/* subsidy waterfall */}
      {plan.aptc > 0 && (
        <section style={{ marginTop: 48 }}>
          <span className="af-eyebrow">Monthly premium</span>
          <h2 className="af-h3" style={{ margin: "14px 0 24px" }}>
            How your subsidy works on <em>this plan.</em>
          </h2>
          <div className="af-card" style={{ padding: 24 }}>
            {[
              ["Premium before savings", formatCurrency(plan.premium)],
              ["Advance Premium Tax Credit", `-${formatCurrency(Math.min(plan.aptc, plan.premium))}`],
              ["Your monthly premium", formatCurrency(plan.realPrice)],
            ].map(([l, v], i) => (
              <div
                key={l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: i < 2 ? "1px solid var(--af-line)" : "none",
                  fontWeight: i === 2 ? 600 : 400,
                  color: i === 1 ? "var(--af-green-d)" : "var(--af-ink)",
                  fontFamily: i === 2 ? "var(--af-font-label)" : "inherit",
                }}
              >
                <span>{l}</span>
                <span style={{ fontFamily: "var(--af-font-label)" }}>{v}</span>
              </div>
            ))}
          </div>
          <p style={{ color: "var(--af-stone)", fontSize: 13, marginTop: 10 }}>
            Your subsidy is automatic.
          </p>
        </section>
      )}

      {/* curated benefits */}
      <section style={{ marginTop: 48 }}>
        <span className="af-eyebrow">The 7 things you&apos;ll use</span>
        <h2 className="af-h3" style={{ margin: "14px 0 24px" }}>
          What this plan actually costs you.
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 1,
            background: "var(--af-line)",
            border: "1px solid var(--af-line)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {[
            ["Deductible", formatCurrencyWhole(plan.deductible)],
            ["Max out-of-pocket", formatCurrencyWhole(plan.moop)],
            ["Primary care", plan.copays.primaryCare],
            ["Specialist", plan.copays.specialist],
            ["Urgent care", plan.copays.urgentCare],
            ["Generic meds", plan.copays.genericDrugs],
            ["Emergency room", plan.copays.emergency],
          ].map(([l, v]) => (
            <div key={l} style={{ background: "var(--af-paper)", padding: 18 }}>
              <div style={{ fontSize: 12, color: "var(--af-stone)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {l}
              </div>
              <div style={{ fontFamily: "var(--af-font-label)", fontSize: 22, marginTop: 4 }}>
                {v}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* florence widget */}
      <section style={{ marginTop: 48 }}>
        <div
          className="af-card"
          style={{ padding: 24, borderLeft: "4px solid var(--af-gold-2)" }}
        >
          <span className="af-eyebrow">Ask Florence</span>
          <h3 className="af-h3" style={{ fontSize: 24, margin: "12px 0" }}>
            Questions about this plan?
          </h3>
          <p style={{ color: "var(--af-body)", fontSize: 14 }}>
            Florence knows {plan.issuer} {plan.name}. Ask if your doctor is in
            network, if your prescription is covered, or how it compares.
          </p>
          <Link href="/florence" className="af-btn af-btn--primary" style={{ marginTop: 10 }}>
            Talk to Florence →
          </Link>
        </div>
      </section>
    </div>
  );
}
