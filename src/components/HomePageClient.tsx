
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Event } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { getApprovedEvents } from "@/lib/firebase-service";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { ArrowRight, PartyPopper } from "lucide-react";
import { Badge } from "./ui/badge";

export function HomePageClient() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const events = await getApprovedEvents();
        setAllEvents(events);
      } catch (error) {
        console.error("Failed to fetch events from Firestore", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (allEvents.length === 0 && !loading) return;

    const now = new Date();
    const liveThreshold = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const categorized = {
      live: [] as Event[],
      upcoming: [] as Event[],
      past: [] as Event[],
    };

    const sortedEvents = [...allEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const event of sortedEvents) {
      let finalStatus = event.status;

      // Only re-calculate for non-past events to respect final DB status
      if (finalStatus !== 'past') {
          if (new Date(event.date) <= now) {
              // If event start time is in the past
              finalStatus = new Date(event.date) >= liveThreshold ? 'live' : 'past';
          }
      }
      
      const updatedEvent = { ...event, status: finalStatus };
      
      if (finalStatus === 'live') {
        categorized.live.push(updatedEvent);
      } else if (finalStatus === 'upcoming') {
        categorized.upcoming.push(updatedEvent);
      } else {
        categorized.past.push(updatedEvent);
      }
    }
    
    // Sort upcoming events from soonest to latest
    categorized.upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setLiveEvents(categorized.live);
    setUpcomingEvents(categorized.upcoming);
    setPastEvents(categorized.past);

  }, [allEvents, loading]);
  
  const heroEvent = upcomingEvents[0] || liveEvents[0] || allEvents[0];

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-16">
        <Skeleton className="w-full h-[50vh] rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allEvents.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="text-center py-24 text-foreground bg-card/50 rounded-lg shadow-lg glowing-border flex flex-col items-center">
          <PartyPopper className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">The Stage is Yours!</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Watch live music shows, comedy, magic, yoga, and more, or become an artist and create your own events.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/artist/register">
              Become an Artist <ArrowRight className="ml-2 h-5 w-5"/>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-16">
        {heroEvent && (
            <div className="relative w-full h-[50vh] rounded-2xl overflow-hidden flex items-end p-4 md:p-8 text-white glowing-border">
                <Image 
                    src={heroEvent.bannerUrl} 
                    alt={heroEvent.title} 
                    fill 
                    className="object-cover z-0 brightness-75" 
                    data-ai-hint="concert crowd"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                <div className="relative z-20">
                    <Badge variant="destructive" className="mb-2 text-base md:text-lg shadow-lg">
                        {heroEvent.status === 'live' ? 'Live Now!' : 'Upcoming'}
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-extrabold shadow-lg">{heroEvent.title}</h1>
                    <p className="text-xl md:text-2xl mt-2">{heroEvent.artist}</p>
                    <Button asChild size="lg" className="mt-6">
                        <Link href={`/events/${heroEvent.id}`}>
                            {heroEvent.status === 'live' ? 'Watch Now' : 'Get Tickets'}
                            <ArrowRight className="ml-2 h-5 w-5"/>
                        </Link>
                    </Button>
                </div>
            </div>
        )}

      <div className="space-y-16">
        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Happening Now 🔴</h2>
          {liveEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {liveEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg">
              <p>No events are live right now. Check out what's coming soon!</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Coming Soon ✨</h2>
          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg">
              <p>You're early! Check back soon for new performances.</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Catch Up On Past Shows 🎬</h2>
          {pastEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg">
              <p>Once events are over, their recordings will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
