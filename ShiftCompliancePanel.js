export function ShiftCompliancePanel(compliance) {

    return `

        <div class="dashboard__panel">

            <div class="dashboard__panel-header">
                <span class="dashboard__panel-title">Shift Compliance — Today</span>
                <span class="dashboard__panel-subtitle">2 audits required per shift</span>
            </div>

            <div class="shift-grid">

                ${compliance.map(shift => `

                    <div class="shift-card ${shift.completed >= shift.target ? "shift-card--met" : "shift-card--pending"}">

                        <div class="shift-card__name">${shift.shift} Shift</div>

                        <div class="shift-card__count">
                            ${shift.completed}<span> / ${shift.target}</span>
                        </div>

                    </div>

                `).join("")}

            </div>

        </div>

    `;

}
