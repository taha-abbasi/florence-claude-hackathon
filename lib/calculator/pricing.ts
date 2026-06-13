// The ONLY pricing rules the client applies. The API returns the hard parts
// (APTC, CSR, Medicaid adjustment); the client only applies max(0, premium-aptc)
// and normalizes the raw plan shape into PlanDisplay.

import type { PlanDisplay } from "@/lib/types";

export function realPriceOf(premium: number, aptc: number): number {
  return Math.max(0, premium - aptc);
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

function firstAmount(arr: unknown): number {
  if (!Array.isArray(arr)) return 0;
  for (const item of arr) {
    if (item && typeof item === "object") {
      const amt = (item as Record<string, unknown>).amount;
      if (amt != null) return num(amt);
    }
    if (typeof item === "number") return item;
  }
  return 0;
}

function copayStr(copays: Record<string, unknown> | undefined, keys: string[]): string {
  if (!copays) return "-";
  for (const k of keys) {
    const v = copays[k];
    if (v == null) continue;
    if (typeof v === "number") return v === 0 ? "$0" : `$${v}`;
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "object") {
      const amt = (v as Record<string, unknown>).amount ?? (v as Record<string, unknown>).copay;
      if (amt != null) {
        const n = num(amt);
        return n === 0 ? "$0" : `$${n}`;
      }
    }
  }
  return "-";
}

// Map the raw /plans plan object → PlanDisplay, applying the given aptc.
export function normalizePlan(raw: Record<string, unknown>, aptc: number): PlanDisplay {
  const premium = num(raw.premium);
  const deductibles = raw.deductibles;
  const moops = raw.moops;
  const copays = (raw.copays ?? {}) as Record<string, unknown>;
  const quality = (raw.quality_rating ?? {}) as Record<string, unknown>;

  const activeDeductible = num(
    (raw as Record<string, unknown>).deductible ?? firstAmount(deductibles),
  );
  const activeMoop = num((raw as Record<string, unknown>).moop ?? firstAmount(moops));

  return {
    id: String(raw.id ?? ""),
    issuer: String(raw.issuer ?? raw.issuer_name ?? "Carrier"),
    name: String(raw.name ?? "Plan"),
    metalLevel: String(raw.metal_level ?? raw.metal ?? "Silver"),
    planType: String(raw.plan_type ?? "HMO"),
    premium,
    aptc,
    realPrice: realPriceOf(premium, aptc),
    deductible: activeDeductible,
    baseDeductible: num((raw as Record<string, unknown>).base_deductible) || activeDeductible,
    moop: activeMoop,
    baseMoop: num((raw as Record<string, unknown>).base_moop) || activeMoop,
    copays: {
      primaryCare: copayStr(copays, ["primary_care", "primaryCare", "pcp"]),
      specialist: copayStr(copays, ["specialist"]),
      urgentCare: copayStr(copays, ["urgent_care", "urgentCare", "urgent"]),
      genericDrugs: copayStr(copays, ["generic_drugs", "genericDrugs", "generic"]),
      emergency: copayStr(copays, ["emergency", "emergency_room", "er"]),
      therapy: copayStr(copays, [
        "mental_health_outpatient",
        "behavioral_health",
        "therapy",
        "mental_behavioral_health_outpatient",
      ]),
    },
    rating: num(quality.global_rating ?? quality.globalRating ?? raw.rating ?? 0),
    raw,
  };
}

export function sortByRealPrice(plans: PlanDisplay[]): PlanDisplay[] {
  return [...plans].sort((a, b) => a.realPrice - b.realPrice);
}
