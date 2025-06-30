import Image from "next/image";
import Link from "next/link";
import { type Movie } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

type MovieCardProps = {
  movie: Movie;
};

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full transition-all hover:shadow-xl hover:-translate-y-1">
      <Link href={`/movies/${movie.id}`} className="block group">
        <div className="relative h-64 w-full">
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="movie poster"
          />
        </div>
      </Link>
      <CardHeader className="flex-grow">
        <Link href={`/movies/${movie.id}`} className="block">
          <CardTitle className="text-xl hover:text-primary transition-colors">
            {movie.title}
          </CardTitle>
        </Link>
        <div className="flex gap-2 pt-2">
            <Badge variant="outline">{movie.language}</Badge>
            <Badge variant="secondary">{movie.genre}</Badge>
        </div>
      </CardHeader>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/movies/${movie.id}`}>
            <Play className="mr-2 h-4 w-4" />
            Watch Now
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
