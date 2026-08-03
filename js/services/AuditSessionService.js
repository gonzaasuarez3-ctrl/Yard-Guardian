import {
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    collection,
    getDocs,
    writeBatch,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, authReady } from "./FirebaseService.js";
import { getSessionsSnapshot, subscribeSessions } from "./SessionsStore.js";
import { getEntriesSnapshot, subscribeEntries } from "./EntriesStore.js";

// ==========================================================
// READS — synchronous, served from the local reactive cache
// (SessionsStore + EntriesStore). Nothing here waits on the
// network; the cache is what's kept current by Firestore's
// realtime listeners.
// ==========================================================

/**
 * Joins each session with its entries (a separate subcollection in
 * Firestore) so every caller can keep treating `session.entries` as a
 * plain array, exactly like the old localStorage version did.
 */
export function getSessions() {

    const sessions = getSessionsSnapshot();

    const entries = getEntriesSnapshot();

    return sessions.map(session => ({

        ...session,

        entries: entries.filter(entry => entry.sessionId === session.id)

    }));

}

export function getSession(id) {

    return getSessions().find(session => session.id === id);

}

/**
 * Only one audit session can be "In Progress" at a time across the
 * whole yard — the YM does one round at a time.
 */
export function getActiveSession() {

    return getSessions().find(session => session.status === "In Progress");

}

export function getAllEntries() {

    return getSessions().flatMap(session =>

        session.entries.map(entry => ({

            ...entry,

            shift: session.shift,
            date: session.date,
            sessionStatus: session.status

        }))

    );

}

// Re-exported so app.js can wire "data changed → re-render current
// page" without needing to import SessionsStore/EntriesStore directly.
export { subscribeSessions, subscribeEntries };

// ==========================================================
// WRITES — async, go to Firestore. Every caller needs to
// await these now (they used to be synchronous localStorage
// calls).
// ==========================================================

async function nextSessionId() {

    const counterRef = doc(db, "counters", "sessions");

    const nextNumber = await runTransaction(db, async transaction => {

        const snapshot = await transaction.get(counterRef);

        const current = snapshot.exists() ? snapshot.data().value : 0;

        const next = current + 1;

        transaction.set(counterRef, { value: next });

        return next;

    });

    return `AUD-${String(nextNumber).padStart(5, "0")}`;

}

export async function startSession({ shift, date, ym }) {

    await authReady;

    const id = await nextSessionId();

    const session = {

        shift,
        date,
        ym,

        status: "In Progress",

        createdAt: new Date().toISOString(),

        completedAt: null

    };

    await setDoc(doc(db, "auditSessions", id), session);

    return { id, ...session, entries: [] };

}

export async function completeSession(id) {

    await authReady;

    await updateDoc(doc(db, "auditSessions", id), {

        status: "Completed",

        completedAt: new Date().toISOString()

    });

    return true;

}

export async function deleteSession(id) {

    await authReady;

    // Firestore doesn't cascade-delete a subcollection when you delete
    // its parent doc — without this, an audit's entries would silently
    // survive as orphaned data after the session itself is gone.
    const entriesSnapshot = await getDocs(collection(db, "auditSessions", id, "entries"));

    const batch = writeBatch(db);

    entriesSnapshot.forEach(entryDoc => batch.delete(entryDoc.ref));

    batch.delete(doc(db, "auditSessions", id));

    await batch.commit();

}

/**
 * Entries are their own Firestore documents (auditSessions/{id}/entries/{entryId})
 * rather than an array field, specifically so add/update/delete don't
 * need a transaction — a plain addDoc/updateDoc/deleteDoc works offline
 * (Firestore queues it locally and syncs once the connection is back),
 * which matters for someone logging a damaged trailer with a weak
 * signal in the yard.
 */
export async function addEntry(sessionId, entryData) {

    await authReady;

    const entriesRef = collection(db, "auditSessions", sessionId, "entries");

    const entryDoc = await addDoc(entriesRef, {

        createdAt: new Date().toISOString(),

        ...entryData

    });

    return { id: entryDoc.id, sessionId, ...entryData };

}

export async function updateEntry(sessionId, entryId, updatedEntry) {

    await authReady;

    await updateDoc(doc(db, "auditSessions", sessionId, "entries", entryId), updatedEntry);

    return true;

}

export async function deleteEntry(sessionId, entryId) {

    await authReady;

    await deleteDoc(doc(db, "auditSessions", sessionId, "entries", entryId));

    return true;

}
