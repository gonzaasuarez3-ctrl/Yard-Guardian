import { navigate } from "../router.js";
import { authReady } from "../services/FirebaseService.js";

export function Sidebar() {

    return `

    <aside class="sidebar">

        <div class="sidebar__top">

            <div class="sidebar__brand">

                <img
                    class="sidebar__brand-logo"
                    src="assets/logo/Bear.png"
                    alt="BER8 Logo">

            </div>

            <nav class="sidebar__menu">

                <a class="sidebar__item" data-route="dashboard">
                    <i data-lucide="layout-dashboard"></i>
                    <span>Dashboard</span>
                </a>

                <a class="sidebar__item" data-route="weekly-report">
                    <i data-lucide="calendar-range"></i>
                    <span>Weekly</span>
                </a>

                <a class="sidebar__item" data-route="audit-history">
                    <i data-lucide="history"></i>
                    <span>History</span>
                </a>

                <a class="sidebar__item" data-route="import">
                    <i data-lucide="upload"></i>
                    <span>Import</span>
                </a>

            </nav>

        </div>

        <div class="sidebar__footer">

            <div class="sidebar__shift">

                <div class="sidebar__shift-label">
                    BER8 Operations
                </div>

                <div class="sidebar__status">
                    <span class="sidebar__status-dot" id="connectionDot"></span>
                    <span id="connectionLabel">Connecting…</span>
                </div>

                <div class="sidebar__credit">
                    Built by Gonzsuar
                </div>

            </div>

        </div>

    </aside>

    `;

}

export function initSidebar() {

    document.querySelectorAll(".sidebar__item[data-route]").forEach(link => {

        link.addEventListener("click", () => navigate(link.dataset.route));

    });

    authReady.then(() => {

        document.getElementById("connectionDot")?.classList.add("sidebar__status-dot--live");

        const label = document.getElementById("connectionLabel");

        if (label) label.textContent = "Live";

    });

}
