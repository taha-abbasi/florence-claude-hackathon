"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatCurrencyWhole } from "@/lib/format";

export default function PriceReveal({
  sticker,
  real,
}: {
  sticker: number;
  real: number;
}) {
  const [struck, setStruck] = useState(false);
  const [showReal, setShowReal] = useState(false);
  const [showSave, setShowSave] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStruck(true);
      setShowReal(true);
    }, 1500);
    const t2 = setTimeout(() => setShowSave(true), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const moSaved = Math.max(0, sticker - real);
  const yrSaved = moSaved * 12;

  return (
    <div className="pr">
      <div className="pr__label">Healthcare.gov shows you</div>
      <div className={`pr__sticker${struck ? " is-struck" : ""}`}>
        {formatCurrency(sticker)}
      </div>
      {showReal && (
        <>
          <div className="pr__label">Your real price with subsidies</div>
          <div className="pr__real">{formatCurrency(real)}</div>
        </>
      )}
      {showSave && (
        <div className="pr__save">
          <b>{formatCurrencyWhole(moSaved)}/mo saved</b>
          <span>{formatCurrencyWhole(yrSaved)}/yr in your pocket</span>
        </div>
      )}
    </div>
  );
}
