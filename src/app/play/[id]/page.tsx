"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EventPlayer from "@/components/EventPlayer";
import { getEventById, checkForExistingTicket } from "@/lib/firebase-service";
import { type Event } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { WifiOff, Ticket, AlertTriangle, Loader2 } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [access, setAccess] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eventId = params.id as string;
    if (!eventId) {
      setError("No event ID provided.");
      setLoading(false);
      setAccess('denied');
      return;
    }

    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const foundEvent = await getEventById(eventId);
        if (foundEvent && foundEvent.moderationStatus === 'approved') {
          setEvent(foundEvent);
        } else {
          setError("Event not found or not available.");
          setAccess('denied');
        }
      } catch (err) {
        console.error("Failed to fetch event for player:", err);
        setError("Could not load the event. Please check your internet connection.");
        setAccess('denied');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [params.id]);

  useEffect(() => {
    if (loading || !event) return;

    // Past events are free to watch for anyone
    if (event.status === 'past') {
      setAccess('granted');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const hasTicket = await checkForExistingTicket(user.uid, event.id);
        setAccess(hasTicket ? 'granted' : 'denied');
      } else {
        setAccess('denied');
      }
    });

    return () => unsubscribe();
  }, [event, loading]);


  if (loading || access === 'checking') {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Verifying access...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-center p-4">
            <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Connection Error</h1>
            <p className="text-muted-foreground mt-2 mb-6 max-w-md">{error}</p>
            <Button onClick={() => window.location.reload()}>
                Try Again
            </Button>
        </div>
    )
  }

  if (access === 'denied') {
    return (
       <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground mt-2 mb-6 max-w-md">
            You need a valid ticket to watch this event. Please purchase a ticket to gain access.
        </p>
        <div className="flex gap-4">
            <Button asChild>
                <Link href={`/events/${params.id}`}>
                    <Ticket className="mr-2 h-4 w-4" /> Get Ticket
                </Link>
            </Button>
             <Button variant="outline" onClick={() => router.push('/')}>
                Back to Home
            </Button>
        </div>
      </div>
    );
  }
  
  if (!event) {
     return (
      <div className="flex items-center justify-center h-[calc(100vh-65px)]">
        <h1 className="text-2xl font-bold">Event not found.</h1>
      </div>
    );
  }

  if (!event.streamUrl || !event.streamUrl.includes('youtube.com')) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-65px)]">
        <h1 className="text-2xl font-bold text-center">This event's stream is not available or the URL is invalid.</h1>
      </div>
    );
  }

  return <EventPlayer event={event} />;
}
