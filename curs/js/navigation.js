/**
 * Модуль управления навигацией приложения
 * Обработка кликов по ссылкам, плавная прокрутка, активные состояния
 * @module navigation
 */

import { smoothScrollTo, debounce } from './utils.js';

/**
 * Инициализация навигации
 * @param {NodeList} navLinks - Коллекция ссылок навигации
 */
export function initializeNavigation(navLinks) {
    console.log('🧭 Инициализация навигации...');
    
    if (!navLinks || navLinks.length === 0) {
        console.warn('Ссылки навигации не найдены');
        return;
    }
    
    // 1. Настраиваем плавную прокрутку для всех ссылок
    setupSmoothScrolling(navLinks);
    
    // 2. Настраиваем отслеживание активной секции
    setupActiveSectionTracking(navLinks);
    
    // 3. Настраиваем мобильное меню (если есть)
    setupMobileMenu();
    
    // 4. Настраиваем навигацию по клавиатуре
    setupKeyboardNavigation(navLinks);
    
    console.log('✅ Навигация инициализирована');
}

/**
 * Настройка плавной прокрутки для ссылок навигации
 * @param {NodeList} navLinks - Ссылки навигации
 */
function setupSmoothScrolling(navLinks) {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Пропускаем якоря без ID (например, внешние ссылки)
            if (!href.startsWith('#')) return;
            
            const targetId = href.substring(1);
            
            // Проверяем существование целевого элемента
            const targetElement = document.getElementById(targetId);
            if (!targetElement) {
                console.warn(`Целевой элемент #${targetId} не найден`);
                return;
            }
            
            e.preventDefault();
            
            // Прокручиваем к элементу
            smoothScrollTo(targetElement, {
                offset: 80,
                duration: 800
            });
            
            // Обновляем URL без перезагрузки страницы
            updateUrlHash(targetId);
            
            // Закрываем мобильное меню если открыто
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                const menuButton = document.getElementById('mobile-menu-button');
                const menuIcon = menuButton?.querySelector('i');
                
                if (menuButton && menuIcon) {
                    mobileMenu.classList.remove('flex');
                    mobileMenu.classList.add('hidden');
                    menuButton.setAttribute('aria-expanded', 'false');
                    menuIcon.className = 'fas fa-bars text-xl';
                    document.body.style.overflow = ''; // Восстанавливаем скролл
                }
            }
            
            // Добавляем визуальную обратную связь
            addClickFeedback(this);
        });
    });
}

/**
 * Настройка отслеживания активной секции при прокрутке
 * @param {NodeList} navLinks - Ссылки навигации
 */
function setupActiveSectionTracking(navLinks) {
    // Дебаунс для оптимизации производительности
    const debouncedUpdateActiveNav = debounce(() => {
        updateActiveNavigation(navLinks);
    }, 100);
    
    // Слушаем событие прокрутки
    window.addEventListener('scroll', debouncedUpdateActiveNav);
    
    // Также обновляем при загрузке
    setTimeout(() => updateActiveNavigation(navLinks), 100);
}

/**
 * Обновление активного состояния навигации
 * @param {NodeList} navLinks - Ссылки навигации
 */
function updateActiveNavigation(navLinks) {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 100;
    let currentActiveId = '';
    
    // Находим текущую активную секцию
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentActiveId = sectionId;
        }
    });
    
    // Обновляем классы у ссылок
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const linkId = href.substring(1);
        
        link.classList.remove('active');
        
        if (linkId === currentActiveId) {
            link.classList.add('active');
            
            // Добавляем ARIA атрибут для доступности
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

/**
 * Настройка мобильного меню
 */
function setupMobileMenu() {
    // Создаем кнопку для мобильного меню
    const mobileMenuButton = createMobileMenuButton();
    
    // Создаем мобильное меню
    const mobileMenu = createMobileMenu();
    
    // Добавляем кнопку в DOM
    const header = document.querySelector('header');
    if (header) {
        header.appendChild(mobileMenuButton);
        document.body.appendChild(mobileMenu);
        
        // Настраиваем обработчики
        setupMobileMenuHandlers(mobileMenuButton, mobileMenu);
    }
}

/**
 * Создание кнопки мобильного меню
 * @returns {Element} Кнопка меню
 */
function createMobileMenuButton() {
    const button = document.createElement('button');
    button.className = 'md:hidden fixed top-4 right-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition';
    button.setAttribute('aria-label', 'Открыть меню');
    button.setAttribute('aria-expanded', 'false');
    button.id = 'mobile-menu-button';
    
    const icon = document.createElement('i');
    icon.className = 'fas fa-bars text-xl';
    button.appendChild(icon);
    
    return button;
}

/**
 * Создание мобильного меню
 * @returns {Element} Контейнер мобильного меню
 */
function createMobileMenu() {
    const menu = document.createElement('div');
    menu.className = 'fixed inset-0 bg-white/95 backdrop-blur-sm z-40 flex flex-col justify-center items-center hidden';
    menu.id = 'mobile-menu';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'absolute top-6 right-6 p-2 text-gray-700 hover:text-blue-600';
    closeButton.setAttribute('aria-label', 'Закрыть меню');
    
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times text-2xl';
    closeButton.appendChild(closeIcon);
    
    const navClone = document.querySelector('nav ul').cloneNode(true);
    navClone.className = 'flex flex-col space-y-6 text-center';
    
    // Обновляем ссылки для мобильного меню
    navClone.querySelectorAll('a').forEach(link => {
        link.className = 'text-2xl font-medium text-gray-800 hover:text-blue-600 py-2';
        link.addEventListener('click', () => {
            // Закрываем мобильное меню при клике по ссылке
            const menu = document.getElementById('mobile-menu');
            const button = document.getElementById('mobile-menu-button');
            const menuIcon = button?.querySelector('i');
            
            if (menu && button && menuIcon) {
                menu.classList.remove('flex');
                menu.classList.add('hidden');
                button.setAttribute('aria-expanded', 'false');
                menuIcon.className = 'fas fa-bars text-xl';
                document.body.style.overflow = ''; // Восстанавливаем скролл
            }
        });
    });
    
    menu.appendChild(closeButton);
    menu.appendChild(navClone);
    
    return menu;
}

/**
 * Настройка обработчиков для мобильного меню
 * @param {Element} button - Кнопка меню
 * @param {Element} menu - Контейнер меню
 */
function setupMobileMenuHandlers(button, menu) {
    const menuIcon = button.querySelector('i');
    
    // Локальные функции открытия/закрытия меню
    const openMenu = () => {
        menu.classList.remove('hidden');
        menu.classList.add('flex');
        button.setAttribute('aria-expanded', 'true');
        menuIcon.className = 'fas fa-times text-xl';
        document.body.style.overflow = 'hidden'; // Блокируем скролл
    };
    
    const closeMenu = () => {
        menu.classList.remove('flex');
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
        menuIcon.className = 'fas fa-bars text-xl';
        document.body.style.overflow = ''; // Восстанавливаем скролл
    };
    
    button.addEventListener('click', () => {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Обработчик для кнопки закрытия в самом меню
    menu.querySelector('button[aria-label="Закрыть меню"]').addEventListener('click', closeMenu);
    
    // Закрытие меню при клике на оверлей
    menu.addEventListener('click', (e) => {
        if (e.target === menu) {
            closeMenu();
        }
    });
}

/**
 * Настройка навигации с клавиатуры
 * @param {NodeList} navLinks - Ссылки навигации
 */
function setupKeyboardNavigation(navLinks) {
    // Делаем навигацию доступной с клавиатуры
    navLinks.forEach((link, index) => {
        link.setAttribute('tabindex', '0');
        
        // Навигация стрелками
        link.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (index + 1) % navLinks.length;
                    navLinks[nextIndex].focus();
                    break;
                    
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = index === 0 ? navLinks.length - 1 : index - 1;
                    navLinks[prevIndex].focus();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    navLinks[0].focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    navLinks[navLinks.length - 1].focus();
                    break;
                    
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    link.click();
                    break;
            }
        });
    });
    
    // Глобальная навигация по странице
    document.addEventListener('keydown', (e) => {
        // Пропускаем если пользователь вводит текст
        if (e.target.matches('input, textarea, [contenteditable="true"]')) return;
        
        // Клавиши для навигации между секциями
        if (e.key === 'PageDown') {
            e.preventDefault();
            scrollToNextSection();
        } else if (e.key === 'PageUp') {
            e.preventDefault();
            scrollToPrevSection();
        }
    });
}

/**
 * Прокрутка к следующей секции
 */
function scrollToNextSection() {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const currentScroll = window.scrollY;
    
    const currentSectionIndex = sections.findIndex(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
    });
    
    const nextIndex = (currentSectionIndex + 1) % sections.length;
    if (sections[nextIndex]) {
        smoothScrollTo(sections[nextIndex], { offset: 80 });
    }
}

/**
 * Прокрутка к предыдущей секции
 */
function scrollToPrevSection() {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    const currentScroll = window.scrollY;
    
    const currentSectionIndex = sections.findIndex(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
    });
    
    const prevIndex = currentSectionIndex <= 0 ? sections.length - 1 : currentSectionIndex - 1;
    if (sections[prevIndex]) {
        smoothScrollTo(sections[prevIndex], { offset: 80 });
    }
}

/**
 * Обновление хэша в URL без перезагрузки страницы
 * @param {string} hash - Новый хэш
 */
function updateUrlHash(hash) {
    if (history.pushState) {
        history.pushState(null, null, `#${hash}`);
    } else {
        window.location.hash = hash;
    }
}

/**
 * Добавление визуальной обратной связи при клике
 * @param {Element} element - Элемент по которому кликнули
 */
function addClickFeedback(element) {
    // Сохраняем исходные стили
    const originalBg = element.style.backgroundColor;
    
    // Добавляем эффект нажатия
    element.style.backgroundColor = '#dbeafe'; // blue-100
    element.style.transition = 'background-color 0.3s';
    
    // Возвращаем исходные стили через 300мс
    setTimeout(() => {
        element.style.backgroundColor = originalBg;
        
        // Полностью сбрасываем через еще 300мс
        setTimeout(() => {
            element.style.backgroundColor = '';
            element.style.transition = '';
        }, 300);
    }, 300);
}

/**
 * Прокрутка к секции по её ID
 * @param {string} sectionId - ID секции
 */
export function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        smoothScrollTo(section, { offset: 80 });
        updateUrlHash(sectionId);
    } else {
        console.warn(`Секция с ID "${sectionId}" не найдена`);
    }
}

/**
 * Получение текущей активной секции
 * @returns {string} ID активной секции
 */
export function getActiveSection() {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
        const href = activeLink.getAttribute('href');
        return href.substring(1);
    }
    return '';
}

/**
 * Обновление навигации при динамическом изменении контента
 * @param {NodeList} newNavLinks - Новые ссылки навигации
 */
export function updateNavigation(newNavLinks) {
    console.log('🔄 Обновление навигации...');
    
    // Удаляем старые обработчики
    document.querySelectorAll('.nav-link').forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });
    
    // Инициализируем с новыми ссылками
    initializeNavigation(newNavLinks);
}

/**
 * Создание хлебных крошек (breadcrumbs)
 * @param {Array} items - Массив объектов {title: string, url: string}
 * @returns {Element} Элемент breadcrumbs
 */
export function createBreadcrumbs(items) {
    const container = document.createElement('nav');
    container.setAttribute('aria-label', 'Хлебные крошки');
    container.className = 'flex items-center space-x-2 text-sm text-gray-600';
    
    items.forEach((item, index) => {
        // Добавляем разделитель (кроме первого элемента)
        if (index > 0) {
            const separator = document.createElement('span');
            separator.className = 'mx-2';
            separator.innerHTML = '<i class="fas fa-chevron-right text-xs"></i>';
            container.appendChild(separator);
        }
        
        if (index === items.length - 1) {
            // Текущая страница
            const current = document.createElement('span');
            current.className = 'font-medium text-gray-800';
            current.textContent = item.title;
            current.setAttribute('aria-current', 'page');
            container.appendChild(current);
        } else {
            // Ссылка
            const link = document.createElement('a');
            link.href = item.url;
            link.className = 'hover:text-blue-600 transition';
            link.textContent = item.title;
            container.appendChild(link);
        }
    });
    
    return container;
}

export default {
    initializeNavigation,
    scrollToSection,
    getActiveSection,
    updateNavigation,
    createBreadcrumbs,
    openMobileMenu: () => {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        const menuIcon = button?.querySelector('i');
        
        if (menu && button && menuIcon) {
            menu.classList.remove('hidden');
            menu.classList.add('flex');
            button.setAttribute('aria-expanded', 'true');
            menuIcon.className = 'fas fa-times text-xl';
            document.body.style.overflow = 'hidden';
        }
    },
    closeMobileMenu: () => {
        const menu = document.getElementById('mobile-menu');
        const button = document.getElementById('mobile-menu-button');
        const menuIcon = button?.querySelector('i');
        
        if (menu && button && menuIcon) {
            menu.classList.remove('flex');
            menu.classList.add('hidden');
            button.setAttribute('aria-expanded', 'false');
            menuIcon.className = 'fas fa-bars text-xl';
            document.body.style.overflow = '';
        }
    }
};