
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
  getCountFromServer,
} from 'firebase/firestore';
import { type Event, type Artist, type Ticket, type Movie } from './types';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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

// --- STORAGE HELPER FUNCTIONS ---
const uploadFile = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

const deleteFileByUrl = async (url: string) => {
  if (!url || url.includes('placehold.co') || url.includes('youtube.com')) {
    // Do not attempt to delete placeholders or YouTube thumbnails
    return;
  }
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.warn("Tried to delete a file that doesn't exist:", url);
    } else {
      console.error("Error deleting file from storage:", error);
      // Don't re-throw, allow the operation to continue
    }
  }
}

// --- YOUTUBE HELPER ---
const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  let videoId = null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
    }
    if(videoId && (videoId === "embed" || videoId === "live")) {
        videoId = urlObj.pathname.split('/').pop()
    }
  } catch (e) {
    // Fallback for invalid URLs
    return null;
  }
  return videoId;
};


// EVENT-RELATED FUNCTIONS

export const addEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'moderationStatus' | 'bannerUrl'>, bannerFile?: File) => {
  const eventRef = doc(collection(db, 'events'));
  const eventId = eventRef.id;

  try {
    // Create the document first with a placeholder URL.
    // This makes the document available for security rule checks.
    await setDoc(eventRef, {
      ...eventData,
      bannerUrl: "https://placehold.co/1280x720.png",
      moderationStatus: 'pending',
      createdAt: serverTimestamp(),
    });

    // If a banner file exists, upload it and update the document.
    if (bannerFile) {
      const bannerUrl = await uploadFile(
        bannerFile,
        `artists/${eventData.artistId}/events/${eventId}/banner.jpg`
      );
      
      // Update the doc with the real banner URL
      await updateDoc(eventRef, { bannerUrl: bannerUrl });
    }

  } catch (error) {
    console.error("Error adding event to Firestore: ", error);
    // If something goes wrong after doc creation but during upload, delete the placeholder doc.
    if(doc(db, 'events', eventId)) {
      await deleteDoc(doc(db, 'events', eventId));
    }
    if (error instanceof Error && (error.message.includes('storage') || error.message.includes('permission'))) {
        throw new Error("Failed to upload event poster. Please check file format and permissions.");
    }
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
  const q = query(eventsCollection, where('artistId', '==', artistId));
  const snapshot = await getDocs(q);
  
  const events = snapshot.docs.map(doc => fromFirestore<Event>(doc));

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

const buildArtistProfileObject = (data: any, profilePictureUrl?: string): Omit<Artist, 'id'> => {
  const defaultProfilePic = `https://placehold.co/128x128.png?text=${data.name.charAt(0)}`;
  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    about: data.about,
    profilePictureUrl: profilePictureUrl || defaultProfilePic,
    youtubeUrl: data.youtubeUrl || "",
    instagramUrl: data.instagramUrl || "",
    facebookUrl: data.facebookUrl || "",
    experience: data.experience,
    category: data.category,
    subCategory: data.subCategory,
    isPremium: false,
    isApproved: false,
    type: 'Solo Artist',
    genres: [data.subCategory],
  };
};

export const createArtistProfileForUser = async (uid: string, data: any, profilePictureFile?: File) => {
    let profilePictureUrl;
    if (profilePictureFile) {
        profilePictureUrl = await uploadFile(profilePictureFile, `artists/${uid}/profile.jpg`);
    }
    const artistProfile = buildArtistProfileObject(data, profilePictureUrl);
    await setDoc(doc(db, "artists", uid), artistProfile);
};

export const registerArtist = async (data: any, profilePictureFile?: File) => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    await createArtistProfileForUser(user.uid, data, profilePictureFile);
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
    // Before deleting the document, delete the profile picture if it exists
    const artistProfile = await getArtistProfile(uid);
    if (artistProfile?.profilePictureUrl) {
      await deleteFileByUrl(artistProfile.profilePictureUrl);
    }
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

// --- MOVIE-RELATED FUNCTIONS ---
type MoviePayload = {
  movieData: Omit<Movie, 'id' | 'posterUrl' | 'videoUrl' | 'createdAt'>;
  files: { movieFile?: File; posterFile?: File };
  youtubeUrl?: string;
};

export const addMovie = async ({ movieData, files, youtubeUrl }: MoviePayload): Promise<void> => {
  const movieRef = doc(collection(db, 'movies'));
  const movieId = movieRef.id;

  let finalVideoUrl = '';
  let finalPosterUrl = '';

  if (youtubeUrl) {
    const videoId = getYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL provided.");
    }
    finalVideoUrl = `https://www.youtube.com/embed/${videoId}`;
    finalPosterUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } else if (files.movieFile && files.posterFile) {
    finalVideoUrl = await uploadFile(files.movieFile, `movies/${movieId}/movie.mp4`);
    finalPosterUrl = await uploadFile(files.posterFile, `movies/${movieId}/poster.jpg`);
  } else {
    throw new Error("Either a YouTube URL or a movie and poster file are required.");
  }

  await setDoc(movieRef, {
    ...movieData,
    genre: movieData.genre.toLowerCase(),
    language: movieData.language.toLowerCase(),
    videoUrl: finalVideoUrl,
    posterUrl: finalPosterUrl,
    createdAt: serverTimestamp(),
  });
};

export const updateMovie = async (movieId: string, { movieData, files, youtubeUrl }: MoviePayload): Promise<void> => {
    const movieRef = doc(db, "movies", movieId);
    const movieSnap = await getDoc(movieRef);

    if (!movieSnap.exists()) {
        throw new Error("Movie to update not found");
    }

    const oldData = movieSnap.data() as Movie;
    let newVideoUrl = oldData.videoUrl;
    let newPosterUrl = oldData.posterUrl;

    if (youtubeUrl) {
      const videoId = getYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error("Invalid YouTube URL provided.");
      }
      newVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      newPosterUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      // If old data was not from youtube, delete old files
      if (!oldData.videoUrl.includes('youtube.com')) await deleteFileByUrl(oldData.videoUrl);
      if (!oldData.posterUrl.includes('youtube.com')) await deleteFileByUrl(oldData.posterUrl);
    } else {
      if (files.movieFile) {
          if (!oldData.videoUrl.includes('youtube.com')) await deleteFileByUrl(oldData.videoUrl);
          newVideoUrl = await uploadFile(files.movieFile, `movies/${movieId}/movie.mp4`);
      }
      if (files.posterFile) {
          if (!oldData.posterUrl.includes('youtube.com')) await deleteFileByUrl(oldData.posterUrl);
          newPosterUrl = await uploadFile(files.posterFile, `movies/${movieId}/poster.jpg`);
      }
    }
    
    await updateDoc(movieRef, {
        ...movieData,
        genre: movieData.genre.toLowerCase(),
        language: movieData.language.toLowerCase(),
        videoUrl: newVideoUrl,
        posterUrl: newPosterUrl,
    });
};


export const deleteMovie = async (movie: Movie): Promise<void> => {
    await deleteFileByUrl(movie.posterUrl);
    await deleteFileByUrl(movie.videoUrl);
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

// --- DASHBOARD COUNT FUNCTIONS ---
export const getArtistsCount = async (): Promise<number> => {
  const q = query(artistsCollection, where('isApproved', '==', true));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}
export const getEventsCount = async (): Promise<number> => {
  const snapshot = await getCountFromServer(eventsCollection);
  return snapshot.data().count;
}
export const getTicketsCount = async (): Promise<number> => {
  const snapshot = await getCountFromServer(ticketsCollection);
  return snapshot.data().count;
}


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
  return 'online';
};

export const updateSiteStatus = async (status: 'online' | 'offline') => {
  const statusDoc = doc(db, 'config', 'siteStatus');
  await setDoc(statusDoc, { status }, { merge: true });
};
