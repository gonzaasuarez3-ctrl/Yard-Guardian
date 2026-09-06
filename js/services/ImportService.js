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
const SUSPECTED_ROW_CAP = 2950;

/**
 * Amazon's Event Report export appears to cap out around 3000 rows —
 * asking for a wide date range on a busy yard can silently return only
 * a few hours before hitting that cap, with no error or indication in
 * the file itself. This looks at what the file actually contains (not
 * what the person intended to export) so the Import page can warn when
 * it looks cut short instead of the person only noticing later because
 * a week's worth of audits came back as one day.
 */
export function getFileCoverageSummary(rows) {

    const validDates = rows

        .map(row => parseUtcDate(row["Date UTC"] || ""))

        .filter(date => !isNaN(date.getTime()));

    if (validDates.length === 0) {

        return { rowCount: rows.length, earliest: null, latest: null, spanHours: 0, likelyTruncated: false };

    }

    const earliest = new Date(Math.min(...validDates));

    const latest = new Date(Math.max(...validDates));

    const spanHours = (latest - earliest) / (1000 * 60 * 60);

    return {

        rowCount: rows.length,

        earliest,
        latest,
        spanHours,

        // Suspicious combination: hit (or nearly hit) the row cap AND
        // covers noticeably less than a full day — a genuine short
        // export (e.g. someone intentionally pulling 2 hours) wouldn't
        // usually also be sitting right at the row limit.
        likelyTruncated: rows.length >= SUSPECTED_ROW_CAP && spanHours < 20

    };

}

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

    if (!value) return new Date(NaN);

    const trimmed = value.trim();

    // "2026-09-04 00:11:12" — no timezone marker, but the column is
    // explicitly "Date UTC", so this is parsed as UTC explicitly rather
    // than relying on new Date() (which would use the browser's local
    // timezone for a string with no "Z"/offset).
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);

    if (isoMatch) {

        const [, year, month, day, hour, minute, second] = isoMatch;

        return new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, second ? +second : 0));

    }

    // "9/4/2026 17:53" or "9/4/2026 17:53:23" — some exports use
    // month/day/year with no leading zeros and no seconds. Amazon's own
    // UI renders dates month-first ("Sep 4, 2026"), so slash dates here
    // are treated as M/D/YYYY, not D/M/YYYY.
    const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);

    if (usMatch) {

        const [, month, day, year, hour, minute, second] = usMatch;

        return new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute, second ? +second : 0));

    }

    // Last resort — may parse as local time if the format is unexpected,
    // but better than refusing outright.
    return new Date(trimmed);

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

    // Deliberately excludes Date UTC: the same persistent damage/note
    // gets re-logged across multiple CSV rows on different dates with
    // otherwise identical content (trailer, location, comment) — keying
    // on the timestamp would treat every re-log as a new record instead
    // of recognizing it as the same one. A genuinely different comment
    // (new information) still produces a new key, which is correct.
    const raw = [
        row["Location"] || "",
        row["Vehicle #"] || row["License Plate"] || "",
        (row["Comment"] || "").trim()
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
    "CORRECTION-DISPLACED"
];

function normalizeEventType(value) {

    // Collapses any run of spaces, underscores, AND hyphens into a
    // single hyphen — needed because "Correction - Added" (space,
    // hyphen, space) would otherwise become "CORRECTION---ADDED"
    // (each space separately turned into its own hyphen alongside the
    // literal one), which never matches "CORRECTION-ADDED".
    return (value || "").toUpperCase().trim().replace(/[\s_-]+/g, "-");

}

/**
 * "Issues" are any Correction event: Removed, Added, or Displaced.
 * (Correction-Location is deliberately excluded — it's high-volume and
 * mostly routine, unlike the other three.) No comment requirement
 * anymore — every row of these three types counts.
 */
export function extractIssues(rows) {

    return rows

        .filter(row => {

            const eventType = normalizeEventType(row["Event Type"]);

            return ISSUE_EVENT_TYPES.includes(eventType);

        })

        .map(row => buildIssueRecord(row, rows));

}

/**
 * A Correction row (e.g. "Correction - Removed") is sometimes logged
 * with no location and no comment of its own — the row alone doesn't
 * say where the vehicle was. When that happens, this walks backward
 * through every other row for the same vehicle (matched by Vehicle #
 * or License Plate, whichever the row has) to find its most recent
 * prior location, and keeps a short trail of what led up to it so that
 * can be reviewed later instead of just guessing from the bare event.
 */
function buildIssueRecord(row, allRows) {

    const record = buildCsvRecord(row);

    const originalPosition = record.position;

    let resolvedPosition = originalPosition;
    let positionInferred = false;
    let precedingEvents = [];

    if (!originalPosition) {

        const issueDate = parseUtcDate(row["Date UTC"] || "");

        precedingEvents = findPrecedingEvents(allRows, record.trailerNumber, issueDate);

        const priorWithLocation = precedingEvents.find(event => event.location);

        if (priorWithLocation) {

            resolvedPosition = priorWithLocation.location;
            positionInferred = true;

        }

    }

    return {

        ...record,

        position: resolvedPosition,
        positionInferred,
        precedingEvents,

        eventType: row["Event Type"] || ""

    };

}

function findPrecedingEvents(rows, vehicleId, beforeDate, limit = 5) {

    if (!vehicleId || isNaN(beforeDate.getTime())) return [];

    return rows

        .filter(row => {

            const matchesVehicle = row["Vehicle #"] === vehicleId || row["License Plate"] === vehicleId;

            if (!matchesVehicle) return false;

            const rowDate = parseUtcDate(row["Date UTC"] || "");

            return !isNaN(rowDate.getTime()) && rowDate < beforeDate;

        })

        .map(row => ({

            eventType: row["Event Type"] || "",
            location: row["Location"] || "",
            comment: (row["Comment"] || "").trim(),
            dateUtc: row["Date UTC"] || ""

        }))

        .sort((a, b) => new Date(b.dateUtc) - new Date(a.dateUtc))

        .slice(0, limit);

}
