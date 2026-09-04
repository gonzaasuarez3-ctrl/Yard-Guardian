import { KpiCards } from "./kpiCards.js";
import { ShiftCompliancePanel } from "./ShiftCompliancePanel.js";
import { IssueBadge } from "./badge.js";
import { Modal } from "./modal.js";
import { Table } from "./table.js";
import {
    getDashboardStats,
    getAuditsToday,
    getTrailerDamagesToday,
    getWorkIdsToday
} from "../services/DashboardService.js";
import { getActiveSession, getAllEntries } from "../services/AuditSessionService.js";
import { navigate } from "../router.js";
import { todayString } from "../constants.js";

const modal = new Modal();

export function Dashboard() {

    const stats = getDashboardStats();

    const activeSession = getActiveSession();

    const recentEntries = getAllEntries()
        .filter(entry => entry.date === todayString())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6);

    return `

        <section class="dashboard">

            <div class="dashboard__header page-toolbar">

                <div>
                    <h2 class="dashboard__title">Yard Overview</h2>
                    <p class="dashboard__subtitle">BER8 Trailer Audit — today at a glance.</p>
                </div>

                <button class="btn btn-primary" id="goToAuditButton">
                    ${activeSession ? "Resume Audit" : "Start Audit"}
                </button>

            </div>

            ${KpiCards(stats)}

            ${ShiftCompliancePanel(stats.compliance)}

            <div class="dashboard__panel" style="margin-top:24px;">

                <div class="dashboard__panel-header">
                    <span class="dashboard__panel-title">Recent Issues</span>
                    <span class="dashboard__panel-subtitle">Logged today, most recent first</span>
                </div>

                ${recentEntries.length === 0
                    ? `<p class="audit-table__empty">No issues logged today yet.</p>`
                    : recentEntries.map(entry => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid var(--color-border);">
                            <div>
                                <strong style="color:white;">${entry.trailerId}</strong>
                                <span style="color:var(--color-text-muted); margin-left:8px;">${entry.shift} · ${entry.parkingPosition || "—"}</span>
                            </div>
                            ${IssueBadge(entry.issueType)}
                        </div>
                    `).join("")
                }

            </div>

        </section>

    `;

}

export function initDashboard() {

    const button = document.getElementById("goToAuditButton");

    if (button) {

        button.addEventListener("click", () => navigate("audit-session"));

    }

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
