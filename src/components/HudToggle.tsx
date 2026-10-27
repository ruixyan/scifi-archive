"use client";

import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

/**
 * A switch that re-skins the whole site as a sci-fi HUD (the styles live
 * under html.hud in globals.css). The choice is remembered in this browser.
 */
export default function HudToggle() {
  const [on, setOn] = useState(false);

  // Pick up the saved choice (the script in layout.tsx already applied it)
  useEffect(() => {
    setOn(document.documentElement.classList.contains("hud"));
  }, []);

  function toggle() {
    const next = !on;
    const flip = () =>
      flushSync(() => {
        setOn(next);
        document.documentElement.classList.toggle("hud", next);
      });
    try {
      localStorage.setItem("hud", next ? "1" : "0");
    } catch {}
    // Cross-fade the switch where the browser supports it
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition) doc.startViewTransition(flip);
    else flip();
  }

  return (
    <button className="hud-toggle" role="switch" aria-checked={on} onClick={toggle}>
      <span className="hud-toggle-track" aria-hidden="true">
        <span className="hud-toggle-thumb" />
      </span>
      <span className="hud-toggle-label">{on ? "HUD on" : "HUD off"}</span>
    </button>
  );
}