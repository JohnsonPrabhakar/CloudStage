import { HomePageClient } from "@/components/HomePageClient";

export const dynamic = 'force-dynamic';

export default function Home() {
  // Data will now be fetched on the client side in HomePageClient from Firestore
  return <HomePageClient />;
}
