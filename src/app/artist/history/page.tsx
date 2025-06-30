"use client";

import ArtistHistory from "@/components/ArtistHistory";
import { getEvents, getLoggedInArtist } from "@/lib/mock-data";
import { useEffect, useState } from "react";
import { type Event } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ArtistHistoryPage() {
  const [artistEvents, setArtistEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loggedInArtist = getLoggedInArtist();
    if (loggedInArtist) {
      const allEvents = getEvents();
      setArtistEvents(allEvents.filter((e) => e.artistId === loggedInArtist.id));
    } else {
      router.push('/artist/login');
    }
    setLoading(false);
  }, [router]);

  if(loading) {
    return <div className="container mx-auto p-8">Loading history...</div>
  }

  return <ArtistHistory initialEvents={artistEvents} />;
}
