document.addEventListener('DOMContentLoaded', function() {
    // Универсальная функция загрузки компонентов
    const loadComponent = async (url, elementId) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = html;
            }
        } catch (error) {
            console.warn(`[Component Load] Failed to load ${url} into #${elementId}`, error);
            // Оставляем fallback, если есть (в HTML)
        }
    };

    // 1. Плавный скролл к верху
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Показываем кнопку при прокрутке
        const showBackToTop = () => {
            if (window.pageYOffset > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        };

        // Инициализация
        showBackToTop();

        // Дебаунс для оптимизации
        const debounce = (func, delay) => {
            let timeoutId;
            return function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        };

        window.addEventListener('scroll', debounce(showBackToTop, 100));
    }

    // 2. Активация пунктов мобильного меню
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    mobileNavItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        }

        item.addEventListener('click', function() {
            mobileNavItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Загружаем только если элементы есть на странице
    document.querySelectorAll('[data-component]').forEach(el => {
        const url = el.getAttribute('data-component');
        loadComponent(url, el.id);
    });
});