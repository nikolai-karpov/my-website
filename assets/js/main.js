document.addEventListener('DOMContentLoaded', function() {
    // Убираем прелоадер
    setTimeout(() => {
        document.body.classList.remove('loading');
    }, 1000);

    // Инициализация AOS
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    });

    // Обработка формы лид-магнита
    const checklistForm = document.getElementById('checklist-form');
    if (checklistForm) {
        checklistForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            // Здесь должна быть интеграция с email-сервисом
            alert(`Спасибо! Чек-лист отправлен на ${email}`);
            this.reset();
        });
    }
});

// Обработка ошибок изображений
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        console.warn('Image failed to load:', e.target.src);
    }
}, true);

// Мобильное меню (Event Delegation для динамически загружаемого хедера)
document.addEventListener('click', function(e) {
    // Проверяем, был ли клик по кнопке гамбургера
    const hamburger = e.target.closest('.hamburger');
    
    if (hamburger) {
        const mobileNav = document.querySelector('.mobile-nav');
        const mobileOverlay = document.querySelector('.mobile-overlay');
        
        // Переключаем состояние
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
        mobileNav.setAttribute('aria-hidden', !isExpanded);
        mobileOverlay.classList.toggle('active');
        document.body.style.overflow = !isExpanded ? 'hidden' : '';
    }
    
    // Обработка клика по оверлею
    if (e.target.classList.contains('mobile-overlay') && e.target.classList.contains('active')) {
        const hamburger = document.querySelector('.hamburger');
        const mobileNav = document.querySelector('.mobile-nav');
        const mobileOverlay = document.querySelector('.mobile-overlay');
        
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Обработка клика по ссылкам в мобильном меню
    if (e.target.closest('.mobile-nav a')) {
        const hamburger = document.querySelector('.hamburger');
        const mobileNav = document.querySelector('.mobile-nav');
        const mobileOverlay = document.querySelector('.mobile-overlay');
        
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
        mobileOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Обработка ошибок изображений
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        console.warn('Image failed to load:', e.target.src);
    }
}, true);