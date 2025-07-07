'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { auth, messaging } from '@/lib/firebase';
import { saveFcmToken } from '@/lib/firebase-service';
import { useToast } from '@/hooks/use-toast';

// This is a non-visual component that handles push notification permissions for any logged-in user.
export default function NotificationPermissionHandler() {
  const { toast } = useToast();

  useEffect(() => {
    const requestPermission = async (uid: string) => {
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
          
          const vapidKey = "BEuYVG34fzDFAqBkFTHJdMlnGjeTkOLeVIePm760_OFTRiBHyAiqj6hTgw9mQUTmuqDWu6oVIsnY5nRYVQT-gLE";
          const fcmToken = await getToken(messagingInstance, { vapidKey });
          
          if (fcmToken) {
            console.log('FCM Token:', fcmToken);
            // This function will attempt to save the token for the user if they exist
            // in either the /artists or /users collection.
            await saveFcmToken(uid, fcmToken);
            // We only show the toast once to avoid annoying users.
            // A more robust solution might use localStorage to track if the toast has been shown.
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
        // Request permission for any logged-in user.
        requestPermission(user.uid);
      }
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; // This component does not render anything.
}
