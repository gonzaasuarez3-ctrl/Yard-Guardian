import { KpiCards } from "./kpiCards.js";
import { ShiftCompliancePanel } from "./ShiftCompliancePanel.js";
import {
    showAuditsListModal,
    showDamagesListModal,
    showWorkIdsListModal,
    showIssuesListModal
} from "./detailModals.js";
import {
    getDashboardStats,
    getAuditsToday,
    getTrailerDamagesToday,
    getWorkIdsToday,
    getIssuesToday,
    getDamagesNeedingWorkId
} from "../services/DashboardService.js";

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

        showAuditsListModal(getAuditsToday(), "Today");

    } else if (cardId === "damages") {

        showDamagesListModal(getTrailerDamagesToday(), "Today");

    } else if (cardId === "workids") {

        showWorkIdsListModal(getWorkIdsToday(), "Today");

    } else if (cardId === "issues") {

        showIssuesListModal(getIssuesToday(), "Today");

    }

}
