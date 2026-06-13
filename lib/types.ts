// Shared types for the Florence experience.

export interface Person {
  age: number;
  gender: "Male" | "Female";
}

export interface Household {
  income: number;
  people: Person[];
  has_married_couple: boolean;
}

export interface Place {
  zipcode: string;
  state: string;
  countyfips: string;
}

export interface County {
  fips: string;
  name: string;
  state: string;
}

export interface QualityRating {
  global_rating?: number;
  clinical_quality_management_rating?: number;
  enrollee_experience_rating?: number;
  plan_efficiency_rating?: number;
}

// Normalized plan the UI renders. We accept the raw API plan shape and map.
export interface PlanDisplay {
  id: string;
  issuer: string;
  name: string;
  metalLevel: string;
  planType: string;
  premium: number; // sticker
  aptc: number; // applied to this plan
  realPrice: number; // max(0, premium - aptc)
  deductible: number; // post-CSR (active), individual
  deductibleFamily: number | null; // post-CSR, family total
  baseDeductible: number; // pre-CSR, individual
  baseDeductibleFamily: number | null;
  moop: number; // post-CSR, individual
  moopFamily: number | null;
  baseMoop: number; // pre-CSR, individual
  baseMoopFamily: number | null;
  copays: {
    primaryCare: string;
    specialist: string;
    urgentCare: string;
    genericDrugs: string;
    emergency: string;
    therapy: string;
  };
  rating: number; // 0-5 (global)
  ratings: { clinical: number; enrollee: number; efficiency: number };
  allBenefits: { name: string; cost: string }[];
  documents: { sbc?: string; formulary?: string; network?: string; brochure?: string };
  raw?: unknown;
}

export interface CoverageResult {
  kind: "doctor" | "drug";
  query: string;
  byPlan: Record<string, "covered" | "partial" | "not_covered">;
  coveredCount: number;
  totalPlans: number;
  tierByPlan?: Record<string, string>;
  matchedName?: string;
  subtitle?: string;
}

export interface ProviderSuggestion {
  npi: string;
  display_name: string;
  specialty: string;
  city: string;
  state: string;
}
