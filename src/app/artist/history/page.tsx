"use client";

import ArtistHistory from "@/components/ArtistHistory";
import { useEffect, useState } from "react";
import { type Event, type Artist } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getArtistEvents, getArtistProfile } from "@/lib/firebase-service";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArtistHistoryPage() {
  const [artistEvents, setArtistEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, see if they are an approved artist.
        const profile = await getArtistProfile(user.uid);
        if (profile && profile.isApproved) {
            // Fetch events for this artist
            const events = await getArtistEvents(user.uid);
            setArtistEvents(events);
        } else if (profile && !profile.isApproved) {
            // Not approved yet
            toast({ variant: 'destructive', title: 'Approval Pending' });
            router.push('/artist/pending');
        } else {
            // No profile, not an artist
            toast({ variant: 'destructive', title: 'Access Denied' });
            router.push('/artist/login');
        }
      } else {
        // User is signed out
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Please log in.' });
        router.push('/artist/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, toast]);


  if(loading) {
    return (
        <div className="container mx-auto p-8 space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    )
  }

  return <ArtistHistory events={artistEvents} />;
}
