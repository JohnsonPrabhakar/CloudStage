import { HomePageClient } from "@/components/HomePageClient";
import { getEvents } from "@/lib/mock-data";

export default function Home() {
  const initialEvents = getEvents();

  return <HomePageClient initialEvents={initialEvents} />;
}
