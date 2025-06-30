"use client";

import ArtistHistory from "@/components/ArtistHistory";
import { useEffect, useState } from "react";
import { type Event } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getArtistEvents, getArtistProfile } from "@/lib/firebase-service";
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

  const fetchHistory = async (currentUser: User) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await getArtistProfile(currentUser.uid);
      if (profile && profile.isApproved) {
        const events = await getArtistEvents(currentUser.uid);
        setArtistEvents(events);
      } else if (profile && !profile.isApproved) {
        toast({ variant: 'destructive', title: 'Approval Pending' });
        router.push('/artist/pending');
      } else {
        toast({ variant: 'destructive', title: 'Access Denied' });
        router.push('/artist/login');
      }
    } catch (err) {
      console.error("Failed to fetch artist history:", err);
      setError("Could not load your history. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchHistory(currentUser);
      } else {
        setUser(null);
        toast({ variant: 'destructive', title: 'Access Denied', description: 'Please log in.' });
        router.push('/artist/login');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, toast]);


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
            <Button onClick={() => user && fetchHistory(user)}>
                Try Again
            </Button>
        </div>
    );
  }

  return <ArtistHistory events={artistEvents} />;
}
