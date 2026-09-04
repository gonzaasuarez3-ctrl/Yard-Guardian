import { getSessions, getAllEntries } from "./AuditSessionService.js";
import { getTrailerDamages } from "./TrailerDamageService.js";
import { getWorkIds } from "./WorkIdService.js";
import { SHIFTS, AUDITS_PER_SHIFT_TARGET, getCurrentBusinessDate } from "../constants.js";

/**
 * An audit only counts toward the shift's quota once it's Completed —
 * a session still In Progress is real work happening right now, but it
 * doesn't satisfy "2 audits done this shift" until it's finalized. The
 * shift each session belongs to is decided once, at the moment it was
 * created (Berlin-time for CSV imports, whatever the YM picked for a
 * manual audit) — this just counts by that stored value.
 */
export function getShiftCompliance(date = getCurrentBusinessDate()) {

    const completedToday = getSessions().filter(
        session => session.date === date && session.status === "Completed"
    );

    return SHIFTS.map(shift => ({

        shift,

        completed: completedToday.filter(session => session.shift === shift).length,

        target: AUDITS_PER_SHIFT_TARGET

    }));

}

export function getAuditsToday(date = getCurrentBusinessDate()) {

    return getSessions()

        .filter(session => session.date === date && session.status === "Completed")

        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

}

export function getTrailerDamagesToday(date = getCurrentBusinessDate()) {

    return getTrailerDamages().filter(damage => damage.berlinDate === date);

}

export function getWorkIdsToday(date = getCurrentBusinessDate()) {

    return getWorkIds().filter(workId => workId.berlinDate === date);

}

export function getDashboardStats(date = getCurrentBusinessDate()) {

    const entriesToday = getAllEntries().filter(entry => entry.date === date);

    const compliance = getShiftCompliance(date);

    const auditsCompleted = compliance.reduce((sum, shift) => sum + shift.completed, 0);

    const auditsTarget = compliance.reduce((sum, shift) => sum + shift.target, 0);

    return {

        auditsToday: { value: auditsCompleted, target: auditsTarget },

        issuesToday: { value: entriesToday.length },

        damagesToday: { value: getTrailerDamagesToday(date).length },

        workIdsToday: { value: getWorkIdsToday(date).length },

        compliance

    };

}
