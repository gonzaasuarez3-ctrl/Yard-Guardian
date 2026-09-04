import { ISSUE_TYPES } from "../constants.js";

export function EntryForm(entry = null) {

    return `
        <form id="entry-form" class="incident-form">

            <h2 class="incident-form__title">
                ${entry ? `Edit Entry ${entry.id}` : "Log an Issue"}
            </h2>

            <p class="incident-form__subtitle">
                ${entry ? "Update the details below." : "Only trailers with a problem need a row."}
            </p>

            <div class="form-group">
                <label for="trailerId">Trailer ID</label>
                <input
                    id="trailerId"
                    type="text"
                    placeholder="VS12345"
                    value="${entry?.trailerId ?? ""}"
                    required
                >
            </div>

            <div class="form-group">
                <label for="parkingPosition">Dock Door / Parking Position</label>
                <input
                    id="parkingPosition"
                    type="text"
                    placeholder="P-42"
                    value="${entry?.parkingPosition ?? ""}"
                >
            </div>

            <div class="form-group">
                <label for="issueType">Issue Type</label>
                <select id="issueType" required>
                    <option value="">Select...</option>
                    ${ISSUE_TYPES.map(type => `
                        <option ${entry?.issueType === type ? "selected" : ""}>${type}</option>
                    `).join("")}
                </select>
            </div>

            <div class="form-group">
                <label for="damageReport">Damage Report</label>
                <textarea
                    id="damageReport"
                    placeholder="Describe what was found..."
                >${entry?.damageReport ?? ""}</textarea>
            </div>

            <div class="form-group" style="display:flex; align-items:center; gap:10px;">
                <input
                    id="workIdCreated"
                    type="checkbox"
                    style="width:18px; height:18px;"
                    ${entry?.workIdCreated ? "checked" : ""}
                >
                <label for="workIdCreated" style="margin:0;">Work ID (repair ticket) created</label>
            </div>

            <div class="form-group" id="workIdFieldGroup" style="display:${entry?.workIdCreated ? "block" : "none"};">
                <label for="workId">Work ID Number</label>
                <input
                    id="workId"
                    type="text"
                    placeholder="WO-9911"
                    value="${entry?.workId ?? ""}"
                >
            </div>

            <div class="form-group">
                <label for="comments">Comments</label>
                <textarea
                    id="comments"
                    placeholder="Anything else worth noting..."
                >${entry?.comments ?? ""}</textarea>
            </div>

            <div class="incident-form__footer">

                <button type="button" class="btn btn-secondary" id="cancelEntry">
                    Cancel
                </button>

                <button type="submit" class="btn btn-primary">
                    ${entry ? "Update Entry" : "Add Entry"}
                </button>

            </div>

        </form>
    `;

}
