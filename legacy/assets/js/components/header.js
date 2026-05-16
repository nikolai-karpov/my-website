/**
 * Управление мобильным меню и активными ссылками
 */
class HeaderComponent {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.mobileNav = document.querySelector('.mobile-nav');
        this.mobileOverlay = document.querySelector('.mobile-overlay');
        this.mobileLinks = document.querySelectorAll('.mobile-nav a');

        this.init();
    }

    init() {
        if (!this.hamburger) return;

        this.hamburger.addEventListener('click', () => this.toggleMenu());
        this.mobileOverlay?.addEventListener('click', () => this.toggleMenu());
        this.mobileLinks.forEach(link => {
            link.addEventListener('click', () => this.toggleMenu());
        });

        this.setActivePage();
    }

    toggleMenu() {
        const isExpanded = this.hamburger.getAttribute('aria-expanded') === 'true';
        this.hamburger.setAttribute('aria-expanded', !isExpanded);
        this.mobileNav?.setAttribute('aria-hidden', isExpanded);
        this.mobileOverlay?.classList.toggle('active');
        document.body.style.overflow = !isExpanded ? 'hidden' : '';
    }

    setActivePage() {
        const path = window.location.pathname;
        const currentPage = path === '/' ? 'index.html' : path.split('/').pop();
        const links = document.querySelectorAll('.desktop-nav a, .mobile-nav a');

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href.endsWith(currentPage)) {
                link.classList.add('active');
            }
        });
    }
}

// Инициализация после загрузки компонента
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#main-header')) {
        new HeaderComponent();
    }
});