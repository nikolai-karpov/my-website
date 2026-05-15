// Основной JavaScript-файл для сайта

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // =============================
    // 1. ПЛАВНАЯ НАВИГАЦИЯ ПО ЯКОРЯМ
    // =============================

    const smoothScroll = () => {
        const links = document.querySelectorAll('a[href^="#"]:not([href="#"])');

        links.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80, // Учитываем высоту шапки
                        behavior: 'smooth'
                    });
                }
            });
        });
    };

    // =============================
    // 2. МОБИЛЬНОЕ МЕНЮ
    // =============================

    const mobileMenu = () => {
        const hamburger = document.querySelector('.hamburger');
        const mobileMenu = document.querySelector('.mobile-menu');
        const mobileOverlay = document.querySelector('.mobile-overlay');

        if (!hamburger || !mobileMenu) return;

        hamburger.addEventListener('click', function () {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = !isExpanded ? 'hidden' : '';
        });

        // Закрытие меню при клике на оверлей
        mobileOverlay?.addEventListener('click', () => {
            hamburger.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('active');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });

        // Закрытие при клике на ссылку
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.remove('active');
                mobileOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    };

    // =============================
    // 3. ФИКСИРОВАННАЯ ШАПКА
    // =============================

    const stickyHeader = () => {
        const header = document.querySelector('header');
        if (!header) return;

        const scrollCallback = () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };

        window.addEventListener('scroll', scrollCallback);
        scrollCallback(); // Проверка при загрузке
    };

    // =============================
    // 4. ПОЯВЛЕНИЕ ЭЛЕМЕНТОВ ПРИ СКРОЛЛЕ
    // =============================

    const animateOnScroll = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.section-animate, .fade-in-delay, .contact-item').forEach(el => {
            observer.observe(el);
        });
    };

    // =============================
    // 5. ОБРАБОТКА ФОРМЫ КОНТАКТОВ
    // =============================

    const contactForm = () => {
        const form = document.querySelector('#contactForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const successMsg = this.querySelector('.form-success');
            const errorMsg = this.querySelector('.form-error');

            // Показываем состояние загрузки
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';

            try {
                // Здесь можно добавить отправку формы через fetch
                // await fetch('/api/contact', { method: 'POST', body: new FormData(form) });

                // Имитация успешной отправки
                setTimeout(() => {
                    successMsg.classList.add('show');
                    form.reset();
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-check"></i> Отправлено!';
                }, 1000);

            } catch (error) {
                errorMsg.classList.add('show');
                errorMsg.textContent = 'Ошибка отправки. Попробуйте позже.';
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Отправить';
            }
        });
    };

    // =============================
    // 6. КОПИРОВАНИЕ EMAIL ПРИ КЛИКЕ
    // =============================

    const copyEmail = () => {
        const emailElements = document.querySelectorAll('.copy-email');
        emailElements.forEach(el => {
            el.addEventListener('click', function () {
                const email = this.getAttribute('data-email');
                navigator.clipboard.writeText(email).then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                });
            });
        });
    };

    // =============================
    // 7. ИНИЦИАЛИЗАЦИЯ ВСЕХ ФУНКЦИЙ
    // =============================

    const init = () => {
        smoothScroll();
        mobileMenu();
        stickyHeader();
        animateOnScroll();
        contactForm();
        copyEmail();
        console.log('Сайт инициализирован');
    };

    // Запуск при загрузке DOM
    init();
});