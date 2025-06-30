import BoostedEvents from "@/components/BoostedEvents";
import { getEvents } from "@/lib/mock-data";

export default function BoostedEventsPage() {
  const events = getEvents();
  return <BoostedEvents initialEvents={events} />;
}
