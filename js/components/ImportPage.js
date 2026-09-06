import { parseCsvFile, extractAuditRounds, extractTrailerDamages, extractWorkIds, extractIssues, getFileCoverageSummary } from "../services/ImportService.js";
import { importSession, isImportKeyUsed } from "../services/AuditSessionService.js";
import { importTrailerDamage, clearAllTrailerDamages } from "../services/TrailerDamageService.js";
import { importWorkId, clearAllWorkIds } from "../services/WorkIdService.js";
import { importIssue, clearAllIssues } from "../services/IssueService.js";
import { Table } from "./table.js";

let detectedRounds = [];
let detectedDamages = [];
let detectedWorkIds = [];
let detectedIssues = [];

export function ImportPage() {

    return `

        <section class="dashboard">

            <div class="dashboard__header">
                <h2 class="dashboard__title">Import Location Audits</h2>
                <p class="dashboard__subtitle">Upload the events CSV (Valet) to record audits, Trailer Damage, and Work IDs.</p>
            </div>

            <div class="dashboard__panel dashboard__panel--narrow">

                <div class="form-group">
                    <label for="csvFile">CSV file (eventReport)</label>
                    <input id="csvFile" type="file" accept=".csv">
                </div>

                <p id="importStatus" style="color:var(--color-text-muted); font-size:var(--text-sm); margin-top:8px;"></p>

                <div id="coverageWarning"></div>

            </div>

            <div id="importPreviewContainer"></div>

            <div class="dashboard__panel" style="margin-top:24px; border-color: rgba(239, 68, 68, .25);">

                <div class="dashboard__panel-header">
                    <span class="dashboard__panel-title">Danger Zone</span>
                    <span class="dashboard__panel-subtitle">Wipe CSV-derived data — useful after a matching-logic change leaves stale records behind</span>
                </div>

                <p id="clearStatus" style="color:var(--color-text-muted); font-size:var(--text-sm); margin: 8px 0 16px 0;"></p>

                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <button class="btn btn-secondary" id="clearIssuesButton">Clear all Issues</button>
                    <button class="btn btn-secondary" id="clearDamagesButton">Clear all Trailer Damage</button>
                    <button class="btn btn-secondary" id="clearWorkIdsButton">Clear all Work IDs</button>
                </div>

            </div>

        </section>

    `;

}

export function initImportPage() {

    const fileInput = document.getElementById("csvFile");

    fileInput?.addEventListener("change", async () => {

        const file = fileInput.files[0];

        if (!file) return;

        setStatus("Reading file...");

        try {

            const rows = await parseCsvFile(file);

            showCoverageSummary(rows);

            detectedRounds = extractAuditRounds(rows);
            detectedDamages = extractTrailerDamages(rows);
            detectedWorkIds = extractWorkIds(rows);
            detectedIssues = extractIssues(rows);

            if (detectedRounds.length === 0 && detectedDamages.length === 0 && detectedWorkIds.length === 0 && detectedIssues.length === 0) {

                setStatus("No audits, Trailer Damage, Work IDs, or Issues found in this file.");
                document.getElementById("importPreviewContainer").innerHTML = "";
                return;

            }

            setStatus(`${detectedRounds.length} audit round(s), ${detectedDamages.length} Trailer Damage, ${detectedWorkIds.length} Work ID, ${detectedIssues.length} Issue(s) detected. Review and confirm.`);

            renderPreview();

        } catch (error) {

            console.error("Failed to parse CSV:", error);

            setStatus("Couldn't read the file — confirm it's the correctly exported CSV.");

        }

    });

    // The page can be re-rendered mid-import (the live data subscription
    // re-renders the current route after every successful write) — this
    // restores the preview instead of losing it, since the detected
    // arrays live in module scope and survive the DOM being replaced.
    if (detectedRounds.length > 0 || detectedDamages.length > 0 || detectedWorkIds.length > 0 || detectedIssues.length > 0) {

        renderPreview();

    }

    document.getElementById("clearIssuesButton")?.addEventListener("click", () =>
        handleClear("Issues", clearAllIssues)
    );

    document.getElementById("clearDamagesButton")?.addEventListener("click", () =>
        handleClear("Trailer Damage", clearAllTrailerDamages)
    );

    document.getElementById("clearWorkIdsButton")?.addEventListener("click", () =>
        handleClear("Work IDs", clearAllWorkIds)
    );

}

function setClearStatus(message) {

    const status = document.getElementById("clearStatus");

    if (status) status.textContent = message;

}

async function handleClear(label, clearFn) {

    if (!confirm(`Delete every ${label} record? This can't be undone — you can re-import from a CSV afterward.`)) return;

    setClearStatus(`Deleting ${label}...`);

    try {

        const count = await clearFn();

        setClearStatus(`Deleted ${count} ${label} record(s).`);

    } catch (error) {

        console.error(`Failed to clear ${label}:`, error);

        setClearStatus(`Couldn't delete ${label} — check your connection and try again.`);

    }

}

function showCoverageSummary(rows) {

    const container = document.getElementById("coverageWarning");

    if (!container) return;

    const coverage = getFileCoverageSummary(rows);

    if (!coverage.earliest) {

        container.innerHTML = "";
        return;

    }

    const format = date => date.toLocaleString("en-GB", {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    });

    const rangeText = `Covers ${format(coverage.earliest)} – ${format(coverage.latest)} UTC (${coverage.rowCount} rows).`;

    if (coverage.likelyTruncated) {

        container.innerHTML = `
            <p style="color:var(--color-warning); font-size:var(--text-sm); margin-top:8px;">
                ⚠️ ${rangeText} This is close to Yard Management's row cap and covers less
                than a day — if you asked for a wider range, it was likely cut short.
                Try exporting in smaller chunks (e.g. one day at a time).
            </p>
        `;

    } else {

        container.innerHTML = `
            <p style="color:var(--color-text-muted); font-size:var(--text-sm); margin-top:8px;">
                ${rangeText}
            </p>
        `;

    }

}

function setStatus(message) {

    const status = document.getElementById("importStatus");

    if (status) status.textContent = message;

}

function renderPreview() {

    const container = document.getElementById("importPreviewContainer");

    if (!container) return;

    const rows = detectedRounds.map(round => ({

        ...round,

        alreadyImported: isImportKeyUsed(round.importKey)

    }));

    const roundsTable = Table({

        columns: [

            {
                label: "",
                render: row => row.alreadyImported
                    ? `<span style="color:var(--color-text-muted); font-size:12px;">Already imported</span>`
                    : `<input type="checkbox" class="round-checkbox" data-key="${row.importKey}" checked>`
            },
            { label: "User", key: "userId" },
            { label: "Date (Berlin)", key: "berlinDate" },
            { label: "Time (Berlin)", key: "berlinTime" },
            { label: "Shift", key: "shift" },
            { label: "Locations", render: row => row.locations.length },
            { label: "Scans", key: "scanCount" }

        ],

        rows,

        emptyMessage: "No audit rounds to show."

    });

    container.innerHTML = `

        <div class="dashboard__panel" style="margin-top:24px;">
            <div class="dashboard__panel-header">
                <span class="dashboard__panel-title">Audit Rounds</span>
                <span class="dashboard__panel-subtitle">Choose which to import — already-imported ones are skipped automatically.</span>
            </div>
        </div>

        <div class="audit-table-wrapper" style="margin-top:8px;">
            ${roundsTable}
        </div>

        <p style="color:var(--color-text-muted); font-size:var(--text-sm); margin-top:16px;">
            Trailer Damage, Work IDs, and Issues detected are imported automatically on confirm (${detectedDamages.length} Trailer Damage, ${detectedWorkIds.length} Work ID, ${detectedIssues.length} Issue) — no need to select them, and they won't be duplicated if already imported.
        </p>

        <div style="margin-top:16px;">
            <button class="btn btn-primary" id="confirmImportButton">Import selected</button>
        </div>

    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById("confirmImportButton")?.addEventListener("click", handleConfirmImport);

}

async function handleConfirmImport() {

    const selectedKeys = [...document.querySelectorAll(".round-checkbox:checked")]
        .map(checkbox => checkbox.dataset.key);

    const roundsToImport = detectedRounds.filter(round => selectedKeys.includes(round.importKey));

    const totalToImport = roundsToImport.length + detectedDamages.length + detectedWorkIds.length;

    if (totalToImport === 0) {

        setStatus("Nothing to import.");

        return;

    }

    setStatus(`Importing ${roundsToImport.length} round(s), ${detectedDamages.length} Trailer Damage, ${detectedWorkIds.length} Work ID, ${detectedIssues.length} Issue(s)...`);

    let importedRounds = 0;

    for (const round of roundsToImport) {

        try {

            const result = await importSession({

                shift: round.shift,
                date: round.berlinDate,
                ym: round.userId,
                locations: round.locations,
                scanCount: round.scanCount,
                startUtc: round.startUtc.toISOString(),
                importKey: round.importKey

            });

            if (result) importedRounds += 1;

        } catch (error) {

            console.error("Failed to import round:", round.importKey, error);

        }

    }

    for (const damage of detectedDamages) {

        try {

            await importTrailerDamage(damage);

        } catch (error) {

            console.error("Failed to import trailer damage:", damage.recordKey, error);

        }

    }

    for (const workId of detectedWorkIds) {

        try {

            await importWorkId(workId);

        } catch (error) {

            console.error("Failed to import work id:", workId.recordKey, error);

        }

    }

    for (const issue of detectedIssues) {

        try {

            await importIssue(issue);

        } catch (error) {

            console.error("Failed to import issue:", issue.recordKey, error);

        }

    }

    setStatus(`Done: ${importedRounds} audit(s), ${detectedDamages.length} Trailer Damage, ${detectedWorkIds.length} Work ID, ${detectedIssues.length} Issue(s) processed.`);

    renderPreview();

}
