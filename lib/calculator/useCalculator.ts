"use client";

import { useCallback, useMemo, useState } from "react";
import type { County, Household, PlanDisplay, Place } from "@/lib/types";
import { buildPlanList } from "./pricing";

export type CalcPhase =
  | "form"
  | "loading"
  | "results"
  | "state_marketplace"
  | "sbe_estimate"
  | "unsupported_zip"
  | "error";

export interface FormPerson {
  age: number;
  gender: "Male" | "Female";
}
export interface CalcForm {
  zipCode: string;
  people: FormPerson[];
  isMarried: boolean;
  income: number;
}

const DEMO: CalcForm = {
  zipCode: "84094",
  people: [
    { age: 35, gender: "Male" },
    { age: 30, gender: "Female" },
  ],
  isMarried: true,
  income: 21000,
};

async function getJson(path: string): Promise<any> {
  const res = await fetch(`/api/florence${path}`, { method: "GET" });
  return res.json();
}
async function postJson(path: string, body: unknown): Promise<any> {
  const res = await fetch(`/api/florence${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function useCalculator(initial?: Partial<CalcForm>) {
  const [form, setForm] = useState<CalcForm>({ ...DEMO, ...initial });
  const [phase, setPhase] = useState<CalcPhase>("form");
  const [counties, setCounties] = useState<County[]>([]);
  const [selectedCounty, setSelectedCounty] = useState<County | null>(null);
  const [showCountyPicker, setShowCountyPicker] = useState(false);
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [totalPlans, setTotalPlans] = useState(0);
  const [aptc, setAptc] = useState(0);
  const [csr, setCsr] = useState("");
  const [isMedicaid, setIsMedicaid] = useState(false);
  const [isNonExpansionBump, setIsNonExpansionBump] = useState(false);
  const [stateMarketplace, setStateMarketplace] = useState<{
    state: string;
    marketplace: string;
  } | null>(null);
  const [unsupportedInfo, setUnsupportedInfo] = useState<{
    message: string;
    alternateCounties: County[];
  } | null>(null);

  const bestPlan = plans[0] ?? null;

  const buildHousehold = useCallback((f: CalcForm): Household => {
    return {
      income: f.income,
      people: f.people.map((p) => ({ age: p.age, gender: p.gender })),
      has_married_couple: f.isMarried && f.people.length >= 2,
    };
  }, []);

  const runPlans = useCallback(
    async (f: CalcForm, county: County) => {
      const place: Place = {
        zipcode: f.zipCode,
        state: county.state,
        countyfips: county.fips,
      };
      const household = buildHousehold(f);

      // eligibility
      const elig = await postJson("/eligibility", { household, place });
      const est = elig?.estimates?.[0] ?? {};
      const thisAptc = Number(est.aptc ?? 0);
      const thisCsr = String(est.csr ?? "");
      const medicaid =
        Boolean(est.is_medicaid_chip) || Boolean(elig?.is_medicaid_adjusted);
      setAptc(thisAptc);
      setCsr(thisCsr);
      setIsMedicaid(medicaid);
      setIsNonExpansionBump(Boolean(elig?.is_non_expansion_bump));

      const csrApplies = Boolean(thisCsr) || Boolean(elig?.is_medicaid_adjusted);
      const filters = csrApplies ? { metal_levels: ["Silver"] } : undefined;

      const planRes = await postJson("/plans", {
        household,
        place,
        fetch_base: true,
        ...(filters ? { filters } : {}),
        limit: 200,
      });
      const rawPlans: Record<string, unknown>[] = planRes?.plans ?? [];
      setTotalPlans(Number(planRes?.total ?? rawPlans.length));

      const sorted = buildPlanList(planRes, thisAptc).slice(0, 3);
      setPlans(sorted);
      setPhase("results");
    },
    [buildHousehold],
  );

  const handleSubmit = useCallback(async () => {
    setPhase("loading");
    setShowCountyPicker(false);
    try {
      const c = await getJson(`/counties?zip=${encodeURIComponent(form.zipCode)}`);

      if (c?.sbeRedirect) {
        setStateMarketplace(c.sbeRedirect);
        setPhase("state_marketplace");
        return;
      }
      if (c?.unsupported) {
        setUnsupportedInfo({
          message: c.unsupported.message ?? "We could not resolve this ZIP.",
          alternateCounties: c.alternateCounties ?? [],
        });
        setPhase("unsupported_zip");
        return;
      }
      const list: County[] = c?.counties ?? [];
      if (list.length === 0) {
        setUnsupportedInfo({
          message: "We could not find that ZIP. Try another.",
          alternateCounties: [],
        });
        setPhase("unsupported_zip");
        return;
      }
      setCounties(list);
      if (list.length > 1) {
        setShowCountyPicker(true);
        setPhase("form");
        return;
      }
      const county = list[0];
      setSelectedCounty(county);
      await runPlans(form, county);
    } catch {
      setPhase("error");
    }
  }, [form, runPlans]);

  const handleAlternateCountyPick = useCallback(
    async (county: County) => {
      setSelectedCounty(county);
      setShowCountyPicker(false);
      setPhase("loading");
      try {
        await runPlans(form, county);
      } catch {
        setPhase("error");
      }
    },
    [form, runPlans],
  );

  const resetForm = useCallback(() => {
    setPhase("form");
    setShowCountyPicker(false);
  }, []);

  const planParams = useMemo(() => {
    const c = selectedCounty;
    return new URLSearchParams({
      zip: form.zipCode,
      income: String(form.income),
      household_size: String(form.people.length),
      married: String(form.isMarried),
      state: c?.state ?? "",
      county_fips: c?.fips ?? "",
      aptc: String(Math.round(aptc)),
      csr,
    }).toString();
  }, [form, selectedCounty, aptc, csr]);

  const planHref = useCallback(
    (planId: string) => `/plans/${planId}?${planParams}`,
    [planParams],
  );

  return {
    form,
    setForm,
    phase,
    counties,
    selectedCounty,
    showCountyPicker,
    plans,
    bestPlan,
    totalPlans,
    aptc,
    csr,
    isMedicaid,
    isNonExpansionBump,
    stateMarketplace,
    unsupportedInfo,
    planHref,
    handleSubmit,
    handleAlternateCountyPick,
    resetForm,
  };
}
