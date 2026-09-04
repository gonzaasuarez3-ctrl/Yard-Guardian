import { parseCsvFile, extractAuditRounds } from "../services/ImportService.js";
import { importSession, isImportKeyUsed } from "../services/AuditSessionService.js";
import { Table } from "./table.js";

let detectedRounds = [];

export function ImportPage() {

    return `

        <section class="dashboard">

            <div class="dashboard__header">
                <h2 class="dashboard__title">Import Location Audits</h2>
                <p class="dashboard__subtitle">Subí el CSV de eventos (Valet) para registrar como audit las rondas hechas fuera de esta app.</p>
            </div>

            <div class="dashboard__panel dashboard__panel--narrow">

                <div class="form-group">
                    <label for="csvFile">Archivo CSV (eventReport)</label>
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

        setStatus("Leyendo archivo...");

        try {

            const rows = await parseCsvFile(file);

            detectedRounds = extractAuditRounds(rows);

            if (detectedRounds.length === 0) {

                setStatus("No se encontraron filas LOCATION_AUDIT en este archivo.");
                document.getElementById("importPreviewContainer").innerHTML = "";
                return;

            }

            setStatus(`${detectedRounds.length} ronda(s) detectada(s). Revisá y confirmá cuáles importar.`);

            renderPreview();

        } catch (error) {

            console.error("Failed to parse CSV:", error);

            setStatus("No se pudo leer el archivo — confirmá que es el CSV exportado correctamente.");

        }

    });

    // The page can be re-rendered mid-import (the live data subscription
    // re-renders the current route after every successful write) — this
    // restores the preview instead of losing it, since detectedRounds
    // itself lives in module scope and survives the DOM being replaced.
    if (detectedRounds.length > 0) {

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

    const table = Table({

        columns: [

            {
                label: "",
                render: row => row.alreadyImported
                    ? `<span style="color:var(--color-text-muted); font-size:12px;">Ya importado</span>`
                    : `<input type="checkbox" class="round-checkbox" data-key="${row.importKey}" checked>`
            },
            { label: "Usuario", key: "userId" },
            { label: "Fecha (Berlin)", key: "berlinDate" },
            { label: "Hora (Berlin)", key: "berlinTime" },
            { label: "Turno", key: "shift" },
            { label: "Locations", render: row => row.locations.length },
            { label: "Scans", key: "scanCount" }

        ],

        rows,

        emptyMessage: "No hay rondas para mostrar."

    });

    container.innerHTML = `

        <div class="audit-table-wrapper" style="margin-top:24px;">
            ${table}
        </div>

        <div style="margin-top:16px;">
            <button class="btn btn-primary" id="confirmImportButton">Importar seleccionados</button>
        </div>

    `;

    if (window.lucide) window.lucide.createIcons();

    document.getElementById("confirmImportButton")?.addEventListener("click", handleConfirmImport);

}

async function handleConfirmImport() {

    const selectedKeys = [...document.querySelectorAll(".round-checkbox:checked")]
        .map(checkbox => checkbox.dataset.key);

    const roundsToImport = detectedRounds.filter(round => selectedKeys.includes(round.importKey));

    if (roundsToImport.length === 0) {

        setStatus("No seleccionaste ninguna ronda para importar.");

        return;

    }

    setStatus(`Importando ${roundsToImport.length} ronda(s)...`);

    let imported = 0;

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

            if (result) imported += 1;

        } catch (error) {

            console.error("Failed to import round:", round.importKey, error);

        }

    }

    setStatus(`${imported} audit(s) importado(s) correctamente.`);

    renderPreview();

}
