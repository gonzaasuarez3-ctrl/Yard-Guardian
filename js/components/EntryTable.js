import { Table } from "./table.js";
import { Modal } from "./modal.js";
import { IssueBadge, WorkIdPill } from "./badge.js";
import { EntryForm } from "./EntryForm.js";
import { bindEntryForm } from "../services/EntryFormService.js";
import { deleteEntry } from "../services/AuditSessionService.js";

const modal = new Modal();

export function renderEntryTable(entries, emptyMessage = "No issues logged yet.") {

    return Table({

        columns: [
            { label: "Trailer ID", key: "trailerId" },
            { label: "Dock Door / Parking", key: "parkingPosition" },
            { label: "Issue Type", render: row => IssueBadge(row.issueType) },
            { label: "Damage Report", key: "damageReport" },
            { label: "Work ID Status", render: row => WorkIdPill(row) },
            { label: "Comments", key: "comments" },
            { label: "", render: row => actionButtons(row.id) }
        ],

        rows: entries,

        emptyMessage

    });

}

function actionButtons(entryId) {

    return `
        <div class="table-actions">
            <button data-edit="${entryId}" title="Edit"><i data-lucide="pencil"></i></button>
            <button data-delete="${entryId}" class="table-actions__delete" title="Delete"><i data-lucide="trash-2"></i></button>
        </div>
    `;

}

/**
 * Wires up "+ Add item" (any element with [data-add-entry]) plus each
 * row's Edit/Delete. No branching on session.status here — a Completed
 * session is just as editable as an In Progress one, on purpose: a
 * supervisor adding a Work ID after the YM closed the audit is a normal
 * part of the workflow, not an exception.
 */
export function bindEntryTableActions(session, onChanged) {

    const openForm = entry => {

        modal.open(EntryForm(entry));

        bindEntryForm({

            sessionId: session.id,
            entry,

            onSaved: () => {
                modal.close();
                onChanged();
            },

            onCancel: () => modal.close()

        });

    };

    document.querySelectorAll("[data-add-entry]").forEach(
        button => button.addEventListener("click", () => openForm(null))
    );

    document.querySelectorAll("[data-edit]").forEach(
        button => button.addEventListener("click", () => {

            const entry = session.entries.find(entry => entry.id === button.dataset.edit);

            if (entry) openForm(entry);

        })
    );

    document.querySelectorAll("[data-delete]").forEach(
        button => button.addEventListener("click", async () => {

            if (!confirm("Delete this entry?")) return;

            try {

                await deleteEntry(session.id, button.dataset.delete);

                onChanged();

            } catch (error) {

                console.error("Failed to delete entry:", error);
                alert("Couldn't delete — check your connection and try again.");

            }

        })
    );

}
