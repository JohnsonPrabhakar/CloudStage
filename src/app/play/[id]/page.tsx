"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EventPlayer from "@/components/EventPlayer";
import { getEventById } from "@/lib/firebase-service";
import { type Event } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function PlayPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvent = async () => {
    if (params.id) {
        setLoading(true);
        setError(null);
        try {
            const eventId = params.id as string;
            const foundEvent = await getEventById(eventId);
            if (foundEvent && foundEvent.moderationStatus === 'approved') {
                setEvent(foundEvent);
            } else {
                setEvent(null);
            }
        } catch (err) {
            console.error("Failed to fetch event for player:", err);
            setError("Could not load the event. Please check your internet connection and try again.");
        } finally {
            setLoading(false);
        }
    } else {
        setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-65px)] text-center">
            <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Connection Error</h1>
            <p className="text-muted-foreground mt-2 mb-6">{error}</p>
            <Button onClick={fetchEvent}>
                Try Again
            </Button>
        </div>
    )
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-65px)]">
        <h1 className="text-2xl font-bold">Event not found or not available.</h1>
      </div>
    );
  }
  
  if (!event.streamUrl) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-65px)]">
        <h1 className="text-2xl font-bold">This event is not yet available for streaming.</h1>
      </div>
    );
  }

  return <EventPlayer event={event} />;
}
