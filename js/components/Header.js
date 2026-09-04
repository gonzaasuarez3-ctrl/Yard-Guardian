export function Header() {

    return `
        <header class="header">

            <div class="header__art" aria-hidden="true">
                ${headerIllustration()}
            </div>

            <div class="header__scrim"></div>

            <div class="header__content">

                <span class="header__eyebrow">
                    <span class="header__eyebrow-mark">/</span>
                    BER8
                    <span class="header__eyebrow-sep">|</span>
                    Yard Operations
                </span>

                <div class="header__title-row">

                    <div class="header__icon-chip">
                        <i data-lucide="truck"></i>
                    </div>

                    <div>

                        <h1 class="header__title">
                            Trailer <span class="header__title-accent">Audit</span>
                        </h1>

                        <p class="header__subtitle">
                            Daily damage &amp; mismatch inspection
                        </p>

                    </div>

                </div>

            </div>

            <div class="header__badge">BER8</div>

        </header>
    `;

}

/**
 * Original SVG illustration — a stylised row of yard trailers at dusk,
 * not a stock photo. Built specifically for this header rather than
 * hotlinked, since a real photo would need rights we don't have.
 */
function headerIllustration() {

    return `
    <svg viewBox="0 0 900 320" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">

        <defs>

            <linearGradient id="hdrSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#0F1620"/>
                <stop offset="100%" stop-color="#05070A"/>
            </linearGradient>

            <linearGradient id="hdrFace" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#242E3A"/>
                <stop offset="100%" stop-color="#161D26"/>
            </linearGradient>

        </defs>

        <rect width="900" height="320" fill="url(#hdrSky)"/>

        <rect y="256" width="900" height="64" fill="#04060A"/>

        <g stroke="#333E4C" stroke-width="1">
            <rect x="30"  y="128" width="88"  height="130" fill="url(#hdrFace)"/>
            <rect x="128" y="118" width="92"  height="140" fill="url(#hdrFace)"/>
            <rect x="230" y="112" width="92"  height="146" fill="url(#hdrFace)"/>
            <rect x="332" y="106" width="96"  height="152" fill="url(#hdrFace)"/>
            <rect x="438" y="100" width="98"  height="158" fill="url(#hdrFace)"/>
            <rect x="546" y="94"  width="100" height="164" fill="url(#hdrFace)"/>
            <rect x="656" y="88"  width="102" height="170" fill="url(#hdrFace)"/>
            <rect x="768" y="82"  width="102" height="176" fill="url(#hdrFace)"/>
        </g>

        <g stroke="#2B3542" stroke-width="1" opacity=".6">
            <line x1="60"  y1="130" x2="60"  y2="256"/>
            <line x1="90"  y1="130" x2="90"  y2="256"/>
            <line x1="270" y1="115" x2="270" y2="256"/>
            <line x1="300" y1="115" x2="300" y2="256"/>
            <line x1="580" y1="96"  x2="580" y2="256"/>
            <line x1="612" y1="96"  x2="612" y2="256"/>
        </g>

        <g fill="#FFB066">
            <circle cx="74"  cy="60" r="2.5" opacity=".85"/>
            <circle cx="276" cy="48" r="2.5" opacity=".65"/>
            <circle cx="482" cy="42" r="2.5" opacity=".8"/>
            <circle cx="700" cy="36" r="2.5" opacity=".55"/>
        </g>

        <polygon points="640,0 700,0 440,320 380,320" fill="#F2760D" opacity=".06"/>
        <line x1="640" y1="0" x2="380" y2="320" stroke="#F2760D" stroke-width="2" opacity=".45"/>

    </svg>
    `;

}
