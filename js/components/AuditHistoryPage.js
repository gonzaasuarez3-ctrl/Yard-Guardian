import { Table } from "./table.js";
import { Modal } from "./modal.js";
import { SessionStatusBadge } from "./badge.js";
import { renderEntryTable, bindEntryTableActions } from "./EntryTable.js";
import { getSessions, deleteSession } from "../services/AuditSessionService.js";
import { navigate } from "../router.js";

const modal = new Modal();

export function AuditHistoryPage() {

    const sessions = getSessions();

    const table = Table({

        columns: [
            { label: "ID", key: "id" },
            { label: "Date", key: "date" },
            { label: "Shift", key: "shift" },
            { label: "YM", key: "ym" },
            { label: "Issues", render: row => row.entries.length },
            { label: "Status", render: row => SessionStatusBadge(row.status) },
            { label: "", render: row => actionButtons(row.id, row.status) }
        ],

        rows: [...sessions].reverse(),

        emptyMessage: "No audits recorded yet."

    });

    return `

        <section class="dashboard">

            <div class="dashboard__header">
                <h2 class="dashboard__title">Audit History</h2>
                <p class="dashboard__subtitle">${sessions.length} session${sessions.length === 1 ? "" : "s"} recorded. Completed audits can still be opened to add a Work ID.</p>
            </div>

            <div class="audit-table-wrapper">
                ${table}
            </div>

        </section>

    `;

}

function actionButtons(id, status) {

    return `
        <div class="table-actions">
            <button data-view="${id}" title="Open"><i data-lucide="eye"></i></button>
            ${status === "In Progress"
                ? `<button data-resume="${id}" title="Resume"><i data-lucide="play"></i></button>`
                : ""
            }
            <button data-delete="${id}" class="table-actions__delete" title="Delete"><i data-lucide="trash-2"></i></button>
        </div>
    `;

}

export function initAuditHistoryPage() {

    document.querySelectorAll("[data-view]").forEach(button =>
        button.addEventListener("click", () => viewSession(button.dataset.view))
    );

    document.querySelectorAll("[data-resume]").forEach(button =>
        button.addEventListener("click", () => navigate("audit-session"))
    );

    document.querySelectorAll("[data-delete]").forEach(button =>
        button.addEventListener("click", () => removeSession(button.dataset.delete))
    );

}

function viewSession(id) {

    const session = getSessions().find(session => session.id === id);

    if (!session) return;

    modal.open(`

        <h2 class="modal-title">${session.shift} Shift Audit — ${session.date}</h2>

        <dl class="detail-view">
            <dt>YM</dt><dd>${session.ym}</dd>
            <dt>Status</dt><dd>${SessionStatusBadge(session.status)}</dd>
        </dl>

        <div class="audit-table-wrapper" style="margin-top:20px;">

            ${renderEntryTable(session.entries, "No issues logged in this audit.")}

            <button class="audit-table__add-row" data-add-entry>
                <i data-lucide="plus"></i> Add item
            </button>

        </div>

    `);

    bindEntryTableActions(session, () => {

        navigate("audit-history");
        viewSession(id);

    });

}

async function removeSession(id) {

    if (!confirm(`Delete audit ${id}? This can't be undone.`)) return;

    try {

        await deleteSession(id);
        navigate("audit-history");

    } catch (error) {

        console.error("Failed to delete session:", error);
        alert("Couldn't delete — check your connection and try again.");

    }

}
