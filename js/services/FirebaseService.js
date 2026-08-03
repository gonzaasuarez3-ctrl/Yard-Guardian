import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "../firebaseConfig.js";

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

const auth = getAuth(app);

let resolveAuthReady;

/**
 * Every read/write in the app awaits this before touching Firestore.
 * There's no login screen — signInAnonymously() runs automatically on
 * load, so this resolves within a second or two without the user
 * doing anything. Firestore security rules require request.auth != null,
 * which is what this satisfies.
 */
export const authReady = new Promise(resolve => {
    resolveAuthReady = resolve;
});

onAuthStateChanged(auth, user => {

    if (user) {

        resolveAuthReady(user);

    } else {

        signInAnonymously(auth).catch(error => {

            console.error("Anonymous sign-in failed — check that Anonymous auth is enabled in the Firebase console.", error);

        });

    }

});
