// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// TODO: Replace with actual config from Firebase Console
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestForToken = () => {
    return getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY })
        .then((currentToken) => {
            if (currentToken) {
                console.log('current token for client: ', currentToken);
                // Track the token -> send to backend
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        })
        .catch((err) => {
            console.log('An error occurred while retrieving token. ', err);
        });
};

import { getToken, onMessage } from "firebase/messaging";

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
