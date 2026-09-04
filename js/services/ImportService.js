import { toBerlinParts, getShiftForTime } from "../constants.js";

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

    return {

        userId: round.userId,
        locations: round.locations,
        scanCount: round.scanCount,

        startUtc: round.startUtc,

        berlinDate: berlinStart.date,
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
