export function KpiCards(stats) {

    const cards = [

        {
            icon: "clipboard-check",
            title: "Audits Today",
            value: `${stats.auditsToday.value}/${stats.auditsToday.target}`,
            color: stats.auditsToday.value >= stats.auditsToday.target ? "green" : "orange"
        },

        {
            icon: "alert-triangle",
            title: "Issues Found Today",
            value: stats.issuesToday.value,
            color: "orange"
        },

        {
            icon: "truck",
            title: "Trailer Damages Today",
            value: stats.damagesToday.value,
            color: "red"
        },

        {
            icon: "ticket",
            title: "Work IDs Created Today",
            value: stats.workIdsToday.value,
            color: "blue"
        }

    ];

    return `

        <section class="kpi-grid">

            ${cards.map(card => `

                <article class="kpi-card">

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
