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
  artistId: string; // This will be the Firebase Auth UID
  description: string;
  category: EventCategory;
  genre: string;
  language: string;
  date: string;
  createdAt?: any;
  status: "live" | "upcoming" | "past";
  moderationStatus: "pending" | "approved" | "rejected";
  bannerUrl: string;
  streamUrl: string;
  ticketPrice: number;
  isBoosted: boolean;
  boostAmount?: number;
  views?: number;
  watchTime?: number;
  ticketsSold?: number;
}

export type ArtistCategory = 'Music' | 'Stand-up Comedy' | 'Yoga' | 'Magic' | 'Devotional';

export interface Artist {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
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
