/**
 * Модуль для отображения технологической карты курса с аккордеоном
 * @module techmap
 */

import { createElement, getColorClasses, truncateText } from './utils.js';

/**
 * Инициализация модуля технологической карты
 * @param {Object} techmapData - Данные технологической карты
 */
export function initializeTechmap(techmapData) {
    console.log('📚 Инициализация технологической карты...');
    
    if (!techmapData || !techmapData.modules) {
        console.error('❌ Данные технологической карты отсутствуют или некорректны');
        return;
    }
    
    const container = document.getElementById('techmap-accordion');
    if (!container) {
        console.error('❌ Контейнер для технологической карты не найден');
        return;
    }
    
    // 1. Очищаем контейнер
    container.innerHTML = '';
    
    // 2. Создаем аккордеон модулей
    const accordion = createAccordion(techmapData.modules);
    container.appendChild(accordion);
    
    // 3. Инициализируем первый модуль как открытый
    const firstModule = container.querySelector('.accordion-item');
    if (firstModule) {
        openAccordionItem(firstModule);
    }
    
    // 4. Настраиваем глобальные фильтры и поиск
    setupFiltersAndSearch(techmapData);
    
    console.log('✅ Технологическая карта инициализирована');
}

/**
 * Создание аккордеона модулей
 * @param {Array} modules - Массив модулей курса
 * @returns {Element} Элемент аккордеона
 */
function createAccordion(modules) {
    const container = createElement('div', {
        className: 'accordion-container space-y-4'
    });
    
    modules.forEach((module, moduleIndex) => {
        const accordionItem = createAccordionItem(module, moduleIndex);
        container.appendChild(accordionItem);
    });
    
    return container;
}

/**
 * Создание элемента аккордеона для модуля
 * @param {Object} module - Данные модуля
 * @param {number} moduleIndex - Индекс модуля
 * @returns {Element} Элемент аккордеона
 */
function createAccordionItem(module, moduleIndex) {
    const item = createElement('div', {
        className: 'accordion-item border border-slate-200 rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-shadow',
        'data-module-id': module.id,
        'data-module-index': moduleIndex
    });
    
    // Заголовок аккордеона
    const header = createAccordionHeader(module);
    item.appendChild(header);
    
    // Контент аккордеона
    const content = createAccordionContent(module);
    item.appendChild(content);
    
    return item;
}

/**
 * Создание заголовка аккордеона
 * @param {Object} module - Данные модуля
 * @returns {Element} Заголовок аккордеона
 */
function createAccordionHeader(module) {
    const header = createElement('div', {
        className: 'accordion-header p-5 md:p-6 cursor-pointer bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 transition-colors'
    });
    
    const headerContent = createElement('div', {
        className: 'flex flex-col md:flex-row md:items-center justify-between'
    });
    
    // Левая часть: номер, иконка, название
    const leftPart = createElement('div', {
        className: 'flex items-start mb-3 md:mb-0 md:items-center'
    });
    
    // Номер модуля
    const moduleNumber = createElement('div', {
        className: 'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-4',
        style: { backgroundColor: getModuleColor(module.color, 100) }
    });
    
    const numberText = createElement('span', {
        className: 'font-bold text-lg',
        style: { color: getModuleColor(module.color, 700) },
        textContent: module.id.split('-')[1] || '1'
    });
    
    moduleNumber.appendChild(numberText);
    
    // Иконка и название
    const titleContainer = createElement('div');
    
    const iconAndTitle = createElement('div', {
        className: 'flex items-center mb-1'
    });
    
    const icon = createElement('i', {
        className: `fas ${module.icon || 'fa-book'} mr-3 text-lg`,
        style: { color: getModuleColor(module.color, 600) }
    });
    
    const title = createElement('h3', {
        className: 'text-xl md:text-2xl font-bold text-gray-800',
        textContent: module.title
    });
    
    iconAndTitle.appendChild(icon);
    iconAndTitle.appendChild(title);
    
    // Описание модуля
    const description = createElement('p', {
        className: 'text-gray-600 text-sm md:text-base',
        textContent: module.description
    });
    
    titleContainer.appendChild(iconAndTitle);
    titleContainer.appendChild(description);
    
    leftPart.appendChild(moduleNumber);
    leftPart.appendChild(titleContainer);
    
    // Правая часть: длительность, количество тем, переключатель
    const rightPart = createElement('div', {
        className: 'flex items-center justify-between md:justify-end'
    });
    
    // Информация о модуле
    const moduleInfo = createElement('div', {
        className: 'flex items-center space-x-4 mr-4'
    });
    
    // Длительность
    const durationBadge = createElement('span', {
        className: 'badge bg-blue-100 text-blue-800 flex items-center'
    });
    
    const durationIcon = createElement('i', {
        className: 'fas fa-clock mr-1'
    });
    
    const durationText = createElement('span', {
        textContent: module.duration
    });
    
    durationBadge.appendChild(durationIcon);
    durationBadge.appendChild(durationText);
    
    // Количество тем
    const topicsBadge = createElement('span', {
        className: 'badge bg-slate-100 text-slate-800 flex items-center'
    });
    
    const topicsIcon = createElement('i', {
        className: 'fas fa-list-ol mr-1'
    });
    
    const topicsText = createElement('span', {
        textContent: `${module.topics?.length || 0} тем`
    });
    
    topicsBadge.appendChild(topicsIcon);
    topicsBadge.appendChild(topicsText);
    
    moduleInfo.appendChild(durationBadge);
    moduleInfo.appendChild(topicsBadge);
    
    // Иконка переключения
    const toggleIcon = createElement('i', {
        className: 'fas fa-chevron-down text-gray-500 transition-transform duration-300'
    });
    
    rightPart.appendChild(moduleInfo);
    rightPart.appendChild(toggleIcon);
    
    headerContent.appendChild(leftPart);
    headerContent.appendChild(rightPart);
    header.appendChild(headerContent);
    
    // Обработчик клика
    header.addEventListener('click', () => {
        toggleAccordionItem(header.parentElement);
    });
    
    // Обработчик клавиатуры
    header.setAttribute('tabindex', '0');
    header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleAccordionItem(header.parentElement);
        }
    });
    
    return header;
}

/**
 * Создание контента аккордеона
 * @param {Object} module - Данные модуля
 * @returns {Element} Контент аккордеона
 */
function createAccordionContent(module) {
    const content = createElement('div', {
        className: 'accordion-content hidden p-5 md:p-6 border-t border-slate-200 bg-white'
    });
    
    // Сетка тем модуля
    const topicsGrid = createElement('div', {
        className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'
    });
    
    if (module.topics && module.topics.length > 0) {
        module.topics.forEach((topic, topicIndex) => {
            const topicCard = createTopicCard(topic, topicIndex, module.color);
            topicsGrid.appendChild(topicCard);
        });
    }
    
    content.appendChild(topicsGrid);
    
    // Результаты обучения
    if (module.learningOutcomes && module.learningOutcomes.length > 0) {
        const outcomesSection = createLearningOutcomesSection(module);
        content.appendChild(outcomesSection);
    }
    
    return content;
}

/**
 * Создание карточки темы
 * @param {Object} topic - Данные темы
 * @param {number} topicIndex - Индекс темы
 * @param {string} moduleColor - Цвет модуля
 * @returns {Element} Карточка темы
 */
function createTopicCard(topic, topicIndex, moduleColor) {
    const card = createElement('div', {
        className: 'card hover:shadow-lg transition-shadow h-full'
    });
    
    // Заголовок темы
    const topicHeader = createElement('div', {
        className: 'flex items-start mb-4'
    });
    
    const topicNumber = createElement('div', {
        className: 'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center mr-3 mt-1',
        style: { backgroundColor: getModuleColor(moduleColor, 100) }
    });
    
    const number = createElement('span', {
        className: 'font-bold text-sm',
        style: { color: getModuleColor(moduleColor, 700) },
        textContent: topic.id.split('.')[1] || topicIndex + 1
    });
    
    topicNumber.appendChild(number);
    
    const title = createElement('h4', {
        className: 'text-lg font-bold text-gray-800',
        textContent: topic.title
    });
    
    topicHeader.appendChild(topicNumber);
    topicHeader.appendChild(title);
    card.appendChild(topicHeader);
    
    // Цели обучения
    if (topic.objectives && topic.objectives.length > 0) {
        const objectivesSection = createElement('div', {
            className: 'mb-4'
        });
        
        const objectivesTitle = createElement('h5', {
            className: 'font-semibold text-gray-700 mb-2 text-sm',
            textContent: 'Цели обучения:'
        });
        
        const objectivesList = createElement('ul', {
            className: 'space-y-1'
        });
        
        topic.objectives.forEach((objective, index) => {
            const li = createElement('li', {
                className: 'flex items-start text-sm text-gray-600'
            });
            
            const bullet = createElement('span', {
                className: 'text-blue-500 mr-2 mt-1',
                textContent: '•'
            });
            
            const objectiveText = createElement('span', {
                textContent: objective
            });
            
            li.appendChild(bullet);
            li.appendChild(objectiveText);
            objectivesList.appendChild(li);
        });
        
        objectivesSection.appendChild(objectivesTitle);
        objectivesSection.appendChild(objectivesList);
        card.appendChild(objectivesSection);
    }
    
    // Артефакты
    if (topic.artifacts && topic.artifacts.length > 0) {
        const artifactsSection = createElement('div', {
            className: 'mb-4'
        });
        
        const artifactsTitle = createElement('h5', {
            className: 'font-semibold text-gray-700 mb-2 text-sm',
            textContent: 'Создаваемые артефакты:'
        });
        
        const artifactsList = createElement('div', {
            className: 'flex flex-wrap gap-2'
        });
        
        topic.artifacts.forEach(artifact => {
            const badge = createElement('span', {
                className: 'badge bg-slate-100 text-slate-700 text-xs',
                textContent: truncateText(artifact, 30)
            });
            
            artifactsList.appendChild(badge);
        });
        
        artifactsSection.appendChild(artifactsTitle);
        artifactsSection.appendChild(artifactsList);
        card.appendChild(artifactsSection);
    }
    
    // Инструменты
    if (topic.tools && topic.tools.length > 0) {
        const toolsSection = createElement('div', {
            className: 'mb-4'
        });
        
        const toolsTitle = createElement('h5', {
            className: 'font-semibold text-gray-700 mb-2 text-sm',
            textContent: 'Используемые инструменты:'
        });
        
        const toolsList = createElement('div', {
            className: 'flex flex-wrap gap-2'
        });
        
        topic.tools.forEach(tool => {
            const badge = createElement('span', {
                className: 'badge bg-blue-100 text-blue-800 text-xs',
                textContent: tool
            });
            
            toolsList.appendChild(badge);
        });
        
        toolsSection.appendChild(toolsTitle);
        toolsSection.appendChild(toolsList);
        card.appendChild(toolsSection);
    }
    
    // Формат проведения
    if (topic.format) {
        const formatSection = createElement('div');
        
        const formatTitle = createElement('h5', {
            className: 'font-semibold text-gray-700 mb-1 text-sm',
            textContent: 'Формат проведения:'
        });
        
        const formatText = createElement('p', {
            className: 'text-sm text-gray-600',
            textContent: topic.format
        });
        
        formatSection.appendChild(formatTitle);
        formatSection.appendChild(formatText);
        card.appendChild(formatSection);
    }
    
    return card;
}

/**
 * Создание секции результатов обучения
 * @param {Object} module - Данные модуля
 * @returns {Element} Секция результатов обучения
 */
function createLearningOutcomesSection(module) {
    const section = createElement('div', {
        className: 'mt-8 pt-6 border-t border-slate-200'
    });
    
    const title = createElement('h4', {
        className: 'text-xl font-bold text-gray-800 mb-4',
        textContent: '🎯 Результаты обучения по модулю:'
    });
    
    const outcomesGrid = createElement('div', {
        className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    });
    
    module.learningOutcomes.forEach((outcome, index) => {
        const outcomeCard = createElement('div', {
            className: 'bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-lg p-4'
        });
        
        const outcomeNumber = createElement('div', {
            className: 'w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-3'
        });
        
        const number = createElement('span', {
            textContent: index + 1
        });
        
        outcomeNumber.appendChild(number);
        
        const outcomeText = createElement('p', {
            className: 'text-gray-700',
            textContent: outcome
        });
        
        outcomeCard.appendChild(outcomeNumber);
        outcomeCard.appendChild(outcomeText);
        outcomesGrid.appendChild(outcomeCard);
    });
    
    section.appendChild(title);
    section.appendChild(outcomesGrid);
    
    return section;
}

/**
 * Переключение состояния элемента аккордеона
 * @param {Element} accordionItem - Элемент аккордеона
 */
function toggleAccordionItem(accordionItem) {
    const isOpen = !accordionItem.querySelector('.accordion-content').classList.contains('hidden');
    
    if (isOpen) {
        closeAccordionItem(accordionItem);
    } else {
        // Закрываем все другие открытые элементы
        document.querySelectorAll('.accordion-item').forEach(item => {
            if (item !== accordionItem && !item.querySelector('.accordion-content').classList.contains('hidden')) {
                closeAccordionItem(item);
            }
        });
        
        openAccordionItem(accordionItem);
    }
}

/**
 * Открытие элемента аккордеона
 * @param {Element} accordionItem - Элемент аккордеона
 */
function openAccordionItem(accordionItem) {
    const content = accordionItem.querySelector('.accordion-content');
    const toggleIcon = accordionItem.querySelector('.fa-chevron-down');
    
    content.classList.remove('hidden');
    content.classList.add('animate-fade-in');
    
    if (toggleIcon) {
        toggleIcon.classList.remove('fa-chevron-down');
        toggleIcon.classList.add('fa-chevron-up');
    }
    
    // Устанавливаем aria-атрибуты
    accordionItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'true');
    
    // Отправляем событие
    const moduleId = accordionItem.getAttribute('data-module-id');
    window.dispatchEvent(new CustomEvent('techmap:moduleOpened', {
        detail: { moduleId }
    }));
}

/**
 * Закрытие элемента аккордеона
 * @param {Element} accordionItem - Элемент аккордеона
 */
function closeAccordionItem(accordionItem) {
    const content = accordionItem.querySelector('.accordion-content');
    const toggleIcon = accordionItem.querySelector('.fa-chevron-up');
    
    content.classList.add('hidden');
    
    if (toggleIcon) {
        toggleIcon.classList.remove('fa-chevron-up');
        toggleIcon.classList.add('fa-chevron-down');
    }
    
    // Устанавливаем aria-атрибуты
    accordionItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
}

/**
 * Получение цвета модуля
 * @param {string} colorName - Название цвета
 * @param {number} shade - Оттенок (100, 200, ..., 900)
 * @returns {string} HEX код цвета
 */
function getModuleColor(colorName, shade = 600) {
    const colorMap = {
        blue: {
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a'
        },
        emerald: {
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b'
        },
        amber: {
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
        },
        purple: {
            100: '#e9d5ff',
            200: '#d8b4fe',
            300: '#c084fc',
            400: '#a855f7',
            500: '#9333ea',
            600: '#7c3aed',
            700: '#6d28d9',
            800: '#5b21b6',
            900: '#4c1d95'
        }
    };
    
    const color = colorMap[colorName] || colorMap.blue;
    return color[shade] || color[600];
}

/**
 * Настройка фильтров и поиска
 * @param {Object} techmapData - Данные технологической карты
 */
function setupFiltersAndSearch(techmapData) {
    // Создаем панель фильтров
    const filtersPanel = createFiltersPanel(techmapData);
    
    // Вставляем перед аккордеоном
    const container = document.getElementById('techmap-accordion');
    if (container && container.parentNode) {
        container.parentNode.insertBefore(filtersPanel, container);
    }
}

/**
 * Создание панели фильтров
 * @param {Object} techmapData - Данные технологической карты
 * @returns {Element} Панель фильтров
 */
function createFiltersPanel(techmapData) {
    const panel = createElement('div', {
        className: 'mb-8 p-5 bg-slate-50 rounded-xl border border-slate-200'
    });
    
    const title = createElement('h3', {
        className: 'text-lg font-bold text-gray-800 mb-4',
        textContent: '🔍 Поиск и фильтрация по курсу'
    });
    
    // Поисковая строка
    const searchContainer = createElement('div', {
        className: 'mb-4'
    });
    
    const searchInput = createElement('input', {
        type: 'text',
        placeholder: 'Поиск по темам, инструментам, артефактам...',
        className: 'w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition'
    });
    
    searchContainer.appendChild(searchInput);
    
    // Фильтры по инструментам
    const toolsFilter = createElement('div', {
        className: 'mb-4'
    });
    
    const toolsLabel = createElement('label', {
        className: 'block font-medium text-gray-700 mb-2',
        textContent: 'Фильтр по инструментам:'
    });
    
    const toolsSelect = createElement('select', {
        className: 'w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition bg-white'
    });
    
    // Опция "Все инструменты"
    const allOption = createElement('option', {
        value: 'all',
        textContent: 'Все инструменты'
    });
    
    toolsSelect.appendChild(allOption);
    
    // Собираем уникальные инструменты
    const allTools = new Set();
    techmapData.modules.forEach(module => {
        module.topics?.forEach(topic => {
            topic.tools?.forEach(tool => allTools.add(tool));
        });
    });
    
    Array.from(allTools).sort().forEach(tool => {
        const option = createElement('option', {
            value: tool,
            textContent: tool
        });
        
        toolsSelect.appendChild(option);
    });
    
    toolsFilter.appendChild(toolsLabel);
    toolsFilter.appendChild(toolsSelect);
    
    // Кнопки действий
    const actionsContainer = createElement('div', {
        className: 'flex flex-wrap gap-3'
    });
    
    const searchButton = createElement('button', {
        className: 'btn-primary flex items-center',
        textContent: 'Искать'
    });
    
    const searchIcon = createElement('i', {
        className: 'fas fa-search mr-2'
    });
    
    searchButton.prepend(searchIcon);
    
    const resetButton = createElement('button', {
        className: 'btn-secondary flex items-center',
        textContent: 'Сбросить'
    });
    
    const resetIcon = createElement('i', {
        className: 'fas fa-redo mr-2'
    });
    
    resetButton.prepend(resetIcon);
    
    const expandAllButton = createElement('button', {
        className: 'btn-secondary flex items-center',
        textContent: 'Развернуть все'
    });
    
    const expandIcon = createElement('i', {
        className: 'fas fa-expand-alt mr-2'
    });
    
    expandAllButton.prepend(expandIcon);
    
    actionsContainer.appendChild(searchButton);
    actionsContainer.appendChild(resetButton);
    actionsContainer.appendChild(expandAllButton);
    
    // Собираем панель
    panel.appendChild(title);
    panel.appendChild(searchContainer);
    panel.appendChild(toolsFilter);
    panel.appendChild(actionsContainer);
    
    // Обработчики событий
    setupFilterHandlers(searchInput, toolsSelect, searchButton, resetButton, expandAllButton, techmapData);
    
    return panel;
}

/**
 * Настройка обработчиков фильтров
 */
function setupFilterHandlers(searchInput, toolsSelect, searchButton, resetButton, expandAllButton, techmapData) {
    // Поиск
    const performSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedTool = toolsSelect.value;
        
        document.querySelectorAll('.accordion-item').forEach(item => {
            const moduleId = item.getAttribute('data-module-id');
            const module = techmapData.modules.find(m => m.id === moduleId);
            
            if (!module) return;
            
            let hasMatch = false;
            
            // Поиск по темам модуля
            module.topics?.forEach(topic => {
                // Поиск по тексту
                const topicText = [
                    topic.title,
                    ...(topic.objectives || []),
                    ...(topic.artifacts || []),
                    ...(topic.tools || []),
                    topic.format || ''
                ].join(' ').toLowerCase();
                
                const matchesSearch = !searchTerm || topicText.includes(searchTerm);
                
                // Фильтр по инструментам
                const matchesTool = selectedTool === 'all' || 
                                   (topic.tools && topic.tools.includes(selectedTool));
                
                if (matchesSearch && matchesTool) {
                    hasMatch = true;
                }
            });
            
            // Показываем/скрываем модуль
            if (hasMatch) {
                item.classList.remove('hidden');
                // Открываем модуль если есть совпадение
                openAccordionItem(item);
            } else {
                item.classList.add('hidden');
            }
        });
        
        // Показываем сообщение если ничего не найдено
        const visibleItems = document.querySelectorAll('.accordion-item:not(.hidden)');
        showNoResultsMessage(visibleItems.length === 0);
    };
    
    // Обработчики
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    toolsSelect.addEventListener('change', performSearch);
    
    // Сброс фильтров
    resetButton.addEventListener('click', () => {
        searchInput.value = '';
        toolsSelect.value = 'all';
        
        document.querySelectorAll('.accordion-item').forEach(item => {
            item.classList.remove('hidden');
        });
        
        showNoResultsMessage(false);
    });
    
    // Развернуть все
    expandAllButton.addEventListener('click', () => {
        document.querySelectorAll('.accordion-item').forEach(item => {
            openAccordionItem(item);
        });
    });
}

/**
 * Показать/скрыть сообщение об отсутствии результатов
 * @param {boolean} show - Показывать ли сообщение
 */
function showNoResultsMessage(show) {
    let message = document.getElementById('no-results-message');
    
    if (show && !message) {
        message = createElement('div', {
            id: 'no-results-message',
            className: 'mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-center'
        });
        
        const icon = createElement('i', {
            className: 'fas fa-search mb-2 text-2xl text-amber-600'
        });
        
        const text = createElement('p', {
            className: 'text-amber-800 font-medium',
            textContent: 'По вашему запросу ничего не найдено. Попробуйте изменить критерии поиска.'
        });
        
        message.appendChild(icon);
        message.appendChild(text);
        
        const container = document.getElementById('techmap-accordion');
        if (container) {
            container.parentNode.insertBefore(message, container.nextSibling);
        }
    } else if (!show && message) {
        message.remove();
    }
}

/**
 * Получить данные активного модуля
 * @returns {Object} Данные активного модуля
 */
export function getActiveModule() {
    const openItem = document.querySelector('.accordion-item .accordion-content:not(.hidden)');
    if (!openItem) return null;
    
    const accordionItem = openItem.closest('.accordion-item');
    const moduleId = accordionItem.getAttribute('data-module-id');
    const techmapData = window.app?.getData()?.techmap;
    
    if (techmapData && techmapData.modules) {
        return techmapData.modules.find(module => module.id === moduleId);
    }
    
    return null;
}

/**
 * Переключение на конкретный модуль по ID
 * @param {string} moduleId - ID модуля
 */
export function switchToModule(moduleId) {
    const moduleItem = document.querySelector(`.accordion-item[data-module-id="${moduleId}"]`);
    if (moduleItem) {
        openAccordionItem(moduleItem);
        
        // Прокручиваем к модулю
        setTimeout(() => {
            moduleItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

/**
 * Получить статистику по курсу
 * @returns {Object} Статистика курса
 */
export function getCourseStats() {
    const techmapData = window.app?.getData()?.techmap;
    if (!techmapData) return null;
    
    let totalTopics = 0;
    let totalArtifacts = 0;
    const allTools = new Set();
    
    techmapData.modules.forEach(module => {
        totalTopics += module.topics?.length || 0;
        
        module.topics?.forEach(topic => {
            totalArtifacts += topic.artifacts?.length || 0;
            topic.tools?.forEach(tool => allTools.add(tool));
        });
    });
    
    return {
        modules: techmapData.modules.length,
        topics: totalTopics,
        artifacts: totalArtifacts,
        tools: allTools.size,
        duration: techmapData.modules.reduce((total, module) => {
            const weeks = parseInt(module.duration) || 0;
            return total + weeks;
        }, 0)
    };
}

export default {
    initializeTechmap,
    getActiveModule,
    switchToModule,
    getCourseStats
};