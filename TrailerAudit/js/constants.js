export const SHIFTS = ["Early", "Twilight", "Night"];

export const SHIFT_HOURS = {
    "Early": "06:00 - 11:30",
    "Twilight": "11:45 - 20:30",
    "Night": "20:45 - 06:00"
};

export const ISSUE_TYPES = ["Damage", "Mismatch", "Missing Trailer", "Other"];

export const AUDITS_PER_SHIFT_TARGET = 2;

/**
 * Guesses the current shift from the clock, used only to pre-select a
 * sensible default when starting a new audit — the user can always
 * override it.
 */
export function getCurrentShift() {

    const hour = new Date().getHours();

    if (hour >= 6 && hour < 11.5) return "Early";

    if (hour >= 11.5 && hour < 20.5) return "Twilight";

    return "Night";

}

export function todayString() {

    return new Date().toISOString().split("T")[0];

}
