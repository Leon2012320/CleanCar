// ============================================
// Firebase Configuration
// ============================================
// 1. Gehe zu https://console.firebase.google.com
// 2. Erstelle ein neues Projekt (oder wähle ein bestehendes)
// 3. Gehe zu Projekteinstellungen > Allgemein > Web-App hinzufügen
// 4. Kopiere die Config-Werte hierhin
// 5. Gehe zu Authentication > Anmeldemethoden > E-Mail/Passwort aktivieren
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, updateProfile } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "DEINE_API_KEY",
    authDomain: "DEIN_PROJEKT.firebaseapp.com",
    projectId: "DEIN_PROJEKT",
    storageBucket: "DEIN_PROJEKT.appspot.com",
    messagingSenderId: "DEINE_SENDER_ID",
    appId: "DEINE_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Deutsche Fehlermeldungen
const ERROR_MESSAGES = {
    'auth/email-already-in-use': 'Diese E-Mail-Adresse wird bereits verwendet.',
    'auth/invalid-email': 'Ungültige E-Mail-Adresse.',
    'auth/operation-not-allowed': 'Anmeldung per E-Mail ist nicht aktiviert.',
    'auth/weak-password': 'Das Passwort ist zu schwach (mind. 6 Zeichen).',
    'auth/user-disabled': 'Dieses Konto wurde deaktiviert.',
    'auth/user-not-found': 'Kein Konto mit dieser E-Mail gefunden.',
    'auth/wrong-password': 'Falsches Passwort.',
    'auth/invalid-credential': 'E-Mail oder Passwort falsch.',
    'auth/too-many-requests': 'Zu viele Versuche. Bitte warten Sie einen Moment.',
    'auth/network-request-failed': 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.',
};

export function getFirebaseError(error) {
    return ERROR_MESSAGES[error.code] || error.message || 'Ein unbekannter Fehler ist aufgetreten.';
}

export {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    updateProfile,
};
