"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type Event, type Artist } from "@/lib/types";
import { getArtists, getEvents } from "@/lib/mock-data";
import {
  PlusCircle,
  Crown,
  History,
  TrendingUp,
  PartyPopper,
} from "lucide-react";
import { format } from "date-fns";

type ArtistDashboardProps = {
  initialEvents: Event[];
};

export default function ArtistDashboard({ initialEvents }: ArtistDashboardProps) {
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const artistId = "artist1"; // Mocked artist ID

  useEffect(() => {
    setIsClient(true);
    const allEvents = getEvents();
    const allArtists = getArtists();
    setMyEvents(allEvents.filter((e) => e.artistId === artistId));
    setArtist(allArtists.find((a) => a.id === artistId) || null);
  }, []);
  
  // This effect will re-run when local storage changes are made on other pages.
  useEffect(() => {
    const handleStorageChange = () => {
        const allEvents = getEvents();
        const allArtists = getArtists();
        setMyEvents(allEvents.filter(e => e.artistId === artistId));
        setArtist(allArtists.find(a => a.id === artistId) || null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const handleBoost = (eventId: string, amount: number) => {
    const updatedEvents = myEvents.map((e) =>
      e.id === eventId ? { ...e, isBoosted: true, boostAmount: amount } : e
    );

    // Update all events in localStorage
    const allEvents = getEvents();
    const allEventsUpdated = allEvents.map(e => {
        const updatedEvent = updatedEvents.find(ue => ue.id === e.id);
        return updatedEvent || e;
    });

    localStorage.setItem("events", JSON.stringify(allEventsUpdated));
    setMyEvents(updatedEvents);

    toast({
      title: "Event Boosted! 🚀",
      description: `Your event has been successfully boosted for ₹${amount}.`,
    });
  };

  const approvedEvents = myEvents.filter(e => e.moderationStatus === 'approved');

  if (!isClient) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8 animate-pulse">
        <div className="h-24 bg-muted rounded-lg"></div>
        <div className="h-12 w-1/3 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="h-48 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {!artist?.isPremium && (
        <Card className="bg-primary/10 border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Crown className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Become a Premium Artist!</CardTitle>
                <CardDescription>
                  Get priority listing, free boosts, and advanced analytics.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/artist/premium">Upgrade to Premium</Link>
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold">Artist Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your events and grow your audience.
          </p>
        </div>
        <div className="flex gap-2">
            <Button asChild variant="outline">
                <Link href="/artist/history"><History className="mr-2 h-4 w-4"/> View History</Link>
            </Button>
            <Button asChild size="lg">
                <Link href="/artist/create-event">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create New Event
                </Link>
            </Button>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4">My Approved Events</h2>
        {approvedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedEvents.map((event) => (
              <Card key={event.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>
                    {format(new Date(event.date), "PPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   <Badge variant={event.isBoosted ? "default" : "outline"} className={event.isBoosted ? "bg-green-600" : ""}>
                    {event.isBoosted ? "Boosted" : "Not Boosted"}
                  </Badge>
                </CardContent>
                <CardFooter>
                  {!event.isBoosted ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full">
                          <TrendingUp className="mr-2 h-4 w-4" /> Boost Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Boost Your Event</DialogTitle>
                          <DialogDescription>
                            Get your event featured on the homepage for maximum visibility.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          {[500, 1000, 2000, 3000].map((amount) => (
                            <DialogClose asChild key={amount}>
                              <Button
                                variant="outline"
                                onClick={() => handleBoost(event.id, amount)}
                              >
                                Boost for ₹{amount}
                              </Button>
                            </DialogClose>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                     <Button className="w-full" disabled>
                        <PartyPopper className="mr-2 h-4 w-4"/> Already Boosted
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No approved events yet. Create one to get started!</p>
        )}
      </section>
    </div>
  );
}
