"use client";

import { useEffect, useRef } from "react";

/**
 * The site's cursor: a small dot in the accent colour (--pencil) that
 * follows the pointer. Only on devices with a mouse or trackpad; touch
 * screens keep their normal behaviour.
 */
export default function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    const onMove = (e: PointerEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      el.classList.add("is-visible");
    };
    const onLeave = () => el.classList.remove("is-visible");

    document.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.classList.remove("has-cursor");
      document.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div ref={ref} className="cursor" aria-hidden="true" />;
}