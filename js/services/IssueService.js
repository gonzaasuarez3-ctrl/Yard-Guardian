import { collection, onSnapshot, query, orderBy, doc, setDoc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, authReady } from "./FirebaseService.js";
import { showErrorBanner } from "../components/ErrorBanner.js";

let issues = [];

const subscribers = new Set();

authReady.then(() => {

    const issuesQuery = query(collection(db, "issues"), orderBy("createdAt", "desc"));

    onSnapshot(issuesQuery, snapshot => {

        issues = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        subscribers.forEach(callback => callback());

    }, error => {

        console.error("Issues listener error:", error);

        showErrorBanner("Error loading Issues from Firestore: " + error.message);

    });

});

export function getIssues() {

    return issues;

}

export function subscribeIssues(callback) {

    subscribers.add(callback);

    return () => subscribers.delete(callback);

}

export async function importIssue(record) {

    await authReady;

    await setDoc(doc(db, "issues", record.recordKey), record);

}

/**
 * Deletes every Issue record. Needed because re-importing a CSV only
 * adds/overwrites rows that match the current logic — it never removes
 * records that were imported under an older, different matching rule.
 * If that rule changes, old non-matching records stay until this runs.
 */
export async function clearAllIssues() {

    await authReady;

    const snapshot = await getDocs(collection(db, "issues"));

    const batch = writeBatch(db);

    snapshot.forEach(docSnap => batch.delete(docSnap.ref));

    await batch.commit();

    return snapshot.size;

}
