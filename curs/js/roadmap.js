/**
 * Модуль для отображения дорожной карты с табами
 * @module roadmap
 */

import { createElement, getColorClasses, formatPercent } from './utils.js';

/**
 * Инициализация модуля дорожной карты
 * @param {Object} roadmapData - Данные дорожной карты
 */
export function initializeRoadmap(roadmapData) {
    console.log('🗺️ Инициализация дорожной карты...');
    
    if (!roadmapData || !roadmapData.stages) {
        console.error('❌ Данные дорожной карты отсутствуют или некорректны');
        return;
    }
    
    const container = document.getElementById('roadmap-tabs-container');
    if (!container) {
        console.error('❌ Контейнер для дорожной карты не найден');
        return;
    }
    
    // 1. Создаем навигацию табов
    const tabNav = createTabNavigation(roadmapData.stages);
    const tabContent = createTabContent(roadmapData.stages);
    
    // 2. Находим существующие элементы и заменяем их
    const existingNav = document.getElementById('roadmap-tab-nav');
    const existingContent = document.getElementById('roadmap-tab-content');
    
    if (existingNav && existingContent) {
        existingNav.innerHTML = '';
        existingNav.appendChild(tabNav);
        
        existingContent.innerHTML = '';
        existingContent.appendChild(tabContent);
    } else {
        console.error('❌ Элементы навигации или контента табов не найдены');
        return;
    }
    
    // 3. Инициализируем первый таб как активный
    activateTab(0, roadmapData.stages);
    
    // 4. Настраиваем обработчики событий
    setupTabEvents(roadmapData.stages);
    
    console.log('✅ Дорожная карта инициализирована');
}

/**
 * Создание навигации табов
 * @param {Array} stages - Этапы дорожной карты
 * @returns {Element} Элемент навигации
 */
function createTabNavigation(stages) {
    const nav = document.createElement('div');
    nav.className = 'flex flex-wrap -mb-px';
    nav.setAttribute('role', 'tablist');
    nav.setAttribute('aria-label', 'Этапы дорожной карты');
    
    stages.forEach((stage, index) => {
        const tab = createTabButton(stage, index);
        nav.appendChild(tab);
    });
    
    return nav;
}

/**
 * Создание кнопки таба
 * @param {Object} stage - Данные этапа
 * @param {number} index - Индекс этапа
 * @returns {Element} Кнопка таба
 */
function createTabButton(stage, index) {
    const button = createElement('button', {
        id: `tab-${stage.id}`,
        className: 'tab mr-2 mb-2',
        role: 'tab',
        'aria-controls': `panel-${stage.id}`,
        'aria-selected': index === 0 ? 'true' : 'false',
        'data-tab-index': index,
        'data-stage-id': stage.id
    });
    
    // Иконка этапа
    const icon = createElement('i', {
        className: `fas ${stage.icon || 'fa-circle'} mr-2`,
        style: { color: getStageColor(stage.color) }
    });
    
    // Название этапа (сокращенное для мобильных)
    const title = createElement('span', {
        className: 'hidden md:inline',
        textContent: stage.title.split('. ')[1] || stage.title
    });
    
    // Полное название для тултипа
    button.setAttribute('title', stage.title);
    button.setAttribute('data-tooltip', stage.description);
    
    button.appendChild(icon);
    button.appendChild(title);
    
    // Добавляем тултип
    setupTooltip(button);
    
    return button;
}

/**
 * Создание контента табов
 * @param {Array} stages - Этапы дорожной карты
 * @returns {Element} Контейнер контента
 */
function createTabContent(stages) {
    const container = document.createElement('div');
    container.className = 'tab-content';
    
    stages.forEach((stage, index) => {
        const panel = createTabPanel(stage, index);
        container.appendChild(panel);
    });
    
    return container;
}

/**
 * Создание панели таба
 * @param {Object} stage - Данные этапа
 * @param {number} index - Индекс этапа
 * @returns {Element} Панель таба
 */
function createTabPanel(stage, index) {
    const panel = createElement('div', {
        id: `panel-${stage.id}`,
        className: 'tab-panel hidden',
        role: 'tabpanel',
        'aria-labelledby': `tab-${stage.id}`,
        'data-stage-id': stage.id
    });
    
    // Заголовок панели
    const header = createElement('div', {
        className: 'mb-6'
    });
    
    const title = createElement('h3', {
        className: 'text-2xl md:text-3xl font-bold text-gray-800 mb-2',
        textContent: stage.title
    });
    
    const description = createElement('p', {
        className: 'text-lg text-gray-600',
        textContent: stage.description
    });
    
    header.appendChild(title);
    header.appendChild(description);
    panel.appendChild(header);
    
    // Контент в зависимости от типа этапа
    switch(stage.id) {
        case 'preproject':
            panel.appendChild(createPreprojectContent(stage));
            break;
        case 'priority-tasks':
            panel.appendChild(createPriorityTasksContent(stage));
            break;
        case 'pilot':
            panel.appendChild(createPilotContent(stage));
            break;
        case 'kpi':
            panel.appendChild(createKPIContent(stage));
            break;
        case 'risks':
            panel.appendChild(createRisksContent(stage));
            break;
        default:
            panel.appendChild(createGenericContent(stage));
    }
    
    return panel;
}

/**
 * Создание контента для предпроектного этапа
 * @param {Object} stage - Данные этапа
 * @returns {Element} Контент этапа
 */
function createPreprojectContent(stage) {
    const container = createElement('div', {
        className: 'space-y-6'
    });
    
    // Цель этапа
    if (stage.content?.goal) {
        const goalCard = createElement('div', {
            className: 'card bg-blue-50 border-blue-200'
        });
        
        const goalTitle = createElement('h4', {
            className: 'text-xl font-bold text-blue-800 mb-2',
            textContent: '🎯 Цель этапа'
        });
        
        const goalText = createElement('p', {
            className: 'text-blue-700',
            textContent: stage.content.goal
        });
        
        goalCard.appendChild(goalTitle);
        goalCard.appendChild(goalText);
        container.appendChild(goalCard);
    }
    
    // Критерии оценки
    if (stage.content?.criteria && stage.content.criteria.length > 0) {
        const criteriaSection = createElement('div', {
            className: 'mt-8'
        });
        
        const criteriaTitle = createElement('h4', {
            className: 'text-xl font-bold text-gray-800 mb-4',
            textContent: '📊 Критерии оценки данных'
        });
        
        const criteriaTable = createElement('div', {
            className: 'table-container'
        });
        
        const table = createElement('table', {
            className: 'table'
        });
        
        // Заголовок таблицы
        const thead = createElement('thead');
        const headerRow = createElement('tr');
        
        ['Задача', 'Критерий готовности данных', 'Метод оценки'].forEach(text => {
            const th = createElement('th', { textContent: text });
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Тело таблицы
        const tbody = createElement('tbody');
        
        stage.content.criteria.forEach(criterion => {
            const row = createElement('tr');
            
            const taskCell = createElement('td', {
                className: 'font-medium',
                textContent: criterion.task
            });
            
            const readinessCell = createElement('td', {
                innerHTML: criterion.readiness.replace(/\n/g, '<br>')
            });
            
            const methodCell = createElement('td', {
                textContent: criterion.method
            });
            
            row.appendChild(taskCell);
            row.appendChild(readinessCell);
            row.appendChild(methodCell);
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        criteriaTable.appendChild(table);
        
        criteriaSection.appendChild(criteriaTitle);
        criteriaSection.appendChild(criteriaTable);
        container.appendChild(criteriaSection);
    }
    
    // Результат этапа
    if (stage.content?.result) {
        const resultCard = createElement('div', {
            className: 'card bg-emerald-50 border-emerald-200 mt-8'
        });
        
        const resultTitle = createElement('h4', {
            className: 'text-xl font-bold text-emerald-800 mb-2',
            textContent: '📋 Результат этапа'
        });
        
        const resultText = createElement('p', {
            className: 'text-emerald-700',
            innerHTML: stage.content.result.replace('Go/No-Go', '<span class="font-bold text-emerald-900">Go/No-Go</span>')
        });
        
        resultCard.appendChild(resultTitle);
        resultCard.appendChild(resultText);
        container.appendChild(resultCard);
    }
    
    return container;
}

/**
 * Создание контента для приоритетных задач
 * @param {Object} stage - Данные этапа
 * @returns {Element} Контент этапа
 */
function createPriorityTasksContent(stage) {
    const container = createElement('div', {
        className: 'space-y-8'
    });
    
    if (!stage.tasks || stage.tasks.length === 0) {
        return container;
    }
    
    stage.tasks.forEach((task, index) => {
        const taskCard = createElement('div', {
            className: 'card hover:shadow-lg transition-shadow'
        });
        
        // Заголовок задачи
        const taskHeader = createElement('div', {
            className: 'flex items-start justify-between mb-4'
        });
        
        const taskNumber = createElement('div', {
            className: 'flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4'
        });
        
        const number = createElement('span', {
            className: 'text-blue-700 font-bold text-lg',
            textContent: index + 1
        });
        
        taskNumber.appendChild(number);
        
        const taskTitle = createElement('h4', {
            className: 'text-xl font-bold text-gray-800 flex-grow',
            textContent: task.title
        });
        
        taskHeader.appendChild(taskNumber);
        taskHeader.appendChild(taskTitle);
        taskCard.appendChild(taskHeader);
        
        // Обоснование приоритета
        if (task.justification) {
            const justification = createElement('div', {
                className: 'mb-4 p-4 bg-slate-50 rounded-lg'
            });
            
            const justificationTitle = createElement('h5', {
                className: 'font-semibold text-slate-700 mb-2',
                textContent: '📈 Обоснование приоритета:'
            });
            
            const justificationText = createElement('p', {
                className: 'text-slate-600',
                textContent: task.justification
            });
            
            justification.appendChild(justificationTitle);
            justification.appendChild(justificationText);
            taskCard.appendChild(justification);
        }
        
        // Риски
        if (task.risks) {
            const risks = createElement('div', {
                className: 'mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200'
            });
            
            const risksTitle = createElement('h5', {
                className: 'font-semibold text-amber-800 mb-2',
                textContent: '⚠️ Риски:'
            });
            
            const risksText = createElement('p', {
                className: 'text-amber-700',
                textContent: task.risks
            });
            
            risks.appendChild(risksTitle);
            risks.appendChild(risksText);
            taskCard.appendChild(risks);
        }
        
        // Критерии качества
        if (task.qualityCriteria && task.qualityCriteria.length > 0) {
            const criteriaSection = createElement('div', {
                className: 'mt-4'
            });
            
            const criteriaTitle = createElement('h5', {
                className: 'font-semibold text-gray-700 mb-3',
                textContent: '🎯 Критерии проверки качества:'
            });
            
            const criteriaList = createElement('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            });
            
            task.qualityCriteria.forEach(criterion => {
                const criterionCard = createElement('div', {
                    className: 'border border-slate-200 rounded-lg p-4'
                });
                
                const criterionName = createElement('div', {
                    className: 'font-medium text-gray-800 mb-2',
                    textContent: criterion.name
                });
                
                const targetBadge = createElement('span', {
                    className: 'badge-primary inline-block mb-2',
                    textContent: `Цель: ${criterion.target}`
                });
                
                const description = createElement('p', {
                    className: 'text-sm text-gray-600',
                    textContent: criterion.description
                });
                
                criterionCard.appendChild(criterionName);
                criterionCard.appendChild(targetBadge);
                criterionCard.appendChild(description);
                criteriaList.appendChild(criterionCard);
            });
            
            criteriaSection.appendChild(criteriaTitle);
            criteriaSection.appendChild(criteriaList);
            taskCard.appendChild(criteriaSection);
        }
        
        container.appendChild(taskCard);
    });
    
    return container;
}

/**
 * Создание контента для пилотного этапа
 * @param {Object} stage - Данные этапа
 * @returns {Element} Контент этапа
 */
function createPilotContent(stage) {
    const container = createElement('div', {
        className: 'space-y-8'
    });
    
    // Фокус пилота
    if (stage.focus) {
        const focusCard = createElement('div', {
            className: 'card bg-purple-50 border-purple-200'
        });
        
        const focusTitle = createElement('h4', {
            className: 'text-xl font-bold text-purple-800 mb-2',
            textContent: '🎯 Фокус пилотного проекта'
        });
        
        const focusText = createElement('p', {
            className: 'text-purple-700',
            textContent: stage.focus
        });
        
        focusCard.appendChild(focusTitle);
        focusCard.appendChild(focusText);
        container.appendChild(focusCard);
    }
    
    // Таймлайн
    if (stage.timeline && stage.timeline.length > 0) {
        const timelineSection = createElement('div', {
            className: 'mt-8'
        });
        
        const timelineTitle = createElement('h4', {
            className: 'text-xl font-bold text-gray-800 mb-6',
            textContent: `📅 Таймлайн (${stage.duration || '2 месяца'})`
        });
        
        const timeline = createElement('div', {
            className: 'relative'
        });
        
        // Вертикальная линия
        const line = createElement('div', {
            className: 'absolute left-4 top-0 bottom-0 w-0.5 bg-slate-300 md:left-1/2 md:-translate-x-1/2'
        });
        timeline.appendChild(line);
        
        // Элементы таймлайна
        stage.timeline.forEach((item, index) => {
            const timelineItem = createTimelineItem(item, index);
            timeline.appendChild(timelineItem);
        });
        
        timelineSection.appendChild(timelineTitle);
        timelineSection.appendChild(timeline);
        container.appendChild(timelineSection);
    }
    
    return container;
}

/**
 * Создание элемента таймлайна
 * @param {Object} item - Данные элемента
 * @param {number} index - Индекс элемента
 * @returns {Element} Элемент таймлайна
 */
function createTimelineItem(item, index) {
    const container = createElement('div', {
        className: 'relative mb-8 pl-12 md:pl-0 md:flex md:items-center md:even:flex-row-reverse'
    });
    
    // Точка на линии
    const dot = createElement('div', {
        className: 'absolute left-2 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow md:left-1/2 md:-translate-x-1/2 z-10',
        style: { top: '0.5rem' }
    });
    container.appendChild(dot);
    
    // Контент
    const content = createElement('div', {
        className: 'md:w-1/2 md:px-8'
    });
    
    const week = createElement('div', {
        className: 'flex items-center mb-2'
    });
    
    const weekIcon = createElement('i', {
        className: 'fas fa-calendar-week text-blue-600 mr-2'
    });
    
    const weekText = createElement('span', {
        className: 'font-bold text-blue-700',
        textContent: `Неделя ${item.week}`
    });
    
    week.appendChild(weekIcon);
    week.appendChild(weekText);
    
    const title = createElement('h5', {
        className: 'text-lg font-bold text-gray-800 mb-3',
        textContent: item.title
    });
    
    content.appendChild(week);
    content.appendChild(title);
    
    // Активности
    if (item.activities && item.activities.length > 0) {
        const activitiesList = createElement('ul', {
            className: 'space-y-2'
        });
        
        item.activities.forEach(activity => {
            const li = createElement('li', {
                className: 'flex items-start'
            });
            
            const checkIcon = createElement('i', {
                className: 'fas fa-check text-emerald-500 mt-1 mr-3 flex-shrink-0'
            });
            
            const activityText = createElement('span', {
                className: 'text-gray-700',
                textContent: activity
            });
            
            li.appendChild(checkIcon);
            li.appendChild(activityText);
            activitiesList.appendChild(li);
        });
        
        content.appendChild(activitiesList);
    }
    
    container.appendChild(content);
    
    return container;
}

/**
 * Создание контента для KPI
 * @param {Object} stage - Данные этапа
 * @returns {Element} Контент этапа
 */
function createKPIContent(stage) {
    const container = createElement('div', {
        className: 'space-y-8'
    });
    
    if (!stage.categories || stage.categories.length === 0) {
        return container;
    }
    
    stage.categories.forEach(category => {
        const categoryCard = createElement('div', {
            className: 'card'
        });
        
        // Заголовок категории
        const categoryHeader = createElement('div', {
            className: 'flex items-center mb-6'
        });
        
        let categoryIcon = 'fa-chart-line';
        let categoryColor = 'blue';
        
        switch(category.name) {
            case 'Эффективность':
                categoryIcon = 'fa-bolt';
                categoryColor = 'emerald';
                break;
            case 'Качество':
                categoryIcon = 'fa-check-double';
                categoryColor = 'amber';
                break;
            case 'Принятие технологии':
                categoryIcon = 'fa-users';
                categoryColor = 'purple';
                break;
        }
        
        const icon = createElement('i', {
            className: `fas ${categoryIcon} text-${categoryColor}-600 text-2xl mr-3`
        });
        
        const title = createElement('h4', {
            className: `text-2xl font-bold text-${categoryColor}-800`,
            textContent: category.name
        });
        
        categoryHeader.appendChild(icon);
        categoryHeader.appendChild(title);
        categoryCard.appendChild(categoryHeader);
        
        // Метрики
        if (category.metrics && category.metrics.length > 0) {
            const metricsGrid = createElement('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            });
            
            category.metrics.forEach(metric => {
                const metricCard = createElement('div', {
                    className: 'border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition'
                });
                
                const metricName = createElement('h5', {
                    className: 'font-bold text-gray-800 mb-3',
                    textContent: metric.name
                });
                
                const targetBadge = createElement('div', {
                    className: 'badge-primary text-center mb-4 py-2',
                    textContent: `Цель: ${metric.target}`
                });
                
                metricCard.appendChild(metricName);
                metricCard.appendChild(targetBadge);
                
                // Базовое значение
                if (metric.baseline) {
                    const baseline = createElement('div', {
                        className: 'text-sm text-gray-600 mb-1'
                    });
                    
                    const baselineLabel = createElement('span', {
                        className: 'font-medium',
                        textContent: 'Базовый уровень: '
                    });
                    
                    const baselineValue = createElement('span', {
                        textContent: metric.baseline
                    });
                    
                    baseline.appendChild(baselineLabel);
                    baseline.appendChild(baselineValue);
                    metricCard.appendChild(baseline);
                }
                
                // Целевое значение
                if (metric.targetValue) {
                    const targetValue = createElement('div', {
                        className: 'text-sm text-gray-600 mb-1'
                    });
                    
                    const targetLabel = createElement('span', {
                        className: 'font-medium',
                        textContent: 'Целевое значение: '
                    });
                    
                    const targetValueSpan = createElement('span', {
                        className: 'font-bold text-emerald-700',
                        textContent: metric.targetValue
                    });
                    
                    targetValue.appendChild(targetLabel);
                    targetValue.appendChild(targetValueSpan);
                    metricCard.appendChild(targetValue);
                }
                
                // Описание
                if (metric.description) {
                    const description = createElement('p', {
                        className: 'text-sm text-gray-600 mt-3',
                        textContent: metric.description
                    });
                    metricCard.appendChild(description);
                }
                
                metricsGrid.appendChild(metricCard);
            });
            
            categoryCard.appendChild(metricsGrid);
        }
        
        container.appendChild(categoryCard);
    });
    
    return container;
}

/**
 * Создание контента для рисков
 * @param {Object} stage - Данные этапа
 * @returns {Element} Контент этапа
 */
function createRisksContent(stage) {
    const container = createElement('div', {
        className: 'space-y-6'
    });
    
    if (!stage.risks || stage.risks.length === 0) {
        return container;
    }
    
    stage.risks.forEach(risk => {
        const riskCard = createElement('div', {
            className: 'card hover:shadow-lg transition-shadow'
        });
        
        // Заголовок риска
        const riskHeader = createElement('div', {
            className: 'flex justify-between items-start mb-4'
        });
        
        const riskTitle = createElement('h4', {
            className: 'text-xl font-bold text-gray-800',
            textContent: risk.title
        });
        
        // Бейджи вероятности и влияния
        const badges = createElement('div', {
            className: 'flex space-x-2'
        });
        
        const probabilityBadge = createElement('span', {
            className: 'badge bg-slate-100 text-slate-800',
            textContent: `Вероятность: ${risk.probability}`
        });
        
        const impactBadge = createElement('span', {
            className: risk.impact === 'Критическое' ? 'badge-danger' : 'badge-warning',
            textContent: `Влияние: ${risk.impact}`
        });
        
        badges.appendChild(probabilityBadge);
        badges.appendChild(impactBadge);
        
        riskHeader.appendChild(riskTitle);
        riskHeader.appendChild(badges);
        riskCard.appendChild(riskHeader);
        
        // Описание риска
        if (risk.description) {
            const description = createElement('p', {
                className: 'text-gray-700 mb-4',
                textContent: risk.description
            });
            riskCard.appendChild(description);
        }
        
        // Меры снижения
        if (risk.mitigation && risk.mitigation.length > 0) {
            const mitigationSection = createElement('div', {
                className: 'mt-4 pt-4 border-t border-slate-200'
            });
            
            const mitigationTitle = createElement('h5', {
                className: 'font-semibold text-emerald-700 mb-3',
                textContent: '🛡️ Меры по снижению риска:'
            });
            
            const mitigationList = createElement('ul', {
                className: 'space-y-2'
            });
            
            risk.mitigation.forEach((measure, index) => {
                const li = createElement('li', {
                    className: 'flex items-start'
                });
                
                const number = createElement('span', {
                    className: 'flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-800 rounded-full text-sm flex items-center justify-center mr-3 mt-0.5',
                    textContent: index + 1
                });
                
                const measureText = createElement('span', {
                    className: 'text-gray-700',
                    textContent: measure
                });
                
                li.appendChild(number);
                li.appendChild(measureText);
                mitigationList.appendChild(li);
            });
            
            mitigationSection.appendChild(mitigationTitle);
            mitigationSection.appendChild(mitigationList);
            riskCard.appendChild(mitigationSection);
        }
        
        container.appendChild(riskCard);
    });
    
    return container;
}

/**
 * Создание общего контента для этапа
 * @param {Object} stage - Данные этапа
 * @returns {Element} Контент этапа
 */
function createGenericContent(stage) {
    const container = createElement('div', {
        className: 'prose prose-lg max-w-none'
    });
    
    // Простой вывод всех данных этапа
    const content = JSON.stringify(stage, null, 2);
    const pre = createElement('pre', {
        className: 'bg-slate-100 p-4 rounded-lg overflow-x-auto',
        textContent: content
    });
    
    container.appendChild(pre);
    return container;
}

/**
 * Настройка событий для табов
 * @param {Array} stages - Этапы дорожной карты
 */
function setupTabEvents(stages) {
    const tabButtons = document.querySelectorAll('.tab[data-tab-index]');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-tab-index'));
            activateTab(index, stages);
        });
        
        // Клавиатурная навигация
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const index = parseInt(button.getAttribute('data-tab-index'));
                activateTab(index, stages);
            }
            
            // Навигация стрелками между табами
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = (parseInt(button.getAttribute('data-tab-index')) + 1) % stages.length;
                activateTab(nextIndex, stages);
                document.getElementById(`tab-${stages[nextIndex].id}`).focus();
            }
            
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const prevIndex = parseInt(button.getAttribute('data-tab-index')) === 0 
                    ? stages.length - 1 
                    : parseInt(button.getAttribute('data-tab-index')) - 1;
                activateTab(prevIndex, stages);
                document.getElementById(`tab-${stages[prevIndex].id}`).focus();
            }
        });
    });
}

/**
 * Активация таба по индексу
 * @param {number} index - Индекс таба
 * @param {Array} stages - Этапы дорожной карты
 */
function activateTab(index, stages) {
    if (index < 0 || index >= stages.length) {
        console.error(`Индекс таба ${index} вне диапазона`);
        return;
    }
    
    const stageId = stages[index].id;
    
    // Обновляем кнопки табов
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    
    const activeTab = document.getElementById(`tab-${stageId}`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }
    
    // Обновляем панели контента
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.add('hidden');
    });
    
    const activePanel = document.getElementById(`panel-${stageId}`);
    if (activePanel) {
        activePanel.classList.remove('hidden');
        activePanel.classList.add('animate-fade-in');
        
        // Прокручиваем к началу панели если нужно
        if (window.innerWidth < 768) {
            setTimeout(() => {
                activePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }
    
    // Отправляем событие об изменении таба
    window.dispatchEvent(new CustomEvent('roadmap:tabChanged', {
        detail: { stageId, index, stage: stages[index] }
    }));
}

/**
 * Получение цвета для этапа
 * @param {string} colorName - Название цвета
 * @returns {string} HEX код цвета
 */
function getStageColor(colorName) {
    const colors = {
        blue: '#2563eb',
        emerald: '#10b981',
        amber: '#f59e0b',
        purple: '#8b5cf6',
        rose: '#f43f5e',
        slate: '#64748b'
    };
    
    return colors[colorName] || colors.blue;
}

/**
 * Настройка тултипа для элемента
 * @param {Element} element - Элемент для тултипа
 */
function setupTooltip(element) {
    const tooltipText = element.getAttribute('data-tooltip');
    if (!tooltipText) return;
    
    element.addEventListener('mouseenter', () => {
        const tooltip = createElement('div', {
            className: 'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 pointer-events-none',
            style: {
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap'
            },
            textContent: tooltipText
        });
        
        element.appendChild(tooltip);
        
        setTimeout(() => {
            tooltip.classList.remove('opacity-0');
            tooltip.classList.add('opacity-100');
        }, 10);
    });
    
    element.addEventListener('mouseleave', () => {
        const tooltip = element.querySelector('div');
        if (tooltip) {
            tooltip.remove();
        }
    });
}

/**
 * Получение текущего активного этапа
 * @returns {Object} Данные активного этапа
 */
export function getActiveStage() {
    const activeTab = document.querySelector('.tab.active');
    if (!activeTab) return null;
    
    const stageId = activeTab.getAttribute('data-stage-id');
    const roadmapData = window.app?.getData()?.roadmap;
    
    if (roadmapData && roadmapData.stages) {
        return roadmapData.stages.find(stage => stage.id === stageId);
    }
    
    return null;
}

/**
 * Переключение на конкретный этап по ID
 * @param {string} stageId - ID этапа
 */
export function switchToStage(stageId) {
    const roadmapData = window.app?.getData()?.roadmap;
    if (!roadmapData || !roadmapData.stages) return;
    
    const index = roadmapData.stages.findIndex(stage => stage.id === stageId);
    if (index !== -1) {
        activateTab(index, roadmapData.stages);
    }
}

export default {
    initializeRoadmap,
    getActiveStage,
    switchToStage
};