"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A small audio player for excerpts. The src can end in #t=start,end (in
 * seconds) to play only part of a longer recording:
 *   /audio/apollo11-broadcast.mp3#t=62,95
 */
export default function AudioClip({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [length, setLength] = useState(0);

  // Split "file.mp3#t=62,95" into the file and the clip's start/end
  const [file, frag] = src.split("#t=");
  const [startS, endS] = (frag ?? "").split(",");
  const start = Number(startS) || 0;
  const end = endS ? Number(endS) : undefined;

  // Read the length once the file's details have loaded (they may have
  // loaded before this component was ready to listen)
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const ready = () => {
      if (!isFinite(a.duration)) return;
      if (a.currentTime < start) a.currentTime = start;
      setLength((end ?? a.duration) - start);
    };
    if (a.readyState >= 1) ready();
    a.addEventListener("loadedmetadata", ready);
    return () => a.removeEventListener("loadedmetadata", ready);
  }, [start, end]);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      if (a.currentTime < start || (end && a.currentTime >= end)) a.currentTime = start;
      a.play();
    } else a.pause();
  }

  function onTime() {
    const a = ref.current;
    if (!a) return;
    if (end && a.currentTime >= end) {
      a.pause();
      a.currentTime = start;
    }
    setNow(Math.max(a.currentTime - start, 0));
  }

  function seek(e: React.PointerEvent<HTMLDivElement>) {
    const a = ref.current;
    if (!a || !length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    a.currentTime = start + frac * length;
    setNow(frac * length);
  }

  const pct = length ? (now / length) * 100 : 0;

  return (
    <div className={`audio-clip ${playing ? "is-playing" : ""}`}>
      <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="audio-bar" onPointerDown={seek} role="presentation">
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="audio-time">
        {fmt(now)} / {fmt(length)}
      </span>
      <audio
        ref={ref}
        src={file}
        preload="metadata"
        onTimeUpdate={onTime}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}

function fmt(s: number) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}