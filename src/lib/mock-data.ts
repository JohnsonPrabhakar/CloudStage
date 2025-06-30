import { type Event, type Artist } from "./types";

const artists: Artist[] = [
    { id: 'artist1', name: 'The Rockers', isPremium: true },
    { id: 'artist2', name: 'Synthwave Dreamer', isPremium: false },
    { id: 'artist3', name: 'Acoustic Soul', isPremium: true },
    { id: 'artist4', name: 'Laugh Factory', isPremium: false },
]

const events: Event[] = [
  {
    id: "evt1",
    title: "Live from the Garage",
    artist: "The Rockers",
    artistId: "artist1",
    description: "Join us for a raw, high-energy rock show live from our garage. Expect loud guitars and new songs!",
    genre: "Rock",
    language: "English",
    date: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
    status: "live",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ticketPrice: 0,
    isBoosted: true,
    youtubeUrl: "https://youtube.com",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "evt2",
    title: "Sunset Boulevard",
    artist: "Synthwave Dreamer",
    artistId: "artist2",
    description: "A chill, nostalgic journey through 80s inspired synthwave tracks. Perfect for a late-night drive.",
    genre: "Synthwave",
    language: "Instrumental",
    date: new Date(Date.now() + 86400000 * 2).toISOString(), // in 2 days
    status: "upcoming",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ticketPrice: 15.0,
    isBoosted: true,
    youtubeUrl: "https://youtube.com",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "evt3",
    title: "Acoustic Campfire Session",
    artist: "Acoustic Soul",
    artistId: "artist3",
    description: "An intimate acoustic performance of soulful original songs and beloved covers.",
    genre: "Acoustic",
    language: "English",
    date: new Date(Date.now() + 86400000 * 7).toISOString(), // in 7 days
    status: "upcoming",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ticketPrice: 10.0,
    isBoosted: false,
    youtubeUrl: "https://youtube.com",
    instagramUrl: "https://instagram.com",
  },
  {
    id: "evt4",
    title: "Comedy Night Live",
    artist: "Laugh Factory",
    artistId: "artist4",
    description: "A hilarious night of stand-up comedy featuring three of the best up-and-coming comedians.",
    genre: "Comedy",
    language: "English",
    date: new Date(Date.now() + 86400000 * 10).toISOString(), // in 10 days
    status: "upcoming",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ticketPrice: 20.0,
    isBoosted: false,
    youtubeUrl: "https://youtube.com",
    instagramUrl: "https://instagram.com",
  },
   {
    id: "evt5",
    title: "World Tour Kick-off",
    artist: "The Rockers",
    artistId: "artist1",
    description: "The official recording of our world tour kick-off show. Experience the epic night all over again.",
    genre: "Rock",
    language: "English",
    date: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    status: "past",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ticketPrice: 25.0,
    isBoosted: false,
    youtubeUrl: "https://youtube.com",
    instagramUrl: "https://instagram.com",
  },
   {
    id: "evt6",
    title: "Neon Nights EP Release",
    artist: "Synthwave Dreamer",
    artistId: "artist2",
    description: "The live-streamed release party for the 'Neon Nights' EP. Featuring a full playthrough and Q&A.",
    genre: "Synthwave",
    language: "Instrumental",
    date: new Date(Date.now() - 86400000 * 14).toISOString(), // 14 days ago
    status: "past",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ticketPrice: 5.0,
    isBoosted: false,
    youtubeUrl: "https://youtube.com",
    instagramUrl: "https://instagram.com",
  },
];

export const getEvents = (): Event[] => {
  if (typeof window !== "undefined") {
    const localEvents = localStorage.getItem("events");
    if (localEvents) {
      return JSON.parse(localEvents);
    }
  }
  return events;
};

export const getArtists = (): Artist[] => artists;
