export function Table({ columns, rows, emptyMessage = "No records yet." }) {

    return `

        <table class="audit-table">

            <thead>

                <tr>
                    ${columns.map(column => `<th>${column.label}</th>`).join("")}
                </tr>

            </thead>

            <tbody>

                ${rows.length === 0
                    ? `<tr><td class="audit-table__empty" colspan="${columns.length}">${emptyMessage}</td></tr>`
                    : rows.map(row => `
                        <tr>
                            ${columns.map(column => `
                                <td>${column.render ? column.render(row) : (row[column.key] ?? "")}</td>
                            `).join("")}
                        </tr>
                    `).join("")
                }

            </tbody>

        </table>

    `;

}
