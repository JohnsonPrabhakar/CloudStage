
"use client";

import { useEffect, useState } from "react";
import { type Movie } from "@/lib/types";
import { getAllMovies, deleteMovie } from "@/lib/firebase-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Loader2, WifiOff, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "./ui/badge";

export default function ManageMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const allMovies = await getAllMovies();
      setMovies(allMovies);
    } catch (err) {
      console.error(err);
      setError("Could not load movies. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleDelete = async (movieToDelete: Movie) => {
    setDeletingId(movieToDelete.id);
    try {
      await deleteMovie(movieToDelete);
      setMovies(prevMovies => prevMovies.filter(m => m.id !== movieToDelete.id));
      toast({
        title: "Movie Deleted",
        description: `"${movieToDelete.title}" has been removed.`,
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the movie. Please try again.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <p>Loading movies...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-24 text-muted-foreground bg-card/50 rounded-lg">
          <WifiOff className="mx-auto h-16 w-16 text-destructive mb-4" />
          <p className="text-xl font-semibold text-foreground">Connection Error</p>
          <p className="mb-4">{error}</p>
          <Button onClick={fetchMovies}>Try Again</Button>
        </div>
      );
    }

    if (movies.length === 0) {
      return (
        <div className="text-center py-24 text-muted-foreground bg-card/50 rounded-lg">
          <p className="text-xl">No movies found.</p>
          <p>Start by uploading a movie to see it here.</p>
           <Button asChild className="mt-4">
              <Link href="/movies/upload">
                  <PlusCircle className="mr-2 h-4 w-4" /> Upload Movie
              </Link>
          </Button>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Poster</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Language</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movies.map((movie) => (
            <TableRow key={movie.id}>
              <TableCell>
                <Image
                  src={movie.posterUrl}
                  alt={movie.title}
                  width={50}
                  height={75}
                  className="rounded-md object-cover"
                  data-ai-hint="movie poster"
                />
              </TableCell>
              <TableCell className="font-medium">{movie.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">{movie.genre}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{movie.language}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/movies/edit/${movie.id}`}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingId === movie.id}
                      >
                         {deletingId === movie.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the movie
                          "{movie.title}" and remove its data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(movie)}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
            <CardTitle>Manage Movies</CardTitle>
            <CardDescription>Edit or delete existing movies in the library.</CardDescription>
        </div>
         <Button asChild>
            <Link href="/movies/upload">
                <PlusCircle className="mr-2 h-4 w-4" /> Upload New Movie
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
