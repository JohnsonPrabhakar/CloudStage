"use client";

import { useState, useEffect, useMemo } from "react";
import { type Event } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type HomePageClientProps = {
  initialEvents: Event[];
};

export function HomePageClient({ initialEvents }: HomePageClientProps) {
  const [allEvents, setAllEvents] = useState<Event[]>(initialEvents);

  useEffect(() => {
    // In a real app, you might want to merge server data with local data more intelligently.
    // For this mock, we'll just check if local data exists and use it.
    if (typeof window !== "undefined") {
      const storedEvents = localStorage.getItem("events");
      if (storedEvents) {
        try {
          const parsedEvents = JSON.parse(storedEvents);
          setAllEvents(parsedEvents);
        } catch (e) {
          console.error("Failed to parse events from localStorage", e);
        }
      } else {
        localStorage.setItem('events', JSON.stringify(initialEvents));
      }
    }
  }, [initialEvents]);

  const { liveEvents, upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    return allEvents.reduce(
      (acc, event) => {
        const eventDate = new Date(event.date);
        if (event.status === "live") {
          acc.liveEvents.push(event);
        } else if (event.status === "upcoming" && eventDate > now) {
          acc.upcomingEvents.push(event);
        } else {
          acc.pastEvents.push(event);
        }
        return acc;
      },
      { liveEvents: [], upcomingEvents: [], pastEvents: [] } as {
        liveEvents: Event[];
        upcomingEvents: Event[];
        pastEvents: Event[];
      }
    );
  }, [allEvents]);

  const renderEventGrid = (events: Event[], emptyMessage: string) => {
    if (events.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground">
          {emptyMessage}
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          The Stage is Yours
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover live performances, workshops, and exclusive events from creators around the world.
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-auto md:mx-auto">
          <TabsTrigger value="live">Live Now ({liveEvents.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
          <TabsTrigger value="past">Past Events ({pastEvents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="live" className="mt-8">
          {renderEventGrid(liveEvents, "No events are live right now. Check back soon!")}
        </TabsContent>
        <TabsContent value="upcoming" className="mt-8">
          {renderEventGrid(upcomingEvents, "No upcoming events scheduled. Stay tuned!")}
        </TabsContent>
        <TabsContent value="past" className="mt-8">
          {renderEventGrid(pastEvents, "No past events found.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
