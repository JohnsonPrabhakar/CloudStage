import ArtistHistory from "@/components/ArtistHistory";
import { getEvents } from "@/lib/mock-data";

export default function ArtistHistoryPage() {
  const events = getEvents();
  // In a real app, you'd get the current artist's ID from auth
  const artistId = "artist1";
  const artistEvents = events.filter((e) => e.artistId === artistId);

  return <ArtistHistory initialEvents={artistEvents} />;
}
