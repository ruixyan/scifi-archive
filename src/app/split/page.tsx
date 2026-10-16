import ConnectedGrids from "@/components/ConnectedGrids";
import { getBuiltTech, getConnections, getSources } from "@/lib/content";

export const metadata = { title: "Imagined / Built — Futures Archive" };

export default function SplitPage() {
  const sources = getSources();
  return (
    <ConnectedGrids sources={sources} tech={getBuiltTech(sources)} connections={getConnections(sources)} />
  );
}
