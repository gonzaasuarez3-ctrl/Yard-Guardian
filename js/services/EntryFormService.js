import { addEntry, updateEntry } from "./AuditSessionService.js";

/**
 * options.sessionId: which session this entry belongs to (required).
 * options.entry: if provided, updates that entry instead of adding a
 * new one. options.onSaved / options.onCancel let the caller (always
 * a modal here) decide what happens next.
 */
export function bindEntryForm(options = {}) {

    const form = document.getElementById("entry-form");

    if (!form) return;

    const workIdCheckbox = document.getElementById("workIdCreated");
    const workIdFieldGroup = document.getElementById("workIdFieldGroup");

    if (workIdCheckbox && workIdFieldGroup) {

        workIdCheckbox.addEventListener("change", () => {

            workIdFieldGroup.style.display = workIdCheckbox.checked ? "block" : "none";

        });

    }

    form.addEventListener("submit", event => {

        event.preventDefault();

        handleSubmit(event, options);

    });

    const cancelButton = document.getElementById("cancelEntry");

    if (cancelButton && options.onCancel) {

        cancelButton.addEventListener("click", options.onCancel);

    }

}

async function handleSubmit(event, { sessionId, entry, onSaved }) {

    const submitButton = event.target.querySelector("button[type=submit]");

    const data = buildEntry();

    if (submitButton) {

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

    }

    try {

        let result;

        if (entry) {

            await updateEntry(sessionId, entry.id, data);
            result = { ...entry, ...data };

        } else {

            result = await addEntry(sessionId, data);

        }

        if (onSaved) {

            onSaved(result);

        }

    } catch (error) {

        console.error("Failed to save entry:", error);

        alert("Couldn't save — check your connection and try again.");

        if (submitButton) {

            submitButton.disabled = false;
            submitButton.textContent = entry ? "Update Entry" : "Add Entry";

        }

    }

}

function buildEntry() {

    return {

        trailerId: value("trailerId"),

        parkingPosition: value("parkingPosition"),

        issueType: value("issueType"),

        damageReport: value("damageReport"),

        workIdCreated: document.getElementById("workIdCreated")?.checked ?? false,

        workId: value("workId"),

        comments: value("comments")

    };

}

function value(id) {

    return document.getElementById(id)?.value ?? "";

}
