'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { auth, messaging } from '@/lib/firebase';
import { saveFcmToken, getArtistProfile } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';

// This is a non-visual component that handles push notification permissions.
export default function NotificationPermissionHandler() {
  const { toast } = useToast();

  useEffect(() => {
    const requestPermission = async (uid: string) => {
      // Check if user has already granted permission or has a token
      const artistProfile = await getArtistProfile(uid);
      if (artistProfile?.fcmToken) {
        return; // Token already exists, no need to ask again.
      }
      
      const messagingInstance = await messaging;
      if (!messagingInstance) {
          console.log("Firebase Messaging is not supported in this browser.");
          return;
      }

      console.log('Requesting permission...');
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          // IMPORTANT: Replace this with your actual VAPID key from the Firebase console.
          // Go to Project Settings -> Cloud Messaging -> Web configuration -> Web Push certificates
          const vapidKey = "YOUR_VAPID_KEY_HERE"; 
          const fcmToken = await getToken(messagingInstance, { vapidKey });
          
          if (fcmToken) {
            console.log('FCM Token:', fcmToken);
            await saveFcmToken(uid, fcmToken);
            toast({
              title: "Notifications Enabled",
              description: "You'll now receive updates from your favorite artists.",
            });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Only try to request permission if the user is logged in and is an artist.
        requestPermission(user.uid);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // This component does not render anything.
}
