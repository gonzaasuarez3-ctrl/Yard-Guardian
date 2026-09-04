import { Sidebar, initSidebar } from "./components/Sidebar.js";
import { Header } from "./components/Header.js";
import { Dashboard, initDashboard } from "./components/Dashboard.js";
import { AuditSessionPage, initAuditSessionPage } from "./components/AuditSessionPage.js";
import { AuditHistoryPage, initAuditHistoryPage } from "./components/AuditHistoryPage.js";
import { ImportPage, initImportPage } from "./components/ImportPage.js";
import { WeeklyReportPage, initWeeklyReportPage } from "./components/WeeklyReportPage.js";
import { registerRoute, navigate, getCurrentRoute } from "./router.js";
import { subscribeSessions } from "./services/SessionsStore.js";
import { subscribeEntries } from "./services/EntriesStore.js";
import { subscribeTrailerDamages } from "./services/TrailerDamageService.js";
import { subscribeWorkIds } from "./services/WorkIdService.js";
import { subscribeIssues } from "./services/IssueService.js";

export class App {

    render() {

        const root = document.getElementById("root");

        root.innerHTML = `
            <div class="app">

                ${Sidebar()}

                <main class="main">

                    ${Header()}

                    <div id="app-content"></div>

                </main>

            </div>
        `;

        this.registerRoutes();

        initSidebar();

        navigate("dashboard");

        this.subscribeToLiveData();

    }

    registerRoutes() {

        registerRoute("dashboard", Dashboard, initDashboard);

        registerRoute("weekly-report", WeeklyReportPage, initWeeklyReportPage);

        registerRoute("audit-session", AuditSessionPage, initAuditSessionPage);

        registerRoute("audit-history", AuditHistoryPage, initAuditHistoryPage);

        registerRoute("import", ImportPage, initImportPage);

    }

    subscribeToLiveData() {

        const rerenderCurrentRoute = () => navigate(getCurrentRoute());

        subscribeSessions(rerenderCurrentRoute);

        subscribeEntries(rerenderCurrentRoute);

        subscribeTrailerDamages(rerenderCurrentRoute);

        subscribeWorkIds(rerenderCurrentRoute);

        subscribeIssues(rerenderCurrentRoute);

    }

}
