import { type Event, type Artist, type PendingArtist, type LoggedInArtist } from "./types";

const artists: Artist[] = [
    {
        id: 'artist1',
        name: 'The Rockers',
        email: 'rockers@test.com',
        password: 'password123',
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

const initializeLocalStorage = () => {
  if (typeof window !== "undefined") {
    // Events are no longer stored in localStorage
    if (!localStorage.getItem("artists")) {
      localStorage.setItem("artists", JSON.stringify(artists));
    }
    if (!localStorage.getItem("myTickets")) {
      localStorage.setItem("myTickets", JSON.stringify([]));
    }
    if (!localStorage.getItem("pendingArtists")) {
      localStorage.setItem("pendingArtists", JSON.stringify([]));
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

// ARTIST-related functions
export const getArtists = (): Artist[] => getParsedItem<Artist[]>("artists", artists);
export const getArtistById = (id: string): Artist | undefined => getArtists().find(a => a.id === id);


// PENDING ARTIST-related functions
export const getPendingArtists = (): PendingArtist[] => getParsedItem<PendingArtist[]>("pendingArtists", []);

export const addPendingArtist = (artist: PendingArtist) => {
  if (typeof window !== 'undefined') {
    const pending = getPendingArtists();
    pending.push(artist);
    localStorage.setItem("pendingArtists", JSON.stringify(pending));
    localStorage.setItem("pendingArtistNotifications", "true");
  }
}

export const approveArtist = (artistEmail: string) => {
  if (typeof window !== 'undefined') {
    const pending = getPendingArtists();
    const approvedArtistData = pending.find(a => a.email === artistEmail);
    if (!approvedArtistData) return;

    const newArtist: Artist = {
      ...approvedArtistData,
      id: `artist-${Date.now()}`,
      isApproved: true,
      isPremium: false,
      type: 'Solo Artist', // Default value
      genres: [approvedArtistData.subCategory]
    };

    const allArtists = getArtists();
    allArtists.push(newArtist);
    localStorage.setItem("artists", JSON.stringify(allArtists));

    const updatedPending = pending.filter(a => a.email !== artistEmail);
    localStorage.setItem("pendingArtists", JSON.stringify(updatedPending));
  }
}

export const rejectArtist = (artistEmail: string) => {
    if (typeof window !== 'undefined') {
        const pending = getPendingArtists();
        const updatedPending = pending.filter(a => a.email !== artistEmail);
        localStorage.setItem("pendingArtists", JSON.stringify(updatedPending));
    }
}


// AUTH-related functions
export const getLoggedInArtist = (): LoggedInArtist | null => getParsedItem<LoggedInArtist | null>("loggedInArtist", null);

export const setLoggedInArtist = (artist: LoggedInArtist) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem("loggedInArtist", JSON.stringify(artist));
    }
}

export const clearLoggedInArtist = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem("loggedInArtist");
    }
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
