export const SHIFTS = ["Early", "Twilight", "Night"];

export const SHIFT_HOURS = {
    "Early": "06:00 - 11:30",
    "Twilight": "11:45 - 20:30",
    "Night": "20:45 - 06:00"
};

// Used to classify an arbitrary time-of-day into a shift (see
// getShiftForTime below) — the official start of each shift, in
// minutes since midnight, Berlin local time.
const SHIFT_START_MINUTES = {
    "Early": 6 * 60,
    "Twilight": 11 * 60 + 45,
    "Night": 20 * 60 + 45
};

export const ISSUE_TYPES = ["Damage", "Mismatch", "Missing Trailer", "Other"];

export const AUDITS_PER_SHIFT_TARGET = 2;

const berlinFormatter = new Intl.DateTimeFormat("en-CA", {

    timeZone: "Europe/Berlin",

    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",

    hour12: false

});

/**
 * Converts any JS Date into its Berlin-local calendar date and
 * clock time — correctly handles CET/CEST daylight saving, unlike a
 * fixed UTC+1/+2 offset. Used both for "what shift is it right now"
 * and for converting the CSV import's UTC timestamps.
 */
export function toBerlinParts(date) {

    const parts = berlinFormatter.formatToParts(date);

    const get = type => parts.find(part => part.type === type)?.value;

    return {

        date: `${get("year")}-${get("month")}-${get("day")}`,

        time: `${get("hour")}:${get("minute")}`,

        hour: Number(get("hour")),

        minute: Number(get("minute"))

    };

}

/**
 * Classifies a Berlin-local hour/minute into a shift: whichever
 * shift's official start time is the most recent one at or before
 * this moment (wrapping around midnight for Night, which starts the
 * evening before and runs past 00:00). This also means the short
 * handover gaps between shifts (11:30–11:44, 20:30–20:44) fall under
 * the shift that's ending, not the one about to start — someone still
 * finishing up counts as part of the shift they were actually doing.
 */
export function getShiftForTime(hour, minute) {

    const minutesOfDay = hour * 60 + minute;

    const shiftsByStart = Object.entries(SHIFT_START_MINUTES)
        .sort((a, b) => a[1] - b[1]);

    let result = shiftsByStart[shiftsByStart.length - 1][0];

    for (const [shift, startMinutes] of shiftsByStart) {

        if (minutesOfDay >= startMinutes) {

            result = shift;

        }

    }

    return result;

}

/**
 * Guesses the current shift from the clock (Berlin time, regardless of
 * the device's own timezone), used only to pre-select a sensible
 * default when starting a new audit — the user can always override it.
 */
export function getCurrentShift() {

    const { hour, minute } = toBerlinParts(new Date());

    return getShiftForTime(hour, minute);

}

/**
 * Night shift runs from 20:45 one evening to 06:00 the next morning.
 * A scan/entry logged at, say, 05:00 is calendar-wise "tomorrow", but
 * it's really still last night's Night shift — attributing it to
 * tomorrow's date would mean the two audits from a single Night shift
 * (one done at the start, one near the end) never land on the same
 * day, and compliance could never show 2/2. This returns the date the
 * shift actually started, given a Berlin-local hour/minute/date.
 */
export function getShiftBusinessDate(berlinParts, shift) {

    if (shift === "Night" && berlinParts.hour < 6) {

        return shiftDateBack(berlinParts.date, 1);

    }

    return berlinParts.date;

}

function shiftDateBack(dateString, days) {

    const [year, month, day] = dateString.split("-").map(Number);

    // Date.UTC arithmetic here is just calendar math (not a real
    // timezone conversion) — using UTC avoids any local-timezone DST
    // edge case shifting the date by an extra day.
    const date = new Date(Date.UTC(year, month - 1, day));

    date.setUTCDate(date.getUTCDate() - days);

    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;

}

export function todayString() {

    return toBerlinParts(new Date()).date;

}
