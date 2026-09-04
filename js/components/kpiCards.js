export function KpiCards(stats) {

    const cards = [

        {
            id: "audits",
            icon: "clipboard-check",
            title: "Audits",
            value: `${stats.auditsToday.value}/${stats.auditsToday.target}`,
            color: stats.auditsToday.value >= stats.auditsToday.target ? "green" : "orange",
            clickable: true
        },

        {
            id: "issues",
            icon: "alert-triangle",
            title: "Issues Found",
            value: stats.issuesToday.value,
            color: "orange",
            clickable: true
        },

        {
            id: "damages",
            icon: "truck",
            title: "Trailer Damage",
            value: stats.damagesToday.value,
            color: "red",
            clickable: true
        },

        {
            id: "workids",
            icon: "ticket",
            title: "Work IDs",
            value: stats.workIdsToday.value,
            color: "blue",
            clickable: true
        }

    ];

    return `

        <section class="kpi-grid">

            ${cards.map(card => `

                <article
                    class="kpi-card kpi-card--${card.color}${card.clickable ? " kpi-card--clickable" : ""}"
                    ${card.clickable ? `data-kpi-card="${card.id}"` : ""}
                >

                    <div class="kpi-card__top">

                        <div class="kpi-card__icon ${card.color}">
                            <i data-lucide="${card.icon}"></i>
                        </div>

                    </div>

                    <h3 class="kpi-card__value">
                        ${card.value}
                    </h3>

                    <p class="kpi-card__title">
                        ${card.title}
                    </p>

                </article>

            `).join("")}

        </section>

    `;

}
