export class Modal {

    constructor() {

        this.overlay = null;

    }

    open(content) {

        this.close();

        this.overlay = document.createElement("div");
        this.overlay.className = "modal-overlay";

        this.overlay.innerHTML = `

            <div class="modal">

                <button class="modal-close" aria-label="Close">
                    ✕
                </button>

                <div class="modal-body">
                    ${content}
                </div>

            </div>

        `;

        document.body.appendChild(this.overlay);

        this.overlay.querySelector(".modal-close")
            .addEventListener("click", () => this.close());

        this.overlay.addEventListener("click", event => {

            if (event.target === this.overlay) {
                this.close();
            }

        });

        document.addEventListener("keydown", this.handleEscape);

        if (window.lucide) {
            window.lucide.createIcons();
        }

    }

    handleEscape = event => {

        if (event.key === "Escape") {
            this.close();
        }

    };

    close() {

        if (this.overlay) {

            document.removeEventListener("keydown", this.handleEscape);

            this.overlay.remove();

            this.overlay = null;

        }

    }

}
