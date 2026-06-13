"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { emptyScene, sceneReducer } from "./scene";
import { createFlorenceClientTools, emptyStore } from "./tools";

export type ConnPhase = "ready" | "connecting" | "live" | "ended" | "error";

export function useFlorenceConversation() {
  const [scene, dispatch] = useReducer(sceneReducer, undefined, emptyScene);
  const [phase, setPhase] = useState<ConnPhase>("ready");
  const [fatal, setFatal] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [muted, setMutedState] = useState(false);

  const storeRef = useRef(emptyStore());
  const greetingDoneRef = useRef(false);
  const connectedAtRef = useRef(0);
  const listeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clientTools = useMemo(
    () => createFlorenceClientTools(storeRef.current, dispatch),
    [],
  );

  const markGreetingDone = useCallback(() => {
    if (greetingDoneRef.current) return;
    greetingDoneRef.current = true;
    dispatch({ t: "greetingComplete" });
  }, []);

  const conversation = useConversation({
    clientTools: clientTools as Record<string, (p: unknown) => Promise<string>>,
    micMuted: muted,
    onConnect: () => {
      connectedAtRef.current = Date.now();
      setPhase("live");
      dispatch({ t: "connected" });
      // 45s hard fallback to unstick the greeting
      setTimeout(markGreetingDone, 45000);
    },
    onDisconnect: () => {
      dispatch({ t: "disconnected" });
      setPhase((p) => (p === "error" ? p : "ended"));
    },
    onModeChange: (m: unknown) => {
      const mode = (m && typeof m === "object" && "mode" in m ? (m as { mode: string }).mode : m) as
        | "speaking"
        | "listening";
      if (mode === "speaking" || mode === "listening") dispatch({ t: "mode", mode });
      // greeting-end detection: a sustained listening after the intro
      if (mode === "listening" && !greetingDoneRef.current) {
        if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current);
        const floor = 15000 - (Date.now() - connectedAtRef.current);
        listeningTimerRef.current = setTimeout(markGreetingDone, Math.max(400, floor));
      }
      if (mode === "speaking" && listeningTimerRef.current) {
        clearTimeout(listeningTimerRef.current);
        listeningTimerRef.current = null;
      }
    },
    onMessage: (m: unknown) => {
      const msg = m as { message?: string; text?: string; role?: string; source?: string };
      const text = msg.message ?? msg.text ?? "";
      const role = msg.role === "user" || msg.source === "user" ? "user" : "agent";
      dispatch({ t: "transcript", role, text });
    },
    onInterruption: () => markGreetingDone(),
    onError: (msg: unknown) => {
      const m = typeof msg === "string" ? msg : "Voice error.";
      setFatal(m);
      setPhase("error");
      dispatch({ t: "error", message: m });
    },
    onUnhandledClientToolCall: (call: unknown) => {
      const name = (call as { tool_name?: string })?.tool_name;
      console.warn("[florence] unhandled tool", name);
    },
  });

  // reveal hold: reveal → plans after 3500ms
  useEffect(() => {
    if (scene.step !== "reveal") return;
    const t = setTimeout(() => dispatch({ t: "revealDone" }), 3500);
    return () => clearTimeout(t);
  }, [scene.step]);

  // amplitude loop
  useEffect(() => {
    if (phase !== "live") {
      setLevel(0);
      return;
    }
    let raf = 0;
    let last = 0;
    const loop = (ts: number) => {
      if (ts - last > 70) {
        last = ts;
        try {
          const raw = conversation.isSpeaking
            ? conversation.getOutputVolume()
            : conversation.getInputVolume();
          const boosted = Math.min(1, (raw || 0) * 2.6);
          setLevel((prev) => Math.max(boosted, prev * 0.72));
        } catch {
          /* not ready */
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, conversation]);

  const begin = useCallback(async () => {
    setPhase("connecting");
    setFatal(null);
    try {
      const res = await fetch("/api/florence/florence/agent-session", { method: "POST" });
      if (res.status === 503) {
        setFatal("Voice is temporarily unavailable while we upgrade our plan.");
        setPhase("error");
        return;
      }
      if (!res.ok) {
        setFatal("Florence isn't enabled right now.");
        setPhase("error");
        return;
      }
      const data = await res.json();
      await conversation.startSession({
        conversationToken: data.conversationToken,
        connectionType: data.connectionType ?? "webrtc",
        clientTools: clientTools as Record<string, (p: unknown) => Promise<string>>,
      });
    } catch (e) {
      setFatal(String(e));
      setPhase("error");
      dispatch({ t: "error", message: String(e) });
    }
  }, [conversation, clientTools]);

  const end = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      /* ignore */
    }
  }, [conversation]);

  const restart = useCallback(() => {
    greetingDoneRef.current = false;
    storeRef.current = emptyStore();
    dispatch({ t: "reset" });
    setPhase("ready");
    setFatal(null);
  }, []);

  const toggleMute = useCallback(() => setMutedState((m) => !m), []);

  // voice-tap helpers: let the user tap UI and have Florence react.
  const sayToFlorence = useCallback(
    (text: string) => {
      try {
        conversation.sendContextualUpdate(text);
      } catch {
        /* not live */
      }
    },
    [conversation],
  );

  return {
    scene,
    phase,
    fatal,
    level,
    muted,
    isSpeaking: conversation.isSpeaking,
    begin,
    end,
    restart,
    toggleMute,
    sayToFlorence,
    dispatch,
  };
}

export type FlorenceConversation = ReturnType<typeof useFlorenceConversation>;
