import { MoviesClient } from "@/components/MoviesClient";

export const dynamic = 'force-dynamic';

export default function MoviesPage() {
  // Data is now fetched on the client side in MoviesClient
  return <MoviesClient />;
}
