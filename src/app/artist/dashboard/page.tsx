
import ArtistDashboard from "@/components/ArtistDashboard";

// This export ensures the page is always rendered dynamically and not from a cache.
export const dynamic = 'force-dynamic';

export default function ArtistDashboardPage() {
  // Component now handles its own data fetching, auth, and real-time updates.
  return <ArtistDashboard />;
}
