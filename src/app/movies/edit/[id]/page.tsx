
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getMovieById } from "@/lib/firebase-service";
import { type Movie } from "@/lib/types";
import { MovieForm } from "@/components/MovieForm";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function EditMoviePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === 'admin@cloudstage.in') {
        setIsAuthenticated(true);
      } else {
        toast({ variant: 'destructive', title: 'Access Denied' });
        router.push("/admin");
      }
    });
    return () => unsubscribe();
  }, [router, toast]);

  useEffect(() => {
    const movieId = params.id as string;
    if (movieId && isAuthenticated) {
      const fetchMovie = async () => {
        try {
          const fetchedMovie = await getMovieById(movieId);
          if (fetchedMovie) {
            setMovie(fetchedMovie);
          } else {
            toast({ variant: 'destructive', title: 'Movie not found' });
            router.push('/admin/dashboard');
          }
        } catch (error) {
          console.error(error);
          toast({ variant: 'destructive', title: 'Failed to load movie' });
        } finally {
          setLoading(false);
        }
      };
      fetchMovie();
    }
  }, [params.id, isAuthenticated, router, toast]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>Loading movie data...</p>
      </div>
    );
  }

  return movie ? (
    <MovieForm mode="edit" initialData={movie} />
  ) : (
    <div className="flex h-screen items-center justify-center">
      <p>Movie could not be loaded.</p>
    </div>
  );
}
