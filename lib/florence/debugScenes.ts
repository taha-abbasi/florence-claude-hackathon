// Canned scene events so any beat can be rendered without a live call.
// Seeded with the golden Utah scenario (Appendix B).

import type { PlanDisplay } from "@/lib/types";
import type { SceneEvent } from "./scene";

function plan(
  id: string,
  name: string,
  sticker: number,
  real: number,
  ded: number,
  baseDed: number,
  copays: PlanDisplay["copays"],
): PlanDisplay {
  return {
    id,
    issuer: "Select Health",
    name,
    metalLevel: "Silver",
    planType: "HMO",
    premium: sticker,
    aptc: 1041,
    realPrice: real,
    deductible: ded,
    deductibleFamily: ded * 2,
    baseDeductible: baseDed,
    baseDeductibleFamily: baseDed * 2,
    moop: 3000,
    moopFamily: 6000,
    baseMoop: 9500,
    baseMoopFamily: 19000,
    copays,
    rating: 4,
    ratings: { clinical: 3, enrollee: 0, efficiency: 5 },
    allBenefits: [],
    documents: {},
  };
}

const GOLDEN: PlanDisplay[] = [
  plan("68781UT0200014", "Signature Benchmark Silver 0 Medical Deductible", 1051.3, 9.95, 0, 5900, {
    primaryCare: "$5",
    specialist: "$15",
    urgentCare: "$10",
    genericDrugs: "$0",
    emergency: "$150",
    therapy: "$5",
  }),
  plan("68781UT0200007", "Value Benchmark Silver 0 Medical Deductible", 1078.1, 36.75, 0, 5900, {
    primaryCare: "$5",
    specialist: "$15",
    urgentCare: "$10",
    genericDrugs: "$0",
    emergency: "$150",
    therapy: "$5",
  }),
  plan("68781UT0020024", "Value Silver 0 Medical Deductible", 1129.16, 87.81, 3000, 3000, {
    primaryCare: "$0",
    specialist: "$10",
    urgentCare: "-",
    genericDrugs: "$5",
    emergency: "-",
    therapy: "$0",
  }),
];

const base: SceneEvent[] = [
  { t: "connected" },
  { t: "location", zip: "84101", state: "UT", countyName: "Salt Lake", countyFips: "49035" },
  { t: "household", summary: "2 people, ages 35 and 30, married couple", size: 2 },
  { t: "income", summary: "about $21,000 a year" },
];

const plansEvent: SceneEvent = {
  t: "plans",
  plans: GOLDEN,
  total: 49,
  aptc: 1041,
  csr: "94",
  isMedicaid: true,
};

export function debugScene(id: string): SceneEvent[] {
  switch (id) {
    case "greeting":
      return [{ t: "connected" }];
    case "collect":
      return [{ t: "connected" }, { t: "greetingComplete" }];
    case "searching":
      return [
        ...base,
        { t: "toolStart", tool: "find_plans" },
        {
          t: "searchProgress",
          steps: [
            { label: "Pulled federal plan data for Salt Lake, UT", done: true },
            { label: "Subsidy applied: ACA premium tax credit", done: true },
            { label: "Sorted 49 plans by your real price", done: true },
            { label: "Confirmed 5,421 doctors + 4,279 meds in UT", done: false },
            { label: "Picking your best plan", done: false },
          ],
        },
      ];
    case "reveal":
      return [...base, plansEvent, { t: "breadth", drugs: 4279, providers: 5421 }];
    case "plans":
      return [...base, plansEvent, { t: "breadth", drugs: 4279, providers: 5421 }, { t: "revealDone" }];
    case "coverage":
      return [
        ...base,
        plansEvent,
        { t: "breadth", drugs: 4279, providers: 5421 },
        { t: "revealDone" },
        {
          t: "narrow",
          coverage: [
            {
              kind: "doctor",
              query: "Tyler Wood",
              matchedName: "DR. TYLER THOMAS WOOD DO",
              subtitle: "Internal Medicine · Murray, UT",
              byPlan: Object.fromEntries(GOLDEN.map((p, i) => [p.id, i < 2 ? "covered" : "not_covered"])),
              coveredCount: 14,
              totalPlans: 49,
            },
            {
              kind: "drug",
              query: "Ozempic",
              matchedName: "semaglutide 0.68 MG/ML Pen Injector",
              subtitle: "Pen Injector",
              byPlan: Object.fromEntries(GOLDEN.map((p, i) => [p.id, i < 1 ? "covered" : "not_covered"])),
              coveredCount: 9,
              totalPlans: 49,
            },
          ],
        },
      ];
    case "email-confirm":
      return [
        ...base,
        plansEvent,
        { t: "revealDone" },
        { t: "selectPlan", planId: GOLDEN[0].id },
        { t: "proposeEmail", email: "taha+demo@askflorence.health" },
      ];
    case "waitlist":
      return [...base, plansEvent, { t: "revealDone" }, { t: "selectPlan", planId: GOLDEN[0].id }];
    case "done":
      return [
        ...base,
        plansEvent,
        { t: "revealDone" },
        { t: "selectPlan", planId: GOLDEN[0].id },
        { t: "waitlisted", email: "taha+demo@askflorence.health" },
      ];
    default:
      return [{ t: "connected" }];
  }
}

export const DEBUG_SCENE_IDS = [
  "greeting",
  "collect",
  "searching",
  "reveal",
  "plans",
  "coverage",
  "email-confirm",
  "waitlist",
  "done",
];
