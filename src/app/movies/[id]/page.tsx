"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Movie } from "@/lib/types";
import { getMovieById } from "@/lib/firebase-service";
import { useToast } from "@/hooks/use-toast";
import {
  Share2,
  Copy,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function MovieWatchPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState<{ id: number; icon: string; left: string }[]>([]);

  useEffect(() => {
    const fetchMovie = async () => {
        if (params.id) {
            setLoading(true);
            const foundMovie = await getMovieById(params.id as string);
            setMovie(foundMovie || null);
        }
        setLoading(false);
    }
    fetchMovie();
  }, [params.id]);

  useEffect(() => {
    const reactionIcons = ['❤️', '🔥', '👏', '🎉', '🤩'];
    const interval = setInterval(() => {
        addReaction(reactionIcons[Math.floor(Math.random() * reactionIcons.length)]);
    }, 10000); // every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const addReaction = (icon: string) => {
    setReactions(prev => [
      ...prev,
      { id: Date.now(), icon, left: `${Math.random() * 90}%` }
    ]);
  };

  const handleManualReaction = () => {
    addReaction('❤️');
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Movie link copied to your clipboard.",
    });
  };

  const handleShare = async () => {
    if (!movie) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: movie.title,
          text: `Check out this movie: ${movie.title}`,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopyLink();
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
        <div className="container mx-auto p-4 md:p-8 animate-pulse">
            <div className="w-24 h-8 bg-muted rounded mb-4"></div>
            <div className="aspect-video w-full bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                </div>
                 <div className="space-y-6">
                    <Skeleton className="h-60 w-full" />
                 </div>
            </div>
        </div>
     );
  }

  if (!movie || !isValidStreamUrl(movie.youtubeUrl)) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold">Video Unavailable</h1>
        <p className="text-muted-foreground mt-4">
          This movie may not exist or the video link is invalid.
        </p>
        <Button onClick={() => router.push("/movies")} className="mt-8">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Movies
        </Button>
      </div>
    );
  }

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

      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl relative">
        {reactions.map(r => (
            <div key={r.id} className="reaction-animation" style={{ left: r.left }}>{r.icon}</div>
        ))}
        <iframe
            width="100%"
            height="100%"
            src={`${movie.youtubeUrl}?autoplay=1`}
            title={movie.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
        ></iframe>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2 space-y-6">
            <h1 className="text-4xl font-extrabold">{movie.title}</h1>
            <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline">{movie.language}</Badge>
                <Badge variant="secondary">{movie.genre}</Badge>
            </div>
             <div>
                <h2 className="text-2xl font-bold border-b pb-2 mb-4">
                Description
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                {movie.description}
                </p>
            </div>
             <div className="flex gap-2">
                <Button variant="outline" onClick={handleManualReaction}>React ❤️</Button>
                <Button variant="outline" onClick={handleCopyLink}>
                    <Copy className="mr-2 h-4 w-4" /> Copy Link
                </Button>
                <Button onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" /> Share Movie
                </Button>
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
        </div>
      </div>
    </div>
  );
}
