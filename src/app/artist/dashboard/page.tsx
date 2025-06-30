import ArtistDashboard from "@/components/ArtistDashboard";
import { getEvents } from "@/lib/mock-data";

export default function ArtistDashboardPage() {
  const events = getEvents();
  return <ArtistDashboard initialEvents={events} />;
}
