import { getSessions } from "./AuditSessionService.js";
import { getTrailerDamages } from "./TrailerDamageService.js";
import { getWorkIds } from "./WorkIdService.js";
import { getIssues } from "./IssueService.js";
import {
    SHIFTS,
    AUDITS_PER_SHIFT_TARGET,
    getCurrentBusinessDate,
    getWeekStart,
    getWeekDates
} from "../constants.js";

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

export function getIssuesToday(date = getCurrentBusinessDate()) {

    return getIssues().filter(issue => issue.berlinDate === date);

}

/**
 * Trailer Damage records with no Work ID recorded for that same
 * trailer — these are the ones still needing a repair ticket opened.
 * Matched by trailer number rather than scoped to "today", since a
 * damage from a few days ago that still has no Work ID is exactly the
 * kind of thing that should keep showing up until it's handled.
 */
export function getDamagesNeedingWorkId() {

    const workIdTrailers = new Set(getWorkIds().map(workId => workId.trailerNumber));

    return getTrailerDamages()

        .filter(damage => !workIdTrailers.has(damage.trailerNumber))

        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

}

export function getDashboardStats(date = getCurrentBusinessDate()) {

    const compliance = getShiftCompliance(date);

    const auditsCompleted = compliance.reduce((sum, shift) => sum + shift.completed, 0);

    const auditsTarget = compliance.reduce((sum, shift) => sum + shift.target, 0);

    return {

        auditsToday: { value: auditsCompleted, target: auditsTarget },

        issuesToday: { value: getIssuesToday(date).length },

        damagesToday: { value: getTrailerDamagesToday(date).length },

        workIdsToday: { value: getWorkIdsToday(date).length },

        compliance

    };

}

/**
 * One week's performance, Monday through Sunday. Reuses
 * getShiftCompliance per day rather than re-deriving the per-shift
 * logic, so a fix there automatically applies here too.
 */
export function getWeeklyStats(weekStart = getWeekStart(getCurrentBusinessDate())) {

    const days = getWeekDates(weekStart);

    const dayBreakdown = days.map(date => ({

        date,

        compliance: getShiftCompliance(date)

    }));

    const totalAudits = dayBreakdown.reduce(
        (sum, day) => sum + day.compliance.reduce((daySum, shift) => daySum + shift.completed, 0),
        0
    );

    const totalTarget = SHIFTS.length * AUDITS_PER_SHIFT_TARGET * days.length;

    const dateSet = new Set(days);

    return {

        weekStart,

        weekEnd: days[days.length - 1],

        days: dayBreakdown,

        totalAudits,

        totalTarget,

        totalIssues: getIssues().filter(issue => dateSet.has(issue.berlinDate)).length,

        totalDamages: getTrailerDamages().filter(damage => dateSet.has(damage.berlinDate)).length,

        totalWorkIds: getWorkIds().filter(workId => dateSet.has(workId.berlinDate)).length

    };

}
