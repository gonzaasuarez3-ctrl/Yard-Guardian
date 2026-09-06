import { Modal } from "./modal.js";
import { Table } from "./table.js";

const modal = new Modal();
const historyModal = new Modal();

export function showAuditsListModal(audits, periodLabel) {

    const table = Table({

        columns: [
            { label: "Login", key: "ym" },
            { label: "Date", key: "date" },
            { label: "Shift", key: "shift" }
        ],

        rows: audits,

        emptyMessage: `No audits recorded ${periodLabel.toLowerCase()}.`

    });

    modal.open(`
        <h2 class="modal-title">Audits — ${periodLabel}</h2>
        <div class="audit-table-wrapper" style="margin-top:16px;">
            ${table}
        </div>
    `);

}

export function showDamagesListModal(damages, periodLabel) {

    const table = Table({

        columns: [
            { label: "Trailer", key: "trailerNumber" },
            { label: "Position", key: "position" },
            { label: "Reason", key: "comment" }
        ],

        rows: damages,

        emptyMessage: `No Trailer Damage recorded ${periodLabel.toLowerCase()}.`

    });

    modal.open(`
        <h2 class="modal-title">Trailer Damage — ${periodLabel}</h2>
        <div class="audit-table-wrapper" style="margin-top:16px;">
            ${table}
        </div>
    `);

}

export function showWorkIdsListModal(workIds, periodLabel) {

    const table = Table({

        columns: [
            { label: "Work ID", key: "comment" },
            { label: "Trailer", key: "trailerNumber" },
            { label: "Position", key: "position" }
        ],

        rows: workIds,

        emptyMessage: `No Work IDs recorded ${periodLabel.toLowerCase()}.`

    });

    modal.open(`
        <h2 class="modal-title">Work IDs — ${periodLabel}</h2>
        <div class="audit-table-wrapper" style="margin-top:16px;">
            ${table}
        </div>
    `);

}

export function showIssuesListModal(issues, periodLabel) {

    const table = Table({

        columns: [
            { label: "Event", key: "eventType" },
            { label: "Trailer", key: "trailerNumber" },
            {
                label: "Position",
                render: row => row.positionInferred
                    ? `${row.position || "—"} <span class="status-badge status-badge--other" style="margin-left:6px;">inferred</span>`
                    : (row.position || "—")
            },
            { label: "Comment", key: "comment" },
            {
                label: "",
                render: (row, index) => row.precedingEvents?.length
                    ? `<button class="needs-workid-row__action" data-history-index="${index}">View History</button>`
                    : ""
            }
        ],

        rows: issues,

        emptyMessage: `No issues recorded ${periodLabel.toLowerCase()}.`

    });

    modal.open(`
        <h2 class="modal-title">Issues Found — ${periodLabel}</h2>
        <div class="audit-table-wrapper" style="margin-top:16px;">
            ${table}
        </div>
    `);

    document.querySelectorAll("[data-history-index]").forEach(button => {

        button.addEventListener("click", () => {

            const issue = issues[Number(button.dataset.historyIndex)];

            showIssueHistory(issue);

        });

    });

}

/**
 * Separate modal instance so this stacks on top of the Issues list
 * instead of replacing it — Modal.open() closes whatever that same
 * instance had open, so History needs its own instance to not close
 * the Issues modal underneath it.
 */
function showIssueHistory(issue) {

    const historyTable = Table({

        columns: [
            { label: "Event", key: "eventType" },
            { label: "Location", render: row => row.location || "—" },
            { label: "Comment", render: row => row.comment || "—" },
            { label: "Date (UTC)", key: "dateUtc" }
        ],

        rows: issue.precedingEvents,

        emptyMessage: "No earlier events found for this vehicle."

    });

    historyModal.open(`
        <h2 class="modal-title">${issue.trailerNumber} — Prior Events</h2>
        <p style="color:var(--color-text-muted); font-size:var(--text-sm); margin-top:4px;">
            This Correction had no location of its own — most recent events for this
            vehicle beforehand, newest first. Resolved position: <strong style="color:var(--color-text);">${issue.position || "—"}</strong>
        </p>
        <div class="audit-table-wrapper" style="margin-top:16px;">
            ${historyTable}
        </div>
    `);

}
