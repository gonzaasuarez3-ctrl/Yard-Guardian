import {
    getWeeklyStats,
    getAuditsForWeek,
    getIssuesForWeek,
    getDamagesForWeek,
    getWorkIdsForWeek
} from "../services/DashboardService.js";
import {
    showAuditsListModal,
    showDamagesListModal,
    showWorkIdsListModal,
    showIssuesListModal
} from "./detailModals.js";
import { getWeekStart, shiftDateByDays, getCurrentBusinessDate, SHIFTS } from "../constants.js";
import { navigate } from "../router.js";

let currentWeekStart = getWeekStart(getCurrentBusinessDate());

export function WeeklyReportPage() {

    const stats = getWeeklyStats(currentWeekStart);

    const periodLabel = formatWeekLabel(stats.weekStart, stats.weekEnd);

    return `

        <section class="dashboard">

            <div class="dashboard__header page-toolbar">

                <div>
                    <h2 class="dashboard__title">Weekly Report</h2>
                    <p class="dashboard__subtitle">${periodLabel}</p>
                </div>

                <div class="week-nav">
                    <button class="btn btn-secondary" id="prevWeekButton" title="Previous week">
                        <i data-lucide="chevron-left"></i>
                    </button>
                    <button class="btn btn-secondary" id="nextWeekButton" title="Next week">
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>

            </div>

            <section class="kpi-grid">

                ${weeklyCard("audits", "clipboard-check", "Audits", `${stats.totalAudits}/${stats.totalTarget}`, stats.totalAudits >= stats.totalTarget ? "green" : "orange")}
                ${weeklyCard("issues", "alert-triangle", "Issues Found", stats.totalIssues, "orange")}
                ${weeklyCard("damages", "truck", "Trailer Damage", stats.totalDamages, "red")}
                ${weeklyCard("workids", "ticket", "Work IDs", stats.totalWorkIds, "blue")}

            </section>

            <div class="dashboard__panel" style="margin-top:24px;">

                <div class="dashboard__panel-header">
                    <span class="dashboard__panel-title">Shift Compliance by Day</span>
                    <span class="dashboard__panel-subtitle">2 audits required per shift per day</span>
                </div>

                <div class="audit-table-wrapper" style="margin-top:8px;">

                    <table class="audit-table">

                        <thead>
                            <tr>
                                <th>Day</th>
                                ${SHIFTS.map(shift => `<th>${shift}</th>`).join("")}
                            </tr>
                        </thead>

                        <tbody>
                            ${stats.days.map(day => `
                                <tr>
                                    <td>${formatDayLabel(day.date)}</td>
                                    ${SHIFTS.map(shift => {

                                        const shiftStat = day.compliance.find(c => c.shift === shift);
                                        const met = shiftStat.completed >= shiftStat.target;

                                        return `<td><span class="status-badge ${met ? "status-badge--completed" : "status-badge--open"}">${shiftStat.completed}/${shiftStat.target}</span></td>`;

                                    }).join("")}
                                </tr>
                            `).join("")}
                        </tbody>

                    </table>

                </div>

            </div>

        </section>

    `;

}

function weeklyCard(id, icon, title, value, color) {

    return `
        <article class="kpi-card kpi-card--${color} kpi-card--clickable" data-kpi-card="${id}">
            <div class="kpi-card__top">
                <div class="kpi-card__icon ${color}">
                    <i data-lucide="${icon}"></i>
                </div>
            </div>
            <h3 class="kpi-card__value">${value}</h3>
            <p class="kpi-card__title">${title}</p>
        </article>
    `;

}

function formatWeekLabel(weekStart, weekEnd) {

    const start = new Date(weekStart + "T00:00:00Z");
    const end = new Date(weekEnd + "T00:00:00Z");

    const startLabel = start.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
    const endLabel = end.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

    return `Week of ${startLabel} – ${endLabel}`;

}

function formatDayLabel(dateString) {

    const date = new Date(dateString + "T00:00:00Z");

    const weekday = date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });

    const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

    return `${weekday}, ${day}`;

}

export function initWeeklyReportPage() {

    document.getElementById("prevWeekButton")?.addEventListener("click", () => {

        currentWeekStart = shiftDateByDays(currentWeekStart, -7);

        navigate("weekly-report");

    });

    document.getElementById("nextWeekButton")?.addEventListener("click", () => {

        currentWeekStart = shiftDateByDays(currentWeekStart, 7);

        navigate("weekly-report");

    });

    document.querySelectorAll("[data-kpi-card]").forEach(card => {

        card.addEventListener("click", () => openKpiDetail(card.dataset.kpiCard));

    });

}

function openKpiDetail(cardId) {

    const periodLabel = formatWeekLabel(currentWeekStart, shiftDateByDays(currentWeekStart, 6));

    if (cardId === "audits") {

        showAuditsListModal(getAuditsForWeek(currentWeekStart), periodLabel);

    } else if (cardId === "damages") {

        showDamagesListModal(getDamagesForWeek(currentWeekStart), periodLabel);

    } else if (cardId === "workids") {

        showWorkIdsListModal(getWorkIdsForWeek(currentWeekStart), periodLabel);

    } else if (cardId === "issues") {

        showIssuesListModal(getIssuesForWeek(currentWeekStart), periodLabel);

    }

}
