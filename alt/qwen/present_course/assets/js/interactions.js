/**
 * Interactive Elements Manager for AI Implementation Playbook
 * Handles hover effects, modal windows, and user interactions
 * UPDATED: Синхронизирован с текущими CSS-классами и структурой
 */

class PresentationInteractions {
    constructor() {
        this.modals = new Map();
        this.currentModal = null;
        this.currentTooltip = null;
        this.activeDocumentIcons = new Set();

        this.init();
    }

    init() {
        this.initMethodologyHoverEffects();
        this.initDocumentClickHandlers();
        this.initPipelineInteractions();
        this.initTooltipSystem();
        this.initSmoothScrolling();
        this.initAccessibility();

        // Initialize existing modals from DOM
        this.initExistingModals();
    }

    // Methodology Diagram Hover Effects
    initMethodologyHoverEffects() {
        const methodologyBlocks = document.querySelectorAll('.methodology-block');

        methodologyBlocks.forEach(block => {
            // Удаляем существующие тултипы (если есть)
            const existingTooltip = block.querySelector('.tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }

            // Получаем данные из дочерних элементов
            const tooltipElement = block.querySelector('.tooltip');
            if (!tooltipElement) return;

            const tooltipText = tooltipElement.textContent || 'Инструменты не указаны';

            // Enhanced hover effects
            block.addEventListener('mouseenter', (e) => {
                this.animateMethodologyBlock(block, 'enter');
            });

            block.addEventListener('mouseleave', (e) => {
                this.animateMethodologyBlock(block, 'leave');
            });

            // Touch support for mobile
            block.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.animateMethodologyBlock(block, 'enter');

                // Show tooltip on touch
                setTimeout(() => {
                    this.showTooltip(block, tooltipText);
                }, 300);
            });

            block.addEventListener('touchend', (e) => {
                e.preventDefault();
                setTimeout(() => {
                    this.animateMethodologyBlock(block, 'leave');
                    this.hideTooltip();
                }, 2000);
            });

            // Keyboard accessibility
            block.setAttribute('tabindex', '0');
            block.setAttribute('role', 'button');
            block.setAttribute('aria-label', `Методология: ${block.querySelector('.methodology-block-title')?.textContent || 'Блок'}`);

            block.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.animateMethodologyBlock(block, 'enter');
                    setTimeout(() => {
                        this.animateMethodologyBlock(block, 'leave');
                    }, 300);
                }
            });
        });
    }

    animateMethodologyBlock(block, action) {
        if (action === 'enter') {
            block.style.transform = 'translateY(-10px) scale(1.02)';
            block.style.zIndex = '10';

            // Animate icon
            const icon = block.querySelector('.icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            }

            // Animate connector lines if they exist
            const connectors = document.querySelectorAll('.methodology-connector');
            connectors.forEach(connector => {
                connector.style.background = 'var(--gradient-primary)';
                connector.style.opacity = '1';
            });

            // Add active class
            block.classList.add('methodology-block--active');

        } else {
            block.style.transform = '';
            block.style.zIndex = '';

            // Reset icon
            const icon = block.querySelector('.icon');
            if (icon) {
                icon.style.transform = '';
            }

            // Reset connectors
            const connectors = document.querySelectorAll('.methodology-connector');
            connectors.forEach(connector => {
                connector.style.background = '';
                connector.style.opacity = '';
            });

            // Remove active class
            block.classList.remove('methodology-block--active');
        }
    }

    // Document Icon Click Handlers
    initDocumentClickHandlers() {
        const documentIcons = document.querySelectorAll('.document-icon');

        documentIcons.forEach(icon => {
            // Очищаем существующие обработчики
            icon.replaceWith(icon.cloneNode(true));
        });

        // Повторно получаем элементы
        const refreshedIcons = document.querySelectorAll('.document-icon');

        refreshedIcons.forEach(icon => {
            const documentType = icon.getAttribute('data-document') || 'Документ';
            const documentTypeSlug = documentType.toLowerCase().replace(/\s+/g, '-');

            // Устанавливаем пример промпта в зависимости от типа документа
            let promptExample = '';
            let modalContent = '';

            switch(documentType) {
                case 'Геология (120 стр.)':
                    promptExample = `Извлеки все параметры грунта из геологического отчета:
1. Несущая способность (R, кПа)
2. Уровень грунтовых вод (УГВ, м)
3. Тип грунта
4. Рекомендации по фундаменту
5. Особые условия (сейсмичность, карсты)

Представь в виде таблицы с указанием страниц-источников.`;
                    modalContent = 'Геологический отчет содержит данные инженерно-геологических изысканий по 8 скважинам.';
                    break;

                case 'ТЗ Заказчика':
                    promptExample = `Проанализируй техническое задание и выдели:
1. Основные требования к объекту
2. Ограничения по срокам и бюджету
3. Требования к материалам и технологиям
4. Особые пожелания заказчика
5. Критерии приемки работ

Сгруппируй по приоритетам (обязательные/желательные).`;
                    modalContent = 'Техническое задание от Заказчика с требованиями к проектированию.';
                    break;

                case 'СНиП/СП':
                    promptExample = `Найди все нормативные требования, относящиеся к:
1. Конструктивным решениям
2. Расчетным нагрузкам
3. Требованиям безопасности
4. Эксплуатационным характеристикам
5. Акттуальные версии нормативов

Отметь устаревшие ссылки и предложи актуальные аналоги.`;
                    modalContent = 'Сборник нормативных документов для проектирования.';
                    break;

                default:
                    promptExample = `Проанализируй предоставленный документ и выдели ключевые параметры:
1. Основные требования
2. Ограничения и условия
3. Технические характеристики
4. Рекомендации и примечания

Представь информацию в структурированном виде.`;
                    modalContent = 'Общий анализ документа.';
            }

            // Устанавливаем атрибуты
            icon.setAttribute('data-document', documentType);
            icon.setAttribute('data-prompt', promptExample);
            icon.setAttribute('data-modal-content', modalContent);
            icon.setAttribute('data-document-slug', documentTypeSlug);

            // Добавляем обработчики событий
            icon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Визуальная обратная связь
                this.animateDocumentIconClick(icon);

                // Открываем модальное окно
                this.openDocumentModal(documentType, promptExample, modalContent);
            });

            // Keyboard accessibility
            icon.setAttribute('tabindex', '0');
            icon.setAttribute('role', 'button');
            icon.setAttribute('aria-label', `Просмотр примера промпта для: ${documentType}`);

            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.animateDocumentIconClick(icon);
                    this.openDocumentModal(documentType, promptExample, modalContent);
                }
            });

            // Hover effects
            icon.addEventListener('mouseenter', () => {
                if (!this.activeDocumentIcons.has(icon)) {
                    icon.style.transform = 'translateY(-5px) scale(1.05)';
                }
            });

            icon.addEventListener('mouseleave', () => {
                if (!this.activeDocumentIcons.has(icon)) {
                    icon.style.transform = '';
                }
            });

            // Touch support
            icon.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.animateDocumentIconClick(icon);
            });

            icon.addEventListener('touchend', (e) => {
                e.preventDefault();
                setTimeout(() => {
                    this.openDocumentModal(documentType, promptExample, modalContent);
                }, 300);
            });
        });
    }

    animateDocumentIconClick(icon) {
        // Анимация клика
        this.activeDocumentIcons.add(icon);
        icon.style.transform = 'translateY(-3px) scale(1.1)';
        icon.style.boxShadow = 'var(--shadow-glow)';

        // Сброс через время
        setTimeout(() => {
            this.activeDocumentIcons.delete(icon);
            icon.style.transform = '';
            icon.style.boxShadow = '';
        }, 300);
    }

    openDocumentModal(documentType, promptExample, modalContent) {
        const modalId = `modal-${documentType.toLowerCase().replace(/\s+/g, '-')}`;

        // Create modal if it doesn't exist
        if (!this.modals.has(modalId)) {
            this.createDocumentModal(modalId, documentType, promptExample, modalContent);
        }

        this.showModal(modalId);
    }

    createDocumentModal(modalId, documentType, promptExample, modalContent) {
        const modal = document.createElement('div');
        modal.className = 'document-modal';
        modal.id = modalId;
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('aria-labelledby', `${modalId}-title`);
        modal.setAttribute('role', 'dialog');

        modal.innerHTML = `
            <div class="modal-content" role="document">
                <button class="modal-close" aria-label="Закрыть окно">×</button>
                <div class="modal-header">
                    <h3 id="${modalId}-title" class="modal-title">Пример промпта: ${documentType}</h3>
                </div>
                <div class="modal-body">
                    <div class="prompt-example">
                        <div class="prompt-header">
                            <span class="prompt-badge">ПРОМПТ</span>
                            <button class="copy-prompt-btn" data-prompt="${promptExample.replace(/"/g, '&quot;')}">
                                <i class="fas fa-copy"></i> Копировать
                            </button>
                        </div>
                        <pre class="prompt-code"><code>${promptExample}</code></pre>
                    </div>
                    ${modalContent ? `
                    <div class="modal-additional-content">
                        <h4>Контекст</h4>
                        <p>${modalContent}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <p class="modal-note">
                        <i class="fas fa-lightbulb"></i> Этот промпт демонстрирует, как ИИ извлекает структурированную информацию из неструктурированных документов
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modals.set(modalId, modal);

        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const copyBtn = modal.querySelector('.copy-prompt-btn');

        closeBtn.addEventListener('click', () => this.hideModal(modalId));
        copyBtn.addEventListener('click', () => this.copyPromptToClipboard(promptExample, copyBtn));

        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal(modalId);
            }
        });

        // Keyboard navigation
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal(modalId);
            }
        });

        // Focus management
        modal.addEventListener('transitionend', () => {
            if (modal.classList.contains('active')) {
                closeBtn.focus();
            }
        });
    }

    initExistingModals() {
        // Инициализация любых существующих модальных окон в DOM
        const existingModals = document.querySelectorAll('.modal');
        existingModals.forEach(modal => {
            const modalId = modal.id;
            if (modalId) {
                this.modals.set(modalId, modal);

                const closeBtn = modal.querySelector('.modal-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => this.hideModal(modalId));
                }
            }
        });
    }

    showModal(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        // Hide any currently open modal
        if (this.currentModal) {
            this.hideModal(this.currentModal);
        }

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        this.currentModal = modalId;

        // Focus trap
        this.setupFocusTrap(modal);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
    }

    hideModal(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        this.currentModal = null;

        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        // Remove focus trap
        this.removeFocusTrap();

        // Возвращаем фокус на элемент, который открыл модалку
        if (this.lastFocusedElement) {
            this.lastFocusedElement.focus();
            this.lastFocusedElement = null;
        }
    }

    getScrollbarWidth() {
        // Create a temporary div to measure scrollbar width
        const div = document.createElement('div');
        div.style.overflow = 'scroll';
        div.style.position = 'absolute';
        div.style.top = '-9999px';
        div.style.width = '50px';
        div.style.height = '50px';
        document.body.appendChild(div);

        const scrollbarWidth = div.offsetWidth - div.clientWidth;
        document.body.removeChild(div);

        return scrollbarWidth;
    }

    setupFocusTrap(modal) {
        // Сохраняем последний сфокусированный элемент
        this.lastFocusedElement = document.activeElement;

        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            this.firstFocusableElement = focusableElements[0];
            this.lastFocusableElement = focusableElements[focusableElements.length - 1];

            // Добавляем обработчик для ловушки фокуса
            this.focusTrapHandler = this.handleFocusTrap.bind(this);
            modal.addEventListener('keydown', this.focusTrapHandler);

            // Фокусируем первый элемент
            setTimeout(() => {
                this.firstFocusableElement.focus();
            }, 100);
        }
    }

    handleFocusTrap(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === this.firstFocusableElement) {
                e.preventDefault();
                this.lastFocusableElement.focus();
            }
        } else {
            if (document.activeElement === this.lastFocusableElement) {
                e.preventDefault();
                this.firstFocusableElement.focus();
            }
        }
    }

    removeFocusTrap() {
        if (this.currentModal) {
            const modal = this.modals.get(this.currentModal);
            if (modal && this.focusTrapHandler) {
                modal.removeEventListener('keydown', this.focusTrapHandler);
            }
        }
    }

    async copyPromptToClipboard(promptText, copyButton) {
        try {
            await navigator.clipboard.writeText(promptText);

            // Visual feedback
            const originalText = copyButton.innerHTML;
            const originalBackground = copyButton.style.background;

            copyButton.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
            copyButton.style.background = 'var(--color-primary-700)';
            copyButton.disabled = true;

            // Анимация успеха
            copyButton.classList.add('copy-success');

            setTimeout(() => {
                copyButton.innerHTML = originalText;
                copyButton.style.background = originalBackground;
                copyButton.disabled = false;
                copyButton.classList.remove('copy-success');
            }, 2000);

        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            this.fallbackCopyPrompt(promptText, copyButton);
        }
    }

    fallbackCopyPrompt(promptText, copyButton) {
        const textArea = document.createElement('textarea');
        textArea.value = promptText;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();

        try {
            const successful = document.execCommand('copy');

            if (successful) {
                copyButton.innerHTML = '<i class="fas fa-check"></i> Скопировано!';
                copyButton.style.background = 'var(--color-primary-700)';

                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i> Копировать';
                    copyButton.style.background = '';
                }, 2000);
            }
        } catch (err) {
            console.error('Fallback copy failed: ', err);
            copyButton.innerHTML = '<i class="fas fa-times"></i> Ошибка';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fas fa-copy"></i> Копировать';
            }, 2000);
        }

        document.body.removeChild(textArea);
    }

    // Pipeline Interactions
    initPipelineInteractions() {
        const pipelineDiagram = document.querySelector('.pipeline-diagram');
        if (!pipelineDiagram) return;

        // Добавляем возможность клика для анимации
        pipelineDiagram.style.cursor = 'pointer';
        pipelineDiagram.setAttribute('title', 'Нажмите для запуска анимации');
        pipelineDiagram.setAttribute('role', 'button');
        pipelineDiagram.setAttribute('tabindex', '0');
        pipelineDiagram.setAttribute('aria-label', 'Анимированная демонстрация пайплайна проверки');

        pipelineDiagram.addEventListener('click', () => {
            this.animatePipeline();
        });

        pipelineDiagram.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.animatePipeline();
            }
        });

        // Auto-animate when slide becomes active
        document.addEventListener('slideChange', (e) => {
            if (e.detail.slideElement.id === 'slide-05-case-2') {
                setTimeout(() => {
                    // Даем пользователю время увидеть слайд перед авто-анимацией
                    setTimeout(() => {
                        this.animatePipeline();
                    }, 1500);
                }, 100);
            }
        });
    }

    animatePipeline() {
        const pipeline = document.querySelector('.pipeline-diagram');
        if (!pipeline) return;

        const steps = pipeline.querySelectorAll('.pipeline-step');
        const arrows = pipeline.querySelectorAll('.pipeline-arrow');

        // Сбрасываем предыдущую анимацию
        pipeline.classList.remove('animating');
        steps.forEach(step => step.classList.remove('active'));
        arrows.forEach(arrow => {
            arrow.style.animation = '';
            arrow.style.background = '';
        });

        // Даем время для сброса
        setTimeout(() => {
            pipeline.classList.add('animating');

            // Animate steps sequentially
            steps.forEach((step, index) => {
                setTimeout(() => {
                    step.classList.add('active');

                    // Animate corresponding arrow
                    if (arrows[index]) {
                        arrows[index].style.background = 'var(--gradient-primary)';
                        arrows[index].style.opacity = '1';
                        arrows[index].style.animation = 'arrowPulse 1s var(--ease-out) infinite';
                    }
                }, index * 600);
            });

            // Reset animation after completion
            setTimeout(() => {
                steps.forEach(step => step.classList.remove('active'));
                arrows.forEach(arrow => {
                    arrow.style.animation = '';
                    arrow.style.background = '';
                    arrow.style.opacity = '';
                });
                pipeline.classList.remove('animating');
            }, steps.length * 600 + 1000);
        }, 50);
    }

    // Tooltip System
    initTooltipSystem() {
        // Enhanced tooltips for various elements
        const tooltipElements = document.querySelectorAll('[data-tooltip]');

        tooltipElements.forEach(element => {
            const tooltipText = element.getAttribute('data-tooltip');

            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, tooltipText);
            });

            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });

            element.addEventListener('focus', (e) => {
                this.showTooltip(e.target, tooltipText);
            });

            element.addEventListener('blur', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        // Remove existing tooltip
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = text;
        tooltip.setAttribute('role', 'tooltip');
        tooltip.setAttribute('id', 'dynamic-tooltip');

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        let top = rect.top + scrollTop - tooltip.offsetHeight - 10;
        let left = rect.left + scrollLeft + rect.width / 2;

        // Adjust if tooltip goes off screen
        if (left < 10) left = 10;
        if (left + tooltip.offsetWidth > window.innerWidth - 10) {
            left = window.innerWidth - tooltip.offsetWidth - 10;
        }
        if (top < 10) top = rect.bottom + scrollTop + 10;

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;

        this.currentTooltip = tooltip;

        // Устанавливаем aria-describedby для доступности
        if (!element.getAttribute('aria-describedby')) {
            element.setAttribute('aria-describedby', 'dynamic-tooltip');
        }
    }

    hideTooltip() {
        if (this.currentTooltip) {
            // Удаляем aria-describedby
            const describedElement = document.querySelector('[aria-describedby="dynamic-tooltip"]');
            if (describedElement) {
                describedElement.removeAttribute('aria-describedby');
            }

            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    // Smooth Scrolling for internal links
    initSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);

                // Проверяем, ссылается ли на слайд
                if (targetId.startsWith('slide-')) {
                    const targetSlide = document.getElementById(targetId);
                    if (targetSlide) {
                        const slideIndex = Array.from(document.querySelectorAll('.slide'))
                            .findIndex(slide => slide.id === targetId);

                        if (slideIndex !== -1 && window.presentationNavigation) {
                            window.presentationNavigation.goToSlide(slideIndex);
                        }
                    }
                }
            }
        });
    }

    // Accessibility improvements
    initAccessibility() {
        // Добавляем ARIA-атрибуты для интерактивных элементов
        this.addAriaAttributes();

        // Обработка нажатия Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
                this.hideTooltip();
            }
        });

        // Улучшаем фокус для мобильных устройств
        if ('ontouchstart' in window) {
            document.addEventListener('touchstart', () => {}, { passive: true });
        }
    }

    addAriaAttributes() {
        // Методология блоки
        document.querySelectorAll('.methodology-block').forEach((block, index) => {
            block.setAttribute('aria-label', `Шаг ${index + 1} методологии: ${block.querySelector('.methodology-block-title')?.textContent || ''}`);
        });

        // Шаги пайплайна
        document.querySelectorAll('.pipeline-step').forEach((step, index) => {
            step.setAttribute('aria-label', `Шаг ${index + 1} пайплайна: ${step.querySelector('strong')?.textContent || ''}`);
        });

        // Иконки документов
        document.querySelectorAll('.document-icon').forEach(icon => {
            const documentName = icon.getAttribute('data-document') || 'Документ';
            icon.setAttribute('aria-label', `Пример промпта для ${documentName}`);
        });

        // Кнопки навигации
        const navButtons = document.querySelectorAll('.nav-btn');
        if (navButtons.length >= 2) {
            navButtons[0].setAttribute('aria-label', 'Предыдущий слайд');
            navButtons[1].setAttribute('aria-label', 'Следующий слайд');
        }

        // Точки прогресса
        document.querySelectorAll('.progress-dot').forEach((dot, index) => {
            dot.setAttribute('aria-label', `Перейти к слайду ${index + 1}`);
        });
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.active, .document-modal.active');
        modals.forEach(modal => {
            const modalId = modal.id;
            if (modalId) {
                this.hideModal(modalId);
            } else {
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
            }
        });

        // Также закрываем кастомные модалки
        this.modals.forEach((modal, modalId) => {
            if (modal.classList.contains('active')) {
                this.hideModal(modalId);
            }
        });
    }
}

// Initialize interactions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.presentationInteractions = new PresentationInteractions();
    }, 100);
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresentationInteractions;
}