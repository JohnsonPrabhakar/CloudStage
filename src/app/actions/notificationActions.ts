'use server';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getEventById, getArtistProfile, getAppUserProfile } from '@/lib/firebase-service';
import { fcm } from '@/lib/fcm-admin';
import { type AppUser } from '@/lib/types';

/**
 * Sends a push notification to all followers of an artist when their new event is approved.
 * This Server Action is designed to be called from the admin dashboard after an event
 * is successfully approved.
 */
export async function sendNewEventNotification(eventId: string) {
  console.log(`[Notification Action] Starting for eventId: ${eventId}`);
  try {
    const event = await getEventById(eventId);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found.`);
    }

    const artist = await getArtistProfile(event.artistId);
    if (!artist) {
      throw new Error(`Artist with ID ${event.artistId} not found.`);
    }

    // 1. Fetch all followers of the artist
    const followersRef = collection(db, 'artists', event.artistId, 'followers');
    const followersSnapshot = await getDocs(followersRef);
    const followerIds = followersSnapshot.docs.map(doc => doc.id);

    if (followerIds.length === 0) {
      console.log('[Notification Action] Artist has no followers. No notifications to send.');
      return { success: true, message: 'Artist has no followers.' };
    }

    console.log(`[Notification Action] Found ${followerIds.length} followers.`);

    // 2. Fetch the FCM token for each follower
    const tokenPromises = followerIds.map(userId => getAppUserProfile(userId));
    const followerProfiles = (await Promise.all(tokenPromises)).filter(p => p !== null) as AppUser[];
    
    const fcmTokens = followerProfiles
      .map(profile => profile.fcmToken)
      .filter((token): token is string => !!token);

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
      tokens: fcmTokens,
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
