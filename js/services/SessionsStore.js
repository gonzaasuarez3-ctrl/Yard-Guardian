import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, authReady } from "./FirebaseService.js";
import { showErrorBanner } from "../components/ErrorBanner.js";

let sessions = [];

const subscribers = new Set();

authReady.then(() => {

    const sessionsQuery = query(collection(db, "auditSessions"), orderBy("createdAt", "asc"));

    onSnapshot(sessionsQuery, snapshot => {

        sessions = snapshot.docs.map(docSnap => ({

            id: docSnap.id,

            ...docSnap.data()

        }));

        subscribers.forEach(callback => callback());

    }, error => {

        console.error("Sessions listener error — check Firestore rules and that the collection exists.", error);

        showErrorBanner("Error cargando audits desde Firestore: " + error.message);

    });

});

export function getSessionsSnapshot() {

    return sessions;

}

/**
 * Registers a callback that fires every time session data changes,
 * whether the change came from this device or from someone else's
 * phone/laptop. app.js uses this to re-render whatever page is
 * currently open — this is the mechanism that makes a YM's entry on
 * one device show up live on a supervisor's screen elsewhere.
 */
export function subscribeSessions(callback) {

    subscribers.add(callback);

    return () => subscribers.delete(callback);

}
