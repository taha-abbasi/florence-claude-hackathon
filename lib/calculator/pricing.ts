// Plan normalization — matches the REAL Florence Tools /plans shape and mirrors
// the canonical extractCopay / extractCostShare logic from @askflorence/shared.
//
// Real plan shape (key fields):
//   issuer: { name }          type: "HMO"          premium / premium_w_credit
//   deductibles[]: { amount, type, family_cost: "Individual"|"Family Per Person"|"Family", network_tier }
//   moops[]:       { amount, type, family_cost, network_tier }
//   benefits[]:    { name, covered, cost_sharings: [{ copay_amount, coinsurance_rate, copay_options, network_tier }] }
//   quality_rating: { global_rating, clinical_quality_management_rating, enrollee_experience_rating, plan_efficiency_rating }
// The pre-CSR (sticker) deductible/MOOP live in the parallel `base_plans[]`, keyed by id.

import type { PlanDisplay } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

export function realPriceOf(premium: number, aptc: number): number {
  return Math.max(0, premium - aptc);
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

interface CostSharing {
  copay_amount?: number;
  coinsurance_rate?: number;
  copay_options?: string;
  network_tier?: string;
}
interface Benefit {
  name: string;
  covered?: boolean;
  cost_sharings?: CostSharing[];
}
interface AmountItem {
  amount: number;
  type?: string;
  family_cost?: string;
  network_tier?: string;
}

const BENEFIT_NAMES = {
  primaryCare: "primary care visit to treat an injury or illness",
  specialist: "specialist visit",
  urgentCare: "urgent care centers or facilities",
  genericDrugs: "generic drugs",
  emergency: "emergency room services",
  therapy: "mental/behavioral health outpatient services",
};

const DED_TYPE = "medical ehb deductible";
const MOOP_TYPE = "maximum out of pocket for medical and drug ehb benefits (total)";

// Format an In-Network cost-share string for one benefit (matches canonical).
function extractCopay(benefits: Benefit[] | undefined, benefitName: string): string {
  if (!benefits) return "-";
  const b = benefits.find((x) => x.name?.toLowerCase() === benefitName);
  if (!b?.cost_sharings?.length) return "-";
  const inNet = b.cost_sharings.find((cs) => cs.network_tier === "In-Network") ?? b.cost_sharings[0];
  const copay = num(inNet.copay_amount);
  const coins = num(inNet.coinsurance_rate);
  const afterDed = (inNet.copay_options ?? "").toLowerCase().includes("after deductible");
  if (copay > 0) return formatCurrency(copay) + (afterDed ? " after ded." : "");
  if (coins > 0) return `${Math.round(coins * 100)}% coins.`;
  return "$0";
}

// Pull Individual + Family-group amounts from a deductibles/moops array.
function extractCostShare(
  items: AmountItem[] | undefined,
  typeMatch: string,
): { individual: number; family: number | null } {
  if (!items) return { individual: 0, family: null };
  const c = items.filter(
    (i) => (i.type ?? "").toLowerCase() === typeMatch && i.network_tier === "In-Network",
  );
  const indiv = c.find((i) => i.family_cost === "Individual");
  const perPerson = c.find((i) => i.family_cost === "Family Per Person");
  const group = c.find((i) => i.family_cost === "Family");
  return {
    individual: num(indiv?.amount ?? perPerson?.amount ?? group?.amount ?? 0),
    family: group ? num(group.amount) : null,
  };
}

function allCoveredBenefits(benefits: Benefit[] | undefined): { name: string; cost: string }[] {
  if (!benefits) return [];
  return benefits
    .filter((b) => b.covered)
    .map((b) => {
      const inNet = b.cost_sharings?.find((cs) => cs.network_tier === "In-Network") ?? b.cost_sharings?.[0];
      const copay = num(inNet?.copay_amount);
      const coins = num(inNet?.coinsurance_rate);
      const cost = copay > 0 ? formatCurrency(copay) : coins > 0 ? `${Math.round(coins * 100)}%` : "$0";
      return { name: b.name, cost };
    });
}

type Raw = Record<string, unknown>;

// Normalize one raw plan, applying the given aptc and an optional base (pre-CSR) plan.
export function normalizePlan(raw: Raw, aptc: number, basePlan?: Raw | null): PlanDisplay {
  const premium = num(raw.premium);
  const benefits = raw.benefits as Benefit[] | undefined;
  const issuerObj = raw.issuer as { name?: string } | string | undefined;
  const issuer =
    typeof issuerObj === "string" ? issuerObj : (issuerObj?.name ?? "Carrier");
  const quality = (raw.quality_rating ?? {}) as Record<string, unknown>;

  const ded = extractCostShare(raw.deductibles as AmountItem[], DED_TYPE);
  const moop = extractCostShare(raw.moops as AmountItem[], MOOP_TYPE);
  const baseDed = extractCostShare(basePlan?.deductibles as AmountItem[], DED_TYPE);
  const baseMoop = extractCostShare(basePlan?.moops as AmountItem[], MOOP_TYPE);

  const urls = (raw.urls ?? {}) as Record<string, string>;

  return {
    id: String(raw.id ?? ""),
    issuer,
    name: String(raw.name ?? "Plan"),
    metalLevel: String(raw.metal_level ?? "Silver"),
    planType: String(raw.type ?? raw.plan_type ?? "HMO"),
    premium,
    aptc,
    realPrice: realPriceOf(premium, aptc),
    deductible: ded.individual,
    deductibleFamily: ded.family,
    baseDeductible: baseDed.individual || ded.individual,
    baseDeductibleFamily: baseDed.family,
    moop: moop.individual,
    moopFamily: moop.family,
    baseMoop: baseMoop.individual || moop.individual,
    baseMoopFamily: baseMoop.family,
    copays: {
      primaryCare: extractCopay(benefits, BENEFIT_NAMES.primaryCare),
      specialist: extractCopay(benefits, BENEFIT_NAMES.specialist),
      urgentCare: extractCopay(benefits, BENEFIT_NAMES.urgentCare),
      genericDrugs: extractCopay(benefits, BENEFIT_NAMES.genericDrugs),
      emergency: extractCopay(benefits, BENEFIT_NAMES.emergency),
      therapy: extractCopay(benefits, BENEFIT_NAMES.therapy),
    },
    rating: num(quality.global_rating),
    ratings: {
      clinical: num(quality.clinical_quality_management_rating),
      enrollee: num(quality.enrollee_experience_rating),
      efficiency: num(quality.plan_efficiency_rating),
    },
    allBenefits: allCoveredBenefits(benefits),
    documents: {
      sbc: urls.sbc || urls.summary_of_benefits,
      formulary: urls.formulary,
      network: urls.provider_directory || urls.network,
      brochure: urls.brochure || urls.plan_brochure,
    },
    raw,
  };
}

// Build a normalized, real-price-sorted list from a /plans response.
export function buildPlanList(apiResponse: Record<string, unknown>, aptc: number): PlanDisplay[] {
  const raw = (apiResponse?.plans ?? []) as Raw[];
  const baseList = (apiResponse?.base_plans ?? []) as Raw[];
  const baseById = new Map<string, Raw>();
  for (const b of baseList) baseById.set(String(b.id), b);
  const normalized = raw.map((r) => normalizePlan(r, aptc, baseById.get(String(r.id))));
  return sortByRealPrice(normalized);
}

export function sortByRealPrice(plans: PlanDisplay[]): PlanDisplay[] {
  return [...plans].sort((a, b) => a.realPrice - b.realPrice);
}
