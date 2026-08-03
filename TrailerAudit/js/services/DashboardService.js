import { getSessions, getAllEntries } from "./AuditSessionService.js";
import { SHIFTS, AUDITS_PER_SHIFT_TARGET, todayString } from "../constants.js";

/**
 * An audit only counts toward the shift's quota once it's Completed —
 * a session still In Progress is real work happening right now, but it
 * doesn't satisfy "2 audits done this shift" until it's finalized.
 */
export function getShiftCompliance(date = todayString()) {

    const completedToday = getSessions().filter(
        session => session.date === date && session.status === "Completed"
    );

    return SHIFTS.map(shift => ({

        shift,

        completed: completedToday.filter(session => session.shift === shift).length,

        target: AUDITS_PER_SHIFT_TARGET

    }));

}

export function getDashboardStats(date = todayString()) {

    const entriesToday = getAllEntries().filter(entry => entry.date === date);

    const compliance = getShiftCompliance(date);

    const auditsCompleted = compliance.reduce((sum, shift) => sum + shift.completed, 0);

    const auditsTarget = compliance.reduce((sum, shift) => sum + shift.target, 0);

    return {

        auditsToday: { value: auditsCompleted, target: auditsTarget },

        issuesToday: { value: entriesToday.length },

        damagesToday: { value: entriesToday.filter(entry => entry.issueType === "Damage").length },

        workIdsToday: { value: entriesToday.filter(entry => entry.workIdCreated).length },

        compliance

    };

}
