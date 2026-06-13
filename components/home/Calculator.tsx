"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import "./home.css";
import { useCalculator } from "@/lib/calculator/useCalculator";
import PlanCard from "./PlanCard";
import PriceReveal from "./PriceReveal";
import { formatCurrencyWhole } from "@/lib/format";

type Scene = "searching" | "reveal" | "plans";

export default function Calculator() {
  const c = useCalculator();
  const [incomeText, setIncomeText] = useState(String(c.form.income));
  const [scene, setScene] = useState<Scene>("searching");
  const [barScrolled, setBarScrolled] = useState(false);
  const takeoverRef = useRef<HTMLDivElement>(null);

  const takeoverActive = c.phase !== "form";

  // scene sequencing
  useEffect(() => {
    if (c.phase === "loading") setScene("searching");
  }, [c.phase]);

  useEffect(() => {
    if (c.phase !== "results") return;
    setScene("reveal");
    const t = setTimeout(() => setScene("plans"), 3500);
    return () => clearTimeout(t);
  }, [c.phase]);

  // body scroll lock + history + escape
  useEffect(() => {
    if (!takeoverActive) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const pushedUrl = window.location.href;
    history.pushState({ takeover: true }, "");
    const onPop = () => c.resetForm();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") c.resetForm();
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      if (window.location.href === pushedUrl) history.back();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takeoverActive]);

  function updatePerson(i: number, patch: Partial<{ age: number; gender: "Male" | "Female" }>) {
    c.setForm((f) => ({
      ...f,
      people: f.people.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    }));
  }

  const tag = (i: number) =>
    i === 0 ? "You" : i === 1 && c.form.isMarried ? "Spouse" : `Person ${i + 1}`;

  // ---- TAKEOVER ----
  if (takeoverActive) {
    return (
      <div
        className="tk"
        role="dialog"
        aria-modal="true"
        ref={takeoverRef}
        onScroll={(e) => setBarScrolled((e.target as HTMLElement).scrollTop > 8)}
      >
        <div className={`tk__bar${barScrolled ? " is-scrolled" : ""}`}>
          <button
            className="tk__back"
            onClick={c.resetForm}
            aria-label="Close results and edit your inputs"
          >
            ← Back
          </button>
          <button
            className="tk__wordmark"
            onClick={() => {
              c.resetForm();
              window.scrollTo({ top: 0 });
            }}
            aria-label="AskFlorence — back to top"
          >
            <span className="af-wordmark">
              Ask<b>Florence</b>
              <i className="dot" />
            </span>
          </button>
          <span style={{ width: 60 }} />
        </div>

        {(c.phase === "loading" || scene === "searching") && (
          <div className="tk__center" aria-live="polite">
            <span className="tk__dot" />
            <div className="tk__searching">
              Finding your plan<span className="tk__dots" />
            </div>
          </div>
        )}

        {c.phase === "results" && scene === "reveal" && c.bestPlan && (
          <div className="tk__center">
            <PriceReveal sticker={c.bestPlan.premium} real={c.bestPlan.realPrice} />
          </div>
        )}

        {c.phase === "results" && scene === "plans" && (
          <div className="tk__plans stagger">
            {c.isMedicaid && (
              <div className="tk__medicaid">
                {c.isNonExpansionBump ? (
                  <>
                    <b>Your income qualifies for the highest ACA subsidy</b>
                    <p>
                      Your state did not expand Medicaid, but ACA premium tax
                      credits are federal. The Silver plans below apply the full
                      subsidy.
                    </p>
                  </>
                ) : (
                  <>
                    <b>Your income falls within the Medicaid threshold</b>
                    <p>
                      At this income the marketplace would first direct you to
                      Medicaid. If you are denied or ineligible, the subsidized
                      Silver plans below may apply.
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="tk__planhead">
              <span className="af-eyebrow">Your plans</span>
              <h2 className="af-h2" style={{ marginTop: 14 }}>
                {c.totalPlans} plans available. <em>Here are the 3 cheapest.</em>
              </h2>
            </div>

            {c.aptc > 0 && (
              <p className="tk__aptc">
                Based on <b>${Math.round(c.aptc)}/month in tax credits</b> applied
                to Silver plans.
              </p>
            )}

            <div className="tk__grid">
              {c.plans.map((p) => (
                <PlanCard key={p.id} plan={p} variant="micro" href={c.planHref(p.id)} />
              ))}
            </div>
            <p className="tk__tap-hint">Tap a plan to see full benefits and documents.</p>
          </div>
        )}

        {c.phase === "state_marketplace" && (
          <div className="tk__center">
            <div className="tk__honest">
              <span className="af-eyebrow">Your state runs its own marketplace</span>
              <h2 className="af-h2" style={{ margin: "16px 0" }}>
                {c.stateMarketplace?.state} uses {c.stateMarketplace?.marketplace}.
              </h2>
              <p style={{ color: "var(--af-body)" }}>
                Your state runs its own exchange, so plan prices come from there.
                We are bringing real {c.stateMarketplace?.state} pricing into
                Florence soon.
              </p>
            </div>
          </div>
        )}

        {c.phase === "unsupported_zip" && (
          <div className="tk__center">
            <div className="tk__honest">
              <span className="af-eyebrow">Let us find your county</span>
              <h2 className="af-h2" style={{ margin: "16px 0" }}>
                {c.unsupportedInfo?.message}
              </h2>
              <div className="cal__chips" style={{ justifyContent: "center" }}>
                {c.unsupportedInfo?.alternateCounties.map((co) => (
                  <button
                    key={co.fips}
                    className="cal__chip"
                    onClick={() => c.handleAlternateCountyPick(co)}
                  >
                    {co.name}, {co.state}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {c.phase === "error" && (
          <div className="tk__center">
            <div className="tk__honest">
              <span className="af-eyebrow">One moment</span>
              <h2 className="af-h2" style={{ margin: "16px 0" }}>
                Something hiccuped.
              </h2>
              <button className="af-btn af-btn--primary" onClick={c.handleSubmit}>
                Try again
              </button>
            </div>
          </div>
        )}

        {c.phase === "results" && scene === "plans" && c.bestPlan && (
          <div className="tk__cta">
            <Link className="af-btn af-btn--primary" href={c.planHref(c.bestPlan.id)}>
              View plan details →
            </Link>
            <small>
              Or{" "}
              <Link href="/florence" className="tk__cta-link">
                talk to Florence by voice
              </Link>{" "}
              to check your doctors and prescriptions.
            </small>
          </div>
        )}
      </div>
    );
  }

  // ---- FORM ----
  return (
    <section className="af-section" id="calculator">
      <div className="cal">
        <div className="cal__grid">
          <div>
            <span className="af-eyebrow">Price calculator</span>
            <h2 className="af-h2" style={{ marginTop: 16 }}>
              Find your plan, <em>in 30 seconds.</em>
            </h2>
            <div className="cal__polas">
              <div className="cal__pola">
                Silver · HMO<b>$7.78/mo</b>was $1,051
              </div>
              <div className="cal__pola">
                Silver · PPO<b>$0/mo</b>$0 deductible
              </div>
              <div className="cal__pola">
                Gold · HMO<b>$24/mo</b>4★ rated
              </div>
            </div>
          </div>

          <form
            className="cal__form"
            onSubmit={(e) => {
              e.preventDefault();
              c.handleSubmit();
            }}
          >
            <div className="cal__field">
              <label className="cal__label">Where do you live?</label>
              <input
                className="cal__input"
                inputMode="numeric"
                maxLength={5}
                placeholder="ZIP code"
                value={c.form.zipCode}
                onChange={(e) =>
                  c.setForm((f) => ({
                    ...f,
                    zipCode: e.target.value.replace(/\D/g, "").slice(0, 5),
                  }))
                }
              />
            </div>

            {c.showCountyPicker && (
              <div className="cal__field">
                <label className="cal__label">
                  This ZIP spans multiple counties. Select yours.
                </label>
                <div className="cal__chips">
                  {c.counties.map((co) => (
                    <button
                      type="button"
                      key={co.fips}
                      className="cal__chip"
                      onClick={() => c.handleAlternateCountyPick(co)}
                    >
                      {co.name}, {co.state}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="cal__field">
              <label className="cal__label">Who&apos;s covered?</label>
              {c.form.people.map((p, i) => (
                <div className="cal__person" key={i}>
                  <span className="cal__tag">{tag(i)}</span>
                  <input
                    className="cal__input"
                    inputMode="numeric"
                    value={p.age}
                    onChange={(e) =>
                      updatePerson(i, {
                        age: Math.min(120, Number(e.target.value.replace(/\D/g, "")) || 0),
                      })
                    }
                  />
                  <select
                    className="cal__select"
                    value={p.gender}
                    onChange={(e) =>
                      updatePerson(i, { gender: e.target.value as "Male" | "Female" })
                    }
                  >
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                  {c.form.people.length > 1 && (
                    <button
                      type="button"
                      className="cal__remove"
                      aria-label="Remove person"
                      onClick={() =>
                        c.setForm((f) => ({
                          ...f,
                          people: f.people.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {c.form.people.length < 6 && (
                <button
                  type="button"
                  className="cal__add"
                  onClick={() =>
                    c.setForm((f) => ({
                      ...f,
                      people: [...f.people, { age: 30, gender: "Female" }],
                    }))
                  }
                >
                  + Add another person
                </button>
              )}
            </div>

            {c.form.people.length >= 2 && (
              <button
                type="button"
                className="cal__toggle"
                role="switch"
                aria-checked={c.form.isMarried}
                onClick={() => c.setForm((f) => ({ ...f, isMarried: !f.isMarried }))}
              >
                <span className="cal__switch" data-on={c.form.isMarried} />
                Married couple?
              </button>
            )}

            <div className="cal__field">
              <label className="cal__label">
                What&apos;s your annual household income?
              </label>
              <div className="cal__money">
                <input
                  className="cal__input"
                  inputMode="numeric"
                  value={incomeText}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setIncomeText(digits);
                    c.setForm((f) => ({ ...f, income: Number(digits) || 0 }));
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: "var(--af-stone)",
                  margin: "6px 0 0",
                }}
              >
                Wages, self-employment, all sources combined.
              </p>
            </div>

            <button className="af-btn af-btn--primary cal__submit" type="submit">
              See your real price →
            </button>
            <p className="cal__reassure">
              Your data stays here. We never resell it.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
