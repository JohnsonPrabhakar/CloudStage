import admin from 'firebase-admin';

// This file ensures that the Firebase Admin SDK is initialized only once.
if (!admin.apps.length) {
  // When deployed to App Hosting, the SDK will automatically
  // discover the necessary credentials.
  admin.initializeApp();
}

export const fcm = admin.messaging();
