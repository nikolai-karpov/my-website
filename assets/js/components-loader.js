/**
 * components-loader.js
 * Динамическая загрузка header и footer
 * Автоопределение пути: корень или site-pages/
 */

function getBasePath() {
    return window.location.pathname.includes('/site-pages/') ? '../' : './';
}

function loadComponent(element) {
    const basePath = getBasePath();
    const url = basePath + element.getAttribute('data-component');
    const id = element.id;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        })
        .then(html => {
            element.innerHTML = html;
            console.debug(`[components-loader] Загружено: ${url}`);
        })
        .catch(err => {
            console.error(`[components-loader] Ошибка загрузки: ${url}`, err);
            element.innerHTML = `<div class="component-error">Компонент не загружен</div>`;
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const components = document.querySelectorAll('[data-component]');
    components.forEach(loadComponent);
});