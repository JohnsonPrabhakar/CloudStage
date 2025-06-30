export type EventCategory = 
  | 'Music'
  | 'Devotional / Bhajan / Satsang'
  | 'Magic Show'
  | 'Meditation / Yoga'
  | 'Stand-up Comedy'
  | 'Workshop'
  | 'Talk';

export interface Event {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  description: string;
  category: EventCategory;
  genre: string; // e.g., Rock, Pop. More specific than category.
  language: string;
  date: string;
  status: "live" | "upcoming" | "past"; // computed based on date
  moderationStatus: "pending" | "approved" | "rejected";
  bannerUrl: string;
  streamUrl: string;
  ticketPrice: number;
  isBoosted: boolean;
  boostAmount?: number;
  // Performance metrics
  views?: number;
  watchTime?: number; // in minutes
  ticketsSold?: number;
}

export interface Artist {
  id: string;
  name: string;
  isPremium: boolean;
  type: 'Solo Artist' | 'Band';
  genres: string[];
  youtubeUrl: string;
  instagramUrl: string;
}
