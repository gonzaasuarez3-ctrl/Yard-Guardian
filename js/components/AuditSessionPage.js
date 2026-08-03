import { renderEntryTable, bindEntryTableActions } from "./EntryTable.js";
import {
    getActiveSession,
    startSession,
    completeSession
} from "../services/AuditSessionService.js";
import { navigate } from "../router.js";
import { SHIFTS, SHIFT_HOURS, getCurrentShift, todayString } from "../constants.js";

export function AuditSessionPage() {

    const session = getActiveSession();

    return session ? renderActiveSession(session) : renderStartForm();

}

function renderStartForm() {

    const suggestedShift = getCurrentShift();

    return `

        <section class="dashboard">

            <div class="dashboard__header">
                <h2 class="dashboard__title">Start Audit</h2>
                <p class="dashboard__subtitle">Only one audit can be active at a time.</p>
            </div>

            <div class="dashboard__panel dashboard__panel--narrow">

                <form id="start-session-form" class="incident-form">

                    <div class="form-group">
                        <label for="shift">Shift</label>
                        <select id="shift" required>
                            ${SHIFTS.map(shift => `
                                <option value="${shift}" ${shift === suggestedShift ? "selected" : ""}>
                                    ${shift} (${SHIFT_HOURS[shift]})
                                </option>
                            `).join("")}
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="date">Date</label>
                        <input id="date" type="date" value="${todayString()}" required>
                    </div>

                    <div class="form-group">
                        <label for="ym">YM Name</label>
                        <input id="ym" type="text" placeholder="Your name" required>
                    </div>

                    <div class="incident-form__footer" style="justify-content:flex-start;">
                        <button type="submit" class="btn btn-primary">Start Audit</button>
                    </div>

                </form>

            </div>

        </section>

    `;

}

function renderActiveSession(session) {

    return `

        <section class="dashboard">

            <div class="dashboard__header page-toolbar">

                <div>
                    <h2 class="dashboard__title">${session.shift} Shift Audit</h2>
                    <p class="dashboard__subtitle">${session.date} · YM: ${session.ym}</p>
                </div>

                <div style="display:flex; gap:12px;">
                    <button class="btn btn-primary" data-add-entry>+ Add Item</button>
                    <button class="btn btn-secondary" id="completeAuditButton">Complete Audit</button>
                </div>

            </div>

            <div class="audit-table-wrapper">

                ${renderEntryTable(session.entries, "No issues logged yet — only trailers with a problem need a row.")}

                <button class="audit-table__add-row" data-add-entry>
                    <i data-lucide="plus"></i> Add item
                </button>

            </div>

        </section>

    `;

}

export function initAuditSessionPage() {

    const session = getActiveSession();

    if (!session) {

        initStartForm();

    } else {

        bindEntryTableActions(session, () => navigate("audit-session"));

        document.getElementById("completeAuditButton")?.addEventListener("click", async () => {

            if (!confirm("Complete this audit? It will move to History.")) return;

            try {

                await completeSession(session.id);
                navigate("audit-history");

            } catch (error) {

                console.error("Failed to complete audit:", error);
                alert("Couldn't complete the audit — check your connection and try again.");

            }

        });

    }

}

function initStartForm() {

    const form = document.getElementById("start-session-form");

    if (!form) return;

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const submitButton = form.querySelector("button[type=submit]");

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Starting...";
        }

        try {

            await startSession({

                shift: document.getElementById("shift").value,
                date: document.getElementById("date").value,
                ym: document.getElementById("ym").value

            });

            navigate("audit-session");

        } catch (error) {

            console.error("Failed to start audit:", error);
            alert("Couldn't start the audit — check your connection and try again.");

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Start Audit";
            }

        }

    });

}
