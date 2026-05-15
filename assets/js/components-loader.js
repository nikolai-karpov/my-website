document.addEventListener("DOMContentLoaded", function () {
    // Определяем базовый путь на основе текущего location
    function getBasePath() {
        const path = window.location.pathname;
        let pathWithoutBase = path;
        
        // Если на GitHub Pages, убираем /my-website из пути
        if (window.location.hostname.includes('github.io')) {
            pathWithoutBase = path.replace(/^\/my-website/, '');
        }
        
        // Определяем глубину: считаем количество папок в пути (исключая имя файла)
        const pathParts = pathWithoutBase.split('/').filter(p => p && p !== 'index.html' && !p.endsWith('.html'));
        const depth = pathParts.length;
        
        // Для корня (index.html) depth = 0, для site-pages/ depth = 1, для site-pages/case-studies/ depth = 2
        return depth > 0 ? '../'.repeat(depth) : './';
    }

    const basePath = getBasePath();
    const componentsPath = basePath + 'site-components/';

    const components = [
        { id: "main-header", url: componentsPath + 'header.html' },
        { id: "header", url: componentsPath + 'header.html' },
        { id: "main-footer", url: componentsPath + 'footer.html' },
        { id: "footer", url: componentsPath + 'footer.html' }
    ];

    components.forEach(component => {
        const element = document.getElementById(component.id);
        if (element) {
            fetch(component.url)
                .then(response => {
                    if (!response.ok) throw new Error(`Failed to load ${component.url}`);
                    return response.text();
                })
                .then(data => {
                    // Заменяем абсолютные пути на относительные
                    let processedData = data;
                    
                    // Заменяем href="/" на относительный путь к главной
                    // Для корня это будет "./", для подпапок "../" или "../index.html"
                    const indexPath = basePath === './' ? './' : basePath + 'index.html';
                    processedData = processedData.replace(/href="\/"/g, `href="${indexPath}"`);
                    
                    // Заменяем href="/site-pages/ на относительные пути
                    processedData = processedData.replace(/href="\/site-pages\//g, `href="${basePath}site-pages/`);
                    
                    // Заменяем другие абсолютные пути (начинающиеся с /, но не внешние)
                    processedData = processedData.replace(/href="\/([^\/"#?]+)"/g, (match, path) => {
                        // Пропускаем внешние ссылки (http, https, mailto, tel)
                        if (path.match(/^(https?:|mailto:|tel:)/)) return match;
                        return `href="${basePath}${path}"`;
                    });
                    
                    element.innerHTML = processedData;
                    
                    // Перезапуск логики для хедера (мобильное меню)
                    if (component.id === 'header' || component.id === 'main-header') {
                        document.dispatchEvent(new Event('headerLoaded'));
                    }
                })
                .catch(error => console.error('Error loading component:', error));
        }
    });
});

/**
 * Тема: скрипты из header.html не выполняются при вставке через innerHTML,
 * а обработчики на «старой» кнопке до fetch теряются после подмены шапки.
 * Делегирование клика + синхронизация иконок после headerLoaded.
 */
(function setupGlobalThemeToggle() {
    if (window.__nkThemeToggleBound) return;
    window.__nkThemeToggleBound = true;

    function effectiveTheme() {
        const saved = localStorage.getItem("theme");
        if (saved === "dark" || saved === "light") return saved;
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    }

    function updateThemeIcons(theme) {
        const iconClass = theme === "dark" ? "fa-sun" : "fa-moon";
        document.querySelectorAll(".theme-toggle > i").forEach((icon) => {
            icon.className = `fas ${iconClass}`;
        });
    }

    function setTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
        updateThemeIcons(theme);
    }

    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".theme-toggle");
        if (!btn) return;
        const current =
            document.documentElement.getAttribute("data-theme") || "light";
        setTheme(current === "dark" ? "light" : "dark");
    });

    document.addEventListener("headerLoaded", function () {
        const attr = document.documentElement.getAttribute("data-theme");
        const theme =
            attr === "dark" || attr === "light" ? attr : effectiveTheme();
        updateThemeIcons(theme);
    });

    window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", function (e) {
            if (!localStorage.getItem("theme")) {
                setTheme(e.matches ? "dark" : "light");
            }
        });

    setTheme(effectiveTheme());
})();