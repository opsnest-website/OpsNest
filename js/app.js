/*
=========================================
OpsNest
=========================================
*/

/*
Theme switch: "system" (default) follows the OS setting, "light" and "dark"
override it. The choice is saved in localStorage; the inline script in
index.html applies it before the first paint.
*/

const THEME_KEY = "opsnest-theme";
const THEME_COLORS = { light: "#F8FAFC", dark: "#0B1120" };

function saveTheme(choice) {
    try {
        if (choice === "system") localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, choice);
    } catch (error) {
        // Storage blocked (private mode, site data disabled): the choice lasts for this page only.
    }
}

function applyTheme(choice) {
    const root = document.documentElement;
    if (choice === "system") delete root.dataset.theme;
    else root.dataset.theme = choice;

    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.themeChoice === choice));
    });

    // Logos: the light <source> follows the system by default, or is forced on/off by the choice.
    document.querySelectorAll("source[data-theme-source]").forEach((source) => {
        source.media = { system: "(prefers-color-scheme: light)", light: "all", dark: "not all" }[choice];
    });

    // Browser UI colour (mobile address bar): pinned to the choice, or back to each media default.
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
        const systemTheme = meta.media.includes("light") ? "light" : "dark";
        meta.content = THEME_COLORS[choice === "system" ? systemTheme : choice];
    });
}

document.addEventListener("DOMContentLoaded", () => {

    applyTheme(document.documentElement.dataset.theme ?? "system");

    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
        button.addEventListener("click", () => {
            const choice = button.dataset.themeChoice;
            saveTheme(choice);
            applyTheme(choice);
        });
    });

});
