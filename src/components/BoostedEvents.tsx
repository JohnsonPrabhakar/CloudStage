"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type Event } from "@/lib/types";
import { getBoostedEvents } from "@/lib/firebase-service";
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
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";

export default function BoostedEvents() {
  const router = useRouter();
  const [boostedEvents, setBoostedEvents] = useState<Event[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adminLoggedIn = localStorage.getItem("isAdmin") === "true";
      if (!adminLoggedIn) {
        router.push("/admin");
      } else {
        setIsAuthenticated(true);
        const fetchBoostedEvents = async () => {
            setLoading(true);
            const events = await getBoostedEvents();
            setBoostedEvents(events);
            setLoading(false);
        }
        fetchBoostedEvents();
      }
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            <div>
                <CardTitle className="text-3xl">Boosted Events</CardTitle>
                <CardDescription>
                    Events that are currently being promoted on the platform.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
             <p className="text-center text-muted-foreground py-12">Loading boosted events...</p>
          ) : boostedEvents.length > 0 ? (
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
