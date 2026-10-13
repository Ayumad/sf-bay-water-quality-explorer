import Link from "next/link";
import { notFound } from "next/navigation";
import { WaterDashboard } from "@/src/components/WaterDashboard";
import { getStation, stations } from "@/src/lib/data";
import { loadWaterFeed } from "@/src/lib/services/water";
export const dynamic = "force-dynamic";
export default async function StationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    station = getStation(slug);
  if (!station) notFound();
  const feed = await loadWaterFeed();
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">
            <Link href="/#explore">THE BAY</Link> / STATION PROFILE
          </p>
          <h1>{station.name}</h1>
          <p>
            Water measurements and nearby wildlife, with the source and date
            attached. Use the change-station link below to keep exploring.
          </p>
        </div>
      </section>
      <WaterDashboard
        stations={stations}
        initialFeed={feed}
        initialSlug={slug}
        profile
      />
    </main>
  );
}
