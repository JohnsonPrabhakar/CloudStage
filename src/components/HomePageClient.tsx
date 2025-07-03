
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Event } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { getApprovedEvents } from "@/lib/firebase-service";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { ArrowRight, PartyPopper, Music, Mic, Sprout, WandSparkles, Clapperboard } from "lucide-react";
import { Badge } from "./ui/badge";
import { EventCalendarView } from "./EventCalendarView";
import { Card, CardContent } from "./ui/card";

export function HomePageClient() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
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

  const { liveEvents, upcomingEvents, pastEvents } = useMemo(() => {
    if (allEvents.length === 0) {
      return { liveEvents: [], upcomingEvents: [], pastEvents: [] };
    }
    const now = new Date();
    const liveThreshold = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const categorized: {
      live: Event[];
      upcoming: Event[];
      past: Event[];
    } = {
      live: [],
      upcoming: [],
      past: [],
    };

    const sortedEvents = [...allEvents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const event of sortedEvents) {
      let finalStatus: Event["status"] = event.status;

      // Only re-evaluate status if it's not already 'past'.
      // This respects the status set by other processes.
      if (finalStatus !== 'past') {
          const eventDate = new Date(event.date);
          if (eventDate <= now) {
              // If the event start time is in the past
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
    
    categorized.upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
        liveEvents: categorized.live,
        upcomingEvents: categorized.upcoming,
        pastEvents: categorized.past,
    };
  }, [allEvents]);
  
  const heroEvent = liveEvents[0] || upcomingEvents[0] || pastEvents[0] || null;

  const renderEventGrid = (events: Event[], emptyMessage: string) => {
    if (events.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      );
    }
    return (
      <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg">
        <p>{emptyMessage}</p>
      </div>
    );
  };
  
  const renderMockCategories = () => {
    const categories = [
        { name: 'Live Music Concerts', icon: <Music className="h-8 w-8 text-primary"/>, hint: "concert stage" },
        { name: 'Stand-up Comedy', icon: <Mic className="h-8 w-8 text-primary"/>, hint: "comedy club" },
        { name: 'Yoga & Meditation', icon: <Sprout className="h-8 w-8 text-primary"/>, hint: "yoga meditation" },
        { name: 'Magic Shows', icon: <WandSparkles className="h-8 w-8 text-primary"/>, hint: "magician stage" },
        { name: 'Talk Shows & Panels', icon: <Clapperboard className="h-8 w-8 text-primary"/>, hint: "panel discussion" },
    ]
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight text-center">Discover Events Across All Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                    <Card key={cat.name} className="overflow-hidden group">
                        <CardContent className="p-0">
                            <div className="relative h-48 w-full">
                                <Image 
                                    src={`https://placehold.co/600x400.png`}
                                    alt={cat.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    data-ai-hint={cat.hint}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                <div className="absolute bottom-4 left-4 text-white flex items-center gap-3">
                                    {cat.icon}
                                    <h3 className="text-xl font-bold">{cat.name}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
             <div className="text-center pt-8">
                <Button asChild size="lg">
                    <Link href="/artist/register">Become an Artist <ArrowRight className="ml-2 h-5 w-5"/></Link>
                </Button>
            </div>
        </div>
    )
  }

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

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-16">
        <div className="relative w-full h-[60vh] md:h-[50vh] rounded-2xl overflow-hidden flex items-center justify-center p-4 md:p-8 text-white text-center glowing-border">
            <Image 
                src={heroEvent?.bannerUrl || "https://placehold.co/1600x600.png"} 
                alt={heroEvent?.title || "Live entertainment stage"} 
                fill 
                className="object-cover z-0 brightness-50" 
                data-ai-hint="concert crowd"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            <div className="relative z-20 max-w-4xl mx-auto">
                {heroEvent && (
                    <Badge variant="destructive" className="mb-4 text-base md:text-lg shadow-lg animate-pulse">
                        {heroEvent.status === 'live' ? 'Live Now!' : 'Featured'}
                    </Badge>
                )}
                <h1 className="text-4xl md:text-6xl font-extrabold shadow-lg">{heroEvent?.title || "The Stage is Yours"}</h1>
                <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto">
                    {heroEvent?.artist ? `by ${heroEvent.artist}` : "Watch live music, support artists, enjoy comedy, yoga, talk shows, and more — all in one stage."}
                </p>
                {heroEvent && (
                    <Button asChild size="lg" className="mt-8">
                        <Link href={`/events/${heroEvent.id}`}>
                            {heroEvent.status === 'live' ? 'Watch Now' : 'Get Tickets'}
                            <ArrowRight className="ml-2 h-5 w-5"/>
                        </Link>
                    </Button>
                )}
            </div>
        </div>

      {allEvents.length === 0 ? (
          renderMockCategories()
      ) : (
          <div className="space-y-16">
            <section>
              <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Happening Now 🔴</h2>
              {renderEventGrid(liveEvents, "No events are live right now. Check out what's coming soon!")}
            </section>

            <section className="space-y-8">
              <h2 className="text-3xl font-bold tracking-tight text-center">Coming Soon ✨</h2>
               <EventCalendarView events={upcomingEvents} />
              {renderEventGrid(upcomingEvents, "You're early! Check back soon for new performances.")}
            </section>

            <section>
              <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Catch Up On Past Shows 🎬</h2>
              {renderEventGrid(pastEvents, "Once events are over, their recordings will appear here.")}
            </section>
          </div>
      )}
    </div>
  );
}
