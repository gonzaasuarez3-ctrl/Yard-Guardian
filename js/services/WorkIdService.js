import { collection, onSnapshot, query, orderBy, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, authReady } from "./FirebaseService.js";
import { showErrorBanner } from "../components/ErrorBanner.js";

let workIds = [];

const subscribers = new Set();

authReady.then(() => {

    const workIdsQuery = query(collection(db, "workIds"), orderBy("createdAt", "desc"));

    onSnapshot(workIdsQuery, snapshot => {

        workIds = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        subscribers.forEach(callback => callback());

    }, error => {

        console.error("Work IDs listener error:", error);

        showErrorBanner("Error cargando Work IDs desde Firestore: " + error.message);

    });

});

export function getWorkIds() {

    return workIds;

}

export function subscribeWorkIds(callback) {

    subscribers.add(callback);

    return () => subscribers.delete(callback);

}

export async function importWorkId(record) {

    await authReady;

    await setDoc(doc(db, "workIds", record.recordKey), record);

}
