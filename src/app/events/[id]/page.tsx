
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Event, type Artist } from "@/lib/types";
import { getEventById, checkForExistingTicket, getSiteStatus, getArtistProfile } from "@/lib/firebase-service";
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
import { format, isToday } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { getYouTubeVideoId } from "@/lib/youtube-utils";

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
        const [foundEvent, status] = await Promise.all([
          getEventById(eventId),
          getSiteStatus()
        ]);
        
        setSiteStatus(status);
        
        if (foundEvent && foundEvent.moderationStatus === 'approved') {
            setEvent(foundEvent);
            const foundArtist = await getArtistProfile(foundEvent.artistId);
            setArtist(foundArtist || null);
        } else {
            setEvent(null);
            setArtist(null);
            setError("This event may not exist or is no longer available.");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const checkTicketStatus = async () => {
      if (currentUser && event) {
        setHasTicket(await checkForExistingTicket(currentUser.uid, event.id));
      } else {
        setHasTicket(false);
      }
    };
    checkTicketStatus();
  }, [currentUser, event]);

  useEffect(() => {
    setAttendees(Math.floor(Math.random() * 5000 + 1000));
  }, []);
  
  const isValidStreamUrl = (url: string) => {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'https:' && (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be'));
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
            <Skeleton className="h-10 w-3/4 bg-muted rounded" />
            <Skeleton className="h-6 w-1/2 bg-muted rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full bg-muted rounded" />
              <Skeleton className="h-4 w-full bg-muted rounded" />
              <Skeleton className="h-4 w-3/4 bg-muted rounded" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full bg-muted rounded-lg" />
            <Skeleton className="h-40 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event || !artist) {
    return (
      <div className="container mx-auto p-8 text-center">
        <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold">{error ? "An Error Occurred" : "Event Not Found"}</h1>
        <p className="text-muted-foreground mt-2 mb-6">{error || "The requested event could not be found."}</p>
        <Button onClick={() => router.push("/")} className="mt-8">
          Back to Home
        </Button>
      </div>
    );
  }
  
  const canWatch = isValidStreamUrl(event.streamUrl);
  const eventDate = new Date(event.date);
  const isEventLiveOrToday = eventDate <= new Date();

  const getAction = () => {
    const buyTicketButton = (
      <Button
        asChild
        size="lg"
        className="w-full text-lg py-6 transition-transform transform hover:scale-105"
        disabled={siteStatus === 'offline' || event.status === 'past'}
      >
        <Link href={`/confirm-ticket/${event.id}`}>
            <Ticket className="mr-2 h-6 w-6" /> Buy Ticket
        </Link>
      </Button>
    );

    if (siteStatus === 'offline' && event.status !== 'past') {
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
              <p>The booking system is temporarily disabled. Please check back later.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // For past events, anyone can watch the recording
    if (event.status === "past") {
      return (
        <Button asChild size="lg" disabled={!canWatch} className="w-full text-lg py-6" variant="secondary">
          <Link href={`/play/${event.id}`}>
            <Play className="mr-2 h-6 w-6" /> Watch Recording
          </Link>
        </Button>
      );
    }

    if (hasTicket) {
      if (!isEventLiveOrToday) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                 <span tabIndex={0} className="w-full">
                    <Button size="lg" className="w-full text-lg py-6" disabled>
                      <Play className="mr-2 h-6 w-6" /> Join Event
                    </Button>
                 </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>This event hasn't started yet. You can join once it's live.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      // For Live/Today's events
      return (
        <Button asChild size="lg" disabled={!canWatch} className="w-full text-lg py-6 transition-transform transform hover:scale-105">
          <Link href={`/play/${event.id}`}>
            <Play className="mr-2 h-6 w-6" /> Watch Now
          </Link>
        </Button>
      );
    }
    
    // If none of the above, user needs to buy a ticket
    return buyTicketButton;
  };

  const videoId = getYouTubeVideoId(event.streamUrl);
  const displayBannerUrl = event.bannerUrl && !event.bannerUrl.includes('youtube.com/vi')
    ? event.bannerUrl
    : videoId
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : "https://placehold.co/1280x720.png";

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
          src={displayBannerUrl}
          alt={event.title}
          fill
          className="object-cover"
          data-ai-hint="concert stage"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (videoId) {
              target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            } else {
              target.src = 'https://placehold.co/1280x720.png';
            }
            target.onerror = null;
          }}
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
           <div className="flex items-center gap-2 mt-2">
            <Link href={`/artist/${artist.id}`} className="text-xl md:text-2xl text-primary-foreground/90 font-medium hover:underline">
                by {event.artist}
            </Link>
            {artist.accessLevel === 'verified' && <VerifiedBadge />}
          </div>
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
