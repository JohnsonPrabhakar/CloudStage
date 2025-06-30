
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EventPlayer from "@/components/EventPlayer";
import { getEvents } from "@/lib/mock-data";
import { type Event } from "@/lib/types";

export default function PlayPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      const allEvents = getEvents();
      const foundEvent = allEvents.find(
        (e) => e.id === params.id && e.moderationStatus === "approved"
      );
      setEvent(foundEvent || null);
    }
    setLoading(false);
  }, [params.id]);


  if (loading) {
     return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Event not found or not available.</h1>
      </div>
    );
  }

  return <EventPlayer event={event} />;
}
