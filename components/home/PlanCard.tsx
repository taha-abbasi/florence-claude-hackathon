import Link from "next/link";
import type { PlanDisplay } from "@/lib/types";
import { formatCurrency, formatCurrencyWhole, savingsPct } from "@/lib/format";

function Stars({ n }: { n: number }) {
  if (!n) return null;
  const full = Math.round(n);
  return (
    <span className="pc__stars" aria-label={`${n} star rating`}>
      {"★".repeat(full)}
      {"☆".repeat(Math.max(0, 5 - full))} {n}
    </span>
  );
}

function BeforeAfter({
  label,
  value,
  base,
}: {
  label: string;
  value: number;
  base: number;
}) {
  const showStrike = base > value;
  return (
    <div>
      <small>{label}</small>
      {showStrike && <span className="was">{formatCurrencyWhole(base)}</span>}
      <b>{formatCurrencyWhole(value)}</b>
    </div>
  );
}

export default function PlanCard({
  plan,
  variant = "micro",
  href,
}: {
  plan: PlanDisplay;
  variant?: "default" | "compact" | "micro";
  href?: string;
}) {
  const pct = savingsPct(plan.realPrice, plan.premium);

  const body = (
    <>
      <div className="pc__issuer">{plan.issuer}</div>
      <div className="pc__name">{plan.name}</div>
      <div className="pc__pills">
        <span className="pc__pill">{plan.metalLevel}</span>
        <span className="pc__pill pc__pill--type">{plan.planType}</span>
        <Stars n={plan.rating} />
      </div>
      <div className="pc__id">Plan ID: {plan.id}</div>

      <div className="pc__price">
        <span className="pc__priceN">{formatCurrency(plan.realPrice)}</span>
        <span className="pc__mo">/month</span>
        {plan.premium > plan.realPrice && (
          <span className="pc__strike">{formatCurrencyWhole(plan.premium)}</span>
        )}
        {pct > 0 && <span className="pc__save">Save {pct}%</span>}
      </div>

      <div className="pc__dm">
        <BeforeAfter label="Deductible" value={plan.deductible} base={plan.baseDeductible} />
        <BeforeAfter label="Max out-of-pocket" value={plan.moop} base={plan.baseMoop} />
      </div>

      {variant !== "micro" && (
        <div className="pc__copays">
          <div>
            <span>Primary care</span>
            <span>{plan.copays.primaryCare}</span>
          </div>
          <div>
            <span>Specialist</span>
            <span>{plan.copays.specialist}</span>
          </div>
          <div>
            <span>Urgent care</span>
            <span>{plan.copays.urgentCare}</span>
          </div>
          <div>
            <span>Generic Rx</span>
            <span>{plan.copays.genericDrugs}</span>
          </div>
          <div>
            <span>Emergency</span>
            <span>{plan.copays.emergency}</span>
          </div>
        </div>
      )}

      {href && (
        <span className="pc__detail">
          View plan details →
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link className="pc pc--link" href={href}>
        {body}
      </Link>
    );
  }
  return <div className="pc">{body}</div>;
}
