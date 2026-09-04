import { collection, onSnapshot, query, orderBy, doc, setDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, authReady } from "./FirebaseService.js";
import { showErrorBanner } from "../components/ErrorBanner.js";

let damages = [];

const subscribers = new Set();

authReady.then(() => {

    const damagesQuery = query(collection(db, "trailerDamages"), orderBy("createdAt", "desc"));

    onSnapshot(damagesQuery, snapshot => {

        damages = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        subscribers.forEach(callback => callback());

    }, error => {

        console.error("Trailer damages listener error:", error);

        showErrorBanner("Error loading Trailer Damage from Firestore: " + error.message);

    });

});

export function getTrailerDamages() {

    return damages;

}

export function subscribeTrailerDamages(callback) {

    subscribers.add(callback);

    return () => subscribers.delete(callback);

}

/**
 * record.recordKey is used as the Firestore doc id, so importing the
 * same CSV row twice (overlapping export ranges) just overwrites the
 * same record instead of duplicating it.
 */
export async function importTrailerDamage(record) {

    await authReady;

    await setDoc(doc(db, "trailerDamages", record.recordKey), record);

}

/**
 * See clearAllIssues() in IssueService.js for why this exists —
 * re-importing never removes records from a previous, differently-matched
 * import on its own.
 */
export async function clearAllTrailerDamages() {

    await authReady;

    const snapshot = await getDocs(collection(db, "trailerDamages"));

    const batch = writeBatch(db);

    snapshot.forEach(docSnap => batch.delete(docSnap.ref));

    await batch.commit();

    return snapshot.size;

}
