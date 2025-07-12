
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Movie } from "@/lib/types";
import { getMovieById, getYouTubeEmbedUrl } from "@/lib/firebase-service";
import { useToast } from "@/hooks/use-toast";
import {
  Share2,
  Copy,
  ChevronLeft,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

export default function MovieWatchPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<{ id: number; icon: string; left: string }[]>([]);

  const fetchMovie = async () => {
    if (params.id) {
        setLoading(true);
        setError(null);
        try {
            const foundMovie = await getMovieById(params.id as string);
            setMovie(foundMovie || null);
        } catch (err) {
            console.error(err);
            setError("Could not load movie details. Please check your internet connection and try again.");
        } finally {
            setLoading(false);
        }
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchMovie();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    const reactionIcons = ['❤️', '🔥', '👏', '🎉', '🤩'];
    const interval = setInterval(() => {
        addReaction(reactionIcons[Math.floor(Math.random() * reactionIcons.length)]);
    }, 10000); // every 10 seconds
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (error) {
    return (
        <div className="container mx-auto p-8 text-center">
            <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Connection Error</h1>
            <p className="text-muted-foreground mt-2 mb-6">{error}</p>
            <Button onClick={fetchMovie}>
                Try Again
            </Button>
        </div>
    )
  }

  if (!movie) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold">Movie Not Found</h1>
        <p className="text-muted-foreground mt-4">
          The movie you are looking for does not exist.
        </p>
        <Button onClick={() => router.push("/movies")} className="mt-8">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Movies
        </Button>
      </div>
    );
  }
  
  const renderVideoPlayer = () => {
    const embedUrl = getYouTubeEmbedUrl(movie.videoUrl);
    
    if (embedUrl) {
        return (
          <iframe
            width="100%"
            height="100%"
            src={`${embedUrl}?autoplay=1`}
            title={movie.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          ></iframe>
        );
    }

    // Check for other valid, non-YouTube video URLs
    if (movie.videoUrl && movie.videoUrl.startsWith('http')) {
      return (
        <video
            src={movie.videoUrl}
            width="100%"
            height="100%"
            controls
            autoPlay
            className="w-full h-full object-contain"
        >
            Your browser does not support the video tag.
        </video>
      );
    }
    
    // Fallback if URL is invalid or missing
    return (
        <div className="w-full h-full flex items-center justify-center bg-black text-destructive-foreground p-4 text-center">
             <p>Video is unavailable.<br/>The provided link is either invalid or missing.</p>
        </div>
    )
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
        {renderVideoPlayer()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <div className="md:col-span-2 space-y-6">
            <h1 className="text-4xl font-extrabold">{movie.title}</h1>
            <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline" className="capitalize">{movie.language}</Badge>
                <Badge variant="secondary" className="capitalize">{movie.genre}</Badge>
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
