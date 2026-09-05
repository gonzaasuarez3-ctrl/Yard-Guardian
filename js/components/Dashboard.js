import { KpiCards } from "./kpiCards.js";
import { ShiftCompliancePanel } from "./ShiftCompliancePanel.js";
import { Modal } from "./modal.js";
import { Table } from "./table.js";
import {
    getDashboardStats,
    getAuditsToday,
    getTrailerDamagesToday,
    getWorkIdsToday,
    getIssuesToday,
    getDamagesNeedingWorkId
} from "../services/DashboardService.js";

const modal = new Modal();

// Where a Work ID ticket actually gets opened — shown next to any
// damage that doesn't have one yet.
const AAP_TICKET_URL = "https://aap-eu.corp.amazon.com/page/734fec2a-5bc1-4930-bcbc-261a6ade0ff3";

export function Dashboard() {

    const stats = getDashboardStats();

    const needsWorkId = getDamagesNeedingWorkId();

    return `

        <section class="dashboard">

            <div class="dashboard__header">

                <h2 class="dashboard__title">Yard Overview</h2>
                <p class="dashboard__subtitle">BER8 Trailer Audit — today at a glance.</p>

            </div>


            ${KpiCards(stats)}

            ${ShiftCompliancePanel(stats.compliance)}

            <div class="dashboard__panel" style="margin-top:24px;">

                <div class="dashboard__panel-header">
                    <span class="dashboard__panel-title">Needs Work ID</span>
                    <a href="${AAP_TICKET_URL}" target="_blank" rel="noopener" class="dashboard__panel-link">
                        AAP: New Unplanned Request
                    </a>
                </div>

                ${needsWorkId.length === 0
                    ? `<p class="audit-table__empty">Every recorded Trailer Damage has a Work ID.</p>`
                    : needsWorkId.slice(0, 8).map(damage => `
                        <div class="needs-workid-row">
                            <div>
                                <strong style="color:var(--color-text);">${damage.trailerNumber}</strong>
                                <span style="color:var(--color-text-muted); margin-left:8px;">${damage.position || "—"} · ${damage.comment}</span>
                            </div>
                            <a href="${AAP_TICKET_URL}" target="_blank" rel="noopener" class="needs-workid-row__action">
                                Open Ticket
                            </a>
                        </div>
                    `).join("")
                }

                ${needsWorkId.length > 8
                    ? `<p class="dashboard__panel-subtitle" style="margin-top:12px;">+${needsWorkId.length - 8} more without a Work ID</p>`
                    : ""
                }

            </div>

        </section>

    `;

}

export function initDashboard() {

    document.querySelectorAll("[data-kpi-card]").forEach(card => {

        card.addEventListener("click", () => openKpiDetail(card.dataset.kpiCard));

    });

}

function openKpiDetail(cardId) {

    if (cardId === "audits") {

        showAuditsModal();

    } else if (cardId === "damages") {

        showDamagesModal();

    } else if (cardId === "workids") {

        showWorkIdsModal();

    } else if (cardId === "issues") {

        showIssuesModal();

    }

}

function showAuditsModal() {

    const audits = getAuditsToday();

    const table = Table({

        columns: [
            { label: "Login", key: "ym" },
            { label: "Date", key: "date" },
            { label: "Shift", key: "shift" }
        ],

        rows: audits,

        emptyMessage: "No audits recorded today."

    });

    modal.open(`
        <h2 class="modal-title">Audits — Today</h2>
        <div class="audit-table-wrapper" style="margin-top:16px;">
            ${table}
        </div>
    `);

}

function showDamagesModal() {

    const damages = getTrailerDamagesToday();

    const table = Table({

        columns: [
            { label: "Trailer", key: "trailerNumber" },
            { label: "Position", key: "position" },
            { label: "Reason", key: "comment" }
        ],

        rows: damages,

        emptyMessage: "No Trailer Damage recorded today."

    });

    modal.open(`
        <h2 class="modal-title">Trailer Damage — Today</h2>
        <div class="audit-table-wrapper" style="margin-top:16px;">
            ${table}
        </div>
    `);

}

function showWorkIdsModal() {

    const workIds = getWorkIdsToday();

    const table = Table({

        columns: [
            { label: "Work ID", key: "comment" },
            { label: "Trailer", key: "trailerNumber" },
            { label: "Position", key: "position" }
        ],

        rows: workIds,

        emptyMessage: "No Work IDs recorded today."

    });

    modal.open(`
        <h2 class="modal-title">Work IDs — Today</h2>
        <div class="audit-table-wrapper" style="margin-top:16px;">
            ${table}
        </div>
    `);

}

const historyModal = new Modal();

function showIssuesModal() {

    const issues = getIssuesToday();

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

        emptyMessage: "No issues recorded today."

    });

    modal.open(`
        <h2 class="modal-title">Issues Found — Today</h2>
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
