import AdminDashboard from "@/components/AdminDashboard";
import { getArtists, getEvents } from "@/lib/mock-data";

export default function AdminDashboardPage() {
  const events = getEvents();
  const artists = getArtists();
  return <AdminDashboard initialEvents={events} initialArtists={artists} />;
}
