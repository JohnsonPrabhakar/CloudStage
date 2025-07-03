
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Event, type Artist } from "@/lib/types";
import { getEventById, createTicket, checkForExistingTicket, getSiteStatus, getArtistProfile } from "@/lib/firebase-service";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  Youtube,
  Instagram,
  Clapperboard,
  Globe,
  Ticket,
  Calendar,
  Users,
  Play,
  DollarSign,
  Sparkles,
  ChevronLeft,
  WifiOff,
} from "lucide-react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendees, setAttendees] = useState(0);
  const [hasTicket, setHasTicket] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [siteStatus, setSiteStatus] = useState<'online' | 'offline'>('online');


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchEventAndStatus = async () => {
    if (params.id) {
      setLoading(true);
      setError(null);
      try {
        const eventId = params.id as string;
        // Fetch event and site status in parallel
        const [foundEvent, status] = await Promise.all([
          getEventById(eventId),
          getSiteStatus()
        ]);
        
        setSiteStatus(status);
        
        if (foundEvent && foundEvent.moderationStatus === 'approved') {
            setEvent(foundEvent);
            // Fetch the associated artist from Firestore
            const foundArtist = await getArtistProfile(foundEvent.artistId);
            setArtist(foundArtist || null);
        } else {
            setEvent(null);
            setArtist(null);
        }
      } catch (err) {
        console.error("Failed to fetch event:", err);
        setError("Could not load event details. Please check your internet connection and try again.");
      } finally {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchEventAndStatus();
  }, [params.id]);

  useEffect(() => {
    // Check if user has a ticket after user and event are loaded
    const checkTicketStatus = async () => {
      if (currentUser && event) {
        const ticketExists = await checkForExistingTicket(currentUser.uid, event.id);
        setHasTicket(ticketExists);
      } else {
        // Reset if user logs out or event changes
        setHasTicket(false);
      }
    };
    checkTicketStatus();
  }, [currentUser, event]);

  useEffect(() => {
    // Generate random number on client after mount to avoid hydration mismatch
    setAttendees(Math.floor(Math.random() * 5000 + 1000));
  }, []);

  const handleBuyTicket = async () => {
    if (!event) return;
    if (!currentUser) {
        toast({
            variant: "destructive",
            title: "Please Log In",
            description: "You need to be logged in to get a ticket.",
        });
        router.push("/artist/login");
        return;
    }

    const result = await createTicket(currentUser.uid, event.id);
    if (result.success) {
        setHasTicket(true);
        toast({
            title: "Ticket Acquired!",
            description: `You've successfully got a ticket for ${event.title}.`,
        });
    } else {
        toast({
            variant: "destructive",
            title: "Failed to Get Ticket",
            description: result.message,
        });
    }
  };
  
  const isValidStreamUrl = (url: string) => {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'https:' && urlObj.hostname.includes('youtube.com');
    } catch (e) {
        return false;
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 animate-pulse">
        <div className="w-full h-96 bg-muted rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="h-10 w-3/4 bg-muted rounded"></div>
            <div className="h-6 w-1/2 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-full bg-muted rounded"></div>
              <div className="h-4 w-3/4 bg-muted rounded"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-12 w-full bg-muted rounded-lg"></div>
            <div className="h-40 bg-muted rounded-lg"></div>
          </div>
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
            <Button onClick={fetchEventAndStatus}>
                Try Again
            </Button>
        </div>
    )
  }

  if (!event || !artist) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-4xl font-bold">Event Not Found</h1>
        <p className="text-muted-foreground mt-4">
          This event may not exist or is no longer available.
        </p>
        <Button onClick={() => router.push("/")} className="mt-8">
          Back to Home
        </Button>
      </div>
    );
  }
  
  const canWatch = isValidStreamUrl(event.streamUrl);

  const getAction = () => {
    switch (event.status) {
      case "live":
        return (
          <Button
            asChild
            size="lg"
            disabled={!canWatch}
            className="w-full text-lg py-6 transition-transform transform hover:scale-105"
          >
            <Link href={`/play/${event.id}`}>
              <Play className="mr-2 h-6 w-6" /> Watch Now
            </Link>
          </Button>
        );
      case "upcoming":
        if (siteStatus === 'offline') {
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="w-full">
                    <Button size="lg" className="w-full text-lg py-6" disabled>
                      Bookings Currently Offline
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>The booking system is temporarily disabled for maintenance. Please check back later.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        if (hasTicket) {
             return (
              <Button
                asChild
                size="lg"
                disabled={!canWatch}
                className="w-full text-lg py-6 transition-transform transform hover:scale-105"
              >
                <Link href={`/play/${event.id}`}>
                  <Play className="mr-2 h-6 w-6" /> Join Event
                </Link>
              </Button>
            );
        }
        return (
          <Button
            size="lg"
            className="w-full text-lg py-6 transition-transform transform hover:scale-105"
            onClick={handleBuyTicket}
          >
            <Ticket className="mr-2 h-6 w-6" /> Buy Ticket
          </Button>
        );
      case "past":
        return (
          <Button
            asChild
            size="lg"
            disabled={!canWatch}
            className="w-full text-lg py-6"
            variant="secondary"
          >
            <Link href={`/play/${event.id}`}>
              <Play className="mr-2 h-6 w-6" /> Watch Recording
            </Link>
          </Button>
        );
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-2xl mb-8">
        <Image
          src={event.bannerUrl}
          alt={event.title}
          fill
          className="object-cover"
          data-ai-hint="concert stage"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        {event.isBoosted && (
          <Badge className="absolute top-4 left-4 bg-amber-500 text-white shadow-lg">
            <Sparkles className="mr-2 h-4 w-4" />
            Boosted Event
          </Badge>
        )}
        <div className="absolute bottom-0 left-0 p-4 md:p-8">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white shadow-lg">
            {event.title}
          </h1>
           <Link href={`/artist/${artist.id}`} className="text-xl md:text-2xl text-primary-foreground/90 font-medium mt-2 hover:underline">
            by {event.artist}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="default" className="text-sm py-1 px-3">
              <Clapperboard className="mr-2 h-4 w-4" />
              {event.category}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              <Globe className="mr-2 h-4 w-4" />
              {event.language}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              {event.genre}
            </Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3 capitalize">
              {event.status}
            </Badge>
          </div>

          <div>
            <h2 className="text-2xl font-bold border-b pb-2 mb-4">
              About the Event
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {event.description}
            </p>
          </div>
           
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 p-4">
            <CardHeader className="p-2 text-center">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Advertisement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Link href="#" target="_blank">
                 <Image
                    src="https://placehold.co/300x250.png"
                    width={300}
                    height={250}
                    alt="Sponsored Ad"
                    className="w-full rounded-md"
                    data-ai-hint="product advertisement"
                />
              </Link>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50">
            <CardContent className="p-6">{getAction()}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-primary" />
                <span className="font-medium">
                  {format(new Date(event.date), "PPP p")}
                </span>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-3 text-primary" />
                <span className="font-medium">
                  ₹{event.ticketPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-3 text-primary" />
                <span className="font-medium">
                  {attendees > 0 ? `${attendees} attendees` : "..."}
                </span>
              </div>
              <div className="flex items-center gap-4 pt-4">
                {artist.youtubeUrl && (
                  <Link href={artist.youtubeUrl} target="_blank">
                    <Button variant="outline" size="icon">
                      <Youtube className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                {artist.instagramUrl && (
                  <Link href={artist.instagramUrl} target="_blank">
                    <Button variant="outline" size="icon">
                      <Instagram className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
