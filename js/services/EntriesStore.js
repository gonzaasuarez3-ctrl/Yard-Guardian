import { collectionGroup, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, authReady } from "./FirebaseService.js";

let entries = [];

const subscribers = new Set();

authReady.then(() => {

    const entriesQuery = query(collectionGroup(db, "entries"), orderBy("createdAt", "asc"));

    onSnapshot(entriesQuery, snapshot => {

        entries = snapshot.docs.map(docSnap => ({

            id: docSnap.id,

            // entries are stored at auditSessions/{sessionId}/entries/{entryId} —
            // this is how we know which session a given entry belongs to.
            sessionId: docSnap.ref.parent.parent.id,

            ...docSnap.data()

        }));

        subscribers.forEach(callback => callback());

    }, error => {

        // The very first time this query runs, Firestore may require a
        // composite index for the collection-group orderBy — if so, this
        // error includes a link that creates it automatically in ~1 minute.
        console.error("Entries listener error — if this mentions a missing index, open the link in the error to create it.", error);

    });

});

export function getEntriesSnapshot() {

    return entries;

}

export function subscribeEntries(callback) {

    subscribers.add(callback);

    return () => subscribers.delete(callback);

}
