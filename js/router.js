const routes = {};

let currentRouteName = null;

/**
 * render: () => string of HTML for the page
 * init: optional () => void, runs after the HTML is in the DOM
 *       (bind buttons, load data, etc).
 */
export function registerRoute(name, render, init) {

    routes[name] = { render, init };

}

export function getCurrentRoute() {

    return currentRouteName;

}

export function navigate(name) {

    const container = document.getElementById("app-content");

    const route = routes[name];

    if (!route) {

        console.error("Route not found:", name);

        return;

    }

    currentRouteName = name;

    container.innerHTML = route.render();

    if (window.lucide) {

        window.lucide.createIcons();

    }

    if (route.init) {

        route.init();

    }

    highlightActiveNavItem(name);

}

function highlightActiveNavItem(name) {

    document.querySelectorAll("[data-route]").forEach(link => {

        link.classList.toggle("active", link.dataset.route === name);

    });

}
