import { parseCsvFile, extractAuditRounds, extractTrailerDamages, extractWorkIds } from "../services/ImportService.js";
import { importSession, isImportKeyUsed } from "../services/AuditSessionService.js";
import { importTrailerDamage } from "../services/TrailerDamageService.js";
import { importWorkId } from "../services/WorkIdService.js";
import { Table } from "./table.js";

let detectedRounds = [];
let detectedDamages = [];
let detectedWorkIds = [];

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

            </div>

            <div id="importPreviewContainer"></div>

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

            detectedRounds = extractAuditRounds(rows);
            detectedDamages = extractTrailerDamages(rows);
            detectedWorkIds = extractWorkIds(rows);

            if (detectedRounds.length === 0 && detectedDamages.length === 0 && detectedWorkIds.length === 0) {

                setStatus("No audits, Trailer Damage, or Work IDs found in this file.");
                document.getElementById("importPreviewContainer").innerHTML = "";
                return;

            }

            setStatus(`${detectedRounds.length} audit round(s), ${detectedDamages.length} Trailer Damage, ${detectedWorkIds.length} Work ID detected. Review and confirm.`);

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
    if (detectedRounds.length > 0 || detectedDamages.length > 0 || detectedWorkIds.length > 0) {

        renderPreview();

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
            Trailer Damage and Work IDs detected are imported automatically on confirm (${detectedDamages.length} Trailer Damage, ${detectedWorkIds.length} Work ID) — no need to select them, and they won't be duplicated if already imported.
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

    setStatus(`Importing ${roundsToImport.length} round(s), ${detectedDamages.length} Trailer Damage, ${detectedWorkIds.length} Work ID...`);

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

    setStatus(`Done: ${importedRounds} audit(s), ${detectedDamages.length} Trailer Damage, ${detectedWorkIds.length} Work ID processed.`);

    renderPreview();

}
