import ArchiveGrid from "@/components/ArchiveGrid";
import { getSources } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <ArchiveGrid sources={getSources()} />
    </>
  );
}
