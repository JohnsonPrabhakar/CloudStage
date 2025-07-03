
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Event } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { getApprovedEvents } from "@/lib/firebase-service";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { ArrowRight } from "lucide-react";
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
      const eventDate = new Date(event.date);
      let finalStatus = event.status;

      if (finalStatus !== 'past') {
          if (eventDate <= now) {
              finalStatus = eventDate >= liveThreshold ? 'live' : 'past';
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
    
    // Sort upcoming events by soonest first
    categorized.upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setLiveEvents(categorized.live);
    setUpcomingEvents(categorized.upcoming);
    setPastEvents(categorized.past);

  }, [allEvents, loading]);
  
  const renderEventGrid = (events: Event[], title: string) => {
    if (loading) {
        return (
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
        )
    }
    if (events.length === 0) {
      return null; // Don't render the section if there are no events to show
    }
    return (
      <section className="py-8 md:py-12">
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    );
  };
  
  const heroEvent = upcomingEvents[0] || liveEvents[0] || allEvents[0];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-16">
        {/* Hero Section */}
        {loading ? (
             <Skeleton className="w-full h-[50vh] rounded-lg" />
        ) : heroEvent && (
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

      {renderEventGrid(liveEvents, "Happening Now 🔴")}
      {renderEventGrid(upcomingEvents, "Coming Soon ✨")}
      {renderEventGrid(pastEvents, "Catch Up On Past Shows 🎬")}
    </div>
  );
}
