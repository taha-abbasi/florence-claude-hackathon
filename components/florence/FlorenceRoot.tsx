"use client";

import { useEffect, useRef, useState } from "react";
import "../../app/florence/florence.css";
import { useFlorenceConversation } from "@/lib/florence/useFlorenceConversation";
import { debugScene } from "@/lib/florence/debugScenes";
import FlorenceExperience from "./FlorenceExperience";

export default function FlorenceRoot() {
  // Hoist the hook above any device/debug branch so state never resets.
  const f = useFlorenceConversation();
  const applied = useRef(false);
  const [debug, setDebug] = useState(false);

  // Debug injector: ?debug-scene=<id> dispatches a canned SceneEvent[].
  useEffect(() => {
    if (applied.current) return;
    const id = new URLSearchParams(window.location.search).get("debug-scene");
    if (!id) return;
    applied.current = true;
    setDebug(true);
    for (const ev of debugScene(id)) f.dispatch(ev);
  }, [f]);

  return <FlorenceExperience f={f} debug={debug} />;
}
