
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { type Event } from "@/lib/types";
import { EventCard } from "@/components/EventCard";
import { getApprovedEvents } from "@/lib/firebase-service";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { ArrowRight, Calendar, RadioTower, Search, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function HomePageClient() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
    const liveThreshold = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago

    if (!allEvents || allEvents.length === 0) {
      return { liveEvents: [], upcomingEvents: [], pastEvents: [] };
    }

    const categorized: {
      live: Event[];
      upcoming: Event[];
      past: Event[];
    } = { live: [], upcoming: [], past: [] };

    const sortedEvents = [...allEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const event of sortedEvents) {
      let finalStatus: Event["status"] = event.status;
      const eventDate = new Date(event.date);

      if (eventDate > now) {
        finalStatus = 'upcoming';
      } else if (eventDate <= now && eventDate >= liveThreshold) {
        finalStatus = 'live';
      } else {
        finalStatus = 'past';
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

  const { uniqueLanguages, uniqueCategories } = useMemo(() => {
    const languages = new Set(allEvents.map(e => e.language));
    const categories = new Set(allEvents.map(e => e.category));
    return {
      uniqueLanguages: Array.from(languages),
      uniqueCategories: Array.from(categories),
    };
  }, [allEvents]);

  const filterAndSearchEvents = (events: Event[]) => {
    return events.filter(event => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.language.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLang = selectedLanguage === 'all' || event.language === selectedLanguage;
      const matchesCat = selectedCategory === 'all' || event.category === selectedCategory;
      return matchesSearch && matchesLang && matchesCat;
    });
  };

  const filteredLiveEvents = filterAndSearchEvents(liveEvents);
  const filteredUpcomingEvents = filterAndSearchEvents(upcomingEvents);
  const filteredPastEvents = filterAndSearchEvents(pastEvents);

  const renderEventSection = (events: Event[], title: string) => {
    if (events.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground bg-card/50 rounded-lg">
          <p>No {title.toLowerCase()} match your criteria.</p>
          <p className="text-sm">Try adjusting your search or filters.</p>
        </div>
      );
    }
    return (
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 -ml-4 pl-4">
          {events.slice(0, 5).map(event => (
            <div key={event.id} className="w-full sm:w-[280px] shrink-0">
              <EventCard event={event} />
            </div>
          ))}
          {events.length > 5 && (
            <div className="w-[280px] shrink-0 flex items-center justify-center">
              <Card className="h-full w-full flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors">
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <h3 className="text-lg font-semibold">Explore More</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    + {events.length - 5} more events
                  </p>
                  <Button variant="outline">
                    View All <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-16">
        <Skeleton className="w-full h-[50vh] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-12">
        <div className="relative w-full h-[60vh] md:h-[50vh] rounded-2xl flex items-center justify-center p-4 md:p-8 text-foreground text-center glowing-border">
            <div className="relative z-20 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold shadow-lg">The Stage is Yours</h1>
                <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto text-muted-foreground">
                    Watch live music, support artists, enjoy comedy, yoga, talk shows, and more — all in one stage.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg">
                      <Link href="#events-section">
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

        <section id="events-section" className="scroll-mt-20 space-y-8">
           <Tabs defaultValue="upcoming" className="w-full">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                <TabsList className="grid w-full grid-cols-3 md:w-auto">
                    <TabsTrigger value="live">
                        <RadioTower className="mr-2 h-4 w-4"/> Live
                    </TabsTrigger>
                    <TabsTrigger value="upcoming">
                        <Calendar className="mr-2 h-4 w-4"/> Upcoming
                    </TabsTrigger>
                    <TabsTrigger value="past">
                        <ArrowRight className="mr-2 h-4 w-4"/> Past
                    </TabsTrigger>
                </TabsList>

                <div className="w-full relative md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                    <Input 
                        placeholder="Search by title, category..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {uniqueCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Languages</SelectItem>
                        {uniqueLanguages.map(lang => (
                            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <TabsContent value="live">
              <h2 className="text-2xl font-bold mb-4">Live Events</h2>
              {renderEventSection(filteredLiveEvents, "Live Events")}
            </TabsContent>
            <TabsContent value="upcoming">
              <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
              {renderEventSection(filteredUpcomingEvents, "Upcoming Events")}
            </TabsContent>
            <TabsContent value="past">
              <h2 className="text-2xl font-bold mb-4">Past Events</h2>
              {renderEventSection(filteredPastEvents, "Past Events")}
            </TabsContent>
          </Tabs>
        </section>
    </div>
  );
}
