import AdminDashboard from "@/components/AdminDashboard";
import { getArtists } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  // Events are now fetched directly in the client component from Firestore.
  // We still pass initial artists from mock data.
  const artists = getArtists();
  return <AdminDashboard initialArtists={artists} />;
}
