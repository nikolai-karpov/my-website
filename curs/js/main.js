/**
 * Основной модуль приложения "Интерактивный портфель методологии AI-курса"
 * Инициализация приложения, защита контента, координация работы модулей
 * @module main
 */

import { initializeNavigation } from './navigation.js';
import { initializeRoadmap } from './roadmap.js';
import { initializeTechmap } from './techmap.js';
import { initializeVisualizations } from './visualizations.js';
import { loadData } from './utils.js';
import { initializeDiagramModals } from './modal.js';
import { initializeBrief } from './brief.js';

/**
 * Основной класс приложения
 */
class App {
    constructor() {
        this.isInitialized = false;
        this.data = {
            roadmap: null,
            techmap: null
        };
        
        // Элементы DOM
        this.elements = {};
        
        // Настройки приложения
        this.config = {
            contentProtection: true,
            animationEnabled: true,
            debugMode: false
        };
        
        this.init();
    }

    /**
     * Инициализация приложения
     */
    async init() {
        try {
            console.log('🚀 Инициализация приложения...');
            
            // 1. Находим ключевые элементы DOM
            this.cacheElements();
            
            // 2. Настраиваем защиту контента
            if (this.config.contentProtection) {
                this.setupContentProtection();
            }
            
            // 3. Загружаем данные
            await this.loadAppData();
            
            // 4. Инициализируем модули
            this.initializeModules();
            
            // 5. Настраиваем обработчики событий
            this.setupEventListeners();
            
            // 6. Показываем приложение
            this.showApp();
            
            this.isInitialized = true;
            console.log('✅ Приложение успешно инициализировано');
            
            // Отправляем событие о готовности
            this.dispatchEvent('app:ready');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации приложения:', error);
            this.showError(error);
        }
    }

    /**
     * Кэширование ключевых элементов DOM
     */
    cacheElements() {
        this.elements = {
            appContainer: document.querySelector('main'),
            loadingIndicators: document.querySelectorAll('.text-center.text-gray-500'),
            navLinks: document.querySelectorAll('.nav-link'),
            body: document.body
        };
    }

    /**
     * Настройка защиты контента от копирования
     */
    setupContentProtection() {
        console.log('🔒 Настройка защиты контента...');
        
        // 1. Отключаем контекстное меню (правый клик)
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showProtectionMessage('Контекстное меню отключено для защиты контента');
            return false;
        });

        // 2. Отключаем выделение текста
        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
        });

        // 3. Отключаем перетаскивание изображений
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
                return false;
            }
        });

        // 4. Добавляем класс защиты к телу документа
        this.elements.body.classList.add('content-protected');

        // 5. Защита от горячих клавиш (Ctrl+C, Ctrl+U и т.д.)
        document.addEventListener('keydown', (e) => {
            // Блокировка Ctrl+U (просмотр исходного кода)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                this.showProtectionMessage('Просмотр исходного кода ограничен');
                return false;
            }
            
            // Блокировка Ctrl+S (сохранение страницы)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.showProtectionMessage('Сохранение страницы ограничено');
                return false;
            }
            
            // Блокировка F12 и Ctrl+Shift+I (инструменты разработчика)
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
                this.showProtectionMessage('Инструменты разработчика ограничены');
                return false;
            }
        });

        // 6. Защита от копирования через буфер обмена
        document.addEventListener('copy', (e) => {
            e.preventDefault();
            this.showProtectionMessage('Копирование контента ограничено');
            return false;
        });

        // 7. Защита от вставки
        document.addEventListener('paste', (e) => {
            e.preventDefault();
            return false;
        });

        // 8. Защита от вырезания
        document.addEventListener('cut', (e) => {
            e.preventDefault();
            return false;
        });

        console.log('✅ Защита контента настроена');
    }

    /**
     * Показать сообщение о защите
     * @param {string} message - Текст сообщения
     */
    showProtectionMessage(message) {
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-rose-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
        notification.textContent = message;
        
        // Добавляем иконку
        const icon = document.createElement('i');
        icon.className = 'fas fa-shield-alt mr-2';
        notification.prepend(icon);
        
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Загрузка данных приложения
     */
    async loadAppData() {
        console.log('📂 Загрузка данных приложения...');
        
        try {
            // Загружаем данные дорожной карты
            this.data.roadmap = await loadData('./data/roadmap.json');
            console.log('✅ Данные дорожной карты загружены');
            
            // Загружаем данные технологической карты
            this.data.techmap = await loadData('./data/techmap.json');
            console.log('✅ Данные технологической карты загружены');
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            throw new Error(`Не удалось загрузить данные: ${error.message}`);
        }
    }

    /**
     * Инициализация модулей приложения
     */
    initializeModules() {
        console.log('⚙️ Инициализация модулей...');
        
        // 1. Инициализация навигации
        initializeNavigation(this.elements.navLinks);
        
        // 2. Инициализация дорожной карты
        if (this.data.roadmap) {
            initializeRoadmap(this.data.roadmap);
        }
        
        // 3. Инициализация технологической карты
        if (this.data.techmap) {
            initializeTechmap(this.data.techmap);
        }
        
        // 4. Инициализация визуализаций
        initializeVisualizations(this.data);
        
        // 5. Инициализация модальных окон для диаграмм
        initializeDiagramModals();
        
        // 6. Инициализация бриф-формы
        initializeBrief();
        
        console.log('✅ Все модули инициализированы');
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        console.log('🎮 Настройка обработчиков событий...');
        
        // Обработчик для кнопки "Наверх"
        const scrollToTopButton = document.createElement('button');
        scrollToTopButton.className = 'fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition duration-300 z-40 hidden';
        scrollToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
        scrollToTopButton.setAttribute('aria-label', 'Наверх');
        scrollToTopButton.id = 'scroll-to-top';
        document.body.appendChild(scrollToTopButton);
        
        // Показываем/скрываем кнопку при прокрутке
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                scrollToTopButton.classList.remove('hidden');
                scrollToTopButton.classList.add('animate-fade-in');
            } else {
                scrollToTopButton.classList.add('hidden');
            }
        });
        
        // Прокрутка наверх при клике
        scrollToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Обработчик для обновления активной навигации при прокрутке
        window.addEventListener('scroll', () => {
            this.updateActiveNavOnScroll();
        });
        
        console.log('✅ Обработчики событий настроены');
    }

    /**
     * Обновление активной ссылки навигации при прокрутке
     */
    updateActiveNavOnScroll() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                // Удаляем активный класс у всех ссылок
                this.elements.navLinks.forEach(link => {
                    link.classList.remove('active');
                });
                
                // Добавляем активный класс текущей ссылке
                const activeLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }

    /**
     * Показать приложение (скрыть индикаторы загрузки)
     */
    showApp() {
        console.log('🎨 Отображение приложения...');
        
        // Скрываем индикаторы загрузки
        this.elements.loadingIndicators.forEach(indicator => {
            indicator.style.display = 'none';
        });
        
        // Показываем контент с анимацией
        this.elements.appContainer.classList.add('opacity-0');
        setTimeout(() => {
            this.elements.appContainer.classList.remove('opacity-0');
            this.elements.appContainer.classList.add('opacity-100', 'transition-opacity', 'duration-500');
        }, 100);
        
        // Обновляем активную навигацию
        this.updateActiveNavOnScroll();
        
        console.log('✅ Приложение отображено');
    }

    /**
     * Показать ошибку
     * @param {Error} error - Объект ошибки
     */
    showError(error) {
        console.error('💥 Критическая ошибка:', error);
        
        // Создаем контейнер для ошибки
        const errorContainer = document.createElement('div');
        errorContainer.className = 'fixed inset-0 bg-white z-50 flex items-center justify-center p-4';
        errorContainer.innerHTML = `
            <div class="max-w-md w-full bg-rose-50 border border-rose-200 rounded-xl p-6 shadow-lg">
                <div class="flex items-center mb-4">
                    <i class="fas fa-exclamation-triangle text-rose-600 text-2xl mr-3"></i>
                    <h3 class="text-xl font-bold text-rose-800">Ошибка загрузки приложения</h3>
                </div>
                <p class="text-rose-700 mb-4">${error.message || 'Произошла непредвиденная ошибка'}</p>
                <div class="bg-rose-100 border border-rose-300 rounded-lg p-3 mb-4">
                    <p class="text-sm text-rose-800 font-mono">${error.stack || 'Нет дополнительной информации'}</p>
                </div>
                <div class="flex justify-end space-x-3">
                    <button id="retry-btn" class="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition">
                        <i class="fas fa-redo mr-2"></i>Повторить
                    </button>
                    <button id="report-btn" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition">
                        <i class="fas fa-bug mr-2"></i>Сообщить об ошибке
                    </button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorContainer);
        
        // Обработчики кнопок
        document.getElementById('retry-btn').addEventListener('click', () => {
            window.location.reload();
        });
        
        document.getElementById('report-btn').addEventListener('click', () => {
            const subject = encodeURIComponent('Ошибка в приложении AI Курс Методология');
            const body = encodeURIComponent(`Ошибка: ${error.message}\n\nСтек: ${error.stack}\n\nБраузер: ${navigator.userAgent}`);
            window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
        });
    }

    /**
     * Отправка пользовательского события
     * @param {string} eventName - Имя события
     * @param {any} detail - Данные события
     */
    dispatchEvent(eventName, detail = null) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Получить данные приложения
     * @returns {Object} Данные приложения
     */
    getData() {
        return this.data;
    }

    /**
     * Получить конфигурацию приложения
     * @returns {Object} Конфигурация
     */
    getConfig() {
        return this.config;
    }

    /**
     * Обновить настройку конфигурации
     * @param {string} key - Ключ настройки
     * @param {any} value - Значение
     */
    setConfig(key, value) {
        if (key in this.config) {
            this.config[key] = value;
            
            // Если отключаем защиту контента
            if (key === 'contentProtection' && !value) {
                this.elements.body.classList.remove('content-protected');
            }
            
            this.dispatchEvent('config:changed', { key, value });
        }
    }
}

/**
 * Инициализация приложения при загрузке DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем поддержку необходимых API
    if (!('Promise' in window)) {
        alert('Ваш браузер устарел. Пожалуйста, обновите его для использования приложения.');
        return;
    }
    
    // Инициализируем приложение
    window.app = new App();
    
    // Экспортируем глобально для отладки (только в debug mode)
    if (window.location.search.includes('debug=true')) {
        window.app.setConfig('debugMode', true);
        console.log('🔧 Режим отладки включен');
    }
});

// Экспорт для использования в других модулях
export default App;