import { HomePageClient } from "@/components/HomePageClient";

export default function Home() {
  // Data will now be fetched on the client side in HomePageClient from Firestore
  return <HomePageClient />;
}
