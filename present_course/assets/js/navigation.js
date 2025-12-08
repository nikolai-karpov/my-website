/**
 * Navigation System for AI Implementation Playbook Presentation
 * Professional slide navigation with keyboard, scroll, and URL hash support
 * UPDATED: Синхронизирован с текущей структурой HTML и стилями
 */

class PresentationNavigation {
    constructor() {
        this.slides = [];
        this.progressDots = [];
        this.currentSlide = 0;
        this.isAnimating = false;
        this.scrollTimeout = null;
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.isTouchScrolling = false;

        this.init();
    }

    async init() {
        // Ждем загрузки всех слайдов
        await this.waitForSlides();

        // Инициализируем навигацию
        this.initProgressIndicator();
        this.initNavigationButtons();
        this.initKeyboardNavigation();
        this.initScrollNavigation();
        this.initTouchNavigation();
        this.initHashNavigation();

        // Показываем начальный слайд
        const initialSlide = this.getSlideIndexFromHash() || 0;
        await this.goToSlide(initialSlide, false); // Без анимации для первого слайда

        // Предзагрузка соседних слайдов
        this.preloadAdjacentSlides();

        // Диспатчим событие загрузки
        this.dispatchSlideChangeEvent();
    }

    async waitForSlides() {
        // Ждем пока все слайды загрузятся
        return new Promise((resolve) => {
            const checkSlides = () => {
                this.slides = Array.from(document.querySelectorAll('.slide'));
                if (this.slides.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkSlides, 100);
                }
            };
            checkSlides();
        });
    }

    initProgressIndicator() {
        const progressContainer = document.getElementById('progress-indicator');
        if (!progressContainer) return;

        // Очищаем существующие точки
        progressContainer.innerHTML = '';

        // Создаем точки прогресса с заголовками
        this.slides.forEach((slide, index) => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.setAttribute('data-slide-index', index);
            dot.setAttribute('data-title', this.getSlideTitle(slide));
            dot.setAttribute('aria-label', `Перейти к слайду ${index + 1}: ${this.getSlideTitle(slide)}`);
            dot.setAttribute('role', 'button');
            dot.setAttribute('tabindex', '0');

            // Анимация появления точек
            dot.style.opacity = '0';
            dot.style.transform = 'translateX(10px)';

            setTimeout(() => {
                dot.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                dot.style.opacity = '1';
                dot.style.transform = 'translateX(0)';
            }, index * 50);

            dot.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToSlide(index);
            });

            // Поддержка клавиатуры
            dot.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.goToSlide(index);
                }
            });

            progressContainer.appendChild(dot);
        });

        this.progressDots = Array.from(document.querySelectorAll('.progress-dot'));
    }

    getSlideTitle(slide) {
        // Пытаемся получить заголовок слайда
        const titleElement = slide.querySelector('.title-header') ||
        slide.querySelector('.title-concept') ||
        slide.querySelector('.case-header') ||
        slide.querySelector('h2') ||
        slide.querySelector('h1');

        if (titleElement) {
            let title = titleElement.textContent || '';
            // Укорачиваем длинные заголовки
            if (title.length > 40) {
                title = title.substring(0, 37) + '...';
            }
            return title;
        }

        // Или используем ID
        const slideId = slide.id;
        const slideNumber = slideId.replace('slide-', '').split('-')[0];
        return `Слайд ${slideNumber}`;
    }

    initNavigationButtons() {
        // Проверяем, есть ли уже кнопки
        let navButtons = document.querySelector('.nav-buttons');

        if (!navButtons) {
            // Создаем кнопки навигации
            navButtons = document.createElement('div');
            navButtons.className = 'nav-buttons';
            navButtons.innerHTML = `
                <button class="nav-btn nav-btn-prev" aria-label="Предыдущий слайд">
                    ← Назад
                </button>
                <button class="nav-btn nav-btn-next" aria-label="Следующий слайд">
                    Вперёд →
                </button>
            `;
            document.body.appendChild(navButtons);
        }

        // Добавляем обработчики событий
        const prevBtn = navButtons.querySelector('.nav-btn-prev');
        const nextBtn = navButtons.querySelector('.nav-btn-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!this.isAnimating) {
                    this.prev();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!this.isAnimating) {
                    this.next();
                }
            });
        }

        // Обновляем состояние кнопок
        this.updateNavButtons();
    }

    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.isAnimating || this.isModalOpen()) return;

            switch(e.key) {
                case 'ArrowRight':
                case 'PageDown':
                case ' ':
                    if (!e.target.matches('input, textarea, button, [contenteditable]')) {
                        e.preventDefault();
                        this.next();
                    }
                    break;

                case 'ArrowLeft':
                case 'PageUp':
                    if (!e.target.matches('input, textarea, button, [contenteditable]')) {
                        e.preventDefault();
                        this.prev();
                    }
                    break;

                case 'Home':
                    e.preventDefault();
                    this.goToSlide(0);
                    break;

                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.slides.length - 1);
                    break;

                case 'Escape':
                    // Закрываем модальные окна (обработка в interactions.js)
                    break;

                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    if (e.altKey) {
                        e.preventDefault();
                        const slideNumber = parseInt(e.key) - 1;
                        if (slideNumber < this.slides.length) {
                            this.goToSlide(slideNumber);
                        }
                    }
                    break;
            }
        });
    }

    initScrollNavigation() {
        let scrollTimeout;
        let lastScrollTime = 0;
        const scrollThrottle = 1000; // Минимальное время между переключениями

        const handleScroll = (e) => {
            if (this.isAnimating || this.isModalOpen()) return;

            const currentTime = Date.now();
            if (currentTime - lastScrollTime < scrollThrottle) return;

            // Clear existing timeout
            if (scrollTimeout) clearTimeout(scrollTimeout);

            // Set new timeout
            scrollTimeout = setTimeout(() => {
                const delta = e.deltaY || e.detail || (-e.wheelDelta);

                if (Math.abs(delta) > 20) { // Минимальный порог
                    if (delta > 0) {
                        this.next();
                    } else if (delta < 0) {
                        this.prev();
                    }
                    lastScrollTime = Date.now();
                }
            }, 100);
        };

        // Modern browsers
        document.addEventListener('wheel', handleScroll, { passive: false });

        // Older Firefox
        document.addEventListener('DOMMouseScroll', handleScroll);
    }

    initTouchNavigation() {
        const touchThreshold = 50; // Минимальное расстояние свайпа
        const timeThreshold = 300; // Максимальное время свайпа

        document.addEventListener('touchstart', (e) => {
            if (this.isAnimating || this.isModalOpen()) return;

            this.touchStartY = e.touches[0].clientY;
            this.touchStartX = e.touches[0].clientX;
            this.isTouchScrolling = false;

            // Предотвращаем скролл страницы при свайпе
            if (e.target.closest('.slide-content')) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!this.touchStartY || this.isTouchScrolling) return;

            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const diffY = this.touchStartY - touchY;
            const diffX = this.touchStartX - touchX;

            // Если горизонтальный свайп сильнее вертикального - это навигация
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                this.isTouchScrolling = true;
                if (e.target.closest('.slide-content')) {
                    e.preventDefault();
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (this.isAnimating || this.isModalOpen() || !this.isTouchScrolling) return;

            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            const diffY = this.touchStartY - touchEndY;
            const diffX = this.touchStartX - touchEndX;
            const timeDiff = Date.now() - this.touchStartTime;

            // Проверяем, был ли это свайп
            if (Math.abs(diffX) > touchThreshold && Math.abs(diffY) < touchThreshold && timeDiff < timeThreshold) {
                if (diffX > 0) {
                    this.next(); // Свайп влево
                } else {
                    this.prev(); // Свайп вправо
                }
                e.preventDefault();
            }

            // Сбрасываем значения
            this.touchStartY = 0;
            this.touchStartX = 0;
            this.isTouchScrolling = false;
        }, { passive: false });
    }

    initHashNavigation() {
        // Обновляем hash при изменении слайда
        window.addEventListener('hashchange', () => {
            const targetSlide = this.getSlideIndexFromHash();
            if (targetSlide !== null && targetSlide !== this.currentSlide) {
                this.goToSlide(targetSlide);
            }
        });
    }

    getSlideIndexFromHash() {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        // Пытаемся найти слайд по ID
        let targetSlide = this.slides.findIndex(slide => slide.id === hash);

        // Если не нашли по ID, ищем по номеру слайда
        if (targetSlide === -1 && /^\d+$/.test(hash)) {
            const slideNumber = parseInt(hash) - 1;
            if (slideNumber >= 0 && slideNumber < this.slides.length) {
                targetSlide = slideNumber;
            }
        }

        // Или ищем по data-slug
        if (targetSlide === -1) {
            targetSlide = this.slides.findIndex(slide =>
            slide.getAttribute('data-slug') === hash
            );
        }

        return targetSlide !== -1 ? targetSlide : null;
    }

    updateHash() {
        const currentSlide = this.slides[this.currentSlide];
        const slideId = currentSlide.id;

        if (history.replaceState) {
            history.replaceState(null, null, `#${slideId}`);
        } else {
            window.location.hash = slideId;
        }

        // Также обновляем title страницы
        this.updatePageTitle();
    }

    updatePageTitle() {
        const slideTitle = this.getSlideTitle(this.slides[this.currentSlide]);
        const baseTitle = 'AI Implementation Playbook';
        document.title = `${slideTitle} | ${baseTitle}`;
    }

    async goToSlide(index, animate = true) {
        if (this.isAnimating || index < 0 || index >= this.slides.length) {
            return;
        }

        this.isAnimating = true;

        const currentSlide = this.slides[this.currentSlide];
        const targetSlide = this.slides[index];

        if (animate) {
            // Добавляем анимацию перехода
            currentSlide.classList.add('slide-exit');
            targetSlide.classList.add('slide-enter', 'active');

            // Ждем завершения анимации
            await this.waitForAnimation(targetSlide);

            // Убираем классы анимации
            currentSlide.classList.remove('active', 'slide-exit');
            targetSlide.classList.remove('slide-enter');
        } else {
            // Просто переключаем видимость без анимации
            currentSlide.classList.remove('active');
            targetSlide.classList.add('active');
        }

        // Обновляем текущий слайд
        this.currentSlide = index;

        // Обновляем UI
        this.updateProgressIndicator();
        this.updateNavButtons();
        this.updateHash();

        // Предзагрузка соседних слайдов
        this.preloadAdjacentSlides();

        // Инициализируем интерактивные элементы
        this.initSlideInteractions(targetSlide);

        this.isAnimating = false;

        // Диспатчим событие
        this.dispatchSlideChangeEvent();
    }

    waitForAnimation(element) {
        return new Promise(resolve => {
            const onAnimationEnd = () => {
                element.removeEventListener('animationend', onAnimationEnd);
                element.removeEventListener('transitionend', onAnimationEnd);
                resolve();
            };

            // Проверяем, есть ли CSS анимация
            const style = window.getComputedStyle(element);
            const animationDuration = parseFloat(style.animationDuration) || 0;
            const transitionDuration = parseFloat(style.transitionDuration) || 0;

            if (animationDuration > 0 || transitionDuration > 0) {
                element.addEventListener('animationend', onAnimationEnd);
                element.addEventListener('transitionend', onAnimationEnd);
                // Fallback таймаут
                setTimeout(onAnimationEnd, Math.max(animationDuration, transitionDuration) * 1000 + 100);
            } else {
                resolve();
            }
        });
    }

    next() {
        if (this.currentSlide < this.slides.length - 1) {
            this.goToSlide(this.currentSlide + 1);
        } else {
            // Достигнут последний слайд
            this.showCompletionMessage();
        }
    }

    prev() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    showCompletionMessage() {
        // Можно добавить фидбек при достижении конца презентации
        console.log('Презентация завершена!');
        // Или показать модальное окно
        // this.showModal('Презентация завершена!');
    }

    updateProgressIndicator() {
        this.progressDots.forEach((dot, index) => {
            const isActive = index === this.currentSlide;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-current', isActive ? 'true' : 'false');

            // Анимация активации
            if (isActive) {
                dot.style.transform = 'scale(1.3)';
            } else {
                dot.style.transform = 'scale(1)';
            }
        });
    }

    updateNavButtons() {
        const prevBtn = document.querySelector('.nav-btn-prev');
        const nextBtn = document.querySelector('.nav-btn-next');

        if (prevBtn) {
            const isFirstSlide = this.currentSlide === 0;
            prevBtn.classList.toggle('disabled', isFirstSlide);
            prevBtn.disabled = isFirstSlide;
            prevBtn.setAttribute('aria-disabled', isFirstSlide);
        }

        if (nextBtn) {
            const isLastSlide = this.currentSlide === this.slides.length - 1;
            nextBtn.classList.toggle('disabled', isLastSlide);
            nextBtn.disabled = isLastSlide;
            nextBtn.setAttribute('aria-disabled', isLastSlide);
            nextBtn.textContent = isLastSlide ? 'Завершить →' : 'Вперёд →';
        }
    }

    preloadAdjacentSlides() {
        const preloadSlides = [];

        if (this.currentSlide > 0) {
            preloadSlides.push(this.currentSlide - 1);
        }
        if (this.currentSlide < this.slides.length - 1) {
            preloadSlides.push(this.currentSlide + 1);
        }

        preloadSlides.forEach(index => {
            const slide = this.slides[index];
            // Force browser to load background images and other resources
            slide.style.contain = 'layout style paint';

            // Предзагрузка изображений
            const images = slide.querySelectorAll('img');
            images.forEach(img => {
                if (!img.complete) {
                    img.loading = 'eager';
                }
            });
        });
    }

    initSlideInteractions(slide) {
        // Инициализация интерактивных элементов слайда
        const interactiveElements = slide.querySelectorAll('[data-interactive]');

        interactiveElements.forEach(element => {
            const type = element.getAttribute('data-interactive');

            switch(type) {
                case 'methodology-block':
                    this.initMethodologyBlock(element);
                    break;
                case 'document-icon':
                    this.initDocumentIcon(element);
                    break;
                case 'pipeline-step':
                    this.initPipelineStep(element);
                    break;
            }
        });

        // Инициализация анимаций для слайда
        this.initSlideAnimations(slide);
    }

    initMethodologyBlock(block) {
        // Hover effects are handled by CSS and interactions.js
    }

    initDocumentIcon(icon) {
        // Click handlers for document icons are in interactions.js
    }

    initPipelineStep(step) {
        // Pipeline animations are handled in animations.js
    }

    initSlideAnimations(slide) {
        // Добавляем entrance animations к элементам слайда
        const animatableElements = slide.querySelectorAll('[data-animate]');

        animatableElements.forEach((element, index) => {
            const animationType = element.getAttribute('data-animate') || 'slideInUp';
            const delay = element.getAttribute('data-delay') || index * 100;

            // Сбрасываем анимацию
            element.style.animation = '';
            void element.offsetWidth; // Trigger reflow

            // Применяем анимацию
            element.style.animationDelay = `${delay}ms`;
            element.classList.add(animationType);
        });
    }

    isModalOpen() {
        // Проверяем, открыто ли модальное окно
        return document.querySelector('.modal.active, .document-modal.active') !== null;
    }

    dispatchSlideChangeEvent() {
        const event = new CustomEvent('slideChange', {
            detail: {
                slideIndex: this.currentSlide,
                slideElement: this.slides[this.currentSlide],
                totalSlides: this.slides.length,
                slideId: this.slides[this.currentSlide].id,
                slideTitle: this.getSlideTitle(this.slides[this.currentSlide])
            }
        });
        document.dispatchEvent(event);
    }

    // Public API
    getCurrentSlide() {
        return this.currentSlide;
    }

    getTotalSlides() {
        return this.slides.length;
    }

    goToFirstSlide() {
        this.goToSlide(0);
    }

    goToLastSlide() {
        this.goToSlide(this.slides.length - 1);
    }

    // Метод для внешнего использования (например, из консоли)
    showSlideInfo() {
        const current = this.slides[this.currentSlide];
        return {
            index: this.currentSlide,
            id: current.id,
            title: this.getSlideTitle(current),
            total: this.slides.length
        };
    }
}

// Инициализация навигации при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    // Ждем немного для загрузки слайдов
    setTimeout(() => {
        window.presentationNavigation = new PresentationNavigation();
    }, 100);
});

// Экспорт для модульного использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresentationNavigation;
}