
"use client";

import { useState, useEffect } from "react";
import { type Event } from "@/lib/types";
import { getEvents, getMyTickets } from "@/lib/mock-data";
import { EventCard } from "@/components/EventCard";
import { Ticket } from "lucide-react";

export default function MyTicketsPage() {
  const [ticketedEvents, setTicketedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allEvents = getEvents();
    const myTicketIds = getMyTickets();
    const events = allEvents.filter((event) =>
      myTicketIds.includes(event.id)
    );
    setTicketedEvents(events);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="container mx-auto p-8">Loading your tickets...</div>;
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
          <p className="text-xl">You haven't bought any tickets yet.</p>
          <p>Explore events and book your spot!</p>
        </div>
      )}
    </div>
  );
}
