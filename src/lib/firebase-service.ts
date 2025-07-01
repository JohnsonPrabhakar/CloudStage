import { db, auth, storage } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp,
  setDoc,
  deleteDoc,
  limit,
  orderBy,
} from 'firebase/firestore';
import { type Event, type Artist, type Ticket, type Movie } from './types';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const eventsCollection = collection(db, 'events');
const artistsCollection = collection(db, 'artists');
const ticketsCollection = collection(db, 'tickets');
const moviesCollection = collection(db, 'movies');

// Helper to convert Firestore doc to a given type
const fromFirestore = <T extends { id: string }>(doc: any): T => {
  const data = doc.data();
  // Convert any Firestore Timestamps to ISO strings for client-side consistency
  const convertTimestamps = (data: any): any => {
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;

    if (data instanceof Timestamp) {
      return data.toDate().toISOString();
    }
    
    if (Array.isArray(data)) {
        return data.map(item => convertTimestamps(item));
    }

    const convertedData: { [key: string]: any } = {};
    for (const key in data) {
      convertedData[key] = convertTimestamps(data[key]);
    }
    return convertedData;
  }
  
  return {
    id: doc.id,
    ...convertTimestamps(data),
  } as T;
};


// EVENT-RELATED FUNCTIONS

export const addEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'moderationStatus'>) => {
  try {
    await addDoc(eventsCollection, {
      ...eventData,
      moderationStatus: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding event to Firestore: ", error);
    throw new Error("Could not create event.");
  }
};

export const getApprovedEvents = async (): Promise<Event[]> => {
  const q = query(eventsCollection, where('moderationStatus', '==', 'approved'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromFirestore<Event>(doc));
};

export const getPendingEvents = async (): Promise<Event[]> => {
  const q = query(eventsCollection, where('moderationStatus', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromFirestore<Event>(doc));
};

export const getBoostedEvents = async (): Promise<Event[]> => {
    const q = query(eventsCollection, where('isBoosted', '==', true), where('moderationStatus', '==', 'approved'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore<Event>(doc));
}

export const getEventById = async (id: string): Promise<Event | null> => {
  const eventDoc = doc(db, 'events', id);
  const snapshot = await getDoc(eventDoc);
  if (snapshot.exists()) {
    return fromFirestore<Event>(snapshot);
  }
  return null;
};

export const getArtistEvents = async (artistId: string): Promise<Event[]> => {
  // This function has been simplified to use a single, more reliable query.
  // This avoids complex queries that can be rejected by Firestore security rules.
  const q = query(eventsCollection, where('artistId', '==', artistId));
  const snapshot = await getDocs(q);
  
  const events = snapshot.docs.map(doc => fromFirestore<Event>(doc));

  // Sort all combined events by date on the client-side
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return events;
};

export const updateEventStatus = async (id: string, status: 'approved' | 'rejected') => {
  const eventDoc = doc(db, 'events', id);
  await updateDoc(eventDoc, {
    moderationStatus: status,
  });
};

export const toggleEventBoost = async (id: string, isBoosted: boolean, amount: number) => {
  const eventDoc = doc(db, 'events', id);
  await updateDoc(eventDoc, {
    isBoosted: isBoosted,
    boostAmount: amount
  });
};


// ARTIST-RELATED FUNCTIONS

export const registerArtist = async (data: Omit<Artist, 'id' | 'isApproved' | 'isPremium' | 'type' | 'genres' | 'profilePictureUrl'> & {password: string}) => {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    // 2. Use a placeholder for the profile picture URL
    const profilePictureUrl = `https://placehold.co/128x128.png?text=${data.name.charAt(0)}`;

    // 3. Create artist profile in Firestore
    const artistProfile: Omit<Artist, 'id'> = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        about: data.about,
        profilePictureUrl: profilePictureUrl,
        youtubeUrl: data.youtubeUrl || "",
        instagramUrl: data.instagramUrl || "",
        facebookUrl: data.facebookUrl || "",
        experience: data.experience,
        category: data.category,
        subCategory: data.subCategory,
        isPremium: false,
        isApproved: false,
        type: 'Solo Artist', // Default value
        genres: [data.subCategory], // Default value
    };

    await setDoc(doc(db, "artists", user.uid), artistProfile);
}

export const getArtistProfile = async (uid: string): Promise<Artist | null> => {
    const artistDoc = doc(db, 'artists', uid);
    const snapshot = await getDoc(artistDoc);
    if (snapshot.exists()) {
        return fromFirestore<Artist>(snapshot);
    }
    return null;
}

export const getPendingArtists = async(): Promise<Artist[]> => {
    const q = query(artistsCollection, where('isApproved', '==', false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore<Artist>(doc));
}

export const approveArtist = async (uid: string) => {
    const artistDoc = doc(db, 'artists', uid);
    await updateDoc(artistDoc, {
        isApproved: true,
    });
}

export const rejectArtist = async (uid: string) => {
    const artistDoc = doc(db, 'artists', uid);
    await deleteDoc(artistDoc);
}

export const updateArtistToPremium = async(uid: string) => {
    const artistDoc = doc(db, 'artists', uid);
    await updateDoc(artistDoc, {
        isPremium: true,
    });
}

// TICKET-RELATED FUNCTIONS

export const checkForExistingTicket = async (userId: string, eventId: string): Promise<boolean> => {
  const q = query(
    ticketsCollection,
    where('userId', '==', userId),
    where('eventId', '==', eventId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const createTicket = async (userId: string, eventId: string): Promise<{ success: boolean; message: string }> => {
  const alreadyExists = await checkForExistingTicket(userId, eventId);
  if (alreadyExists) {
    return { success: false, message: 'You already have a ticket for this event.' };
  }

  try {
    await addDoc(ticketsCollection, {
      userId,
      eventId,
      createdAt: serverTimestamp(),
      isPaid: false,
      paymentId: null,
    });
    return { success: true, message: 'Ticket successfully acquired!' };
  } catch (error) {
    console.error("Error creating ticket in Firestore: ", error);
    return { success: false, message: 'Could not acquire ticket. Please try again.' };
  }
};

export const getUserTickets = async (userId: string): Promise<Ticket[]> => {
  const q = query(ticketsCollection, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => fromFirestore<Ticket>(doc));
};

// MOVIE-RELATED FUNCTIONS
export const addMovie = async (
  movieData: Omit<Movie, 'id' | 'posterUrl' | 'videoUrl' | 'createdAt'>, 
  uploadDetails: { youtubeUrl: string; }
): Promise<void> => {
  let posterUrl = '';
  let videoUrl = '';
  const { youtubeUrl } = uploadDetails;

  if (youtubeUrl) {
    videoUrl = youtubeUrl;
    const videoId = youtubeUrl.split('embed/')[1]?.split('?')[0] || youtubeUrl.split('live/')[1]?.split('?')[0];
    posterUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : `https://placehold.co/400x600.png?text=${encodeURIComponent(movieData.title)}`;
  } else {
    throw new Error("Invalid upload details. YouTube URL is required.");
  }

  await addDoc(moviesCollection, {
    ...movieData,
    genre: movieData.genre.toLowerCase(),
    language: movieData.language.toLowerCase(),
    videoUrl,
    posterUrl,
    createdAt: serverTimestamp(),
  });
};

export const updateMovie = async (
    movieId: string,
    movieData: Omit<Movie, 'id' | 'posterUrl' | 'videoUrl' | 'createdAt'>,
    uploadDetails: {
        youtubeUrl: string;
    }
): Promise<void> => {
    let { posterUrl, videoUrl } = await getDoc(doc(db, "movies", movieId)).then(d => d.data() as Movie);
    const { youtubeUrl } = uploadDetails;

    // Video URL must be a youtube URL
    videoUrl = youtubeUrl;
    const videoId = youtubeUrl.split('embed/')[1]?.split('?')[0];
    posterUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    await updateDoc(doc(db, "movies", movieId), {
        ...movieData,
        genre: movieData.genre.toLowerCase(),
        language: movieData.language.toLowerCase(),
        videoUrl,
        posterUrl,
    });
};

export const deleteMovie = async (movie: Movie): Promise<void> => {
    // Then delete the document from Firestore
    await deleteDoc(doc(db, 'movies', movie.id));
}

export const getAllMovies = async (): Promise<Movie[]> => {
  try {
    const q = query(moviesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore<Movie>(doc));
  } catch (error) {
    console.error("Error fetching all movies: ", error);
    throw error;
  }
};

export const getMovieById = async (id: string): Promise<Movie | null> => {
  try {
    const movieDoc = doc(db, 'movies', id);
    const snapshot = await getDoc(movieDoc);
    if (snapshot.exists()) {
      return fromFirestore<Movie>(snapshot);
    }
    return null;
  } catch (error) {
    console.error("Error fetching movie by ID: ", error);
    throw error;
  }
};


// CONFIG/SITE STATUS FUNCTIONS
export const getSiteStatus = async (): Promise<'online' | 'offline'> => {
  const statusDoc = doc(db, 'config', 'siteStatus');
  try {
    const snapshot = await getDoc(statusDoc);
    if (snapshot.exists() && snapshot.data().status === 'offline') {
      return 'offline';
    }
  } catch (error) {
    console.error("Could not fetch site status, defaulting to online:", error);
  }
  // Default to online if doc doesn't exist, status is 'online', or there's an error
  return 'online';
};

export const updateSiteStatus = async (status: 'online' | 'offline') => {
  const statusDoc = doc(db, 'config', 'siteStatus');
  // Use setDoc with merge to create the document if it doesn't exist
  await setDoc(statusDoc, { status }, { merge: true });
};
