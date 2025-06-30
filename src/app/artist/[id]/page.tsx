"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Event, type Artist } from "@/lib/types";
import { getEvents, getArtists } from "@/lib/mock-data";
import { EventCard } from "@/components/EventCard";
import {
  Youtube,
  Instagram,
  ChevronLeft,
  Crown,
  User,
  Music,
} from "lucide-react";

export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [artistEvents, setArtistEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const artistId = params.id as string;
    if (artistId) {
      const allArtists = getArtists();
      const allEvents = getEvents();
      const foundArtist = allArtists.find((a) => a.id === artistId);
      setArtist(foundArtist || null);

      if (foundArtist) {
        const approvedAndPastEvents = allEvents.filter(
          (e) =>
            e.artistId === foundArtist.id &&
            e.moderationStatus === "approved" &&
            new Date(e.date) < new Date()
        );
        setArtistEvents(approvedAndPastEvents);
      }
    }
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (!artist) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold">Artist Not Found</h1>
        <Button onClick={() => router.push("/")} className="mt-8">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-8">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="mb-8">
        <CardContent className="p-6 flex flex-col md:flex-row items-start gap-8">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-primary">
            <Image
              src={`https://placehold.co/128x128.png`}
              alt={artist.name}
              fill
              className="object-cover"
              data-ai-hint="artist portrait"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold">{artist.name}</h1>
              {artist.isPremium && (
                <Badge className="bg-amber-500 text-white">
                  <Crown className="mr-2 h-4 w-4" />
                  Premium
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{artist.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                <span>{artist.genres.join(", ")}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <Button asChild variant="outline" size="sm">
                <Link href={artist.youtubeUrl} target="_blank">
                  <Youtube className="mr-2 h-4 w-4" /> YouTube
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={artist.instagramUrl} target="_blank">
                  <Instagram className="mr-2 h-4 w-4" /> Instagram
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Past Events</h2>
        {artistEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {artistEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg">
            <p>This artist has no past events on CloudStage yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
