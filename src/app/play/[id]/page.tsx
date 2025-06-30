"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EventPlayer from "@/components/EventPlayer";
import { getEventById } from "@/lib/firebase-service";
import { type Event } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlayPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
        if (params.id) {
            setLoading(true);
            const eventId = params.id as string;
            const foundEvent = await getEventById(eventId);
            if (foundEvent && foundEvent.moderationStatus === 'approved') {
                setEvent(foundEvent);
            } else {
                setEvent(null);
            }
        }
        setLoading(false);
    }
    fetchEvent();
  }, [params.id]);


  if (loading) {
     return (
      <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] bg-background p-4 gap-4">
          <div className="flex-grow lg:w-3/4 flex flex-col">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <div className="py-4 space-y-2">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
              </div>
          </div>
          <div className="lg:w-1/4 bg-card border-l flex flex-col h-full rounded-lg">
             <Skeleton className="h-full w-full" />
          </div>
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
  
  if (!event.streamUrl) {
    return (
      <div className="flex items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">This event is not yet available for streaming.</h1>
      </div>
    );
  }

  return <EventPlayer event={event} />;
}
