import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  // All data is now fetched directly in the client component from Firestore.
  return <AdminDashboard />;
}
