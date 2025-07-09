
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getEventById } from "@/lib/firebase-service";
import { type Event } from "@/lib/types";
import { CreateEventForm } from "@/components/CreateEventForm";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function EditEventPageLoader() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-pulse">
        <Skeleton className="h-8 w-48 mb-4" />
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
                <div className="flex justify-start">
                  <Skeleton className="h-12 w-48" />
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'Please log in.' });
            router.push('/artist/login');
            return;
        }
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, [router, toast]);


  useEffect(() => {
    if (!user) return;

    const eventId = params.id as string;
    if (eventId) {
      const fetchEvent = async () => {
        setLoading(true);
        try {
          const fetchedEvent = await getEventById(eventId);
          if (fetchedEvent) {
             if (fetchedEvent.artistId !== user.uid) {
                toast({ variant: 'destructive', title: 'Access Denied', description: 'You are not the owner of this event.' });
                router.push('/artist/dashboard');
                return;
             }
            setEvent(fetchedEvent);
          } else {
            toast({ variant: 'destructive', title: 'Event not found' });
            router.push('/artist/dashboard');
          }
        } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Failed to load event' });
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [params.id, router, toast, user]);

  if (loading || !user) {
    return <EditEventPageLoader />;
  }

  return event ? (
    <CreateEventForm mode="edit" initialData={event} />
  ) : (
    <div className="flex h-screen items-center justify-center">
        <Card className="text-center p-8">
            <CardHeader>
                <CardTitle>Event Not Loaded</CardTitle>
                <CardDescription>The event data could not be loaded. It may have been deleted or there was a network issue.</CardDescription>
            </CardHeader>
        </Card>
    </div>
  );
}
