"use client";

import { useState, useMemo, useEffect } from "react";
import { type Movie } from "@/lib/types";
import { MovieCard } from "./MovieCard";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Film } from "lucide-react";
import { getAllMovies } from "@/lib/firebase-service";
import { Skeleton } from "./ui/skeleton";

const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];
const languages = ['English', 'Hindi', 'Tamil', 'Telugu'];

export function MoviesClient() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | "all">("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string | "all">("all");

  useEffect(() => {
    const fetchMovies = async () => {
        setLoading(true);
        const allMovies = await getAllMovies();
        setMovies(allMovies);
        setLoading(false);
    }
    fetchMovies();
  }, []);

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesGenre = selectedGenre === 'all' || movie.genre === selectedGenre;
        const matchesLanguage = selectedLanguage === 'all' || movie.language === selectedLanguage;
        return matchesSearch && matchesGenre && matchesLanguage;
    });
  }, [movies, searchQuery, selectedGenre, selectedLanguage]);

  const renderMovieGrid = () => {
    if (loading) {
       return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3">
                        <Skeleton className="h-[250px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-[200px]" />
                            <Skeleton className="h-4 w-[150px]" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (filteredMovies.length > 0) {
      return (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
            ))}
         </div>
      );
    }

    return (
        <div className="text-center py-24 text-muted-foreground bg-card/50 rounded-lg">
          <p className="text-xl">No movies found.</p>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight flex items-center justify-center gap-4">
          <Film className="h-10 w-10 text-primary" />
          Browse Movies
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore our collection of movies. Filter by genre and language to find your next favorite film.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 bg-card rounded-lg border">
         <Input
            placeholder="Search by movie title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="md:col-span-1"
        />
        <Select onValueChange={(value) => setSelectedGenre(value as any)} defaultValue="all">
            <SelectTrigger>
                <SelectValue placeholder="Filter by Genre" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select onValueChange={(value) => setSelectedLanguage(value as any)} defaultValue="all">
            <SelectTrigger>
                <SelectValue placeholder="Filter by Language" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>
      
      {renderMovieGrid()}
    </div>
  );
}
