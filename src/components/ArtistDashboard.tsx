
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { getArtistEvents, getArtistProfile, toggleEventBoost } from "@/lib/firebase-service";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  PlusCircle,
  Crown,
  History,
  TrendingUp,
  PartyPopper,
  Copy,
  Share2,
  LogOut,
  WifiOff,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "./ui/skeleton";

export default function ArtistDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                setError(null);
                const profile = await getArtistProfile(user.uid);
                if (profile) {
                    if (profile.isApproved) {
                        setArtist(profile);
                        const events = await getArtistEvents(user.uid);
                        setMyEvents(events);
                    } else {
                        router.push('/artist/pending');
                    }
                } else {
                     router.push('/artist/login');
                }
            } catch (err) {
                 console.error("Failed to fetch artist data:", err);
                 setError("Could not load your dashboard. Please check your internet connection and try again.");
            } finally {
                setLoading(false);
            }
        } else {
            router.push('/artist/login');
            setLoading(false);
        }
    });

    return () => unsubscribe();
  }, [router]);

  const handleBoost = async (eventId: string, amount: number) => {
    await toggleEventBoost(eventId, true, amount);
    setMyEvents(prevEvents => prevEvents.map(e => e.id === eventId ? {...e, isBoosted: true, boostAmount: amount} : e));
    toast({
      title: "Event Boosted! 🚀",
      description: `Your event has been successfully boosted for ₹${amount}.`,
    });
  };

  const handleCopyLink = (eventId: string) => {
    const url = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Event link copied to your clipboard.",
    });
  };

  const handleShare = async (event: Event) => {
    const url = `${window.location.origin}/events/${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this event: ${event.title} by ${event.artist}`,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopyLink(event.id);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push("/artist/login");
  }

  const approvedEvents = myEvents.filter(e => e.moderationStatus === 'approved');

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8 animate-pulse">
        <div className="h-10 w-1/4 bg-muted rounded"></div>
        <div className="h-24 bg-muted rounded-lg"></div>
        <div className="h-12 w-1/3 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
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
    );
  }
  
  if (!artist) {
    // This state is hit briefly before redirection. Showing a skeleton is a good fallback.
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8 animate-pulse">
        <div className="h-10 w-1/4 bg-muted rounded"></div>
        <div className="h-24 bg-muted rounded-lg"></div>
        <div className="h-12 w-1/3 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {!artist.isPremium && (
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
          <h1 className="text-4xl font-bold">Welcome, {artist.name}</h1>
          <p className="text-muted-foreground">
            Manage your events and grow your audience.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
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
                <CardFooter className="flex-col items-stretch gap-2">
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleCopyLink(event.id)}>
                      <Copy className="mr-2 h-4 w-4" /> Copy Link
                    </Button>
                     <Button variant="outline" size="sm" className="flex-1" onClick={() => handleShare(event)}>
                      <Share2 className="mr-2 h-4 w-4" /> Share
                    </Button>
                  </div>

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
                        </Header>
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
