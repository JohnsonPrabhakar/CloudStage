"use client";

import { useState, useEffect } from "react";
import { type Event } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApprovedEvents } from "@/lib/firebase-service";
import { EventCalendarView } from "./EventCalendarView";
import { Button } from "./ui/button";
import { Calendar, List } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export function HomePageClient() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
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
    // This logic is now in useEffect to prevent hydration mismatches.
    // It runs only on the client-side after the component has mounted.
    if (allEvents.length === 0 && !loading) return;

    const now = new Date();
    const categorized = allEvents.reduce(
      (acc, event) => {
        const eventDate = new Date(event.date);
        let status: Event['status'] = 'past';

        // A simple check to simulate a live event (e.g., started in the last hour)
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        if (eventDate > oneHourAgo && eventDate <= now) {
            status = 'live';
        } else if (eventDate > now) {
            status = 'upcoming';
        }
        
        const updatedEvent = { ...event, status };

        if (status === "live") {
          acc.live.push(updatedEvent);
        } else if (status === "upcoming") {
          acc.upcoming.push(updatedEvent);
        } else {
          acc.past.push(updatedEvent);
        }
        return acc;
      },
      { live: [], upcoming: [], past: [] } as {
        live: Event[];
        upcoming: Event[];
        past: Event[];
      }
    );

    setLiveEvents(categorized.live);
    setUpcomingEvents(categorized.upcoming);
    setPastEvents(categorized.past);

  }, [allEvents, loading]);

  const renderEventGrid = (events: Event[], emptyMessage: string) => {
    if (loading) {
        return (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }
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

      <div className="flex justify-center mb-8">
        <div className="bg-muted p-1 rounded-lg flex gap-1">
           <Button variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')}>
             <List className="mr-2 h-4 w-4"/> List View
           </Button>
           <Button variant={viewMode === 'calendar' ? 'default' : 'ghost'} onClick={() => setViewMode('calendar')}>
             <Calendar className="mr-2 h-4 w-4"/> Calendar View
           </Button>
        </div>
      </div>
      
      {viewMode === 'list' ? (
        <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:w-auto md:mx-auto">
                <TabsTrigger value="live">Live Now ({!loading && liveEvents.length})</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming ({!loading && upcomingEvents.length})</TabsTrigger>
                <TabsTrigger value="past">Past Events ({!loading && pastEvents.length})</TabsTrigger>
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
      ) : (
        <EventCalendarView events={allEvents} />
      )}
    </div>
  );
}
