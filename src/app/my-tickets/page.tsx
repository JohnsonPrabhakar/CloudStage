
"use client";

import { useState, useEffect } from "react";
import { type Event } from "@/lib/types";
import { getUserTicketsListener } from "@/lib/firebase-service";
import { EventCard } from "@/components/EventCard";
import { Ticket, LogIn, WifiOff, Loader2, ArrowRight, User } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default function MyTicketsPage() {
  const [ticketedEvents, setTicketedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setTicketedEvents([]);
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    let listenerUnsubscribe: (() => void) | undefined;
    
    if (user) {
      setLoading(true);
      setError(null);
      
      try {
        listenerUnsubscribe = getUserTicketsListener(user.uid, (events) => {
          const sortedEvents = events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTicketedEvents(sortedEvents);
          setLoading(false);
        });
      } catch (err) {
        console.error("Failed to set up ticket listener:", err);
        setError("Could not load your tickets. Please check your connection and try again.");
        setTicketedEvents([]);
        setLoading(false);
      }
    }
    
    return () => {
      if (listenerUnsubscribe) {
        listenerUnsubscribe();
      }
    };
  }, [user]);

  const { upcoming, past } = ticketedEvents.reduce((acc, event) => {
    if (new Date(event.date) >= new Date()) {
      acc.upcoming.push(event);
    } else {
      acc.past.push(event);
    }
    return acc;
  }, { upcoming: [] as Event[], past: [] as Event[] });

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-12 space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="container mx-auto p-4 md:p-8 text-center py-24 bg-card rounded-lg">
            <User className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-3xl font-bold mb-2">Access Your Tickets</h1>
            <p className="text-muted-foreground mb-6">Please log in to view the events you've booked.</p>
            <Button asChild size="lg">
                <Link href="/user/login?redirect=/my-tickets">
                    <LogIn className="mr-2 h-4 w-4" />
                    Log In
                </Link>
            </Button>
        </div>
    )
  }
  
  if (error) {
    return (
        <div className="container mx-auto p-8 text-center">
            <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Connection Error</h1>
            <p className="text-muted-foreground mt-2 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
                Try Again
            </Button>
        </div>
    )
  }

  const renderTicketList = (events: Event[], emptyMessage: string) => {
    if (events.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg mt-6">
          <p>{emptyMessage}</p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    );
  };


  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight flex items-center gap-4">
          <Ticket className="h-10 w-10 text-primary" />
          My Tickets
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          All the events you've booked. Ready for the show?
        </p>
      </div>

      {ticketedEvents.length > 0 ? (
        <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              {renderTicketList(upcoming, "You have no upcoming tickets.")}
            </TabsContent>
             <TabsContent value="past">
              {renderTicketList(past, "You have no past tickets.")}
            </TabsContent>
        </Tabs>
      ) : (
        <Card className="text-center py-24">
            <CardContent>
                <p className="text-xl text-muted-foreground">You haven't bought any tickets yet.</p>
                <Button asChild className="mt-4">
                    <Link href="/">
                        Explore Events <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
