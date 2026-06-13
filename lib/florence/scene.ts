// Pure, framework-free scene state machine for the Florence voice experience.

import type { CoverageResult, PlanDisplay, ProviderSuggestion } from "@/lib/types";

export type SceneStep =
  | "idle"
  | "greeting"
  | "collect_zip"
  | "collect_household"
  | "collect_income"
  | "searching"
  | "reveal"
  | "plans"
  | "coverage"
  | "waitlist"
  | "done"
  | "state_marketplace"
  | "unsupported"
  | "error";

export type PresenceState =
  | "greeting"
  | "listening"
  | "thinking"
  | "speaking"
  | "idle";

export interface SearchStep {
  label: string;
  done: boolean;
}

export interface SceneState {
  step: SceneStep;
  presence: PresenceState;
  captionAgent: string;
  captionUser: string;
  location: { zip: string; state: string; countyName: string; countyFips: string } | null;
  householdSummary: string;
  householdSize: number;
  incomeSummary: string;
  plans: PlanDisplay[];
  bestPlan: PlanDisplay | null;
  totalPlans: number;
  aptc: number;
  csr: string;
  isMedicaid: boolean;
  coverage: CoverageResult[];
  chosenPlanId: string | null;
  waitlisted: boolean;
  waitlistEmail: string;
  coverageSummary: string;
  notice: string;
  errorMsg: string;
  providerSuggestions: ProviderSuggestion[];
  providerSuggestionsTotal: number;
  breadthTotals: { drugs: number; providers: number } | null;
  searchProgress: SearchStep[];
  pendingEmailConfirm: { email: string } | null;
}

export const EYEBROWS: Record<SceneStep, string> = {
  idle: "AskFlorence",
  greeting: "Meet Florence",
  collect_zip: "Where you live",
  collect_household: "Your household",
  collect_income: "Your income",
  searching: "Pulling real plans",
  reveal: "The real price",
  plans: "Your plans",
  coverage: "Your doctors and medications",
  waitlist: "Save your spot",
  done: "You are set",
  state_marketplace: "Your state runs its own marketplace",
  unsupported: "Let us find your county",
  error: "One moment",
};

export function emptyScene(): SceneState {
  return {
    step: "idle",
    presence: "idle",
    captionAgent: "",
    captionUser: "",
    location: null,
    householdSummary: "",
    householdSize: 0,
    incomeSummary: "",
    plans: [],
    bestPlan: null,
    totalPlans: 0,
    aptc: 0,
    csr: "",
    isMedicaid: false,
    coverage: [],
    chosenPlanId: null,
    waitlisted: false,
    waitlistEmail: "",
    coverageSummary: "",
    notice: "",
    errorMsg: "",
    providerSuggestions: [],
    providerSuggestionsTotal: 0,
    breadthTotals: null,
    searchProgress: [],
    pendingEmailConfirm: null,
  };
}

export type SceneEvent =
  | { t: "connected" }
  | { t: "disconnected" }
  | { t: "mode"; mode: "speaking" | "listening" }
  | { t: "greetingComplete" }
  | { t: "transcript"; role: "agent" | "user"; text: string }
  | { t: "toolStart"; tool: string }
  | { t: "location"; zip: string; state: string; countyName: string; countyFips: string }
  | { t: "household"; summary: string; size: number }
  | { t: "income"; summary: string }
  | { t: "searchProgress"; steps: SearchStep[] }
  | { t: "breadth"; drugs: number; providers: number }
  | {
      t: "plans";
      plans: PlanDisplay[];
      total: number;
      aptc: number;
      csr: string;
      isMedicaid: boolean;
    }
  | { t: "revealDone" }
  | { t: "narrow"; coverage: CoverageResult[] }
  | { t: "suggest"; suggestions: ProviderSuggestion[]; total: number }
  | { t: "selectPlan"; planId: string }
  | { t: "proposeEmail"; email: string }
  | { t: "waitlisted"; email: string }
  | { t: "notice"; step: SceneStep; message: string }
  | { t: "error"; message: string }
  | { t: "reset" };

function computeCoverageSummary(coverage: CoverageResult[], total: number): string {
  if (coverage.length === 0 || total === 0) return "";
  // intersection: plans that cover EVERYTHING the user named.
  let matching = 0;
  const ids = new Set<string>();
  for (const c of coverage) for (const id of Object.keys(c.byPlan)) ids.add(id);
  for (const id of ids) {
    const all = coverage.every((c) => c.byPlan[id] === "covered" || c.byPlan[id] === "partial");
    if (all) matching++;
  }
  return `${matching} of ${total} plans cover everything you take`;
}

export function sceneReducer(s: SceneState, e: SceneEvent): SceneState {
  switch (e.t) {
    case "connected":
      return { ...s, step: "greeting", presence: "speaking" };
    case "disconnected":
      return { ...s, presence: "idle" };
    case "mode":
      if (e.mode === "speaking") return { ...s, presence: "speaking" };
      return { ...s, presence: s.presence === "thinking" ? "thinking" : "listening" };
    case "greetingComplete":
      return s.step === "greeting" ? { ...s, step: "collect_zip", presence: "listening" } : s;
    case "transcript":
      return e.role === "agent"
        ? { ...s, captionAgent: e.text }
        : { ...s, captionUser: e.text };
    case "toolStart":
      return {
        ...s,
        presence: "thinking",
        step: e.tool === "find_plans" ? "searching" : s.step,
      };
    case "location":
      return {
        ...s,
        location: { zip: e.zip, state: e.state, countyName: e.countyName, countyFips: e.countyFips },
        step: "collect_household",
        presence: "speaking",
      };
    case "household":
      return {
        ...s,
        householdSummary: e.summary,
        householdSize: e.size,
        step: "collect_income",
        presence: "speaking",
      };
    case "income":
      return { ...s, incomeSummary: e.summary, presence: "speaking" };
    case "searchProgress":
      return { ...s, searchProgress: e.steps, step: "searching" };
    case "breadth":
      return { ...s, breadthTotals: { drugs: e.drugs, providers: e.providers } };
    case "plans":
      return {
        ...s,
        plans: e.plans,
        bestPlan: e.plans[0] ?? null,
        totalPlans: e.total,
        aptc: e.aptc,
        csr: e.csr,
        isMedicaid: e.isMedicaid,
        step: "reveal",
        presence: "speaking",
      };
    case "revealDone":
      return s.step === "reveal" ? { ...s, step: "plans" } : s;
    case "narrow": {
      const summary = computeCoverageSummary(e.coverage, s.totalPlans);
      return {
        ...s,
        coverage: e.coverage,
        coverageSummary: summary,
        step: "coverage",
        presence: "speaking",
      };
    }
    case "suggest":
      return {
        ...s,
        providerSuggestions: e.suggestions,
        providerSuggestionsTotal: e.total,
        presence: "speaking",
      };
    case "selectPlan":
      return { ...s, chosenPlanId: e.planId, step: "waitlist", presence: "speaking" };
    case "proposeEmail":
      return { ...s, pendingEmailConfirm: { email: e.email }, step: "waitlist" };
    case "waitlisted":
      return {
        ...s,
        waitlisted: true,
        waitlistEmail: e.email,
        pendingEmailConfirm: null,
        step: "done",
        presence: "speaking",
      };
    case "notice":
      return { ...s, step: e.step, notice: e.message };
    case "error":
      return { ...s, step: "error", errorMsg: e.message, presence: "idle" };
    case "reset":
      return emptyScene();
    default:
      return s;
  }
}
