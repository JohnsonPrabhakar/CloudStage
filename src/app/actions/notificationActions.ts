'use server';

import { fcm, adminDb } from '@/lib/fcm-admin';
import { type AppUser, type Event, type Artist } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

// Helper to convert Firestore doc using Admin SDK
const fromAdminFirestore = <T extends { id: string }>(doc: FirebaseFirestore.DocumentSnapshot): T => {
  const data = doc.data();
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


/**
 * Sends a push notification to all followers of an artist when their new event is approved.
 * This Server Action is designed to be called from the admin dashboard after an event
 * is successfully approved. It uses the Firebase Admin SDK to bypass security rules
 * for reading user data.
 */
export async function sendNewEventNotification(eventId: string) {
  console.log(`[Notification Action] Starting for eventId: ${eventId}`);
  try {
    // Fetch data using the Admin SDK
    const eventDoc = await adminDb.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
        throw new Error(`Event with ID ${eventId} not found.`);
    }
    const event = fromAdminFirestore<Event>(eventDoc);

    const artistDoc = await adminDb.collection('artists').doc(event.artistId).get();
     if (!artistDoc.exists) {
      throw new Error(`Artist with ID ${event.artistId} not found.`);
    }
    const artist = fromAdminFirestore<Artist>(artistDoc);

    // 1. Fetch all followers of the artist
    const followersSnapshot = await adminDb.collection('artists').doc(event.artistId).collection('followers').get();
    const followerIds = followersSnapshot.docs.map(doc => doc.id);

    if (followerIds.length === 0) {
      console.log('[Notification Action] Artist has no followers. No notifications to send.');
      return { success: true, message: 'Artist has no followers.' };
    }

    console.log(`[Notification Action] Found ${followerIds.length} followers.`);

    // 2. Fetch the FCM token for each follower from the /users collection.
    // This assumes followers are audience members, not other artists.
    const userDocRefs = followerIds.map(id => adminDb.collection('users').doc(id));
    const userDocs = await adminDb.getAll(...userDocRefs);

    const fcmTokens = userDocs
      .map(doc => doc.exists ? (doc.data() as AppUser).fcmToken : null)
      .filter((token): token is string => !!token && token.length > 0);


    if (fcmTokens.length === 0) {
      console.log('[Notification Action] No followers have valid FCM tokens. No notifications to send.');
      return { success: true, message: 'No followers with notification permissions.' };
    }
    
    console.log(`[Notification Action] Found ${fcmTokens.length} FCM tokens to send to.`);

    // 3. Construct and send the notification
    const message = {
      notification: {
        title: `🎤 New Event by ${artist.name}!`,
        body: `"${event.title}" has been announced. Tap to book your tickets now!`,
      },
      webpush: {
        fcm_options: {
          link: `/events/${eventId}`,
        },
      },
      tokens: [...new Set(fcmTokens)], // Use Set to remove duplicate tokens
    };

    const response = await fcm.sendEachForMulticast(message);
    console.log(`[Notification Action] Successfully sent ${response.successCount} messages.`);
    
    if (response.failureCount > 0) {
      console.warn(`[Notification Action] Failed to send ${response.failureCount} messages.`);
      // Optionally, you could add logic here to clean up invalid tokens from your database
    }

    return { success: true, message: `Notifications sent to ${response.successCount} followers.` };
  } catch (error) {
    console.error('[Notification Action] A critical error occurred:', error);
    return { success: false, error: 'Failed to send notifications.' };
  }
}
