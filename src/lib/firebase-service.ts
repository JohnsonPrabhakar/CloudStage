
import { db, auth, storage } from '@/lib/firebase';
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
  onSnapshot,
  getCountFromServer,
} from 'firebase/firestore';
import { type Event, type Artist, type Ticket, type Movie, type ChatMessage, type VerificationRequestData, type EventFeedback, type EventCategory, type AppUser } from '@/lib/types';
import { createUserWithEmailAndPassword, type User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { format } from "date-fns";

const eventsCollection = collection(db, 'events');
const artistsCollection = collection(db, 'artists');
const ticketsCollection = collection(db, 'tickets');
const moviesCollection = collection(db, 'movies');
const usersCollection = collection(db, 'users');
const eventFeedbackCollection = collection(db, 'eventFeedback');


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
  try {
    const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error(`[uploadFile] Firebase Storage Error during upload to ${path}:`, error);
    // Re-throw the error to be handled by the calling function
    throw new Error("File upload failed. Check storage rules and network connection.");
  }
}


const deleteFileByUrl = async (url: string) => {
  if (!url || !url.startsWith('https://firebasestorage.googleapis.com')) {
    return;
  }
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
        console.warn(`File not found, could not delete: ${url}`);
    } else {
        console.error(`Could not delete file: ${url}`, error);
    }
  }
}

// --- YOUTUBE HELPER ---
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  let videoId: string | null = null;
  
  try {
      if (url.includes("youtube.com/watch")) {
        const urlParams = new URLSearchParams(new URL(url).search);
        videoId = urlParams.get("v");
      }
      else if (url.includes("youtu.be/")) {
        videoId = new URL(url).pathname.slice(1);
      }
      else if (url.includes("youtube.com/embed/")) {
        videoId = new URL(url).pathname.split('/embed/')[1];
      }
      else if (url.includes("youtube.com/live/")) {
        videoId = new URL(url).pathname.split('/live/')[1];
      }
  } catch(e) {
      const patterns = [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
          /(?:https?:\/\/)?youtu\.be\/([^?]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([^?]+)/
      ];
      for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match && match[1]) {
              videoId = match[1];
              break;
          }
      }
  }

  if (videoId) {
      videoId = videoId.split('?')[0].split('&')[0];
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

const getYouTubeVideoId = (url: string): string | null => {
    const embedUrl = getYouTubeEmbedUrl(url);
    if (!embedUrl) {
        return null;
    }
    const parts = embedUrl.split('/embed/');
    if (parts.length > 1) {
        const videoId = parts[1].split('?')[0];
        return videoId;
    }
    return null;
};


// --- EVENT-RELATED FUNCTIONS ---
const addEvent = async (
  eventData: Omit<Event, 'id' | 'bannerUrl' | 'eventCode' | 'createdAt'>
): Promise<{ eventId: string }> => {
  const docRef = doc(collection(db, 'events'));
  const eventId = docRef.id;

  const videoId = getYouTubeVideoId(eventData.streamUrl);
  const bannerUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : 'https://placehold.co/600x400.png';

  const eventCode = `EVT-${eventId.substring(0, 8).toUpperCase()}`;

  const finalStreamUrl = getYouTubeEmbedUrl(eventData.streamUrl) || eventData.streamUrl;

  await setDoc(docRef, {
    ...eventData,
    bannerUrl: bannerUrl,
    streamUrl: finalStreamUrl,
    eventCode,
    createdAt: serverTimestamp(),
  });
  
  return { eventId };
};

const updateEvent = async (eventId: string, eventData: Partial<Omit<Event, 'id' | 'artist' | 'artistId'>>) => {
    const eventDoc = doc(db, 'events', eventId);

    const dataToUpdate: Partial<Event> = {
        ...eventData,
        moderationStatus: 'pending' as const,
    };

    if (eventData.streamUrl) {
        const videoId = getYouTubeVideoId(eventData.streamUrl);
        dataToUpdate.bannerUrl = videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : 'https://placehold.co/600x400.png';
        dataToUpdate.streamUrl = getYouTubeEmbedUrl(eventData.streamUrl) || eventData.streamUrl;
    }
    
    await updateDoc(eventDoc, dataToUpdate);
}

const getApprovedEventsListener = (callback: (events: Event[]) => void): (() => void) => {
  const q = query(
    eventsCollection,
    where('moderationStatus', '==', 'approved'),
    limit(50)
  );
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => fromFirestore<Event>(doc));
    const sortedEvents = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(sortedEvents);
  }, (error) => {
    console.error(`Approved events listener failed:`, error);
  });
};


const getAllApprovedEventsForAnalytics = async (): Promise<Event[]> => {
  const q = query(
    eventsCollection,
    where('moderationStatus', '==', 'approved')
  );
  const snapshot = await getDocs(q);
  const events = snapshot.docs.map(doc => fromFirestore<Event>(doc));
  return events;
};

const getPendingEventsListener = (callback: (events: Event[]) => void): (() => void) => {
  const q = query(eventsCollection, where('moderationStatus', '==', 'pending'));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => fromFirestore<Event>(doc));
    callback(events);
  });
};

const getBoostedEvents = async (): Promise<Event[]> => {
    const q = query(eventsCollection, where('isBoosted', '==', true), where('moderationStatus', '==', 'approved'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore<Event>(doc));
}

const getEventById = async (id: string): Promise<Event | null> => {
  const eventDoc = doc(db, 'events', id);
  const snapshot = await getDoc(eventDoc);
  if (snapshot.exists()) {
    return fromFirestore<Event>(snapshot);
  }
  return null;
};

const getArtistEventsListener = (artistId: string, callback: (events: Event[]) => void): (() => void) => {
  const q = query(eventsCollection, where('artistId', '==', artistId));
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => fromFirestore<Event>(doc));
    // Sort on the client-side to avoid the composite index requirement
    const sortedEvents = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(sortedEvents);
  }, (error) => {
    console.error(`Artist events listener for artistId ${artistId} failed:`, error);
  });
};

const getPublicArtistEventsListener = (artistId: string, callback: (events: Event[]) => void): (() => void) => {
  const q = query(
    eventsCollection,
    where('artistId', '==', artistId),
    where('moderationStatus', '==', 'approved'),
    orderBy('date', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => fromFirestore<Event>(doc));
    callback(events);
  }, (error) => {
    console.error(`Public artist events listener for artistId ${artistId} failed:`, error);
  });
};

const updateEventStatus = async (id: string, status: 'approved' | 'rejected', category?: 'verified' | 'premium') => {
  const eventDoc = doc(db, 'events', id);
  const dataToUpdate: { moderationStatus: 'approved' | 'rejected', eventCategory?: 'verified' | 'premium' } = {
    moderationStatus: status,
  };
  if (status === 'approved' && category) {
    dataToUpdate.eventCategory = category;
  }
  await updateDoc(eventDoc, dataToUpdate);
};

const toggleEventBoost = async (id: string, isBoosted: boolean, amount: number) => {
  const eventDoc = doc(db, 'events', id);
  await updateDoc(eventDoc, {
    isBoosted: isBoosted,
    boostAmount: amount
  });
};

const goLive = async (eventId: string, streamUrl: string) => {
  const embedUrl = getYouTubeEmbedUrl(streamUrl);
  if (!embedUrl) {
    throw new Error("Invalid YouTube URL provided. Please use a valid watch, live, or youtu.be link.");
  }

  const eventDoc = doc(db, 'events', eventId);
  await updateDoc(eventDoc, {
    streamUrl: embedUrl,
    status: 'live',
  });
};


// --- USER-RELATED FUNCTIONS (for mobile app users) ---
const createUserProfileForPhoneAuth = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists() && user.phoneNumber) {
    await setDoc(userRef, {
      phoneNumber: user.phoneNumber,
      createdAt: serverTimestamp(),
      fcmToken: '',
    });
  }
};

const getAppUserProfile = async (uid: string): Promise<AppUser | null> => {
    const userDoc = doc(db, 'users', uid);
    const snapshot = await getDoc(userDoc);
    if (snapshot.exists()) {
        return fromFirestore<AppUser>(snapshot);
    }
    return null;
}

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
    accessLevel: 'basic',
  };
};

const createArtistProfileForUser = async (uid: string, data: any, profilePictureFile?: File) => {
    let profilePictureUrl;
    if (profilePictureFile) {
        profilePictureUrl = await uploadFile(profilePictureFile, `artists/${uid}/profile.jpg`);
    }
    const artistProfile = buildArtistProfileObject(data, profilePictureUrl);
    await setDoc(doc(db, "artists", uid), artistProfile);
};

const registerArtist = async (data: any, profilePictureFile?: File) => {
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    await createArtistProfileForUser(user.uid, data, profilePictureFile);
}

const getArtistProfile = async (uid: string): Promise<Artist | null> => {
    const artistDoc = doc(db, 'artists', uid);
    const snapshot = await getDoc(artistDoc);
    if (snapshot.exists()) {
        return fromFirestore<Artist>(snapshot);
    }
    return null;
}

const getAllArtists = async (): Promise<Artist[]> => {
    const snapshot = await getDocs(artistsCollection);
    return snapshot.docs.map(doc => fromFirestore<Artist>(doc));
};

const getPendingArtistsListener = (callback: (artists: Artist[]) => void): (() => void) => {
    const q = query(artistsCollection, where('isApproved', '==', false));
    return onSnapshot(q, (snapshot) => {
        const artists = snapshot.docs.map(doc => fromFirestore<Artist>(doc));
        callback(artists);
    });
}

const approveArtist = async (uid: string) => {
    const artistDoc = doc(db, 'artists', uid);
    await updateDoc(artistDoc, {
        isApproved: true,
    });
}

const rejectArtist = async (uid: string) => {
    const artistDoc = doc(db, 'artists', uid);
    const artistProfile = await getArtistProfile(uid);
    if (artistProfile?.profilePictureUrl) {
      await deleteFileByUrl(artistProfile.profilePictureUrl);
    }
    await deleteDoc(artistDoc);
}

const updateArtistToPremium = async(uid: string) => {
    const artistDoc = doc(db, 'artists', uid);
    await updateDoc(artistDoc, {
        isPremium: true,
    });
}

const saveFcmToken = async (userId: string, token: string) => {
    const artistDocRef = doc(db, 'artists', userId);
    const artistSnap = await getDoc(artistDocRef);
    if (artistSnap.exists()) {
        await setDoc(artistDocRef, { fcmToken: token }, { merge: true });
    }

    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
        await setDoc(userDocRef, { fcmToken: token }, { merge: true });
    }
};

// --- TICKET-RELATED FUNCTIONS ---

const checkForExistingTicket = async (userId: string, eventId: string): Promise<boolean> => {
  const q = query(
    ticketsCollection,
    where('userId', '==', userId),
    where('eventId', '==', eventId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

const createTicket = async (
    userId: string,
    eventId: string,
    price: number,
    contactDetails: { buyerName: string; buyerEmail: string; buyerPhone: string }
): Promise<{ success: boolean, ticketId?: string, error?: string }> => {
    const alreadyExists = await checkForExistingTicket(userId, eventId);
    if (alreadyExists) {
        return { success: false, error: 'You already have a ticket for this event.' };
    }

    const eventData = await getEventById(eventId);
    if (!eventData) {
      return { success: false, error: 'Event not found, cannot create ticket.'};
    }

    const newTicketData: Omit<Ticket, 'id'> = {
        userId,
        eventId,
        pricePaid: price,
        createdAt: serverTimestamp(),
        ...contactDetails,
        testMode: true, // All tickets are now in test mode
    };

    try {
      const ticketRef = await addDoc(ticketsCollection, newTicketData);
      return { success: true, ticketId: ticketRef.id };
    } catch (error: any) {
      console.error("Error writing ticket to Firestore: ", error);
      return { success: false, error: 'Could not save your ticket to the database. Please try again.' };
    }
};

const getUserTicketsListener = (userId: string, callback: (events: Event[]) => void): (() => void) => {
  const q = query(ticketsCollection, where('userId', '==', userId));
  
  return onSnapshot(q, async (snapshot) => {
    const tickets = snapshot.docs.map(doc => fromFirestore<Ticket>(doc));
    if (tickets.length > 0) {
      const eventPromises = tickets.map(ticket => getEventById(ticket.eventId));
      const eventResults = await Promise.all(eventPromises);
      const validEvents = eventResults.filter((event): event is Event => event !== null);
      callback(validEvents);
    } else {
      callback([]);
    }
  });
};

// --- FOLLOWER FUNCTIONS ---

const isUserFollowing = async (userId: string, artistId: string): Promise<boolean> => {
  const followDocRef = doc(db, 'artists', artistId, 'followers', userId);
  const docSnap = await getDoc(followDocRef);
  return docSnap.exists();
};

const followArtist = async (userId: string, artistId:string): Promise<void> => {
  const followDocRef = doc(db, 'artists', artistId, 'followers', userId);
  await setDoc(followDocRef, { followedAt: serverTimestamp() });
};

const unfollowArtist = async (userId: string, artistId:string): Promise<void> => {
  const followDocRef = doc(db, 'artists', artistId, 'followers', userId);
  await deleteDoc(followDocRef);
};

const getFollowersCountListener = (artistId: string, callback: (count: number) => void): (() => void) => {
  const followersCol = collection(db, 'artists', artistId, 'followers');
  return onSnapshot(followersCol, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error("Follower count listener error:", error);
    callback(0);
  });
};

// --- MOVIE-RELATED FUNCTIONS ---
type MoviePayload = {
  movieData: Omit<Movie, 'id' | 'posterUrl' | 'videoUrl' | 'createdAt'>;
  files: { movieFile?: File; posterFile?: File };
  youtubeUrl?: string;
};

const addMovie = async ({ movieData, files, youtubeUrl }: MoviePayload): Promise<void> => {
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

const updateMovie = async (movieId: string, { movieData, files, youtubeUrl }: MoviePayload): Promise<void> => {
    const movieRef = doc(db, "movies", movieId);
    const movieSnap = await getDoc(movieRef);

    if (!movieSnap.exists()) {
        throw new Error("Movie to update not found");
    }

    const oldData = fromFirestore<Movie>(movieSnap);
    let finalVideoUrl = oldData.videoUrl;
    let finalPosterUrl = oldData.posterUrl;

    if (youtubeUrl) {
        const videoId = getYouTubeVideoId(youtubeUrl);
        if (!videoId) {
            throw new Error("Invalid YouTube URL provided. Please use a valid YouTube watch or share link.");
        }
        finalVideoUrl = `https://www.youtube.com/embed/${videoId}`;
        finalPosterUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else {
        if (files.movieFile) {
            finalVideoUrl = await uploadFile(files.movieFile, `movies/${movieId}/movie.mp4`);
        }
        if (files.posterFile) {
            finalPosterUrl = await uploadFile(files.posterFile, `movies/${movieId}/poster.jpg`);
        }
    }
    
    await updateDoc(movieRef, {
        ...movieData,
        genre: movieData.genre.toLowerCase(),
        language: movieData.language.toLowerCase(),
        videoUrl: finalVideoUrl,
        posterUrl: finalPosterUrl,
    });

    if (oldData.videoUrl !== finalVideoUrl && oldData.videoUrl && !oldData.videoUrl.includes('youtube.com')) {
        await deleteFileByUrl(oldData.videoUrl);
    }
    if (oldData.posterUrl !== finalPosterUrl && oldData.posterUrl && !oldData.posterUrl.includes('youtube.com')) {
        await deleteFileByUrl(oldData.posterUrl);
    }
};


const deleteMovie = async (movie: Movie): Promise<void> => {
    await deleteFileByUrl(movie.posterUrl);
    if (movie.videoUrl && !movie.videoUrl.includes('youtube')) {
        await deleteFileByUrl(movie.videoUrl);
    }
    await deleteDoc(doc(db, 'movies', movie.id));
}

const getAllMovies = async (): Promise<Movie[]> => {
  try {
    const q = query(moviesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => fromFirestore<Movie>(doc));
  } catch (error) {
    throw error;
  }
};

const getMovieById = async (id: string): Promise<Movie | null> => {
  try {
    const movieDoc = doc(db, 'movies', id);
    const snapshot = await getDoc(movieDoc);
    if (snapshot.exists()) {
      return fromFirestore<Movie>(snapshot);
    }
    return null;
  } catch (error) {
    throw error;
  }
};


// --- CHAT FUNCTIONS ---

const getChatMessagesListener = (
  eventId: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const messagesCollection = collection(db, 'events', eventId, 'messages');
  const q = query(messagesCollection, orderBy('createdAt', 'asc'), limit(50));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => fromFirestore<ChatMessage>(doc));
    callback(messages);
  });
};

const sendChatMessage = async (eventId: string, name: string, message: string): Promise<void> => {
    if (!name.trim() || !message.trim()) {
        throw new Error("Name and message cannot be empty.");
    }
    const messagesCollection = collection(db, 'events', eventId, 'messages');
    await addDoc(messagesCollection, {
        name,
        message,
        createdAt: serverTimestamp()
    });
}


// --- DASHBOARD COUNT LISTENER FUNCTIONS ---
const getArtistsCountListener = (callback: (count: number) => void): (() => void) => {
  const q = query(artistsCollection, where('isApproved', '==', true));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error("Artist count listener failed:", error);
  });
};

const getEventsCountListener = (callback: (count: number) => void): (() => void) => {
  return onSnapshot(eventsCollection, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error("Event count listener failed:", error);
  });
};

const getTicketsCountListener = (callback: (count: number) => void): (() => void) => {
  return onSnapshot(ticketsCollection, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error("Ticket count listener failed:", error);
  });
};

const getUsersCountListener = (callback: (count: number) => void): (() => void) => {
  const currentUser = auth.currentUser;
  if (currentUser && currentUser.email === 'admin@cloudstage.in') {
    return onSnapshot(usersCollection, (snapshot) => {
      callback(snapshot.size);
    }, (error) => {
      console.error("User count listener failed:", error);
    });
  } else {
    // Return a no-op unsubscribe function if the user is not an admin
    return () => {};
  }
};


// CONFIG/SITE STATUS FUNCTIONS
const getSiteStatus = async (): Promise<'online' | 'offline'> => {
  const statusDoc = doc(db, 'config', 'siteStatus');
  try {
    const snapshot = await getDoc(statusDoc);
    if (snapshot.exists() && snapshot.data().status === 'offline') {
      return 'offline';
    }
  } catch (error) {
    console.error('Could not fetch site status, defaulting to online:', error);
  }
  return 'online';
};

const updateSiteStatus = async (status: 'online' | 'offline') => {
  const statusDoc = doc(db, 'config', 'siteStatus');
  await setDoc(statusDoc, { status }, { merge: true });
};

// --- ARTIST VERIFICATION FUNCTIONS ---

const submitVerificationRequest = async (
    artistId: string,
    requestData: Omit<VerificationRequestData, 'status' | 'submittedAt' | 'reviewedByAdmin' | 'reviewedAt'>,
    sampleVideoFile?: File
) => {
    const artistDoc = doc(db, 'artists', artistId);
    let sampleVideoUrl: string | undefined;
    if (sampleVideoFile) {
        sampleVideoUrl = await uploadFile(sampleVideoFile, `artists/${artistId}/verification_sample.mp4`);
    }

    const verificationPayload: VerificationRequestData = {
        ...requestData,
        sampleVideoUrl,
        submittedAt: serverTimestamp(),
        status: 'pending',
        reviewedByAdmin: null,
        reviewedAt: null,
    };

    await updateDoc(artistDoc, {
        verificationRequest: verificationPayload
    });
};

const getPendingVerificationRequestsListener = (callback: (artists: Artist[]) => void): (() => void) => {
    const q = query(artistsCollection, where('verificationRequest.status', '==', 'pending'));
    return onSnapshot(q, (snapshot) => {
        const artistsWithPendingRequests = snapshot.docs.map(doc => fromFirestore<Artist>(doc));
        callback(artistsWithPendingRequests);
    }, (error) => {
        console.error("Error fetching pending requests:", error);
    });
};

const approveVerificationRequest = async (artistId: string, adminId: string) => {
    const artistDoc = doc(db, 'artists', artistId);
    await updateDoc(artistDoc, {
        accessLevel: 'verified',
        'verificationRequest.status': 'approved',
        'verificationRequest.reviewedAt': serverTimestamp(),
        'verificationRequest.reviewedByAdmin': adminId,
    });
};

const rejectVerificationRequest = async (artistId: string, adminId: string) => {
    const artistDoc = doc(db, 'artists', artistId);
    await updateDoc(artistDoc, {
        'verificationRequest.status': 'rejected',
        'verificationRequest.reviewedAt': serverTimestamp(),
        'verificationRequest.reviewedByAdmin': adminId,
    });
};

// --- REPORTING FUNCTIONS ---

const getCompletedEventsForReport = async (): Promise<Event[]> => {
    const q = query(
        eventsCollection,
        where('moderationStatus', '==', 'approved')
    );
    const snapshot = await getDocs(q);
    const allApprovedEvents = snapshot.docs.map(doc => fromFirestore<Event>(doc));
    
    const now = new Date();
    const completedEvents = allApprovedEvents.filter(event => new Date(event.date) < now);
        
    return completedEvents;
};

const getAllTickets = async (): Promise<Ticket[]> => {
    const snapshot = await getDocs(ticketsCollection);
    return snapshot.docs.map(doc => fromFirestore<Ticket>(doc));
};

// --- EVENT FEEDBACK FUNCTIONS ---

const submitEventFeedback = async (feedbackData: Omit<EventFeedback, 'id' | 'submittedAt'>) => {
    await addDoc(eventFeedbackCollection, {
        ...feedbackData,
        submittedAt: serverTimestamp(),
    });
};

export {
    uploadFile,
    getYouTubeEmbedUrl,
    addEvent,
    updateEvent,
    getApprovedEventsListener,
    getAllApprovedEventsForAnalytics,
    getPendingEventsListener,
    getBoostedEvents,
    getEventById,
    getArtistEventsListener,
    getPublicArtistEventsListener,
    updateEventStatus,
    toggleEventBoost,
    goLive,
    createUserProfileForPhoneAuth,
    getAppUserProfile,
    createArtistProfileForUser,
    registerArtist,
    getArtistProfile,
    getAllArtists,
    getPendingArtistsListener,
    approveArtist,
    rejectArtist,
    updateArtistToPremium,
    saveFcmToken,
    checkForExistingTicket,
    createTicket,
    getUserTicketsListener,
    isUserFollowing,
    followArtist,
    unfollowArtist,
    getFollowersCountListener,
    addMovie,
    updateMovie,
    deleteMovie,
    getAllMovies,
    getMovieById,
    getChatMessagesListener,
    sendChatMessage,
    getArtistsCountListener,
    getEventsCountListener,
    getTicketsCountListener,
    getUsersCountListener,
    getSiteStatus,
    updateSiteStatus,
    submitVerificationRequest,
    getPendingVerificationRequestsListener,
    approveVerificationRequest,
    rejectVerificationRequest,
    getCompletedEventsForReport,
    getAllTickets,
    submitEventFeedback,
};

    