import ConnectedGrids from "@/components/ConnectedGrids";
import { getBuiltTech, getConnections, getSources } from "@/lib/content";

// The home page is the split view: sources on the left, what was built on the right.
export default function HomePage() {
  const sources = getSources();
  return (
    <ConnectedGrids sources={sources} tech={getBuiltTech(sources)} connections={getConnections(sources)} />
  );
}