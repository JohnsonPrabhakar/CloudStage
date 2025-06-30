import { type Event, type Artist } from "./types";

const initializeLocalStorage = () => {
  if (typeof window !== "undefined") {
    // Artist and Event data are now managed by Firebase.
    // We only keep client-side specific data like 'myTickets'.
    if (!localStorage.getItem("myTickets")) {
      localStorage.setItem("myTickets", JSON.stringify([]));
    }
  }
};

initializeLocalStorage();

// General Parsed Getters
const getParsedItem = <T>(key: string, defaultValue: T): T => {
    if (typeof window !== "undefined") {
        const item = localStorage.getItem(key);
        if (item) {
            try {
                return JSON.parse(item);
            } catch (e) {
                console.error(`Failed to parse ${key} from localStorage`, e);
                localStorage.setItem(key, JSON.stringify(defaultValue));
                return defaultValue;
            }
        }
        localStorage.setItem(key, JSON.stringify(defaultValue));
    }
    return defaultValue;
}


// TICKET-related functions
export const getMyTickets = (): string[] => getParsedItem<string[]>("myTickets", []);

export const addTicket = (eventId: string) => {
  if (typeof window !== 'undefined') {
    const myTickets = getMyTickets();
    if (!myTickets.includes(eventId)) {
      myTickets.push(eventId);
      localStorage.setItem('myTickets', JSON.stringify(myTickets));
    }
  }
};


// Legacy functions for mock-data based artist fetching (used in non-auth pages like event details)
// In a full-stack app, this would be replaced with a public API endpoint.
const artists: Artist[] = [
    {
        id: 'artist1',
        name: 'The Rockers',
        email: 'rockers@test.com',
        isPremium: false,
        type: 'Band',
        genres: ['Rock', 'Hard Rock'],
        youtubeUrl: 'https://youtube.com',
        instagramUrl: 'https://instagram.com',
        facebookUrl: 'https://facebook.com',
        isApproved: true,
        phone: '1234567890',
        location: 'Mumbai, India',
        about: 'Just a band trying to make it.',
        profilePictureUrl: 'https://placehold.co/128x128.png',
        experience: 5,
        category: 'Music',
        subCategory: 'Rock',
    },
];
export const getArtistById = (id: string): Artist | undefined => artists.find(a => a.id === id);
