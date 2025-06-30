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
import { ChevronLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function BoostedEvents() {
  const router = useRouter();
  const { toast } = useToast();
  const [boostedEvents, setBoostedEvents] = useState<Event[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && user.email === 'admin@cloudstage.in') {
            setIsAuthenticated(true);
            const fetchBoostedEvents = async () => {
                setLoading(true);
                const events = await getBoostedEvents();
                setBoostedEvents(events);
                setLoading(false);
            }
            fetchBoostedEvents();
        } else {
            toast({ variant: 'destructive', title: 'Access Denied' });
            router.push("/admin");
        }
    });
    return () => unsubscribe();
  }, [router, toast]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Verifying admin access...</p>
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
