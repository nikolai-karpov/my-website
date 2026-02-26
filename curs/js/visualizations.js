/**
 * Модуль для отображения диаграмм KPI и визуализаций с использованием Mermaid.js
 * @module visualizations
 */

import { formatPercent } from './utils.js';

/**
 * Инициализация модуля визуализаций
 * @param {Object} appData - Данные приложения
 */
export async function initializeVisualizations(appData) {
    console.log('📊 Инициализация визуализаций...');
    
    // Ждем загрузки Mermaid.js
    if (!window.mermaid) {
        console.warn('Mermaid.js не загружен, откладываем инициализацию визуализаций');
        setTimeout(() => initializeVisualizations(appData), 500);
        return;
    }
    
    // 1. Настраиваем Mermaid.js
    configureMermaid();
    
    // 2. Создаем диаграммы KPI
    await createKPIDiagrams(appData?.roadmap);
    
    // 3. Создаем диаграмму этапов внедрения
    await createImplementationStagesDiagram(appData?.roadmap);
    
    // 4. Создаем диаграмму артефактов курса
    await createArtifactsDiagram(appData?.techmap);
    
    // 5. Создаем диаграмму инструментов
    await createToolsDiagram(appData);
    
    // 6. Настраиваем перерисовку при изменении размера окна
    setupResizeHandler();
    
    // 7. Настраиваем ленивую загрузку
    setupLazyLoading();
    
    console.log('✅ Визуализации инициализированы');
}

/**
 * Конфигурация Mermaid.js
 */
function configureMermaid() {
    try {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: {
                primaryColor: '#dbeafe',      // blue-100
                primaryTextColor: '#1e40af',  // blue-800
                primaryBorderColor: '#93c5fd', // blue-300
                lineColor: '#3b82f6',         // blue-500
                secondaryColor: '#d1fae5',    // emerald-100
                tertiaryColor: '#fef3c7',     // amber-100
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '14px'
            },
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'basis'
            },
            sequence: {
                useMaxWidth: true,
                showSequenceNumbers: false
            },
            gantt: {
                useMaxWidth: true,
                titleTopMargin: 25,
                barHeight: 20,
                barGap: 4,
                topPadding: 50,
                leftPadding: 75,
                gridLineStartPadding: 35,
                fontSize: 11,
                numberSectionStyles: 4,
                axisFormat: '%Y-%m-%d'
            }
        });
        
        console.log('✅ Mermaid.js сконфигурирован');
    } catch (error) {
        console.error('❌ Ошибка конфигурации Mermaid.js:', error);
    }
}

/**
 * Создание диаграмм KPI
 * @param {Object} roadmapData - Данные дорожной карты
 */
async function createKPIDiagrams(roadmapData) {
    const container = document.getElementById('kpi-diagrams');
    if (!container) {
        console.warn('Контейнер для диаграмм KPI не найден');
        return;
    }
    
    // 1. Диаграмма эффективности пилота
    const effectivenessSection = container.querySelector('#kpi-effectiveness');
    if (effectivenessSection && roadmapData?.stages) {
        const kpiStage = roadmapData.stages.find(stage => stage.id === 'kpi');
        if (kpiStage) {
            const effectivenessDiagram = createEffectivenessGauge(kpiStage);
            await renderMermaidDiagram(effectivenessDiagram, effectivenessSection);
        }
    }
    
    // 2. Генерация дополнительных KPI диаграмм
    await generateAdditionalKPIs(roadmapData, container);
}

/**
 * Создание диаграммы эффективности (Gauge chart)
 * @param {Object} kpiStage - Данные KPI
 * @returns {string} Mermaid.js код диаграммы
 */
function createEffectivenessGauge(kpiStage) {
    if (!kpiStage?.categories) return '';
    
    let diagramCode = 'graph TD\n';
    diagramCode += '    A[KPI Эффективности Пилота] --> B\n';
    diagramCode += '    subgraph B [Критерии успеха]\n';
    
    kpiStage.categories.forEach((category, index) => {
        const categoryId = `C${index}`;
        diagramCode += `        ${categoryId}[${category.name}]\n`;
        
        if (category.metrics) {
            category.metrics.forEach((metric, metricIndex) => {
                const metricId = `${categoryId}M${metricIndex}`;
                const targetValue = metric.target || 'N/A';
                
                diagramCode += `        ${categoryId} --> ${metricId}{${metric.name}: ${targetValue}}\n`;
            });
        }
    });
    
    diagramCode += '    end\n';
    diagramCode += '    B --> D[🎯 Цель: Успешный пилот]\n';
    
    return diagramCode;
}

/**
 * Генерация дополнительных KPI диаграмм
 * @param {Object} roadmapData - Данные дорожной карты
 * @param {Element} container - Контейнер для диаграмм
 */
async function generateAdditionalKPIs(roadmapData, container) {
    if (!roadmapData?.stages) return;
    
    // Создаем контейнер для дополнительных диаграмм
    const additionalDiagramsContainer = createElement('div', {
        className: 'col-span-full mt-8',
        id: 'additional-kpi-diagrams'
    });
    
    const title = createElement('h3', {
        className: 'text-2xl font-bold text-gray-800 mb-6 text-center',
        textContent: '📈 Детализация KPI'
    });
    
    additionalDiagramsContainer.appendChild(title);
    
    // Создаем сетку для диаграмм
    const diagramsGrid = createElement('div', {
        className: 'grid grid-cols-1 md:grid-cols-2 gap-6'
    });
    
    // 1. Диаграмма рисков
    const risksStage = roadmapData.stages.find(stage => stage.id === 'risks');
    if (risksStage) {
        const risksDiagram = createRiskMatrixDiagram(risksStage);
        const risksCard = createDiagramCard('Матрица рисков', risksDiagram, 'risks-matrix');
        diagramsGrid.appendChild(risksCard);
    }
    
    // 2. Диаграмма приоритетных задач
    const tasksStage = roadmapData.stages.find(stage => stage.id === 'priority-tasks');
    if (tasksStage) {
        const tasksDiagram = createTasksFlowDiagram(tasksStage);
        const tasksCard = createDiagramCard('Приоритетные задачи', tasksDiagram, 'tasks-flow');
        diagramsGrid.appendChild(tasksCard);
    }
    
    // 3. Диаграмма пилотного таймлайна
    const pilotStage = roadmapData.stages.find(stage => stage.id === 'pilot');
    if (pilotStage) {
        const timelineDiagram = createTimelineDiagram(pilotStage);
        const timelineCard = createDiagramCard('Таймлайн пилота', timelineDiagram, 'pilot-timeline');
        diagramsGrid.appendChild(timelineCard);
    }
    
    // 4. Диаграмма инструментов
    if (roadmapData.tools) {
        const toolsDiagram = createToolsFlowDiagram(roadmapData.tools);
        const toolsCard = createDiagramCard('Инструменты LLM', toolsDiagram, 'tools-flow');
        diagramsGrid.appendChild(toolsCard);
    }
    
    additionalDiagramsContainer.appendChild(diagramsGrid);
    container.appendChild(additionalDiagramsContainer);
    
    // Рендерим диаграммы после добавления в DOM
    setTimeout(() => {
        renderAllMermaidDiagrams();
    }, 100);
}

/**
 * Создание диаграммы матрицы рисков
 * @param {Object} risksStage - Данные рисков
 * @returns {string} Mermaid.js код диаграммы
 */
function createRiskMatrixDiagram(risksStage) {
    if (!risksStage?.risks) return '';
    
    let diagramCode = 'quadrantChart\n';
    diagramCode += '    title "Матрица рисков внедрения LLM"\n';
    diagramCode += '    x-axis "Низкая вероятность" --> "Высокая вероятность"\n';
    diagramCode += '    y-axis "Низкое влияние" --> "Высокое влияние"\n';
    diagramCode += '    "Утечка данных": [0.7, 0.8]\n';
    diagramCode += '    "Сопротивление сотрудников": [0.9, 0.5]\n';
    diagramCode += '    "Галлюцинации LLM": [0.5, 0.7]\n';
    
    // Добавляем риски из данных
    risksStage.risks.forEach((risk, index) => {
        const probability = risk.probability === 'Высокая' ? 0.9 : 
                          risk.probability === 'Средняя' ? 0.5 : 0.3;
        
        const impact = risk.impact === 'Критическое' ? 0.9 :
                      risk.impact === 'Высокое' ? 0.7 :
                      risk.impact === 'Среднее' ? 0.5 : 0.3;
        
        diagramCode += `    "${risk.title}": [${probability}, ${impact}]\n`;
    });
    
    return diagramCode;
}

/**
 * Создание диаграммы потока задач
 * @param {Object} tasksStage - Данные задач
 * @returns {string} Mermaid.js код диаграммы
 */
function createTasksFlowDiagram(tasksStage) {
    if (!tasksStage?.tasks) return '';
    
    let diagramCode = 'graph LR\n';
    diagramCode += '    Start[Начало] --> Analysis\n';
    
    tasksStage.tasks.forEach((task, index) => {
        const taskId = `Task${index}`;
        const nextTaskId = index < tasksStage.tasks.length - 1 ? `Task${index + 1}` : 'End';
        
        diagramCode += `    ${taskId}[${task.title}]\n`;
        diagramCode += `    ${index === 0 ? 'Analysis' : `Task${index - 1}`} --> ${taskId}\n`;
        diagramCode += `    ${taskId} --> ${nextTaskId}\n`;
        
        // Добавляем качественные критерии как подграф
        if (task.qualityCriteria) {
            diagramCode += `    subgraph ${taskId}_QC [Критерии качества]\n`;
            task.qualityCriteria.forEach((criterion, critIndex) => {
                const critId = `${taskId}C${critIndex}`;
                diagramCode += `        ${critId}[${criterion.name}: ${criterion.target}]\n`;
            });
            diagramCode += '    end\n';
            diagramCode += `    ${taskId} -.-> ${taskId}_QC\n`;
        }
    });
    
    diagramCode += '    End[Завершение] --> Success[Успешное внедрение]\n';
    
    // Стилизация
    diagramCode += '    style Start fill:#10b981,color:#fff\n';
    diagramCode += '    style Success fill:#2563eb,color:#fff\n';
    diagramCode += '    style Analysis fill:#f59e0b,color:#000\n';
    
    tasksStage.tasks.forEach((_, index) => {
        diagramCode += `    style Task${index} fill:#93c5fd,color:#000\n`;
    });
    
    return diagramCode;
}

/**
 * Создание диаграммы таймлайна
 * @param {Object} pilotStage - Данные пилотного этапа
 * @returns {string} Mermaid.js код диаграммы
 */
function createTimelineDiagram(pilotStage) {
    if (!pilotStage?.timeline) return '';
    
    let diagramCode = 'gantt\n';
    diagramCode += '    title Таймлайн пилотного проекта\n';
    diagramCode += '    dateFormat YYYY-MM-DD\n';
    diagramCode += '    axisFormat %d/%m\n';
    diagramCode += '    section Подготовка\n';
    
    const startDate = new Date('2023-11-01');
    pilotStage.timeline.forEach((item, index) => {
        const duration = item.week.includes('-') ? 3 : 1; // Недели или диапазон недель
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration * 7);
        
        diagramCode += `    ${item.title} :${formatDate(startDate)}, ${duration * 7}d\n`;
        
        startDate.setDate(startDate.getDate() + duration * 7 + 1);
    });
    
    return diagramCode;
}

/**
 * Создание диаграммы инструментов
 * @param {Object} toolsData - Данные инструментов
 * @returns {string} Mermaid.js код диаграммы
 */
function createToolsFlowDiagram(toolsData) {
    if (!toolsData) return '';
    
    let diagramCode = 'graph TD\n';
    diagramCode += '    Start[Выбор инструмента LLM] --> Decision{Тип данных?}\n';
    diagramCode += '    Decision -->|Конфиденциальные| Russian[Российские решения]\n';
    diagramCode += '    Decision -->|Тестовые/Открытые| Any[Любые решения]\n';
    
    if (toolsData.primary) {
        diagramCode += '    Russian --> Primary[Основные инструменты]\n';
        toolsData.primary.forEach((tool, index) => {
            diagramCode += `    Primary --> ${tool.replace(/\s+/g, '')}[${tool}]\n`;
        });
    }
    
    if (toolsData.secondary) {
        diagramCode += '    Any --> Secondary[Резервные инструменты]\n';
        toolsData.secondary.forEach((tool, index) => {
            diagramCode += `    Secondary --> ${tool.replace(/\s+/g, '')}[${tool}]\n`;
        });
    }
    
    // Стилизация
    diagramCode += '    style Start fill:#2563eb,color:#fff\n';
    diagramCode += '    style Decision fill:#f59e0b,color:#000\n';
    diagramCode += '    style Russian fill:#10b981,color:#fff\n';
    diagramCode += '    style Any fill:#8b5cf6,color:#fff\n';
    
    return diagramCode;
}

/**
 * Создание диаграммы этапов внедрения
 * @param {Object} roadmapData - Данные дорожной карты
 */
async function createImplementationStagesDiagram(roadmapData) {
    const container = document.getElementById('implementation-stages');
    if (!container) return;
    
    const stagesDiagram = createStagesFlowDiagram(roadmapData);
    await renderMermaidDiagram(stagesDiagram, container);
}

/**
 * Создание диаграммы потока этапов
 * @param {Object} roadmapData - Данные дорожной карты
 * @returns {string} Mermaid.js код диаграммы
 */
function createStagesFlowDiagram(roadmapData) {
    if (!roadmapData?.stages) return '';
    
    let diagramCode = 'graph TB\n';
    diagramCode += '    Start[Начало внедрения] --> Preproject\n';
    
    roadmapData.stages.forEach((stage, index) => {
        const stageId = stage.id.replace(/-/g, '');
        diagramCode += `    ${stageId}[${stage.title}]\n`;
        
        if (index > 0) {
            const prevStageId = roadmapData.stages[index - 1].id.replace(/-/g, '');
            diagramCode += `    ${prevStageId} --> ${stageId}\n`;
        }
    });
    
    diagramCode += `    ${roadmapData.stages[roadmapData.stages.length - 1].id.replace(/-/g, '')} --> End[Масштабирование]\n`;
    
    // Стилизация этапов
    roadmapData.stages.forEach((stage, index) => {
        const color = getStageColorForDiagram(stage.color);
        diagramCode += `    style ${stage.id.replace(/-/g, '')} fill:${color.fill},color:${color.text},stroke-width:2px\n`;
    });
    
    diagramCode += '    style Start fill:#10b981,color:#fff,stroke-width:2px\n';
    diagramCode += '    style End fill:#2563eb,color:#fff,stroke-width:2px\n';
    
    return diagramCode;
}

/**
 * Создание диаграммы артефактов курса
 * @param {Object} techmapData - Данные технологической карты
 */
async function createArtifactsDiagram(techmapData) {
    // Создаем контейнер для диаграммы артефактов
    const artifactsSection = document.getElementById('artifacts');
    if (!artifactsSection) return;
    
    const diagramContainer = createElement('div', {
        className: 'mt-8'
    });
    
    const title = createElement('h3', {
        className: 'text-2xl font-bold text-gray-800 mb-4 text-center',
        textContent: '🛠️ Карта артефактов курса'
    });
    
    const diagram = createElement('div', {
        className: 'mermaid-container bg-white p-4 rounded-xl border border-slate-200',
        id: 'artifacts-diagram'
    });
    
    diagramContainer.appendChild(title);
    diagramContainer.appendChild(diagram);
    artifactsSection.appendChild(diagramContainer);
    
    // Создаем диаграмму
    const artifactsDiagram = createArtifactsMindMap(techmapData);
    await renderMermaidDiagram(artifactsDiagram, diagram);
}

/**
 * Создание ментальной карты артефактов
 * @param {Object} techmapData - Данные технологической карты
 * @returns {string} Mermaid.js код диаграммы
 */
function createArtifactsMindMap(techmapData) {
    if (!techmapData?.modules) return '';
    
    let diagramCode = 'mindmap\n';
    diagramCode += '  root((Артефакты курса))\n';
    
    techmapData.modules.forEach((module, moduleIndex) => {
        const moduleName = module.title.split('. ')[1] || module.title;
        diagramCode += `    ${moduleName}\n`;
        
        if (module.topics) {
            module.topics.forEach((topic, topicIndex) => {
                const topicName = topic.title.substring(0, 20) + (topic.title.length > 20 ? '...' : '');
                diagramCode += `      ${topicName}\n`;
                
                if (topic.artifacts) {
                    topic.artifacts.forEach((artifact, artifactIndex) => {
                        const artifactName = artifact.substring(0, 15) + (artifact.length > 15 ? '...' : '');
                        diagramCode += `        ${artifactName}\n`;
                    });
                }
            });
        }
    });
    
    return diagramCode;
}

/**
 * Создание диаграммы инструментов
 * @param {Object} appData - Данные приложения
 */
async function createToolsDiagram(appData) {
    const toolsSection = document.getElementById('artifacts');
    if (!toolsSection || !appData?.techmap?.toolsComparison) return;
    
    const diagramContainer = createElement('div', {
        className: 'mt-8'
    });
    
    const title = createElement('h3', {
        className: 'text-2xl font-bold text-gray-800 mb-4 text-center',
        textContent: '⚙️ Сравнение инструментов LLM'
    });
    
    const diagram = createElement('div', {
        className: 'mermaid-container bg-white p-4 rounded-xl border border-slate-200',
        id: 'tools-diagram'
    });
    
    diagramContainer.appendChild(title);
    diagramContainer.appendChild(diagram);
    toolsSection.appendChild(diagramContainer);
    
    // Создаем диаграмму сравнения
    const toolsDiagram = createToolsComparisonDiagram(appData.techmap.toolsComparison);
    await renderMermaidDiagram(toolsDiagram, diagram);
}

/**
 * Создание диаграммы сравнения инструментов
 * @param {Object} toolsComparison - Данные сравнения инструментов
 * @returns {string} Mermaid.js код диаграммы
 */
function createToolsComparisonDiagram(toolsComparison) {
    let diagramCode = 'xychart-beta\n';
    diagramCode += '    title "Сравнение инструментов LLM"\n';
    diagramCode += '    x-axis ["GigaChat", "ЯндексGPT", "DeepSeek", "ChatGPT"]\n';
    diagramCode += '    y-axis "Оценка" 0 --> 10\n';
    
    // Примерные оценки по категориям
    diagramCode += '    bar [8.5, 8.0, 6.5, 7.0]\n';
    diagramCode += '    bar [9.0, 8.5, 7.0, 6.0]\n';
    diagramCode += '    bar [7.5, 7.5, 8.5, 9.0]\n';
    
    diagramCode += '    line [8.0, 7.5, 7.0, 7.5]\n';
    
    return diagramCode;
}

/**
 * Создание карточки для диаграммы
 * @param {string} title - Заголовок диаграммы
 * @param {string} diagramCode - Код диаграммы
 * @param {string} id - ID диаграммы
 * @returns {Element} Карточка диаграммы
 */
function createDiagramCard(title, diagramCode, id) {
    const card = createElement('div', {
        className: 'bg-slate-50 p-4 rounded-xl border border-slate-200'
    });
    
    const cardTitle = createElement('h4', {
        className: 'text-lg font-bold text-gray-800 mb-3',
        textContent: title
    });
    
    const diagramContainer = createElement('div', {
        className: 'mermaid min-h-[200px]',
        id: id,
        'data-mermaid-code': diagramCode
    });
    
    card.appendChild(cardTitle);
    card.appendChild(diagramContainer);
    
    return card;
}

/**
 * Рендеринг диаграммы Mermaid.js
 * @param {string} diagramCode - Код диаграммы
 * @param {Element} container - Контейнер для диаграммы
 */
async function renderMermaidDiagram(diagramCode, container) {
    if (!diagramCode || !container || !window.mermaid) {
        console.warn('Mermaid не загружен или нет данных для рендеринга');
        showFallbackContent(container);
        return;
    }
    
    try {
        // Сохраняем код диаграммы в data-атрибут
        container.setAttribute('data-processed', 'false');
        container.setAttribute('data-diagram-code', diagramCode);
        
        // Рендерим асинхронно с правильным извлечением SVG
        const { svg } = await mermaid.render(
            `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            diagramCode
        );
        
        if (svg) {
            container.innerHTML = svg;
            container.setAttribute('data-processed', 'true');
        } else {
            throw new Error('Mermaid вернул пустой SVG');
        }
                
        // Добавляем обработчики кликов для интерактивных диаграмм
        addDiagramInteractivity(container);
    } catch (error) {
        console.error('Ошибка рендеринга Mermaid:', error);
        showFallbackContent(container);
    }
}

/**
 * Показать fallback контент вместо диаграммы при ошибках
 * @param {Element} container - Контейнер для диаграммы
 */
function showFallbackContent(container) {
    container.innerHTML = `
        <div class="text-center p-4 bg-slate-100 rounded-lg">
            <i class="fas fa-chart-line text-slate-400 text-2xl mb-2"></i>
            <p class="text-slate-600">Диаграмма временно недоступна</p>
        </div>
    `;
}

/**
 * Рендеринг всех диаграмм Mermaid.js
 */
async function renderAllMermaidDiagrams() {
    if (!window.mermaid) return;
    
    const diagrams = document.querySelectorAll('.mermaid:not([data-processed="true"])');
    const renderPromises = [];
    
    diagrams.forEach(diagram => {
        const diagramCode = diagram.getAttribute('data-mermaid-code') || diagram.textContent;
        if (diagramCode) {
            renderPromises.push(renderMermaidDiagram(diagramCode, diagram));
        }
    });
    
    // Параллельный рендеринг всех диаграмм
    await Promise.all(renderPromises);
}

/**
 * Добавление интерактивности к диаграммам
 * @param {Element} container - Контейнер диаграммы
 */
function addDiagramInteractivity(container) {
    // Добавляем обработчики кликов для элементов диаграммы
    container.querySelectorAll('[id]').forEach(element => {
        element.style.cursor = 'pointer';
        element.addEventListener('click', () => {
            const elementId = element.getAttribute('id');
            console.log('Клик по элементу диаграммы:', elementId);
            
            // Добавляем визуальную обратную связь
            element.style.filter = 'brightness(0.9)';
            setTimeout(() => {
                element.style.filter = '';
            }, 300);
        });
        
        // Добавляем эффект при наведении
        element.addEventListener('mouseenter', () => {
            element.style.filter = 'brightness(1.1)';
            element.style.transition = 'filter 0.2s';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.filter = '';
        });
    });
}

/**
 * Настройка обработчика изменения размера окна
 */
function setupResizeHandler() {
    let resizeTimeout;
    
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('🔄 Перерисовка диаграмм при изменении размера окна');
            renderAllMermaidDiagrams();
        }, 300);
    });
}

/**
 * Настройка ленивой загрузки диаграмм
 */
function setupLazyLoading() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const diagram = entry.target;
                if (diagram.getAttribute('data-processed') !== 'true') {
                    const diagramCode = diagram.getAttribute('data-mermaid-code') || diagram.textContent;
                    if (diagramCode) {
                        renderMermaidDiagram(diagramCode, diagram);
                    }
                }
                observer.unobserve(diagram);
            }
        });
    }, {
        rootMargin: '100px',
        threshold: 0.1
    });
    
    // Наблюдаем за всеми диаграммами
    document.querySelectorAll('.mermaid').forEach(diagram => {
        observer.observe(diagram);
    });
}

/**
 * Получение цвета для категории
 * @param {string} categoryName - Название категории
 * @returns {Object} Объект с цветами
 */
function getCategoryColor(categoryName) {
    const colors = {
        'Эффективность': {
            bg: '#d1fae5',     // emerald-100
            text: '#065f46',   // emerald-800
            border: '#10b981'  // emerald-500
        },
        'Качество': {
            bg: '#fef3c7',     // amber-100
            text: '#92400e',   // amber-800
            border: '#f59e0b'  // amber-500
        },
        'Принятие технологии': {
            bg: '#e9d5ff',     // purple-100
            text: '#5b21b6',   // purple-800
            border: '#8b5cf6'  // purple-500
        }
    };
    
    return colors[categoryName] || {
        bg: '#dbeafe',     // blue-100
        text: '#1e40af',   // blue-800
        border: '#3b82f6'  // blue-500
    };
}

/**
 * Получение цвета для этапа
 * @param {string} colorName - Название цвета
 * @returns {Object} Объект с цветами
 */
function getStageColorForDiagram(colorName) {
    const colors = {
        blue: {
            fill: '#dbeafe',   // blue-100
            text: '#1e40af'    // blue-800
        },
        emerald: {
            fill: '#d1fae5',   // emerald-100
            text: '#065f46'    // emerald-800
        },
        amber: {
            fill: '#fef3c7',   // amber-100
            text: '#92400e'    // amber-800
        },
        purple: {
            fill: '#e9d5ff',   // purple-100
            text: '#5b21b6'    // purple-800
        },
        rose: {
            fill: '#ffe4e6',   // rose-100
            text: '#9f1239'    // rose-800
        }
    };
    
    return colors[colorName] || colors.blue;
}

/**
 * Форматирование даты для диаграммы
 * @param {Date} date - Дата
 * @returns {string} Отформатированная дата
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Создание элемента
 * @param {string} tag - Тег элемента
 * @param {Object} attributes - Атрибуты
 * @returns {Element} Созданный элемент
 */
function createElement(tag, attributes = {}) {
    const element = document.createElement(tag);
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else if (key === 'textContent') {
            element.textContent = attributes[key];
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });
    return element;
}

/**
 * Экспортировать данные диаграмм
 * @returns {Object} Данные всех диаграмм
 */
export function exportDiagramsData() {
    const diagrams = document.querySelectorAll('.mermaid[data-processed="true"]');
    const data = {};
    
    diagrams.forEach((diagram, index) => {
        data[`diagram-${index}`] = {
            id: diagram.id,
            code: diagram.getAttribute('data-diagram-code') || diagram.getAttribute('data-mermaid-code'),
            html: diagram.innerHTML
        };
    });
    
    return data;
}

/**
 * Перерисовать все диаграммы
 */
export function redrawAllDiagrams() {
    document.querySelectorAll('.mermaid[data-processed="true"]').forEach(diagram => {
        diagram.setAttribute('data-processed', 'false');
    });
    
    renderAllMermaidDiagrams();
}

export default {
    initializeVisualizations,
    exportDiagramsData,
    redrawAllDiagrams,
    renderAllMermaidDiagrams
};