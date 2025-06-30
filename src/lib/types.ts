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

export type ArtistCategory = 'Music' | 'Stand-up Comedy' | 'Yoga' | 'Magic' | 'Devotional';

export interface Artist {
  id: string;
  name: string;
  email: string;
  password?: string; // Should not be sent to client after auth
  phone: string;
  location: string;
  about: string;
  profilePictureUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  experience: number;
  category: ArtistCategory;
  subCategory: string;
  isPremium: boolean;
  isApproved: boolean;
  type: 'Solo Artist' | 'Band';
  genres: string[];
}

export interface LoggedInArtist {
  id: string;
  name: string;
  email: string;
}

export type PendingArtist = Omit<Artist, 'id' | 'isApproved' | 'isPremium' | 'type' | 'genres'> & { password_confirmation?: string };


export type MovieGenre = 'Action' | 'Romance' | 'Comedy' | 'Thriller' | 'Drama' | 'Sci-Fi' | 'Horror';
export type MovieLanguage = 'English' | 'Hindi' | 'Tamil' | 'Telugu';

export interface Movie {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  genre: MovieGenre;
  language: MovieLanguage;
  posterUrl: string;
}
