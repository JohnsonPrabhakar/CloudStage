export interface Event {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  description: string;
  genre: string;
  language: string;
  date: string;
  status: "live" | "upcoming" | "past";
  bannerUrl: string;
  streamUrl: string;
  ticketPrice: number;
  isBoosted: boolean;
  youtubeUrl: string;
  instagramUrl: string;
}

export interface Artist {
  id: string;
  name: string;
  isPremium: boolean;
}
