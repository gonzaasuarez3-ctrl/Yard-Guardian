const ISSUE_COLORS = {
    "Damage": "damage",
    "Mismatch": "mismatch",
    "Missing Trailer": "missing",
    "Other": "other"
};

export function IssueBadge(issueType) {

    const color = ISSUE_COLORS[issueType] || "other";

    return `<span class="status-badge status-badge--${color}">${issueType}</span>`;

}

export function SessionStatusBadge(status) {

    const color = status === "Completed" ? "completed" : "open";

    return `<span class="status-badge status-badge--${color}">${status}</span>`;

}

export function WorkIdPill(entry) {

    if (!entry.workIdCreated) {

        return `<span class="workid-pill">— No ticket</span>`;

    }

    return `<span class="workid-pill workid-pill--created">✓ ${entry.workId || "Created"}</span>`;

}
