"use client";

import { useState, useEffect } from "react";
import { type Event, type Ticket as TicketType } from "@/lib/types";
import { getUserTicketsListener } from "@/lib/firebase-service";
import { EventCard } from "@/components/EventCard";
import { Ticket, LogIn, WifiOff, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyTicketsPage() {
  const [ticketedEvents, setTicketedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
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
          setTicketedEvents(events);
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
            <Ticket className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-3xl font-bold mb-2">See Your Tickets</h1>
            <p className="text-muted-foreground mb-6">Please log in to view the events you've booked.</p>
            <Button asChild size="lg">
                <Link href="/artist/login">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {ticketedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-muted-foreground bg-card rounded-lg">
          <p className="text-xl">You haven't acquired any tickets yet.</p>
          <p>Explore events and book your spot!</p>
        </div>
      )}
    </div>
  );
}
