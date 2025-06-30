import EventPlayer from "@/components/EventPlayer";
import { getEvents } from "@/lib/mock-data";

type Props = {
  params: { id: string };
};

export default function PlayPage({ params }: Props) {
  const allEvents = getEvents(); // In a real app, you'd also check local storage
  const event = allEvents.find((e) => e.id === params.id);

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Event not found</h1>
      </div>
    );
  }

  return <EventPlayer event={event} />;
}
