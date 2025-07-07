// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3ICTBkzhRijyMiGp8JPjkftKbUWuFcKQ",
  authDomain: "cloudstage-5quap.firebaseapp.com",
  projectId: "cloudstage-5quap",
  storageBucket: "cloudstage-5quap.appspot.com",
  messagingSenderId: "47546684219",
  appId: "1:47546684219:web:a4ee6a5a9505c9d3b91d1e"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
