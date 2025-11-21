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