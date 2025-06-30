import { type Event, type Artist } from "./types";

const artists: Artist[] = [
    { id: 'artist1', name: 'The Rockers', isPremium: false, type: 'Band', genres: ['Rock', 'Hard Rock'], youtubeUrl: 'https://youtube.com', instagramUrl: 'https://instagram.com' },
    { id: 'artist2', name: 'Synthwave Dreamer', isPremium: false, type: 'Solo Artist', genres: ['Synthwave', 'Electronic'], youtubeUrl: 'https://youtube.com', instagramUrl: 'https://instagram.com' },
    { id: 'artist3', name: 'Acoustic Soul', isPremium: true, type: 'Solo Artist', genres: ['Acoustic', 'Folk', 'Soul'], youtubeUrl: 'https://youtube.com', instagramUrl: 'https://instagram.com' },
    { id: 'artist4', name: 'Laugh Factory', isPremium: false, type: 'Band', genres: ['Comedy'], youtubeUrl: 'https://youtube.com', instagramUrl: 'https://instagram.com' },
];

const events: Event[] = [
  {
    id: "evt1",
    title: "Live from the Garage",
    artist: "The Rockers",
    artistId: "artist1",
    description: "Join us for a raw, high-energy rock show live from our garage. Expect loud guitars and new songs!",
    category: "Music",
    genre: "Rock",
    language: "English",
    date: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
    status: "live",
    moderationStatus: "approved",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ticketPrice: 0,
    isBoosted: true,
    boostAmount: 2000,
    views: 12532,
    watchTime: 45 * 12532,
    ticketsSold: 0,
  },
  {
    id: "evt2",
    title: "Sunset Boulevard",
    artist: "Synthwave Dreamer",
    artistId: "artist2",
    description: "A chill, nostalgic journey through 80s inspired synthwave tracks. Perfect for a late-night drive.",
    category: "Music",
    genre: "Synthwave",
    language: "Instrumental",
    date: new Date(Date.now() + 86400000 * 2).toISOString(), // in 2 days
    status: "upcoming",
    moderationStatus: "approved",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ticketPrice: 15.0,
    isBoosted: true,
    boostAmount: 1000,
    views: 0,
    watchTime: 0,
    ticketsSold: 834,
  },
  {
    id: "evt3",
    title: "Acoustic Campfire Session",
    artist: "Acoustic Soul",
    artistId: "artist3",
    description: "An intimate acoustic performance of soulful original songs and beloved covers.",
    category: "Music",
    genre: "Acoustic",
    language: "English",
    date: new Date(Date.now() + 86400000 * 7).toISOString(), // in 7 days
    status: "upcoming",
    moderationStatus: "approved",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ticketPrice: 10.0,
    isBoosted: false,
    views: 0,
    watchTime: 0,
    ticketsSold: 451,
  },
  {
    id: "evt4",
    title: "Comedy Night Live",
    artist: "Laugh Factory",
    artistId: "artist4",
    description: "A hilarious night of stand-up comedy featuring three of the best up-and-coming comedians.",
    category: "Stand-up Comedy",
    genre: "Comedy",
    language: "English",
    date: new Date(Date.now() + 86400000 * 10).toISOString(), // in 10 days
    status: "upcoming",
    moderationStatus: "pending",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ticketPrice: 20.0,
    isBoosted: false,
    views: 0,
    watchTime: 0,
    ticketsSold: 120,
  },
   {
    id: "evt5",
    title: "World Tour Kick-off",
    artist: "The Rockers",
    artistId: "artist1",
    description: "The official recording of our world tour kick-off show. Experience the epic night all over again.",
    category: "Music",
    genre: "Rock",
    language: "English",
    date: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
    status: "past",
    moderationStatus: "approved",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ticketPrice: 25.0,
    isBoosted: false,
    views: 50000,
    watchTime: 90 * 50000,
    ticketsSold: 25000,
  },
   {
    id: "evt6",
    title: "Neon Nights EP Release",
    artist: "Synthwave Dreamer",
    artistId: "artist2",
    description: "The live-streamed release party for the 'Neon Nights' EP. Featuring a full playthrough and Q&A.",
    category: "Music",
    genre: "Synthwave",
    language: "Instrumental",
    date: new Date(Date.now() - 86400000 * 14).toISOString(), // 14 days ago
    status: "past",
    moderationStatus: "rejected",
    bannerUrl: "https://placehold.co/1280x720.png",
    streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ticketPrice: 5.0,
    isBoosted: false,
    views: 15000,
    watchTime: 60 * 15000,
    ticketsSold: 7500,
  },
];

const initializeLocalStorage = () => {
  if (typeof window !== "undefined") {
    if (!localStorage.getItem("events")) {
      localStorage.setItem("events", JSON.stringify(events));
    }
    if (!localStorage.getItem("artists")) {
      localStorage.setItem("artists", JSON.stringify(artists));
    }
     if (!localStorage.getItem("myTickets")) {
      localStorage.setItem("myTickets", JSON.stringify([]));
    }
  }
};

initializeLocalStorage();

export const getEvents = (): Event[] => {
  if (typeof window !== "undefined") {
    const localEvents = localStorage.getItem("events");
    if (localEvents) {
      try {
        return JSON.parse(localEvents);
      } catch (e) {
        console.error("Failed to parse events from localStorage", e);
        // If parsing fails, fallback to default
        localStorage.setItem("events", JSON.stringify(events));
        return events;
      }
    }
    localStorage.setItem("events", JSON.stringify(events));
  }
  return events;
};

export const getArtists = (): Artist[] => {
  if (typeof window !== "undefined") {
    const localArtists = localStorage.getItem("artists");
    if (localArtists) {
      try {
        return JSON.parse(localArtists);
      } catch (e) {
        console.error("Failed to parse artists from localStorage", e);
        // If parsing fails, fallback to default
        localStorage.setItem("artists", JSON.stringify(artists));
        return artists;
      }
    }
    localStorage.setItem("artists", JSON.stringify(artists));
  }
  return artists;
};


export const getMyTickets = (): string[] => {
  if (typeof window !== 'undefined') {
    const myTickets = localStorage.getItem('myTickets');
    if (myTickets) {
      try {
        return JSON.parse(myTickets);
      } catch (e) {
        console.error('Failed to parse myTickets from localStorage', e);
        localStorage.setItem('myTickets', JSON.stringify([]));
        return [];
      }
    }
  }
  return [];
};

export const addTicket = (eventId: string) => {
  if (typeof window !== 'undefined') {
    const myTickets = getMyTickets();
    if (!myTickets.includes(eventId)) {
      myTickets.push(eventId);
      localStorage.setItem('myTickets', JSON.stringify(myTickets));
    }
  }
};
