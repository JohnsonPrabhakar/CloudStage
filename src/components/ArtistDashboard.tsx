
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { getArtistEventsListener, getArtistProfile, toggleEventBoost } from "@/lib/firebase-service";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
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
  Loader2,
  BadgeCheck,
  ShieldAlert,
  RadioTower,
} from "lucide-react";
import { format } from "date-fns";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { GoLiveModal } from "@/components/GoLiveModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ArtistDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        // No user is signed in. Redirect to login.
        router.push('/artist/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    let eventsUnsubscribe: (() => void) | undefined;

    if (user) {
      setLoading(true);
      (async () => {
        try {
          const profile = await getArtistProfile(user.uid);
          if (profile) {
            if (profile.isApproved) {
              setArtist(profile);
              // Set up listener for events only for approved artists
              eventsUnsubscribe = getArtistEventsListener(user.uid, (events) => {
                setMyEvents(events);
              });
            } else {
              router.push('/artist/pending');
            }
          } else {
            router.push('/artist/register');
          }
        } catch (err) {
          console.error("Dashboard data fetch error:", err);
          setError("Could not load your dashboard. Please check your internet connection.");
        } finally {
          setLoading(false);
        }
      })();
    }

    return () => {
      if (eventsUnsubscribe) eventsUnsubscribe();
    };
  }, [user, router]);
  
  const { liveEvents, upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    const categorized: { live: Event[], upcoming: Event[], past: Event[] } = {
      live: [],
      upcoming: [],
      past: [],
    };

    const approvedEvents = myEvents.filter(e => e.moderationStatus === 'approved');

    for (const event of approvedEvents) {
      const eventStartDate = new Date(event.date);
      const eventEndDate = event.endTime ? new Date(event.endTime) : new Date(eventStartDate.getTime() + 3 * 60 * 60 * 1000); // 3-hour fallback

      if (now >= eventEndDate) {
        categorized.past.push(event);
      } else if (now >= eventStartDate && now < eventEndDate) {
        categorized.live.push(event);
      } else {
        categorized.upcoming.push(event);
      }
    }
    
    // Sort events in each category
    categorized.live.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    categorized.upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(a.date).getTime());
    categorized.past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return categorized;
  }, [myEvents]);

  const handleBoost = async (eventId: string, amount: number) => {
    await toggleEventBoost(eventId, true, amount);
    // State will update automatically via onSnapshot listener
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
        // User cancelled share, do nothing.
      }
    } else {
      handleCopyLink(event.id);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push("/artist/login");
  };

  const renderVerificationButton = () => {
      if (!artist || artist.accessLevel === 'verified') return null;

      const verificationRequest = artist.verificationRequest;

      if (verificationRequest?.status === 'pending') {
          return (
              <Button variant="outline" disabled>
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  Verification Pending
              </Button>
          )
      }
       if (verificationRequest?.status === 'rejected') {
          return (
              <Button variant="destructive" asChild>
                <Link href="/artist/verify">
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  Re-apply for Verification
                </Link>
              </Button>
          )
      }

      return (
          <Button variant="outline" asChild>
            <Link href="/artist/verify">
              <BadgeCheck className="mr-2 h-4 w-4" />
              Apply for Verified Badge
            </Link>
          </Button>
      )
  }

  const renderEventGrid = (events: Event[], emptyMessage: string) => {
    if (events.length === 0) {
      return (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg mt-6">
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {events.map((event) => {
          const now = new Date();
          const eventStartDate = new Date(event.date);
          const eventEndDate = event.endTime ? new Date(event.endTime) : new Date(eventStartDate.getTime() + 3 * 60 * 60 * 1000);
          
          const isEventOver = now >= eventEndDate;
          const isLiveWindow = now >= eventStartDate && now < eventEndDate;

          return (
            <Card key={event.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription>
                  {format(eventStartDate, "PPP p")}
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
                
                {(() => {
                  if (isEventOver) {
                    return <Button variant="outline" disabled className="w-full">Event Ended</Button>;
                  }

                  if (event.status === 'live') {
                    return (
                      <Badge className="w-full justify-center py-2 bg-green-600 text-white">
                        <RadioTower className="mr-2 h-4 w-4 animate-pulse" /> Live
                      </Badge>
                    );
                  }
                  
                  if (isLiveWindow) {
                    return (
                      <GoLiveModal eventId={event.id}>
                        <Button className="w-full" variant="destructive">
                          <RadioTower className="mr-2 h-4 w-4" /> Go Live Now
                        </Button>
                      </GoLiveModal>
                    );
                  }
                  
                  if (!event.isBoosted) {
                    return (
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
                    );
                  } else {
                      return (
                        <Button className="w-full" disabled>
                          <PartyPopper className="mr-2 h-4 w-4" /> Already Boosted
                        </Button>
                      );
                  }
                })()}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-semibold">Verifying your access...</h2>
        <p className="text-muted-foreground">Please wait while we check your artist profile.</p>
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-semibold">Redirecting...</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      {!artist.isPremium && (
        <Card className="bg-primary/10 border-primary/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Crown className="h-8 w-8 text-primary shrink-0" />
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
           <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold">Welcome, {artist.name}</h1>
              {artist.accessLevel === 'verified' && <VerifiedBadge />}
           </div>
          <p className="text-muted-foreground">
            Manage your events and grow your audience.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {renderVerificationButton()}
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
          <Button asChild variant="outline">
            <Link href="/artist/history"><History className="mr-2 h-4 w-4" /> View History</Link>
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
        <h2 className="text-2xl font-bold mb-4">My Events</h2>
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
            <TabsTrigger value="live">Live ({liveEvents.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming">
            {renderEventGrid(upcomingEvents, "You have no upcoming events.")}
          </TabsContent>
          <TabsContent value="live">
            {renderEventGrid(liveEvents, "You have no events live right now.")}
          </TabsContent>
          <TabsContent value="past">
            {renderEventGrid(pastEvents, "You have no past events.")}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
