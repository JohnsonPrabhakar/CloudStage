"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Event } from "@/lib/types";
import { getEvents } from "@/lib/mock-data";
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
} from "lucide-react";
import { format } from "date-fns";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState(0);

  useEffect(() => {
    if (params.id) {
      const allEvents = getEvents();
      const foundEvent = allEvents.find(
        (e) => e.id === params.id && e.moderationStatus === "approved"
      );
      setEvent(foundEvent || null);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    // Generate random number on client after mount to avoid hydration mismatch
    setAttendees(Math.floor(Math.random() * 5000 + 1000));
  }, []);

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

  if (!event) {
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

  const getAction = () => {
    switch (event.status) {
      case "live":
        return (
          <Button
            asChild
            size="lg"
            className="w-full text-lg py-6 transition-transform transform hover:scale-105"
          >
            <Link href={`/play/${event.id}`}>
              <Play className="mr-2 h-6 w-6" /> Watch Now
            </Link>
          </Button>
        );
      case "upcoming":
        return (
          <Button
            size="lg"
            className="w-full text-lg py-6 transition-transform transform hover:scale-105"
            onClick={() => alert("Redirecting to ticket purchase...")}
          >
            <Ticket className="mr-2 h-6 w-6" /> Buy Ticket
          </Button>
        );
      case "past":
        return (
          <Button
            asChild
            size="lg"
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
          <p className="text-xl md:text-2xl text-primary-foreground/90 font-medium mt-2">
            by {event.artist}
          </p>
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
                <Link href={event.youtubeUrl} target="_blank">
                  <Button variant="outline" size="icon">
                    <Youtube className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href={event.instagramUrl} target="_blank">
                  <Button variant="outline" size="icon">
                    <Instagram className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
