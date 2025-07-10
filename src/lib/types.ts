


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
  date: string; // Start time in ISO format
  duration: number; // in minutes
  endTime: string; // End time in ISO format
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
  eventCode: string;
  eventCategory?: 'verified' | 'premium';
}

export type ArtistCategory = 'Music' | 'Stand-up Comedy' | 'Yoga' | 'Magic' | 'Devotional';

export interface VerificationRequestData {
    youtubeLinks: string[];
    instagramLinks: string[];
    sampleVideoUrl?: string;
    messageToAdmin: string;
    submittedAt: any;
    status: 'pending' | 'approved' | 'rejected';
    reviewedByAdmin: string | null;
    reviewedAt: any | null;
}

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
  accessLevel: 'basic' | 'verified';
  verificationRequest?: VerificationRequestData;
  premiumPaymentId?: string;
  fcmToken?: string;
}

export type MovieGenre = string;
export type MovieLanguage = string;

export interface Movie {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  genre: MovieGenre;
  language: MovieLanguage;
  posterUrl: string;
  createdAt?: any;
}

export interface Ticket {
  id: string;
  userId: string;
  eventId: string;
  createdAt: any;
  isPaid: boolean;
  paymentId: string | null;
  pricePaid: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  testMode: boolean;
  paymentStatus?: string;
  bookingStatus?: 'confirmed' | 'pending' | 'failed';
}

export interface ChatMessage {
  id: string;
  name: string;
  message: string;
  createdAt: any;
}

export interface EventFeedback {
    id:string;
    userId: string;
    artistId: string;
    eventId: string;
    rating: number; // 1 to 5
    review: string;
    submittedAt: any;
}

export interface AppUser {
  id: string; // Firebase Auth UID
  phoneNumber: string;
  createdAt: any;
  fcmToken?: string;
}
