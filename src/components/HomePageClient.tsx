
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
    if (allEvents.length === 0 && !loading) return;

    const now = new Date();
    // Use a 2-hour window to determine if an event is "live"
    const liveThreshold = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const categorized = {
      live: [] as Event[],
      upcoming: [] as Event[],
      past: [] as Event[],
    };

    for (const event of allEvents) {
      const eventDate = new Date(event.date);
      // Start with the status from the database as the source of truth
      let finalStatus = event.status;

      // Re-evaluate status only if it's not already 'past'
      if (finalStatus !== 'past') {
          if (eventDate <= now) {
              finalStatus = eventDate >= liveThreshold ? 'live' : 'past';
          }
      }
      
      const updatedEvent = { ...event, status: finalStatus };
      
      // Add to the correct category based on its final, calculated status
      categorized[finalStatus].push(updatedEvent);
    }
    
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
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }
    if (events.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground bg-slate-100 rounded-lg">
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
                <TabsTrigger value="live">Live Now ({!loading ? liveEvents.length : '...'})</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming ({!loading ? upcomingEvents.length : '...'})</TabsTrigger>
                <TabsTrigger value="past">Past Events ({!loading ? pastEvents.length : '...'})</TabsTrigger>
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
