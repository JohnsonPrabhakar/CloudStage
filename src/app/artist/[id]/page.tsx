
"use client";

import { useEffect, useState } from "react";
import { type Event, type Artist } from "@/lib/types";
import {
  getArtistProfile,
  getPublicArtistEventsListener,
  isUserFollowing,
  followArtist,
  unfollowArtist,
  getFollowersCountListener,
} from "@/lib/firebase-service";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCard } from "@/components/EventCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { WifiOff, Heart, UserPlus, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Instagram, Youtube, Facebook } from "lucide-react";

interface ArtistPageProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';

export default function ArtistPage({ params }: ArtistPageProps) {
  const { id: artistId } = params;
  const { toast } = useToast();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    const authSub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    let eventsUnsubscribe: (() => void) | undefined;
    let followersUnsubscribe: (() => void) | undefined;

    const fetchArtistData = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getArtistProfile(artistId);
        if (profile) {
          setArtist(profile);
          eventsUnsubscribe = getPublicArtistEventsListener(artistId, setEvents);
          followersUnsubscribe = getFollowersCountListener(artistId, setFollowersCount);
        } else {
          setError("Artist not found.");
        }
      } catch (err) {
        console.error("Error fetching artist profile:", err);
        setError("Could not load artist profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();

    return () => {
      authSub();
      if (eventsUnsubscribe) eventsUnsubscribe();
      if (followersUnsubscribe) followersUnsubscribe();
    };
  }, [artistId]);

  useEffect(() => {
    if (currentUser && artistId) {
      isUserFollowing(currentUser.uid, artistId).then(setIsFollowing);
    } else {
      setIsFollowing(false);
    }
  }, [currentUser, artistId]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Please log in",
        description: "You need to be logged in to follow an artist.",
      });
      return;
    }
    try {
      if (isFollowing) {
        await unfollowArtist(currentUser.uid, artistId);
        toast({ title: `Unfollowed ${artist?.name}` });
      } else {
        await followArtist(currentUser.uid, artistId);
        toast({ title: `You are now following ${artist?.name}!` });
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: "Could not update your follow status. Please try again.",
      });
    }
  };
  
  const renderSocialLink = (url: string | undefined, icon: React.ReactNode, label: string) => {
    if (!url) return null;
    return (
       <Button asChild variant="outline" size="icon">
          <Link href={url} target="_blank" aria-label={`Visit ${artist?.name} on ${label}`}>
            {icon}
          </Link>
        </Button>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-40 mt-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold">An Error Occurred</h1>
        <p className="text-muted-foreground mt-2 mb-6">{error}</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold">Artist Not Found</h1>
        <p className="text-muted-foreground mt-4">The artist you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex flex-col items-center md:flex-row gap-6 md:gap-8 mb-12">
        <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-primary/50">
          <AvatarImage src={artist.profilePictureUrl} alt={artist.name} />
          <AvatarFallback>{artist.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <h1 className="text-4xl md:text-5xl font-extrabold">{artist.name}</h1>
            {artist.accessLevel === "verified" && <VerifiedBadge />}
          </div>
          <p className="text-lg text-muted-foreground mt-1">
            {artist.subCategory} | {artist.location}
          </p>
          <div className="mt-4 flex items-center justify-center md:justify-start gap-6">
            <Button onClick={handleFollowToggle} disabled={!currentUser}>
              {isFollowing ? (
                <UserCheck className="mr-2 h-4 w-4" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <div className="text-center">
              <p className="font-bold text-lg">{followersCount}</p>
              <p className="text-sm text-muted-foreground">Followers</p>
            </div>
            <div className="flex gap-2">
                {renderSocialLink(artist.youtubeUrl, <Youtube />, 'YouTube')}
                {renderSocialLink(artist.instagramUrl, <Instagram />, 'Instagram')}
                {renderSocialLink(artist.facebookUrl, <Facebook />, 'Facebook')}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>About {artist.name}</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">{artist.about}</p></CardContent>
          </Card>
        </div>
        <div className="space-y-4">
             <Card>
                <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>Category:</strong> {artist.category}</p>
                    <p><strong>Experience:</strong> {artist.experience} years</p>
                    <p><strong>Type:</strong> {artist.type}</p>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-3xl font-bold mb-6">Events by {artist.name}</h2>
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12 bg-card rounded-lg">
            This artist has no upcoming events.
          </p>
        )}
      </div>
    </div>
  );
}
