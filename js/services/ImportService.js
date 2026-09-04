import { toBerlinParts, getShiftForTime, getShiftBusinessDate } from "../constants.js";

const DEFAULT_GAP_MINUTES = 30;

export function parseCsvFile(file) {

    return new Promise((resolve, reject) => {

        window.Papa.parse(file, {

            header: true,
            skipEmptyLines: true,

            complete: results => resolve(results.data),

            error: reject

        });

    });

}

/**
 * Turns raw CSV rows into "rounds" — one round is a single User ID
 * doing one walk of the yard: consecutive LOCATION_AUDIT rows (sorted
 * by time) by the same user, with no gap larger than gapMinutes
 * between one scan and the next.
 */
export function extractAuditRounds(rows, gapMinutes = DEFAULT_GAP_MINUTES) {

    const auditRows = rows

        .filter(row => row["Event Type"] === "LOCATION_AUDIT" && row["Date UTC"] && row["User ID"])

        .map(row => ({

            userId: row["User ID"],
            location: row["Location"],
            utcDate: parseUtcDate(row["Date UTC"])

        }))

        .filter(row => row.utcDate && !isNaN(row.utcDate.getTime()));

    const byUser = groupBy(auditRows, row => row.userId);

    const rounds = [];

    for (const [userId, userRows] of Object.entries(byUser)) {

        const sorted = [...userRows].sort((a, b) => a.utcDate - b.utcDate);

        let currentRound = null;

        for (const row of sorted) {

            const startsNewRound = !currentRound ||
                (row.utcDate - currentRound.lastUtcDate) > gapMinutes * 60 * 1000;

            if (startsNewRound) {

                currentRound = {

                    userId,
                    startUtc: row.utcDate,
                    lastUtcDate: row.utcDate,
                    locations: [],
                    scanCount: 0

                };

                rounds.push(currentRound);

            }

            currentRound.lastUtcDate = row.utcDate;
            currentRound.scanCount += 1;

            if (row.location && !currentRound.locations.includes(row.location)) {

                currentRound.locations.push(row.location);

            }

        }

    }

    return rounds

        .map(finalizeRound)

        .sort((a, b) => a.startUtc - b.startUtc);

}

function finalizeRound(round) {

    const berlinStart = toBerlinParts(round.startUtc);

    const shift = getShiftForTime(berlinStart.hour, berlinStart.minute);

    const businessDate = getShiftBusinessDate(berlinStart, shift);

    return {

        userId: round.userId,
        locations: round.locations,
        scanCount: round.scanCount,

        startUtc: round.startUtc,

        berlinDate: businessDate,
        berlinTime: berlinStart.time,

        shift,

        // Stable id for this round, used to skip re-importing the same
        // round if the CSV export ranges overlap across uploads.
        importKey: `${round.userId}_${round.startUtc.toISOString()}`

    };

}

function parseUtcDate(value) {

    // "2026-09-04 00:11:12" has no timezone marker, but the column is
    // explicitly "Date UTC" — appending "Z" forces UTC interpretation.
    // Without it, new Date(...) parses as the browser's local time,
    // which would silently compute the wrong Berlin time and shift.
    return new Date(value.replace(" ", "T") + "Z");

}

function groupBy(items, keyFn) {

    return items.reduce((groups, item) => {

        const key = keyFn(item);

        if (!groups[key]) groups[key] = [];

        groups[key].push(item);

        return groups;

    }, {});

}

const DAMAGE_KEYWORDS = ["DAMAGE", "BROKEN", "ISSUE"];

const WORKID_KEYWORDS = ["WORK ID", "WORKID", "WORK REQUEST ID"];

function matchesKeywords(comment, keywords) {

    if (!comment) return false;

    const upper = comment.toUpperCase();

    return keywords.some(keyword => upper.includes(keyword));

}

/**
 * Both damage reports and Work IDs come from the free-text Comment
 * column on ANY row (not just LOCATION_AUDIT ones) — Trailer Damage and
 * Work ID reporting isn't tied to the audit-round grouping the way
 * extractAuditRounds() is. Each matching row becomes its own record.
 */
function buildCsvRecord(row) {

    const utcDate = parseUtcDate(row["Date UTC"] || "");

    const validDate = !isNaN(utcDate.getTime());

    const berlin = validDate ? toBerlinParts(utcDate) : null;

    const shift = berlin ? getShiftForTime(berlin.hour, berlin.minute) : null;

    const businessDate = berlin ? getShiftBusinessDate(berlin, shift) : null;

    return {

        trailerNumber: row["Vehicle #"] || row["License Plate"] || "Unknown",
        position: row["Location"] || "",
        comment: (row["Comment"] || "").trim(),
        userId: row["User ID"] || "",

        shift,

        berlinDate: businessDate,
        berlinTime: berlin?.time ?? null,

        createdAt: validDate ? utcDate.toISOString() : new Date().toISOString(),

        // Stable id from the row's own content — re-uploading an
        // overlapping CSV export just overwrites the same record
        // instead of duplicating it.
        recordKey: buildRecordKey(row)

    };

}

function buildRecordKey(row) {

    const raw = [
        row["Location"] || "",
        row["Vehicle #"] || row["License Plate"] || "",
        row["Date UTC"] || "",
        (row["Comment"] || "").slice(0, 40)
    ].join("_");

    const sanitized = raw
        .replace(/[\/\s]+/g, "-")
        .replace(/[^a-zA-Z0-9\-_.:]/g, "")
        .slice(0, 400);

    return sanitized || `record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

}

export function extractTrailerDamages(rows) {

    return rows

        .filter(row => matchesKeywords(row["Comment"], DAMAGE_KEYWORDS))

        .map(buildCsvRecord);

}

export function extractWorkIds(rows) {

    return rows

        .filter(row => matchesKeywords(row["Comment"], WORKID_KEYWORDS))

        .map(buildCsvRecord);

}

const ISSUE_EVENT_TYPES = [
    "CORRECTION-REMOVED",
    "CORRECTION-ADDED",
    "CORRECTION-DISPLACED",
    "CORRECTION-LOCATION"
];

function normalizeEventType(value) {

    return (value || "").toUpperCase().trim().replace(/[\s_]+/g, "-");

}

/**
 * "Issues" are Correction events — but only the ones a person actually
 * left a comment on. The CSV can spell these with hyphens or
 * underscores (e.g. "CORRECTION_LOCATION" vs "Correction-Location"),
 * so the comparison normalizes both to the same hyphenated form first.
 */
export function extractIssues(rows) {

    return rows

        .filter(row => {

            const eventType = normalizeEventType(row["Event Type"]);
            const comment = (row["Comment"] || "").trim();

            return ISSUE_EVENT_TYPES.includes(eventType) && comment.length > 0;

        })

        .map(row => ({

            ...buildCsvRecord(row),

            eventType: row["Event Type"] || ""

        }));

}
