
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { type Event } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { getApprovedEvents } from "@/lib/firebase-service";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { ArrowRight, Music, Mic, Sprout, WandSparkles, Clapperboard, Radio, Calendar } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const getEventHint = (category: Event['category']): string => {
    switch (category) {
        case 'Music':
            return 'concert stage';
        case 'Stand-up Comedy':
            return 'comedy club';
        case 'Meditation / Yoga':
            return 'yoga meditation';
        case 'Magic Show':
            return 'magician stage';
        case 'Talk':
            return 'panel discussion';
        case 'Devotional / Bhajan / Satsang':
            return 'devotional music';
        case 'Workshop':
            return 'workshop class';
        default:
            return 'live event';
    }
};

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
    const now = new Date();
    const liveThreshold = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago

    if (!allEvents || allEvents.length === 0) {
      return { liveEvents: [], upcomingEvents: [], pastEvents: [] };
    }

    const categorized: {
      live: Event[];
      upcoming: Event[];
      past: Event[];
    } = {
      live: [],
      upcoming: [],
      past: [],
    };
    
    const sortedEvents = [...allEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const event of sortedEvents) {
      let finalStatus: Event["status"] = event.status;
      const eventDate = new Date(event.date);

      if (event.status !== 'past') {
          if (eventDate <= now && eventDate >= liveThreshold) {
              finalStatus = 'live';
          } else if (eventDate < liveThreshold) {
              finalStatus = 'past';
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
    
    // Sort upcoming ascending, past/live descending
    categorized.upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    categorized.live.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    categorized.past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const boostedUpcoming = categorized.upcoming.filter(e => e.isBoosted);
    const nonBoostedUpcoming = categorized.upcoming.filter(e => !e.isBoosted);

    return {
        liveEvents: categorized.live,
        upcomingEvents: [...boostedUpcoming, ...nonBoostedUpcoming],
        pastEvents: categorized.past,
    };
  }, [allEvents]);
  
  const renderMockCategories = () => {
    const categories = [
        { name: 'Live Music Concerts', icon: <Music className="h-8 w-8 text-primary"/>, hint: "concert stage", imageUrl: "https://images.unsplash.com/photo-1656283384093-1e227e621fad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8TGl2ZSUyME11c2ljJTIwQ29uY2VydHxlbnwwfHx8fDE3NTE1MTAyMjl8MA&ixlib=rb-4.1.0&q=80&w=1080" },
        { name: 'Stand-up Comedy', icon: <Mic className="h-8 w-8 text-primary"/>, hint: "comedy club", imageUrl: "https://images.unsplash.com/photo-1611956425642-d5a8169abd63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxTdGFuZCUyMHVwJTIwY29tZWR5fGVufDB8fHx8MTc1MTUxMDEyOXww&ixlib=rb-4.1.0&q=80&w=1080" },
        { name: 'Yoga & Meditation', icon: <Sprout className="h-8 w-8 text-primary"/>, hint: "yoga meditation", imageUrl: "https://images.unsplash.com/photo-1588286840104-8957b019727f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHx5b2dhfGVufDB8fHx8MTc1MTQ2NTI5OHww&ixlib=rb-4.1.0&q=80&w=1080" },
        { name: 'Magic Shows', icon: <WandSparkles className="h-8 w-8 text-primary"/>, hint: "magician stage", imageUrl: "https://images.unsplash.com/photo-1556195332-95503f664ced?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxNYWdpYyUyMFNob3d8ZW58MHx8fHwxNzUxNTEwNzgwfDA&ixlib=rb-4.1.0&q=80&w=1080" },
        { name: 'Devotional / Satsang', icon: <Radio className="h-8 w-8 text-primary"/>, hint: "devotional music", imageUrl: "https://images.unsplash.com/photo-1542042179-03efeb269b35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxNHx8cHJheWVyfGVufDB8fHx8MTc1MTUxMTA2MHww&ixlib=rb-4.1.0&q=80&w=1080" },
        { name: 'Talk Shows & Panels', icon: <Clapperboard className="h-8 w-8 text-primary"/>, hint: "panel discussion", imageUrl: "https://images.unsplash.com/photo-1747476263861-c9eec8f97ab9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMXx8VGFsayUyMHnob3dzJTIwYW5kJTIwZGViYXRlfGVufDB8fHx8MTc1MTUwOTc0NXww&ixlib=rb-4.1.0&q=80&w=1080" },
    ];
    return (
        <div className="space-y-8">
            <div className="text-center">
                 <h2 className="text-3xl font-bold tracking-tight">The stage is quiet... for now.</h2>
                 <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">While there are no scheduled events, here are the kinds of live experiences you can discover on CloudStage.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                    <Card key={cat.name} className="overflow-hidden group">
                        <CardContent className="p-0">
                            <div className="relative h-48 w-full">
                                <Image
                                    src={cat.imageUrl}
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
        </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-16">
        <div className="relative w-full h-[60vh] md:h-[50vh] rounded-2xl flex items-center justify-center p-4 md:p-8 text-foreground text-center glowing-border">
            <div className="relative z-20 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold shadow-lg">The Stage is Yours</h1>
                <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto text-muted-foreground">
                    Watch live music, support artists, enjoy comedy, yoga, talk shows, and more — all in one stage.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg">
                      <Link href="#upcoming-events">
                          <Calendar className="mr-2 h-5 w-5"/>
                          Explore Events
                      </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                      <Link href="/artist/login">
                          <ArrowRight className="mr-2 h-5 w-5"/>
                          Artist Login
                      </Link>
                  </Button>
                </div>
            </div>
        </div>
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
        <div className="relative w-full h-[60vh] md:h-[50vh] rounded-2xl flex items-center justify-center p-4 md:p-8 text-foreground text-center glowing-border">
            <div className="relative z-20 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold shadow-lg">The Stage is Yours</h1>
                <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto text-muted-foreground">
                    Watch live music, support artists, enjoy comedy, yoga, talk shows, and more — all in one stage.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="#upcoming-events">
                      <Calendar className="mr-2 h-5 w-5" />
                      Upcoming Events
                    </Link>
                  </Button>
                </div>
            </div>
        </div>

      {!allEvents || allEvents.length === 0 ? (
          renderMockCategories()
      ) : (
          <div className="space-y-16">

            <section id="upcoming-events" className="scroll-mt-20 space-y-8">
              {upcomingEvents.length > 0 ? (
                <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                  <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className="text-xl font-semibold hover:no-underline justify-center bg-muted/50 rounded-md px-4 py-3">
                       <span>View All Upcoming Events ({upcomingEvents.length})</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg">
                  <p>You're early! Check back soon for new performances.</p>
                </div>
              )}
            </section>

            <section id="past-events" className="scroll-mt-20">
              <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">Catch Up On Past Shows 🎬</h2>
              {pastEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {pastEvents.map((event) => <EventCard key={event.id} event={event} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg">
                        <p>Once events are over, their recordings will appear here.</p>
                    </div>
                )}
            </section>
          </div>
      )}
    </div>
  );
}
