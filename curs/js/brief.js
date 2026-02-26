/**
 * Модуль бриф-формы для заказчиков обучения
 * Интерактивный опросник на основе 5P подхода
 * @module brief
 */

/**
 * Класс бриф-формы
 */
class BriefForm {
    constructor() {
        this.container = document.getElementById('brief-container');
        this.currentStep = 0;
        this.answers = {};
        this.isInitialized = false;
        
        // Вопросы бриф-формы (5P подход)
        this.questions = [
            {
                id: 'purpose',
                title: '🎯 Цель (Purpose)',
                subtitle: 'Какова основная цель обучения?',
                description: 'Опишите, какие бизнес-задачи вы хотите решить с помощью обучения сотрудников.',
                type: 'textarea',
                placeholder: 'Например: Повысить эффективность работы с ИИ, сократить время на проектирование...'
            },
            {
                id: 'people',
                title: '👥 Аудитория (People)',
                subtitle: 'Кто будет проходить обучение?',
                description: 'Опишите целевую аудиторию: должности, уровень квалификации, опыт работы.',
                type: 'textarea',
                placeholder: 'Например: Инженеры-проектировщики 2-5 лет опыта, знакомы с AutoCAD...'
            },
            {
                id: 'problem',
                title: '痛点 Проблемы (Problem)',
                subtitle: 'Какие проблемы вы хотите решить?',
                description: 'Опишите текущие трудности и болевые точки вашей команды.',
                type: 'textarea',
                placeholder: 'Например: Сотрудники не используют ИИ эффективно, много рутинной работы...'
            },
            {
                id: 'process',
                title: '🔄 Процесс (Process)',
                subtitle: 'Какие процессы будут затронуты?',
                description: 'Опишите рабочие процессы, которые изменятся после обучения.',
                type: 'textarea',
                placeholder: 'Например: Процесс проектирования, согласования чертежей, взаимодействия с ИИ...'
            },
            {
                id: 'performance',
                title: '📊 Результаты (Performance)',
                subtitle: 'Как измерить успех?',
                description: 'Опишите ключевые метрики и критерии успеха обучения.',
                type: 'textarea',
                placeholder: 'Например: Сокращение времени проектирования на 30%, повышение качества...'
            }
        ];
        
        this.init();
    }
    
    /**
     * Инициализация бриф-формы
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Инициализация бриф-формы...');
        
        // Загружаем сохраненные ответы
        this.loadAnswers();
        
        // Загружаем ответы из URL, если есть
        this.loadAnswersFromUrl();
        
        // Отображаем форму
        this.render();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('✅ Бриф-форма инициализирована');
    }
    
    /**
     * Загрузка сохраненных ответов
     */
    loadAnswers() {
        try {
            const saved = localStorage.getItem('briefAnswers');
            if (saved) {
                this.answers = JSON.parse(saved);
                console.log('💾 Загружены сохраненные ответы');
            }
        } catch (error) {
            console.warn('Не удалось загрузить сохраненные ответы:', error);
        }
    }
    
    /**
     * Сохранение ответов
     */
    saveAnswers() {
        try {
            localStorage.setItem('briefAnswers', JSON.stringify(this.answers));
            console.log('💾 Ответы сохранены');
        } catch (error) {
            console.warn('Не удалось сохранить ответы:', error);
        }
    }
    
    /**
     * Отображение формы
     */
    render() {
        if (!this.container) {
            console.error('Контейнер для бриф-формы не найден');
            return;
        }
        
        this.container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <div class="mb-8">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-2xl font-bold text-gray-800">Интерактивный бриф</h3>
                        <span class="text-sm text-gray-500">Шаг ${this.currentStep + 1} из ${this.questions.length}</span>
                    </div>
                    
                    <!-- Прогресс-бар -->
                    <div class="w-full bg-slate-200 rounded-full h-2 mb-6">
                        <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                             style="width: ${(this.currentStep / this.questions.length) * 100}%"></div>
                    </div>
                </div>
                
                <!-- Вопрос -->
                <div class="mb-8">
                    <h4 class="text-xl font-bold text-gray-800 mb-2">${this.questions[this.currentStep].title}</h4>
                    <p class="text-gray-600 mb-4">${this.questions[this.currentStep].subtitle}</p>
                    <p class="text-sm text-gray-500 mb-6">${this.questions[this.currentStep].description}</p>
                    
                    <div class="mb-6">
                        <textarea 
                            id="brief-answer" 
                            class="w-full min-h-[150px] p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="${this.questions[this.currentStep].placeholder}"
                        >${this.answers[this.questions[this.currentStep].id] || ''}</textarea>
                    </div>
                </div>
                
                <!-- Навигация -->
                <div class="flex justify-between">
                    <button id="brief-prev" class="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition ${this.currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                            ${this.currentStep === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-left mr-2"></i>Назад
                    </button>
                    
                    ${this.currentStep < this.questions.length - 1 ? 
                        `<button id="brief-next" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            Далее<i class="fas fa-arrow-right ml-2"></i>
                        </button>` : 
                        `<button id="brief-submit" class="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                            <i class="fas fa-check-circle mr-2"></i>Завершить
                        </button>`
                    }
                </div>
            </div>
        `;
        
        // Добавляем обработчики событий для новых элементов
        this.setupStepEventListeners();
    }
    
    /**
     * Настройка обработчиков событий для навигации
     */
    setupStepEventListeners() {
        const prevBtn = document.getElementById('brief-prev');
        const nextBtn = document.getElementById('brief-next');
        const submitBtn = document.getElementById('brief-submit');
        const textarea = document.getElementById('brief-answer');
        
        // Обработчик для предыдущего шага
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.saveCurrentAnswer();
                this.previousStep();
            });
        }
        
        // Обработчик для следующего шага
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.saveCurrentAnswer();
                this.nextStep();
            });
        }
        
        // Обработчик для завершения
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.saveCurrentAnswer();
                this.submitForm();
            });
        }
        
        // Автоматическое сохранение при вводе
        if (textarea) {
            textarea.addEventListener('input', () => {
                this.answers[this.questions[this.currentStep].id] = textarea.value;
                this.saveAnswers();
            });
        }
    }
    
    /**
     * Сохранение текущего ответа
     */
    saveCurrentAnswer() {
        const textarea = document.getElementById('brief-answer');
        if (textarea) {
            this.answers[this.questions[this.currentStep].id] = textarea.value;
            this.saveAnswers();
        }
    }
    
    /**
     * Переход к следующему шагу
     */
    nextStep() {
        if (this.currentStep < this.questions.length - 1) {
            this.currentStep++;
            this.render();
        }
    }
    
    /**
     * Переход к предыдущему шагу
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    }
    
    /**
     * Завершение формы и генерация результата
     */
    submitForm() {
        // Сохраняем все ответы
        this.saveCurrentAnswer();
        
        // Генерируем результат
        const result = this.generateResult();
        
        // Отображаем результат
        this.showResult(result);
    }
    
    /**
     * Получение всех ответов
     */
    getAnswers() {
        return this.answers;
    }
    
    /**
     * Генерация результата бриф-формы
     */
    generateResult() {
        const timestamp = new Date().toLocaleString('ru-RU');
        
        return {
            timestamp,
            answers: this.answers,
            summary: this.generateSummary()
        };
    }
    
    /**
     * Создание ссылки для обмена брифом
     */
    generateShareableLink() {
        // Кодируем ответы в base64
        const encodedAnswers = btoa(encodeURIComponent(JSON.stringify(this.answers)));
        const baseUrl = window.location.href.split('?')[0];
        return `${baseUrl}?brief=${encodedAnswers}`;
    }
    
    /**
     * Загрузка ответов из URL
     */
    loadAnswersFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedAnswers = urlParams.get('brief');
        
        if (encodedAnswers) {
            try {
                const decodedAnswers = JSON.parse(decodeURIComponent(atob(encodedAnswers)));
                this.answers = { ...this.answers, ...decodedAnswers };
                this.saveAnswers();
                console.log('💾 Загружены ответы из URL');
                return true;
            } catch (error) {
                console.warn('Не удалось загрузить ответы из URL:', error);
                return false;
            }
        }
        return false;
    }
    
    /**
     * Генерация сводки
     */
    generateSummary() {
        return `
## 📋 Сводка бриф-формы

**Дата заполнения:** ${new Date().toLocaleString('ru-RU')}

### 🎯 Цель (Purpose)
${this.answers.purpose || 'Не указано'}

### 👥 Аудитория (People)
${this.answers.people || 'Не указано'}

### 痛点 Проблемы (Problem)
${this.answers.problem || 'Не указано'}

### 🔄 Процесс (Process)
${this.answers.process || 'Не указано'}

### 📊 Результаты (Performance)
${this.answers.performance || 'Не указано'}

---
*Сгенерировано автоматически на основе бриф-формы*
        `.trim();
    }
    
    /**
     * Отображение результата
     */
    showResult(result) {
        this.container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <div class="text-center mb-8">
                    <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-check text-emerald-600 text-2xl"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Спасибо за заполнение!</h3>
                    <p class="text-gray-600">Ваш бриф успешно отправлен. Мы свяжемся с вами в ближайшее время.</p>
                </div>
                
                <div class="bg-slate-50 rounded-lg p-6 mb-8">
                    <h4 class="font-bold text-gray-800 mb-4">Сводка вашего запроса</h4>
                    <div class="prose max-w-none">
                        <p><strong>🎯 Цель:</strong> ${result.answers.purpose?.substring(0, 100) || 'Не указано'}${result.answers.purpose && result.answers.purpose.length > 100 ? '...' : ''}</p>
                        <p><strong>👥 Аудитория:</strong> ${result.answers.people?.substring(0, 100) || 'Не указано'}${result.answers.people && result.answers.people.length > 100 ? '...' : ''}</p>
                        <p><strong>📊 Результаты:</strong> ${result.answers.performance?.substring(0, 100) || 'Не указано'}${result.answers.performance && result.answers.performance.length > 100 ? '...' : ''}</p>
                    </div>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-4">
                    <button id="brief-download" class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-download mr-2"></i>Скачать бриф
                    </button>
                    <button id="brief-copy-link" class="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                        <i class="fas fa-link mr-2"></i>Копировать ссылку
                    </button>
                    <button id="brief-reset" class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">
                        <i class="fas fa-redo mr-2"></i>Заполнить заново
                    </button>
                </div>
            </div>
        `;
        
        // Добавляем обработчики событий для новых элементов
        document.getElementById('brief-download').addEventListener('click', () => {
            this.downloadResult(result);
        });
        
        document.getElementById('brief-copy-link').addEventListener('click', () => {
            this.copyShareableLink();
        });
        
        document.getElementById('brief-reset').addEventListener('click', () => {
            this.resetForm();
        });
    }
    
    /**
     * Копирование ссылки на бриф в буфер обмена
     */
    copyShareableLink() {
        const shareableLink = this.generateShareableLink();
        
        navigator.clipboard.writeText(shareableLink).then(() => {
            // Показываем уведомление об успешном копировании
            this.showNotification('Ссылка скопирована в буфер обмена', 'success');
        }).catch(err => {
            console.error('Не удалось скопировать ссылку: ', err);
            // Показываем уведомление об ошибке
            this.showNotification('Не удалось скопировать ссылку', 'error');
        });
    }
    
    /**
     * Показать уведомление
     */
    showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        const existingNotifications = document.querySelectorAll('.brief-notification');
        existingNotifications.forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = `brief-notification fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-fade-in ${
            type === 'success' ? 'bg-emerald-500 text-white' :
            type === 'error' ? 'bg-rose-500 text-white' :
            type === 'warning' ? 'bg-amber-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        
        const icon = type === 'success' ? 'fa-check-circle' :
                     type === 'error' ? 'fa-exclamation-circle' :
                     type === 'warning' ? 'fa-exclamation-triangle' :
                     'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon} mr-2"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    /**
     * Скачивание результата
     */
    downloadResult(result) {
        const blob = new Blob([result.summary], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brief-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Сброс формы
     */
    resetForm() {
        if (confirm('Вы уверены, что хотите начать заполнение заново? Все данные будут потеряны.')) {
            this.currentStep = 0;
            this.answers = {};
            localStorage.removeItem('briefAnswers');
            this.render();
        }
    }
    
    /**
     * Настройка общих обработчиков событий
     */
    setupEventListeners() {
        // Обработчик для клавиши Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Можно добавить закрытие формы при нажатии Esc
            }
        });
    }
}

/**
 * Инициализация бриф-формы
 */
export function initializeBrief() {
    // Проверяем, что элемент существует на странице
    const container = document.getElementById('brief-container');
    if (!container) {
        console.warn('Контейнер для бриф-формы не найден на странице');
        return;
    }
    
    // Создаем экземпляр бриф-формы
    const briefForm = new BriefForm();
    
    // Импортируем и вызываем расширенные функции
    import('./brief-enhancements.js').then(({ initializeBriefEnhancements }) => {
        initializeBriefEnhancements(briefForm);
    }).catch(error => {
        console.warn('Не удалось загрузить расширенные функции бриф-формы:', error);
    });
    
    // Экспортируем для глобального доступа (для отладки)
    window.briefForm = briefForm;
    
    console.log('✅ Бриф-форма инициализирована');
}

// Экспорт по умолчанию
export default BriefForm;