/**
 * Расширенные функции для бриф-формы: поддержка обучения, рабочая группа, интеграция
 * @module briefEnhancements
 */

import { createElement, storage } from './utils.js';

/**
 * Класс для расширенной функциональности бриф-формы
 */
export class BriefEnhancements {
    constructor(briefFormInstance) {
        this.briefForm = briefFormInstance;
        this.currentStep = 1;
        this.totalSteps = 4;
    }

    /**
     * Инициализация расширенных функций
     */
    initialize() {
        console.log('🔧 Инициализация расширенных функций бриф-формы...');
        
        // 1. Добавляем дополнительные шаги в форму
        this.addSupportStep();
        this.addTeamStep();
        this.addIntegrationStep();
        
        // 2. Улучшаем итоговый документ
        this.enhanceFinalDocument();
        
        // 3. Добавляем интеграцию с email
        this.addEmailIntegration();
        
        console.log('✅ Расширенные функции инициализированы');
    }

    /**
     * Добавление шага "Поддержка обучения"
     */
    addSupportStep() {
        const supportQuestions = [
            {
                id: 'support-before',
                title: 'Поддержка до обучения',
                description: 'Какие мероприятия планируются перед началом обучения?',
                type: 'textarea',
                placeholder: 'Например: рассылки с анонсами, вводные вебинары, сбор предварительных вопросов от аудитории...'
            },
            {
                id: 'support-during',
                title: 'Поддержка во время обучения',
                description: 'Как будет организована поддержка в процессе обучения?',
                type: 'textarea',
                placeholder: 'Например: ответы на вопросы в чате, индивидуальные консультации, работа в малых группах...'
            },
            {
                id: 'support-after',
                title: 'Поддержка после обучения',
                description: 'Что планируется для закрепления результатов?',
                type: 'textarea',
                placeholder: 'Например: посттренинговые встречи, напоминания, дополнительные материалы, коучинг...'
            },
            {
                id: 'community',
                title: 'Сообщество и обмен опытом',
                description: 'Как будет организовано общение между участниками?',
                type: 'textarea',
                placeholder: 'Например: закрытый чат в Telegram, форум на корпоративном портале, регулярные митапы...'
            }
        ];

        // Добавляем эти вопросы в существующую форму
        this.addQuestionsToForm('support', supportQuestions, '🎯 Поддержка обучения');
    }

    /**
     * Добавление шага "Рабочая группа и экспертиза"
     */
    addTeamStep() {
        const teamQuestions = [
            {
                id: 'internal-experts',
                title: 'Внутренние эксперты',
                description: 'Кто из ваших сотрудников может выступить экспертом курса?',
                type: 'textarea',
                placeholder: 'ФИО, должность, область экспертизы, доступность (часов в неделю)...'
            },
            {
                id: 'external-experts',
                title: 'Внешняя экспертиза',
                description: 'Требуется ли привлечение внешних экспертов?',
                type: 'select',
                options: [
                    { value: 'yes', label: 'Да, требуется' },
                    { value: 'no', label: 'Нет, справимся своими силами' },
                    { value: 'maybe', label: 'Возможно, зависит от темы' }
                ]
            },
            {
                id: 'external-requirements',
                title: 'Требования к внешним экспертам',
                description: 'Если требуются внешние эксперты, какие к ним требования?',
                type: 'textarea',
                placeholder: 'Опыт работы, подтвержденные кейсы, стоимость, формат участия...',
                condition: 'external-experts:yes,maybe'
            },
            {
                id: 'decision-makers',
                title: 'Принимающие решения',
                description: 'Кто будет принимать окончательное решение по курсу?',
                type: 'textarea',
                placeholder: 'ФИО, должность, контактные данные, зона ответственности...'
            },
            {
                id: 'stakeholders',
                title: 'Заинтересованные стороны',
                description: 'Кто еще должен быть вовлечен в процесс?',
                type: 'textarea',
                placeholder: 'Руководители отделов, HR, технические специалисты, конечные пользователи...'
            }
        ];

        this.addQuestionsToForm('team', teamQuestions, '👥 Рабочая группа и экспертиза');
    }

    /**
     * Добавление шага "Интеграция и материалы"
     */
    addIntegrationStep() {
        const integrationQuestions = [
            {
                id: 'existing-materials',
                title: 'Существующие материалы',
                description: 'Какие материалы уже есть по теме?',
                type: 'textarea',
                placeholder: 'Презентации, инструкции, видео, статьи, внутренние документы...'
            },
            {
                id: 'material-processing',
                title: 'Переработка материалов',
                description: 'Какая требуется обработка существующих материалов?',
                type: 'select',
                options: [
                    { value: 'a', label: 'Основательная переработка (дополнение, систематизация, обновление)' },
                    { value: 'b', label: 'Структурирование по принципам педагогического дизайна' },
                    { value: 'c', label: 'Дополнение примерами и выделение ключевых моментов' },
                    { value: 'd', label: 'Готовый сценарий, требуется только верстка' }
                ]
            },
            {
                id: 'integration-platforms',
                title: 'Платформы для обучения',
                description: 'На каких платформах будет размещен курс?',
                type: 'textarea',
                placeholder: 'Корпоративный портал, LMS (Moodle, iSpring, etc.), Zoom/Teams, собственные системы...'
            },
            {
                id: 'technical-requirements',
                title: 'Технические требования',
                description: 'Есть ли особые технические требования?',
                type: 'textarea',
                placeholder: 'Интеграция с CRM/ERP, мобильная версия, SCORM-пакеты, API доступ...'
            }
        ];

        this.addQuestionsToForm('integration', integrationQuestions, '🔄 Интеграция и материалы');
    }

    /**
     * Добавление вопросов в форму
     */
    addQuestionsToForm(sectionId, questions, sectionTitle) {
        if (!this.briefForm || !this.briefForm.questions) {
            console.warn('Бриф-форма не найдена для расширения');
            return;
        }

        // Создаем новый раздел вопросов
        const section = {
            id: sectionId,
            title: sectionTitle,
            questions: questions
        };

        // Добавляем в массив вопросов
        this.briefForm.questions.push(section);
        
        // Обновляем общее количество шагов
        this.totalSteps = this.briefForm.questions.length;
    }

    /**
     * Улучшение итогового документа
     */
    enhanceFinalDocument() {
        if (!this.briefForm.generateSummary) return;

        // Сохраняем оригинальную функцию
        const originalGenerateSummary = this.briefForm.generateSummary.bind(this.briefForm);
        
        // Переопределяем с улучшениями
        this.briefForm.generateSummary = () => {
            const originalContent = originalGenerateSummary();
            
            // Добавляем расширенные разделы
            const enhancedContent = this.addEnhancedSections(originalContent);
            
            // Добавляем форматирование для email
            const emailReadyContent = this.formatForEmail(enhancedContent);
            
            // Сохраняем улучшенную версию
            storage('brief-enhanced-content', emailReadyContent);
            
            return enhancedContent;
        };
    }

    /**
     * Добавление расширенных разделов в документ
     */
    addEnhancedSections(originalContent) {
        const answers = this.briefForm.getAnswers();
        
        let enhancedContent = originalContent + '\n\n';
        
        enhancedContent += '## 🎯 Поддержка обучения\n\n';
        
        if (answers['support-before']) {
            enhancedContent += `**До обучения:**\n${answers['support-before']}\n\n`;
        }
        
        if (answers['support-during']) {
            enhancedContent += `**Во время обучения:**\n${answers['support-during']}\n\n`;
        }
        
        if (answers['support-after']) {
            enhancedContent += `**После обучения:**\n${answers['support-after']}\n\n`;
        }
        
        if (answers['community']) {
            enhancedContent += `**Сообщество:**\n${answers['community']}\n\n`;
        }
        
        enhancedContent += '## 👥 Рабочая группа и экспертиза\n\n';
        
        if (answers['internal-experts']) {
            enhancedContent += `**Внутренние эксперты:**\n${answers['internal-experts']}\n\n`;
        }
        
        if (answers['external-experts']) {
            const externalLabel = this.getSelectLabel('external-experts', answers['external-experts']);
            enhancedContent += `**Внешняя экспертиза:** ${externalLabel}\n\n`;
        }
        
        if (answers['external-requirements']) {
            enhancedContent += `**Требования к внешним экспертам:**\n${answers['external-requirements']}\n\n`;
        }
        
        if (answers['decision-makers']) {
            enhancedContent += `**Принимающие решения:**\n${answers['decision-makers']}\n\n`;
        }
        
        if (answers['stakeholders']) {
            enhancedContent += `**Заинтересованные стороны:**\n${answers['stakeholders']}\n\n`;
        }
        
        enhancedContent += '## 🔄 Интеграция и материалы\n\n';
        
        if (answers['existing-materials']) {
            enhancedContent += `**Существующие материалы:**\n${answers['existing-materials']}\n\n`;
        }
        
        if (answers['material-processing']) {
            const processingLabel = this.getSelectLabel('material-processing', answers['material-processing']);
            enhancedContent += `**Переработка материалов:** ${processingLabel}\n\n`;
        }
        
        if (answers['integration-platforms']) {
            enhancedContent += `**Платформы для обучения:**\n${answers['integration-platforms']}\n\n`;
        }
        
        if (answers['technical-requirements']) {
            enhancedContent += `**Технические требования:**\n${answers['technical-requirements']}\n\n`;
        }
        
        // Добавляем рекомендации
        enhancedContent += this.generateRecommendations(answers);
        
        return enhancedContent;
    }

    /**
     * Получение метки для select-поля
     */
    getSelectLabel(fieldId, value) {
        const sections = ['support', 'team', 'integration'];
        
        for (const section of sections) {
            const sectionData = this.briefForm.questions.find(q => q.id === section);
            if (sectionData) {
                const question = sectionData.questions.find(q => q.id === fieldId);
                if (question && question.options) {
                    const option = question.options.find(opt => opt.value === value);
                    return option ? option.label : value;
                }
            }
        }
        
        return value;
    }

    /**
     * Генерация рекомендаций на основе ответов
     */
    generateRecommendations(answers) {
        let recommendations = '## 💡 Рекомендации по следующим шагам\n\n';
        
        // Рекомендации по поддержке
        if (!answers['support-before'] || !answers['support-during']) {
            recommendations += '1. **Разработать план поддержки** - рекомендуется создать четкий план поддержки на всех этапах обучения\n';
        }
        
        // Рекомендации по экспертам
        if (answers['external-experts'] === 'yes') {
            recommendations += '2. **Подготовить ТЗ для внешних экспертов** - на основе указанных требований\n';
        }
        
        // Рекомендации по материалам
        if (answers['material-processing'] && ['a', 'b'].includes(answers['material-processing'])) {
            recommendations += '3. **Провести аудит материалов** - перед переработкой рекомендую систематизировать все существующие материалы\n';
        }
        
        recommendations += '\n**Следующие шаги:**\n';
        recommendations += '- Обсудить брифинг с командой (2-3 дня)\n';
        recommendations += '- Подготовить детальное ТЗ на разработку курса (5-7 дней)\n';
        recommendations += '- Согласовать бюджет и сроки (3-5 дней)\n';
        recommendations += '- Начать разработку пилотного модуля (10-14 дней)\n';
        
        return recommendations;
    }

    /**
     * Форматирование контента для email
     */
    formatForEmail(content) {
        // Преобразуем Markdown в простой текст для email
        let emailContent = content
            .replace(/^#+\s+(.*)$/gm, '===== $1 =====')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\n{3,}/g, '\n\n');
        
        return emailContent;
    }

    /**
     * Добавление интеграции с email
     */
    addEmailIntegration() {
        const briefContainer = document.getElementById('brief-container');
        if (!briefContainer) return;
        
        // Добавляем форму подписки
        const subscriptionForm = this.createSubscriptionForm();
        briefContainer.appendChild(subscriptionForm);
        
        // Добавляем кнопку отправки по email
        this.addEmailButton();
    }

    /**
     * Создание формы подписки
     */
    createSubscriptionForm() {
        const form = createElement('div', {
            className: 'mt-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm'
        });
        
        form.innerHTML = `
            <h4 class="text-xl font-bold text-gray-800 mb-4">📧 Получить консультацию</h4>
            <p class="text-gray-600 mb-4">Отправьте заполненный бриф на консультацию с экспертом</p>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Ваше имя</label>
                    <input type="text" id="consultation-name" 
                           class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                           placeholder="Иван Иванов">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email для связи</label>
                    <input type="email" id="consultation-email" 
                           class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                           placeholder="ivan@company.com">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Компания</label>
                    <input type="text" id="consultation-company" 
                           class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                           placeholder="Название компании">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Дополнительные комментарии</label>
                    <textarea id="consultation-comments" rows="3"
                              class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                              placeholder="Что еще важно нам знать?"></textarea>
                </div>
                
                <div class="flex items-center space-x-4">
                    <button id="send-brief-btn" class="btn-primary flex-1">
                        <i class="fas fa-paper-plane mr-2"></i>Отправить бриф на консультацию
                    </button>
                    
                    <button id="schedule-call-btn" class="btn-secondary">
                        <i class="fas fa-calendar mr-2"></i>Запланировать звонок
                    </button>
                </div>
                
                <p class="text-xs text-gray-500 mt-2">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                </p>
            </div>
        `;
        
        // Обработчики событий
        this.setupEmailHandlers(form);
        
        return form;
    }

    /**
     * Настройка обработчиков для email-формы
     */
    setupEmailHandlers(form) {
        const sendBtn = form.querySelector('#send-brief-btn');
        const scheduleBtn = form.querySelector('#schedule-call-btn');
        
        sendBtn.addEventListener('click', () => {
            this.sendBriefByEmail();
        });
        
        scheduleBtn.addEventListener('click', () => {
            this.scheduleConsultationCall();
        });
    }

    /**
     * Добавление кнопки отправки по email
     */
    addEmailButton() {
        const downloadBtn = document.querySelector('#download-brief');
        if (!downloadBtn) return;
        
        const emailBtn = createElement('button', {
            id: 'email-brief',
            className: 'btn-primary flex items-center ml-4',
            innerHTML: '<i class="fas fa-envelope mr-2"></i>Отправить по email'
        });
        
        downloadBtn.parentNode.appendChild(emailBtn);
        
        emailBtn.addEventListener('click', () => {
            this.sendBriefByEmail();
        });
    }

    /**
     * Отправка брифа по email
     */
    sendBriefByEmail() {
        const name = document.getElementById('consultation-name')?.value || '';
        const email = document.getElementById('consultation-email')?.value || '';
        const company = document.getElementById('consultation-company')?.value || '';
        const comments = document.getElementById('consultation-comments')?.value || '';
        
        if (!name || !email) {
            this.showNotification('Пожалуйста, заполните имя и email', 'warning');
            return;
        }
        
        const briefContent = storage('brief-enhanced-content') || this.briefForm.generateSummary();
        
        // Формируем email
        const subject = encodeURIComponent(`Бриф на разработку курса от ${name} (${company})`);
        const body = encodeURIComponent(
            `Контактные данные:\n` +
            `Имя: ${name}\n` +
            `Email: ${email}\n` +
            `Компания: ${company}\n` +
            `Комментарии: ${comments}\n\n` +
            `---\n\n` +
            `${briefContent}\n\n` +
            `---\n` +
            `Сгенерировано через портфолио AI-курса`
        );
        
        // Открываем почтовый клиент
        window.location.href = `mailto:consult@ai-course.example?subject=${subject}&body=${body}`;
        
        this.showNotification('Открывается почтовый клиент для отправки', 'success');
    }

    /**
     * Запланировать консультационный звонок
     */
    scheduleConsultationCall() {
        const name = document.getElementById('consultation-name')?.value || '';
        const email = document.getElementById('consultation-email')?.value || '';
        const company = document.getElementById('consultation-company')?.value || '';
        
        if (!name || !email) {
            this.showNotification('Для записи на звонок заполните имя и email', 'warning');
            return;
        }
        
        // Перенаправляем на страницу записи (пример)
        const calLink = `https://calendly.com/ai-course-consult/30min?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&company=${encodeURIComponent(company)}`;
        window.open(calLink, '_blank');
        
        this.showNotification('Открывается страница для записи на звонок', 'success');
    }

    /**
     * Показать уведомление
     */
    showNotification(message, type = 'info') {
        // Удаляем предыдущие уведомления
        const existingNotifications = document.querySelectorAll('.brief-notification');
        existingNotifications.forEach(el => el.remove());
        
        const notification = createElement('div', {
            className: `brief-notification fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-fade-in ${
                type === 'success' ? 'bg-emerald-500 text-white' :
                type === 'error' ? 'bg-rose-500 text-white' :
                type === 'warning' ? 'bg-amber-500 text-white' :
                'bg-blue-500 text-white'
            }`
        });
        
        const icon = type === 'success' ? 'fa-check-circle' :
                     type === 'error' ? 'fa-exclamation-circle' :
                     type === 'warning' ? 'fa-exclamation-triangle' :
                     'fa-info-circle';
        
        notification.innerHTML = `
            <i class="fas ${icon} mr-2"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

/**
 * Инициализация расширенных функций
 * @param {Object} briefFormInstance - Экземпляр бриф-формы
 */
export function initializeBriefEnhancements(briefFormInstance) {
    const enhancements = new BriefEnhancements(briefFormInstance);
    enhancements.initialize();
    return enhancements;
}

export default {
    BriefEnhancements,
    initializeBriefEnhancements
};