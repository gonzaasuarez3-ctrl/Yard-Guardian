import { navigate } from "../router.js";

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

                <a class="sidebar__item" data-route="audit-session">
                    <i data-lucide="clipboard-check"></i>
                    <span>Audit</span>
                </a>

                <a class="sidebar__item" data-route="audit-history">
                    <i data-lucide="history"></i>
                    <span>History</span>
                </a>

            </nav>

        </div>

        <div class="sidebar__footer">

            <div class="sidebar__shift">

                <div class="sidebar__shift-label">
                    BER8 OPERATIONS
                </div>

                <div class="sidebar__shift-name">
                    <i data-lucide="truck"></i>
                    Trailer Audit
                </div>

                <div class="sidebar__shift-hours">
                    Protect the yard.
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

}
