
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { type Event, type Artist } from "@/lib/types";
import { getArtistProfile, getPublicArtistEventsListener, isUserFollowing, followArtist, unfollowArtist, getFollowersCountListener } from "@/lib/firebase-service";
import { EventCard } from "@/components/EventCard";
import {
  Youtube,
  Instagram,
  ChevronLeft,
  Crown,
  User,
  Music,
  Heart,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";


export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [artistEvents, setArtistEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const artistId = params.id as string;
    if (!artistId) {
      setLoading(false);
      setError("No artist ID provided.");
      return;
    }

    let eventsUnsubscribe: (() => void) | undefined;
    let followersUnsubscribe: (() => void) | undefined;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const foundArtist = await getArtistProfile(artistId);
        setArtist(foundArtist || null);

        if (foundArtist) {
          // Set up listeners
          eventsUnsubscribe = getPublicArtistEventsListener(artistId, (events) => {
            const pastEvents = events.filter(
              (e) => new Date(e.date) < new Date()
            );
            setArtistEvents(pastEvents);
          });
          followersUnsubscribe = getFollowersCountListener(artistId, setFollowersCount);
          setLoading(false);
        } else {
            setArtist(null);
            setLoading(false);
        }
      } catch (err) {
        console.error("Failed to fetch artist profile data:", err);
        setError("Could not load artist details. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (eventsUnsubscribe) eventsUnsubscribe();
      if (followersUnsubscribe) followersUnsubscribe();
    };
  }, [params.id]);
  
  useEffect(() => {
    const checkFollowStatus = async () => {
        if(currentUser && artist) {
            setFollowLoading(true);
            const following = await isUserFollowing(currentUser.uid, artist.id);
            setIsFollowing(following);
            setFollowLoading(false);
        }
    }
    checkFollowStatus();
  }, [currentUser, artist]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
        toast({ title: "Login Required", description: "Please log in to follow artists." });
        router.push('/artist/login');
        return;
    }
    if (followLoading || !artist) return;

    setFollowLoading(true);
    try {
        if (isFollowing) {
            await unfollowArtist(currentUser.uid, artist.id);
            setIsFollowing(false);
        } else {
            await followArtist(currentUser.uid, artist.id);
            setIsFollowing(true);
        }
    } catch (error) {
        console.error("Failed to toggle follow state", error);
        toast({ variant: 'destructive', title: 'Something went wrong', description: 'Could not update your follow status.' });
    } finally {
        setFollowLoading(false);
    }
  };


  if (loading) {
    return (
       <div className="container mx-auto p-4 md:p-8 space-y-8 animate-pulse">
          <Skeleton className="h-8 w-24 mb-8" />
          <Card>
              <CardContent className="p-6 flex flex-col md:flex-row items-start gap-8">
                  <Skeleton className="h-32 w-32 rounded-full" />
                  <div className="space-y-4 flex-grow">
                      <Skeleton className="h-10 w-1/2" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-8 w-1/4" />
                  </div>
              </CardContent>
          </Card>
           <div>
            <Skeleton className="h-8 w-1/4 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
           </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold">{error ? "An Error Occurred" : "Artist Not Found"}</h1>
        <p className="text-muted-foreground mt-2">{error || "The requested artist could not be found."}</p>
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
              src={artist.profilePictureUrl || `https://placehold.co/128x128.png`}
              alt={artist.name}
              fill
              className="object-cover"
              data-ai-hint="artist portrait"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold">{artist.name}</h1>
              {artist.accessLevel === 'verified' && <VerifiedBadge />}
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
               <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>{followersCount} Followers</span>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <Button onClick={handleFollowToggle} disabled={followLoading}>
                <Heart className={`mr-2 h-4 w-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`}/>
                {followLoading ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}
              </Button>
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
