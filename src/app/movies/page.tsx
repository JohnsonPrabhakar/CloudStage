import { getMovies } from "@/lib/mock-movies";
import { MoviesClient } from "@/components/MoviesClient";

export default function MoviesPage() {
  const initialMovies = getMovies();

  return <MoviesClient initialMovies={initialMovies} />;
}
