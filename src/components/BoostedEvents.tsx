"use client";

import { useState, useEffect } from "react";
import { type Event } from "@/lib/types";
import { getEvents } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

type BoostedEventsProps = {
  initialEvents: Event[];
};

export default function BoostedEvents({ initialEvents }: BoostedEventsProps) {
  const [boostedEvents, setBoostedEvents] = useState<Event[]>([]);

  useEffect(() => {
    // In a real app, this would be an API call.
    // Here we filter from all events.
    const allEvents = getEvents();
    setBoostedEvents(allEvents.filter((e) => e.isBoosted));
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Boosted Events</CardTitle>
          <CardDescription>
            Events that are currently being promoted on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {boostedEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Boost Amount</TableHead>
                  <TableHead>Event Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boostedEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>{event.artist}</TableCell>
                    <TableCell>₹{event.boostAmount?.toLocaleString("en-IN") || "N/A"}</TableCell>
                    <TableCell>{format(new Date(event.date), "PPP")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              No events are currently boosted.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
