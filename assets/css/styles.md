Проанализировав предоставленные HTML-файлы, я составил полный список используемых CSS-классов.

Этот список послужит основой для архитектуры SCSS. Я разбил их на логические категории, чтобы облегчить миграцию в модульную структуру (например, 7-1 Pattern).

### 1. Глобальные слои и Layout (Layout & Base)
Классы, отвечающие за сетку, общую структуру и сквозные элементы.
*   `body.loading`
*   `.container`
*   `.main-header` / `.header-container`
*   `.main-footer` / `.footer-content` / `.footer-bottom`
*   `.preloader` / `.preloader-content`
*   `.mobile-overlay`

### 2. Типографика и Утилиты (Abstracts & Utilities)
Классы для текста и вспомогательные модификаторы (часть из них похожа на Bootstrap/Tailwind).
*   `.gradient-text`
*   `.text-center`
*   `.title-line`
*   `.subtitle`
*   `.mb-0`, `.mb-2`, `.mb-3`, `.mb-4`, `.mb-5`, `.mt-3` (Spacing utilities)
*   `.d-block`, `.d-inline-block`
*   `.flex`, `.items-center`, `.justify-center`, `.gap-2` (Flex utilities)

### 3. UI Компоненты (Components)
Повторяющиеся элементы интерфейса.

**Кнопки:**
*   `.cta-button` (и модификаторы: `.primary`, `.secondary`, `.large`)
*   `.btn`, `.btn-primary`, `.btn-large` (Обнаружена неконсистентность: используются и `cta-button`, и `btn`)
*   `.view-all-button`
*   `.submit-btn` / `.form-button`

**Карточки (Базовые и вариации):**
*   `.card` (используется в report.html и methodology.html)
*   `.floating-card` (модификаторы: `.card-1`, `.card-2`, `.card-3`)
*   `.card--competency` (БЭМ-стиль: `.card__icon`, `.card__description`, `.card__details`, `.card__features`, `.card__metric`, `.card__metric-value`, `.card__metric-label`)
*   `.case-card` (модификаторы: `.featured`, элементы: `.case-image`, `.case-badge`, `.case-content`, `.case-client`, `.case-description`, `.case-link`)

**Навигация:**
*   `.logo`
*   `.desktop-nav`
*   `.hamburger` / `.hamburger-line`
*   `.mobile-footer-menu` / `.mobile-nav` / `.mobile-nav-item`
*   `.footer-nav`
*   `.social-links` / `.social-link`
*   `.back-to-top`

**Формы:**
*   `.form-group`
*   `.form-note`
*   `.lead-form`
*   `.contact-form`
*   `.contact-field`

**Анимации:**
*   `.neural-network-animation` / `.neuron`
*   `.image-glow`

### 4. Блоки конкретных страниц (Pages)

**Главная (Index) - Hero:**
*   `.hero-section`
*   `.hero-background`
*   `.hero-container`, `.hero-content`, `.hero-visual`
*   `.hero-badge`, `.hero-title`, `.hero-subtitle`
*   `.hero-stats` (`.stat`, `.stat-number`, `.stat-label`)
*   `.profile-image`

**Секция компетенций:**
*   `.competencies-section`
*   `.competencies-grid`

**Лид-магнит:**
*   `.lead-magnet-section` / `.lead-magnet-card`
*   `.lead-content` / `.lead-badge` / `.lead-description`
*   `.lead-visual` / `.document-preview` (`.page`, `.page-1`, `.page-2`, `.page-3`)
*   `.benefits-list`

**Секция конверсии (CTA):**
*   `.conversion-section` / `.conversion-card`
*   `.conversion-content` / `.conversion-subtitle`
*   `.conversion-benefits` (`.benefit`)
*   `.conversion-actions` / `.conversion-meta` (`.meta-item`)

**Страница Методологии (Timeline):**
*   `.methodology-hero`
*   `.timeline-section` / `.timeline`
*   `.timeline-item` / `.timeline-marker` / `.timeline-content`
*   `.stage-number`, `.timeline-duration`
*   `.proof-link`
*   `.prompt-magnet-box`

**Страница Контактов:**
*   `.contact-hero`
*   `.contact-grid` / `.contact-info`
*   `.contact-methods` (`.contact-icon`, `.contact-details`)
*   `.availability`
*   `.faq-section` / `.faq-grid` / `.faq-item`

**Страница Результатов:**
*   `.results-hero`
*   `.stats-highlight` (`.highlight-item`, `.highlight-number`, `.highlight-label`)
*   `.dashboard-section` / `.dashboard-grid` / `.dashboard-card`
*   `.metric-icon`, `.metric-value`, `.metric-label`, `.metric-description`
*   `.progress-bar` / `.progress-fill`
*   `.calculator-section` / `.calculator-container` / `.calculator-grid` / `.calculator-result`
*   `.download-section` / `.download-card` / `.download-icon`

**Страницы Кейсов (Construction, Procurement):**
*   `.case-hero` / `.case-hero-content`
*   `.client-info`
*   `.key-metrics` / `.metric-card` / `.metric-item`
*   `.case-details`
*   `.case-section` (`.section-sidebar`, `.section-badge`, `.section-content`)
*   `.tech-stack` / `.tech-item`
*   `.process-flow` / `.flow-steps` / `.flow-step`
*   `.feature-list` / `.feature-icon`
*   `.proofs-section` / `.proofs-grid` / `.proof-card` / `.proof-list`
*   `.file-icon`, `.file-type`, `.file-description`, `.file-meta`

**Report (Tailwind + Custom):**
*   Замечены конфликты имен: `.hero-section`, `.card`.
*   Уникальные классы: `.cost-highlight`, `.toc-fixed`, `.toc-link`, `.data-table`, `.comparison-grid`, `.comparison-card`.

---