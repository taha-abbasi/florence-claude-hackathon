"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setState("sending");
    try {
      const res = await fetch("/api/florence/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          interest: "early_access",
          source_page: "home",
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p style={{ color: "var(--af-green-d)", fontSize: 16, fontWeight: 600 }}>
        You&apos;re on the list. Check your inbox for a note from
        hello@updates.askflorence.health.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 460 }}
    >
      <input
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          flex: 1,
          minWidth: 220,
          padding: "14px 14px",
          background: "var(--af-white)",
          border: "1px solid var(--af-line)",
          borderRadius: 4,
          fontSize: 16,
        }}
      />
      <button
        className="af-btn af-btn--primary"
        type="submit"
        disabled={state === "sending"}
      >
        {state === "sending" ? "Saving…" : "Get early access"}
      </button>
      {state === "error" && (
        <p style={{ color: "var(--af-red-d)", fontSize: 13, width: "100%" }}>
          Something went wrong. Try again.
        </p>
      )}
    </form>
  );
}
