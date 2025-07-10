
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getEventById } from "@/lib/firebase-service";
import { type Event } from "@/lib/types";
import CreateEventForm from "@/components/CreateEventForm";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export default function EditEventPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const eventId = params.id as string;
        try {
          const fetchedEvent = await getEventById(eventId);
          if (fetchedEvent && fetchedEvent.artistId === user.uid) {
            setEvent(fetchedEvent);
            setIsAuthenticated(true);
          } else {
            toast({ variant: 'destructive', title: 'Access Denied' });
            router.push("/artist/dashboard");
          }
        } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Failed to load event' });
        } finally {
          setLoading(false);
        }
      } else {
        toast({ variant: 'destructive', title: 'Access Denied' });
        router.push("/artist/login");
      }
    });
    return () => unsubscribe();
  }, [params.id, router, toast]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading event data...</p>
      </div>
    );
  }

  return event ? (
    <CreateEventForm mode="edit" initialData={event} />
  ) : (
    <div className="flex h-screen items-center justify-center">
      <p>Event could not be loaded.</p>
    </div>
  );
}
