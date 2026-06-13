// Client tool implementations. Keys MUST match the agent's tool names.
// Each tool returns a string Florence narrates from (status-prefixed).

import type { CoverageResult, PlanDisplay } from "@/lib/types";
import { normalizePlan, sortByRealPrice } from "@/lib/calculator/pricing";
import { formatCurrency } from "@/lib/format";
import type { SceneEvent } from "./scene";

export interface FlorenceStore {
  zip: string;
  state: string;
  countyName: string;
  countyFips: string;
  ages: number[];
  married: boolean;
  income: number;
  aptc: number;
  csr: string;
  isMedicaid: boolean;
  allPlans: PlanDisplay[];
  totalPlans: number;
  coverage: CoverageResult[];
}

export function emptyStore(): FlorenceStore {
  return {
    zip: "",
    state: "",
    countyName: "",
    countyFips: "",
    ages: [],
    married: false,
    income: 0,
    aptc: 0,
    csr: "",
    isMedicaid: false,
    allPlans: [],
    totalPlans: 0,
    coverage: [],
  };
}

type Dispatch = (e: SceneEvent) => void;

async function postJson(path: string, body: unknown) {
  const res = await fetch(`/api/florence${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}
async function getJson(path: string) {
  const res = await fetch(`/api/florence${path}`, { method: "GET" });
  return res.json();
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// chunk allPlans ids by 10, fire in parallel, aggregate per-plan coverage.
async function coverProvidersAcrossAllPlans(
  npis: string[],
  store: FlorenceStore,
): Promise<Record<string, "covered" | "partial" | "not_covered">> {
  const ids = store.allPlans.map((p) => p.id);
  const byPlan: Record<string, "covered" | "partial" | "not_covered"> = {};
  const chunks = chunk(ids, 10);
  const results = await Promise.all(
    chunks.map((c) =>
      postJson("/providers/covered", { npis, plan_id: c, state: store.state }),
    ),
  );
  for (const r of results) {
    const rows = r?.data?.coverage ?? [];
    for (const row of rows) {
      const cov = String(row.coverage ?? "");
      const v =
        cov === "Covered" || cov === "GenericCovered"
          ? "covered"
          : cov === "PartialCovered"
            ? "partial"
            : "not_covered";
      // a plan is covered if any named provider/npi is covered on it
      const prev = byPlan[row.plan_id];
      if (prev !== "covered") byPlan[row.plan_id] = v;
    }
  }
  return byPlan;
}

export function createFlorenceClientTools(store: FlorenceStore, dispatch: Dispatch) {
  return {
    collect_location: async (p: { zip?: string; county_name?: string }) => {
      dispatch({ t: "toolStart", tool: "collect_location" });
      const zip = String(p.zip ?? "").replace(/\D/g, "").slice(0, 5);
      const c = await getJson(`/counties?zip=${zip}`);
      if (c?.sbeRedirect) {
        dispatch({
          t: "notice",
          step: "state_marketplace",
          message: `${c.sbeRedirect.state} runs its own marketplace (${c.sbeRedirect.marketplace}).`,
        });
        return `state_marketplace: ${c.sbeRedirect.state} uses ${c.sbeRedirect.marketplace}. Tell them honestly their state runs its own exchange.`;
      }
      if (c?.unsupported) {
        dispatch({ t: "notice", step: "unsupported", message: c.unsupported.message ?? "" });
        return `unsupported: ${c.unsupported.message}. Ask them to confirm their county.`;
      }
      const counties = c?.counties ?? [];
      if (counties.length === 0) return "not_found: no county for that ZIP. Ask them to repeat it.";
      const county = counties[0];
      store.zip = zip;
      store.state = county.state;
      store.countyName = county.name;
      store.countyFips = county.fips;
      dispatch({
        t: "location",
        zip,
        state: county.state,
        countyName: county.name,
        countyFips: county.fips,
      });
      return `ok: resolved to ${county.name} County, ${county.state}. Now ask who is on the plan in the same turn.`;
    },

    set_household: async (p: { ages?: number[]; married?: boolean; phrase?: string }) => {
      dispatch({ t: "toolStart", tool: "set_household" });
      const ages = (p.ages ?? []).map((a) => Number(a)).filter((a) => a > 0);
      store.ages = ages.length ? ages : store.ages;
      store.married = Boolean(p.married);
      const size = store.ages.length;
      const summary = `${size} ${size === 1 ? "person" : "people"}, ages ${store.ages.join(" and ")}${store.married ? ", married couple" : ""}`;
      dispatch({ t: "household", summary, size });
      return `ok: ${summary}. Now ask for their rough yearly household income.`;
    },

    set_income: async (p: { annual_income?: number }) => {
      dispatch({ t: "toolStart", tool: "set_income" });
      store.income = Number(p.annual_income ?? 0);
      const summary = `about $${store.income.toLocaleString()} a year`;
      dispatch({ t: "income", summary });
      return `ok: ${summary}. Now call find_plans.`;
    },

    find_plans: async () => {
      dispatch({ t: "toolStart", tool: "find_plans" });
      const household = {
        income: store.income,
        people: store.ages.map((age, i) => ({
          age,
          gender: i === 0 ? ("Male" as const) : ("Female" as const),
        })),
        has_married_couple: store.married,
      };
      const place = { zipcode: store.zip, state: store.state, countyfips: store.countyFips };

      const steps = [
        { label: `Pulled federal plan data for ${store.countyName}, ${store.state}`, done: false },
        { label: "Subsidy applied: ACA premium tax credit", done: false },
        { label: "Sorted plans by your real price", done: false },
        { label: "Confirmed doctors + medications in your state", done: false },
        { label: "Picking your best plan", done: false },
      ];
      dispatch({ t: "searchProgress", steps: steps.map((s) => ({ ...s })) });

      const elig = await postJson("/eligibility", { household, place });
      const est = elig?.estimates?.[0] ?? {};
      store.aptc = Number(est.aptc ?? 0);
      store.csr = String(est.csr ?? "");
      store.isMedicaid = Boolean(est.is_medicaid_chip) || Boolean(elig?.is_medicaid_adjusted);
      steps[0].done = true;
      steps[1].done = true;
      dispatch({ t: "searchProgress", steps: steps.map((s) => ({ ...s })) });

      const csrApplies = Boolean(store.csr) || Boolean(elig?.is_medicaid_adjusted);
      const planRes = await postJson("/plans", {
        household,
        place,
        fetch_base: true,
        ...(csrApplies ? { filters: { metal_levels: ["Silver"] } } : {}),
        limit: 200,
      });
      const raw: Record<string, unknown>[] = planRes?.plans ?? [];
      store.totalPlans = Number(planRes?.total ?? raw.length);
      const all = sortByRealPrice(raw.map((r) => normalizePlan(r, store.aptc)));
      store.allPlans = all;
      steps[2].done = true;
      dispatch({ t: "searchProgress", steps: steps.map((s) => ({ ...s })) });

      const top3 = all.slice(0, 3);
      const best = top3[0];

      // breadth (best plan)
      if (best) {
        try {
          const ct = await postJson("/plans/coverage-totals", {
            plan_id: best.id,
            state: store.state,
          });
          if (ct?.ok) {
            dispatch({ t: "breadth", drugs: Number(ct.drugs ?? 0), providers: Number(ct.providers ?? 0) });
            steps[3].label = `Confirmed ${Number(ct.providers ?? 0).toLocaleString()} doctors + ${Number(ct.drugs ?? 0).toLocaleString()} meds in ${store.state}`;
          }
        } catch {}
      }
      steps[3].done = true;
      steps[4].done = true;
      dispatch({ t: "searchProgress", steps: steps.map((s) => ({ ...s })) });

      dispatch({
        t: "plans",
        plans: top3,
        total: store.totalPlans,
        aptc: store.aptc,
        csr: store.csr,
        isMedicaid: store.isMedicaid,
      });

      if (!best) return "no_plans: no plans returned for this household.";
      return `ok. Best plan: ${best.issuer} ${best.name}. Monthly after subsidy ${formatCurrency(best.realPrice)}. Sticker ${formatCurrency(best.premium)}. Showing the 3 cheapest of ${store.totalPlans}. Narrate ONLY these numbers.`;
    },

    check_provider: async (p: { name?: string; specialty_hint?: string; npi_hint?: string }) => {
      dispatch({ t: "toolStart", tool: "check_provider" });
      const name = String(p.name ?? "");
      const ac = await postJson("/providers/autocomplete", {
        q: name,
        zipcode: store.zip,
        type: "Individual",
      });
      const hits = ac?.data ?? [];
      if (hits.length === 0) return `not_found: no provider matched "${name}".`;
      const hit = hits[0];
      const byPlan = await coverProvidersAcrossAllPlans([hit.npi], store);
      const coveredCount = Object.values(byPlan).filter((v) => v !== "not_covered").length;
      const result: CoverageResult = {
        kind: "doctor",
        query: name,
        matchedName: hit.name,
        subtitle: `${hit.specialties?.[0] ?? "Provider"}`,
        byPlan,
        coveredCount,
        totalPlans: store.totalPlans,
      };
      store.coverage = [...store.coverage.filter((c) => c.kind !== "doctor" || c.query !== name), result];
      dispatch({ t: "narrow", coverage: store.coverage });
      return `result: "${hit.name}" is in-network on ${coveredCount} of ${store.totalPlans} plans.`;
    },

    check_drug: async (p: { name?: string; strength_hint?: string; form_hint?: string }) => {
      dispatch({ t: "toolStart", tool: "check_drug" });
      const name = String(p.name ?? "");
      const ids = store.allPlans.map((pl) => pl.id);
      const res = await postJson("/drugs/find", {
        name,
        plan_ids: ids,
        ...(p.strength_hint ? { strength_hint: p.strength_hint } : {}),
      });
      const matches = res?.matches ?? [];
      if (matches.length === 0) return `not_found: "${name}" did not resolve to a drug.`;
      const m = matches[0];
      const covering: string[] = m.plans_covering ?? [];
      const byPlan: Record<string, "covered" | "partial" | "not_covered"> = {};
      for (const id of ids) byPlan[id] = covering.includes(id) ? "covered" : "not_covered";
      const result: CoverageResult = {
        kind: "drug",
        query: name,
        matchedName: m.display_name,
        subtitle: m.form_category,
        byPlan,
        coveredCount: covering.length,
        totalPlans: store.totalPlans,
        tierByPlan: m.tier_by_plan,
      };
      store.coverage = [...store.coverage.filter((c) => c.kind !== "drug" || c.query !== name), result];
      dispatch({ t: "narrow", coverage: store.coverage });
      return `result: "${name}" is covered on ${covering.length} of ${store.totalPlans} plans.`;
    },

    suggest_providers: async (p: { specialty?: string; limit?: number }) => {
      dispatch({ t: "toolStart", tool: "suggest_providers" });
      const best = store.allPlans[0];
      if (!best) return "no_plan: run find_plans first.";
      const res = await postJson("/providers/suggest", {
        plan_id: best.id,
        state: store.state,
        zip: store.zip,
        specialty: p.specialty ?? "primary_care",
        limit: p.limit ?? 5,
      });
      const sugg = (res?.suggestions ?? []).map((s: Record<string, unknown>) => ({
        npi: String(s.npi),
        display_name: String(s.display_name),
        specialty: String(s.specialty),
        city: String(s.city),
        state: String(s.state),
      }));
      dispatch({ t: "suggest", suggestions: sugg, total: Number(res?.total_in_plan ?? sugg.length) });
      return `ok: a few accepting ${p.specialty ?? "primary care"} doctors on ${best.name}. About ${res?.total_in_plan ?? sugg.length} total.`;
    },

    plan_detail: async (p: { plan_id?: string; topic?: string }) => {
      dispatch({ t: "toolStart", tool: "plan_detail" });
      const plan = store.allPlans.find((pl) => pl.id === p.plan_id) ?? store.allPlans[0];
      if (!plan) return "no_plan: run find_plans first.";
      return `ok. Plan ${plan.id}: deductible ${formatCurrency(plan.deductible)}, primary care ${plan.copays.primaryCare}, specialist ${plan.copays.specialist}, ER ${plan.copays.emergency}, therapy ${plan.copays.therapy}. Narrate ONLY these numbers.`;
    },

    select_plan: async (p: { plan_id?: string }) => {
      dispatch({ t: "toolStart", tool: "select_plan" });
      const plan = store.allPlans.find((pl) => pl.id === p.plan_id) ?? store.allPlans[0];
      if (!plan) return "no_plan: run find_plans first.";
      dispatch({ t: "selectPlan", planId: plan.id });
      return `ok: selected ${plan.name} at ${formatCurrency(plan.realPrice)}/mo. Now ask for their best email.`;
    },

    propose_email: async (p: { email?: string }) => {
      const email = String(p.email ?? "").trim();
      if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return `invalid_email: "${email}" does not look valid. Ask again.`;
      dispatch({ t: "proposeEmail", email });
      return `ok_proposed: showing "${email}". Ask "I have you down as ${email}, is that right?" If yes, call join_waitlist.`;
    },

    join_waitlist: async (p: { email?: string }) => {
      dispatch({ t: "toolStart", tool: "join_waitlist" });
      const email = String(p.email ?? "").trim();
      const plan = store.allPlans.find((pl) => pl.id) ?? store.allPlans[0];
      await postJson("/waitlist", {
        email,
        interest: "plan_interest",
        source_page: "florence_voice",
        plan: plan
          ? {
              plan_id: plan.id,
              plan_name: plan.name,
              issuer: plan.issuer,
              metal_level: plan.metalLevel,
              plan_type: plan.planType,
              premium_subsidized: plan.realPrice,
              premium_sticker: plan.premium,
              deductible: plan.deductible,
              moop: plan.moop,
              state: store.state,
              zipcode: store.zip,
            }
          : undefined,
      });
      dispatch({ t: "waitlisted", email });
      return `ok: saved and confirmation sent to ${email}. Remind them to check spam for hello@updates.askflorence.health.`;
    },
  };
}
