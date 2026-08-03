let bannerEl = null;

export function showErrorBanner(message) {

    if (!bannerEl) {

        bannerEl = document.createElement("div");

        bannerEl.id = "global-error-banner";

        bannerEl.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #7f1d1d;
            color: white;
            padding: 12px 16px;
            font-size: 13px;
            font-family: sans-serif;
            z-index: 99999;
            text-align: center;
            line-height: 1.4;
        `;

        document.body.prepend(bannerEl);

    }

    bannerEl.textContent = message;

    bannerEl.style.display = "block";

}
