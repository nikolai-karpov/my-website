/**
 * Вспомогательные функции и утилиты для приложения
 * @module utils
 */

/**
 * Загрузка данных из JSON файла
 * @param {string} url - URL JSON файла
 * @returns {Promise<Object>} Загруженные данные
 * @throws {Error} Ошибка загрузки или парсинга
 */
export async function loadData(url) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`❌ Ошибка загрузки данных из ${url}:`, error);
        throw new Error(`Не удалось загрузить данные: ${error.message}`);
    }
}

/**
 * Форматирование числа с разделителями тысяч
 * @param {number} number - Число для форматирования
 * @param {string} locale - Локаль (по умолчанию 'ru-RU')
 * @returns {string} Отформатированное число
 */
export function formatNumber(number, locale = 'ru-RU') {
    if (typeof number !== 'number') {
        return number;
    }
    
    return new Intl.NumberFormat(locale).format(number);
}

/**
 * Форматирование процента
 * @param {number} value - Значение от 0 до 1 или строка с процентом
 * @param {number} decimals - Количество знаков после запятой
 * @returns {string} Отформатированный процент
 */
export function formatPercent(value, decimals = 1) {
    let numericValue;
    
    if (typeof value === 'string') {
        // Убираем символ процента и конвертируем в число
        numericValue = parseFloat(value.replace('%', '').replace('≥', '').replace('≤', ''));
        if (isNaN(numericValue)) return value;
    } else {
        numericValue = value;
    }
    
    // Если значение меньше 1, считаем что это дробь (0.95 -> 95%)
    if (numericValue < 1 && numericValue > 0) {
        numericValue = numericValue * 100;
    }
    
    const formatted = numericValue.toFixed(decimals);
    return `${formatted}%`;
}

/**
 * Генерация уникального ID
 * @param {number} length - Длина ID
 * @returns {string} Уникальный ID
 */
export function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

/**
 * Дебаунс функции (отложенное выполнение)
 * @param {Function} func - Функция для дебаунса
 * @param {number} wait - Время ожидания в мс
 * @returns {Function} Дебаунсированная функция
 */
export function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Троттлинг функции (ограничение частоты выполнения)
 * @param {Function} func - Функция для троттлинга
 * @param {number} limit - Лимит времени в мс
 * @returns {Function} Троттлированная функция
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Проверка, находится ли элемент в области видимости
 * @param {Element} element - DOM элемент
 * @param {number} offset - Отступ от края (px)
 * @returns {boolean} Виден ли элемент
 */
export function isElementInViewport(element, offset = 100) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= -offset &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight + offset) &&
        rect.right <= window.innerWidth
    );
}

/**
 * Плавная прокрутка к элементу
 * @param {string|Element} target - ID элемента или DOM элемент
 * @param {Object} options - Опции прокрутки
 */
export function smoothScrollTo(target, options = {}) {
    const defaultOptions = {
        offset: 80,
        duration: 800,
        easing: 'easeInOutCubic'
    };
    
    const config = { ...defaultOptions, ...options };
    
    let targetElement;
    if (typeof target === 'string') {
        targetElement = document.querySelector(target);
    } else {
        targetElement = target;
    }
    
    if (!targetElement) {
        console.warn(`Элемент не найден: ${target}`);
        return;
    }
    
    const startPosition = window.pageYOffset;
    const targetPosition = targetElement.getBoundingClientRect().top + startPosition - config.offset;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();
    
    // Функции easing
    const easingFunctions = {
        linear: t => t,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        easeOutCubic: t => 1 - Math.pow(1 - t, 3)
    };
    
    const easing = easingFunctions[config.easing] || easingFunctions.easeInOutCubic;
    
    function scrollStep(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / config.duration, 1);
        const easedProgress = easing(progress);
        
        window.scrollTo(0, startPosition + distance * easedProgress);
        
        if (progress < 1) {
            requestAnimationFrame(scrollStep);
        }
    }
    
    requestAnimationFrame(scrollStep);
}

/**
 * Клонирование объекта (поверхностное)
 * @param {Object} obj - Объект для клонирования
 * @returns {Object} Клонированный объект
 */
export function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(item => cloneObject(item));
    
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = cloneObject(obj[key]);
        }
    }
    return cloned;
}

/**
 * Фильтрация массива объектов по нескольким полям
 * @param {Array} array - Массив для фильтрации
 * @param {string} query - Строка поиска
 * @param {Array} fields - Поля для поиска
 * @returns {Array} Отфильтрованный массив
 */
export function filterArray(array, query, fields) {
    if (!query.trim()) return array;
    
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return array.filter(item => {
        return searchTerms.every(term => {
            return fields.some(field => {
                const value = getNestedValue(item, field);
                return value && value.toString().toLowerCase().includes(term);
            });
        });
    });
}

/**
 * Получение вложенного значения объекта по строке пути
 * @param {Object} obj - Объект
 * @param {string} path - Путь вида 'prop.subprop'
 * @param {any} defaultValue - Значение по умолчанию
 * @returns {any} Значение свойства
 */
export function getNestedValue(obj, path, defaultValue = null) {
    if (!obj || typeof obj !== 'object') return defaultValue;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
        if (current === null || current === undefined) return defaultValue;
        current = current[key];
    }
    
    return current === undefined ? defaultValue : current;
}

/**
 * Создание элемента DOM с атрибутами и контентом
 * @param {string} tag - Тег элемента
 * @param {Object} attributes - Атрибуты элемента
 * @param {string|Array|Element} content - Контент элемента
 * @returns {Element} Созданный элемент
 */
export function createElement(tag, attributes = {}, content = null) {
    const element = document.createElement(tag);
    
    // Установка атрибутов
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className' || key === 'class') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    }
    
    // Добавление контента
    if (content) {
        if (Array.isArray(content)) {
            content.forEach(item => {
                if (item instanceof Element) {
                    element.appendChild(item);
                } else if (typeof item === 'string') {
                    element.appendChild(document.createTextNode(item));
                }
            });
        } else if (content instanceof Element) {
            element.appendChild(content);
        } else if (typeof content === 'string') {
            element.textContent = content;
        }
    }
    
    return element;
}

/**
 * Установка или получение данных из localStorage с обработкой ошибок
 * @param {string} key - Ключ
 * @param {any} value - Значение (если undefined - получаем значение)
 * @returns {any|null} Сохраненное значение или null
 */
export function storage(key, value = undefined) {
    try {
        if (value === undefined) {
            // Получение значения
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } else if (value === null) {
            // Удаление значения
            localStorage.removeItem(key);
            return null;
        } else {
            // Установка значения
            localStorage.setItem(key, JSON.stringify(value));
            return value;
        }
    } catch (error) {
        console.warn('Ошибка работы с localStorage:', error);
        return null;
    }
}

/**
 * Валидация email
 * @param {string} email - Email для проверки
 * @returns {boolean} Валиден ли email
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Форматирование даты
 * @param {string|Date} date - Дата для форматирования
 * @param {string} locale - Локаль
 * @param {Object} options - Опции форматирования
 * @returns {string} Отформатированная дата
 */
export function formatDate(date, locale = 'ru-RU', options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        return 'Неверная дата';
    }
    
    const formatOptions = { ...defaultOptions, ...options };
    return dateObj.toLocaleDateString(locale, formatOptions);
}

/**
 * Ограничение строки по длине с добавлением многоточия
 * @param {string} text - Текст
 * @param {number} maxLength - Максимальная длина
 * @returns {string} Обрезанный текст
 */
export function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    
    return text.substr(0, maxLength).trim() + '...';
}

/**
 * Извлечение цветового класса Tailwind по типу
 * @param {string} type - Тип (success, warning, error, info, primary)
 * @returns {Object} Объект с классами для фона, текста и границы
 */
export function getColorClasses(type) {
    const colorMap = {
        success: {
            bg: 'bg-emerald-100',
            text: 'text-emerald-800',
            border: 'border-emerald-300',
            icon: 'text-emerald-600'
        },
        warning: {
            bg: 'bg-amber-100',
            text: 'text-amber-800',
            border: 'border-amber-300',
            icon: 'text-amber-600'
        },
        error: {
            bg: 'bg-rose-100',
            text: 'text-rose-800',
            border: 'border-rose-300',
            icon: 'text-rose-600'
        },
        info: {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            border: 'border-blue-300',
            icon: 'text-blue-600'
        },
        primary: {
            bg: 'bg-blue-600',
            text: 'text-white',
            border: 'border-blue-700',
            icon: 'text-white'
        }
    };
    
    return colorMap[type] || colorMap.info;
}

/**
 * Создание диаграммы прогресса (progress bar)
 * @param {number} value - Текущее значение
 * @param {number} max - Максимальное значение
 * @param {Object} options - Опции
 * @returns {Element} Элемент progress bar
 */
export function createProgressBar(value, max = 100, options = {}) {
    const percentage = Math.min((value / max) * 100, 100);
    const config = {
        height: 'h-2',
        borderRadius: 'rounded-full',
        bgColor: 'bg-slate-200',
        barColor: 'bg-blue-600',
        showLabel: true,
        labelPosition: 'right',
        ...options
    };
    
    const container = createElement('div', {
        className: 'w-full'
    });
    
    const progressWrapper = createElement('div', {
        className: `${config.height} ${config.bgColor} ${config.borderRadius} overflow-hidden`
    });
    
    const progressBar = createElement('div', {
        className: `${config.barColor} ${config.height} transition-all duration-500`,
        style: { width: `${percentage}%` }
    });
    
    progressWrapper.appendChild(progressBar);
    container.appendChild(progressWrapper);
    
    if (config.showLabel) {
        const label = createElement('div', {
            className: `text-sm font-medium mt-1 text-slate-700 ${config.labelPosition === 'right' ? 'text-right' : ''}`,
            textContent: `${percentage.toFixed(1)}%`
        });
        container.appendChild(label);
    }
    
    return container;
}

/**
 * Очистка HTML от потенциально опасных тегов
 * @param {string} html - HTML строка
 * @returns {string} Очищенный HTML
 */
export function sanitizeHTML(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Группировка массива объектов по ключу
 * @param {Array} array - Массив объектов
 * @param {string} key - Ключ для группировки
 * @returns {Object} Сгруппированный объект
 */
export function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const groupKey = getNestedValue(item, key);
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {});
}

export default {
    loadData,
    formatNumber,
    formatPercent,
    generateId,
    debounce,
    throttle,
    isElementInViewport,
    smoothScrollTo,
    cloneObject,
    filterArray,
    getNestedValue,
    createElement,
    storage,
    isValidEmail,
    formatDate,
    truncateText,
    getColorClasses,
    createProgressBar,
    sanitizeHTML,
    groupBy
};