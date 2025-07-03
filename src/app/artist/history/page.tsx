
"use client";

import ArtistHistory from "@/components/ArtistHistory";
import { useEffect, useState } from "react";
import { type Event } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getArtistEventsListener, getArtistProfile } from "@/lib/firebase-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function ArtistHistoryPage() {
  const [artistEvents, setArtistEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false); // Stop loading if user is not logged in
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Please log in.' });
        router.push('/artist/login');
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  useEffect(() => {
    if (!user) {
      // Don't fetch data if user is not set. The other useEffect will handle redirect.
      return;
    }

    let listenerUnsubscribe: (() => void) | undefined;
    
    setLoading(true);
    setError(null);
    
    const checkProfileAndListen = async () => {
      try {
        const profile = await getArtistProfile(user.uid);
        if (profile?.isApproved) {
          listenerUnsubscribe = getArtistEventsListener(user.uid, (events) => {
            setArtistEvents(events);
            setLoading(false); // Data is here, stop loading
          });
        } else if (profile && !profile.isApproved) {
          setLoading(false);
          toast({ variant: 'destructive', title: 'Approval Pending' });
          router.push('/artist/pending');
        } else {
          setLoading(false);
          toast({ variant: 'destructive', title: 'Access Denied' });
          router.push('/artist/login');
        }
      } catch (err) {
        console.error("Failed to fetch artist history:", err);
        setError("Could not load your history. Please check your internet connection and try again.");
        setLoading(false);
      }
    };
    
    checkProfileAndListen();

    // Cleanup function for the listener
    return () => {
      if (listenerUnsubscribe) {
        listenerUnsubscribe();
      }
    };
  }, [user, router, toast]);


  if (loading) {
    return (
        <div className="container mx-auto p-8 space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    );
  }

  if (error) {
    return (
        <div className="container mx-auto p-8 text-center">
            <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Connection Error</h1>
            <p className="text-muted-foreground mt-2 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
                Try Again
            </Button>
        </div>
    );
  }

  return <ArtistHistory events={artistEvents} />;
}
