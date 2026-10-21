import TimelineChart from "@/components/TimelineChart";
import { getSources, getYearRange } from "@/lib/content";

export const metadata = { title: "Timeline — Sci-Fi Archive" };

export default function TimelinePage() {
  const sources = getSources();
  const [start, end] = getYearRange(sources);
  return <TimelineChart sources={sources} start={start} end={end} />;
}