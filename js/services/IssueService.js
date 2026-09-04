import { collection, onSnapshot, query, orderBy, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
