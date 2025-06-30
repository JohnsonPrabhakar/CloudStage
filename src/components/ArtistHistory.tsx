"use client";

import { useEffect } from 'react';
import { useRouter } from "next/navigation";
import { type Event } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, PlusCircle, ChevronLeft, Eye, Clock, Ticket } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type ArtistHistoryProps = {
  events: Event[];
};

export default function ArtistHistory({ events }: ArtistHistoryProps) {
  const router = useRouter();

  const handleDuplicate = (eventId: string) => {
    // Note: Duplication from one event to another might need a more complex
    // implementation when dealing with Firestore to avoid carrying over old IDs.
    // For now, it just links to the create page.
    router.push(`/artist/create-event?duplicate=${eventId}`);
  };

  const getStatusBadge = (status: Event["moderationStatus"]) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            <div>
              <CardTitle className="text-3xl">My Event History</CardTitle>
              <CardDescription>
                A complete log of all events you have submitted, with performance metrics.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
             <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4">
                   <div className="md:col-span-2">
                       <p className="font-bold">{event.title}</p>
                       <p className="text-sm text-muted-foreground">{format(new Date(event.date), "PPP")}</p>
                       <div className="mt-2">{getStatusBadge(event.moderationStatus)}</div>
                   </div>
                   <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2"><Eye className="h-4 w-4"/><span>{event.views?.toLocaleString() || 0} views</span></div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4"/><span>{event.watchTime || 0} min watch time</span></div>
                      <div className="flex items-center gap-2"><Ticket className="h-4 w-4"/><span>{event.ticketsSold?.toLocaleString() || 0} tickets sold</span></div>
                   </div>
                   <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicate(event.id)}
                      >
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </Button>
                   </div>
                </Card>
              ))}
             </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground space-y-4">
                <p>You haven't created any events yet.</p>
                <Button asChild>
                    <Link href="/artist/create-event">
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Event
                    </Link>
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
