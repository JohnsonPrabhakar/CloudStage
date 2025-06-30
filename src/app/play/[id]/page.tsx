import EventPlayer from "@/components/EventPlayer";
import { getEvents } from "@/lib/mock-data";

type Props = {
  params: { id: string };
};

export default function PlayPage({ params }: Props) {
  const allEvents = getEvents(); 
  const event = allEvents.find((e) => e.id === params.id && e.moderationStatus === 'approved');

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Event not found or not available.</h1>
      </div>
    );
  }

  return <EventPlayer event={event} />;
}
