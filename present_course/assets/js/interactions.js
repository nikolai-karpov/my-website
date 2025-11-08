/**
 * Interactive Elements Manager
 * Handles hover effects, modal windows, and user interactions
 */

class PresentationInteractions {
    constructor() {
        this.modals = new Map();
        this.currentModal = null;

        this.init();
    }

    init() {
        this.initMethodologyHoverEffects();
        this.initDocumentClickHandlers();
        this.initPipelineInteractions();
        this.initTooltipSystem();
        this.initSmoothScrolling();
    }

    // Methodology Diagram Hover Effects
    initMethodologyHoverEffects() {
        const methodologyBlocks = document.querySelectorAll('.methodology-block');

        methodologyBlocks.forEach(block => {
            const tools = block.getAttribute('data-tools');
            if (!tools) return;

            // Create tooltip element
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = `Tools: ${tools}`;
            block.appendChild(tooltip);

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
            });

            block.addEventListener('touchend', (e) => {
                e.preventDefault();
                setTimeout(() => {
                    this.animateMethodologyBlock(block, 'leave');
                }, 2000);
            });
        });
    }

    animateMethodologyBlock(block, action) {
        if (action === 'enter') {
            block.style.transform = 'translateY(-15px) scale(1.05)';
            block.style.zIndex = '10';

            // Animate connector lines
            const connectors = document.querySelectorAll('.methodology-connector');
            connectors.forEach(connector => {
                connector.style.background = 'var(--gradient-primary)';
                connector.style.transform = 'scaleX(1.2)';
            });

        } else {
            block.style.transform = '';
            block.style.zIndex = '';

            // Reset connectors
            const connectors = document.querySelectorAll('.methodology-connector');
            connectors.forEach(connector => {
                connector.style.background = '';
                connector.style.transform = '';
            });
        }
    }

    // Document Icon Click Handlers
    initDocumentClickHandlers() {
        const documentIcons = document.querySelectorAll('.document-icon');

        documentIcons.forEach(icon => {
            icon.addEventListener('click', (e) => {
                e.preventDefault();

                const documentType = icon.getAttribute('data-document');
                const promptExample = icon.getAttribute('data-prompt');
                const modalContent = icon.getAttribute('data-modal-content');

                this.openDocumentModal(documentType, promptExample, modalContent);
            });

            // Keyboard accessibility
            icon.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    icon.click();
                }
            });

            // Add focus styles for accessibility
            icon.setAttribute('tabindex', '0');
            icon.setAttribute('role', 'button');
            icon.setAttribute('aria-label', `View prompt for ${icon.getAttribute('data-document')}`);
        });
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
        modal.className = 'modal';
        modal.id = modalId;

        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" aria-label="Close modal">×</button>
                <div class="modal-header">
                    <h3>AI Prompt Example: ${documentType}</h3>
                </div>
                <div class="modal-body">
                    <div class="prompt-example">
                        <div class="prompt-header">
                            <span class="prompt-badge">PROMPT</span>
                            <button class="copy-prompt-btn" data-prompt="${promptExample.replace(/"/g, '&quot;')}">
                                Copy
                            </button>
                        </div>
                        <pre class="prompt-code"><code>${promptExample}</code></pre>
                    </div>
                    ${modalContent ? `
                    <div class="modal-additional-content">
                        <h4>Additional Context</h4>
                        <p>${modalContent}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <p class="modal-note">This prompt demonstrates how AI can extract structured information from unstructured documents</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modals.set(modalId, modal);

        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const copyBtn = modal.querySelector('.copy-prompt-btn');

        closeBtn.addEventListener('click', () => this.hideModal(modalId));
        copyBtn.addEventListener('click', () => this.copyPromptToClipboard(promptExample));

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
    }

    showModal(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        // Hide any currently open modal
        if (this.currentModal) {
            this.hideModal(this.currentModal);
        }

        modal.classList.add('active');
        this.currentModal = modalId;

        // Focus trap
        this.setupFocusTrap(modal);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        modal.classList.remove('active');
        this.currentModal = null;

        // Restore body scroll
        document.body.style.overflow = '';

        // Remove focus trap
        this.removeFocusTrap();
    }

    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            this.firstFocusableElement = focusableElements[0];
            this.lastFocusableElement = focusableElements[focusableElements.length - 1];

            this.firstFocusableElement.focus();

            modal.addEventListener('keydown', this.handleFocusTrap.bind(this));
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
            modal.removeEventListener('keydown', this.handleFocusTrap);
        }
    }

    async copyPromptToClipboard(promptText) {
        try {
            await navigator.clipboard.writeText(promptText);

            // Visual feedback
            const copyBtn = document.querySelector('.copy-prompt-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = 'var(--color-primary-700)';

            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);

        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            this.fallbackCopyPrompt(promptText);
        }
    }

    fallbackCopyPrompt(promptText) {
        const textArea = document.createElement('textarea');
        textArea.value = promptText;
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            console.log('Prompt copied to clipboard');
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }

        document.body.removeChild(textArea);
    }

    // Pipeline Interactions
    initPipelineInteractions() {
        const pipelineDiagram = document.querySelector('.pipeline-diagram');
        if (!pipelineDiagram) return;

        pipelineDiagram.addEventListener('click', () => {
            this.animatePipeline();
        });

        // Auto-animate when slide becomes active
        document.addEventListener('slideChange', (e) => {
            if (e.detail.slideElement.id === 'case-2-pipeline') {
                setTimeout(() => {
                    this.animatePipeline();
                }, 1000);
            }
        });
    }

    animatePipeline() {
        const pipeline = document.querySelector('.pipeline-diagram');
        const steps = pipeline.querySelectorAll('.pipeline-step');
        const arrows = pipeline.querySelectorAll('.pipeline-arrow');

        pipeline.classList.add('animating');

        // Animate steps sequentially
        steps.forEach((step, index) => {
            setTimeout(() => {
                step.classList.add('active');

                // Animate corresponding arrow
                if (arrows[index]) {
                    arrows[index].style.animationDelay = `${index * 300}ms`;
                }
            }, index * 600);
        });

        // Reset animation after completion
        setTimeout(() => {
            steps.forEach(step => step.classList.remove('active'));
            pipeline.classList.remove('animating');
        }, steps.length * 600 + 1000);
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
        });
    }

    showTooltip(element, text) {
        // Remove existing tooltip
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = text;

        document.body.appendChild(tooltip);

        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        tooltip.style.transform = 'translateX(-50%)';

        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
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
                const targetSlide = document.getElementById(targetId);

                if (targetSlide) {
                    const slideIndex = Array.from(this.slides || document.querySelectorAll('.slide'))
                        .findIndex(slide => slide.id === targetId);

                    if (slideIndex !== -1 && window.presentationNavigation) {
                        window.presentationNavigation.goToSlide(slideIndex);
                    }
                }
            }
        });
    }
}

// Initialize interactions when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.presentationInteractions = new PresentationInteractions();
});

// CSS for dynamically created elements
const dynamicStyles = `
.custom-tooltip {
    position: fixed;
    background: var(--color-background-dark);
    color: var(--color-text-invert);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    white-space: nowrap;
    z-index: var(--z-tooltip);
    pointer-events: none;
    animation: tooltipFadeIn 0.2s var(--ease-out);
}

@keyframes tooltipFadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.prompt-example {
    background: var(--color-background-dark);
    border-radius: var(--border-radius);
    overflow: hidden;
    margin-bottom: var(--spacing-md);
}

.prompt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid var(--color-border);
}

.prompt-badge {
    background: var(--gradient-primary);
    color: var(--color-text-invert);
    padding: 2px 8px;
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.copy-prompt-btn {
    background: var(--color-primary-500);
    color: var(--color-text-invert);
    border: none;
    padding: 4px 12px;
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    cursor: pointer;
    transition: var(--motion-default);
}

.copy-prompt-btn:hover {
    background: var(--color-primary-700);
    transform: translateY(-1px);
}

.prompt-code {
    padding: var(--spacing-md);
    margin: 0;
    background: transparent;
    color: var(--color-text-invert);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    white-space: pre-wrap;
    overflow-x: auto;
}

.modal-additional-content {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
}

.modal-additional-content h4 {
    margin-bottom: var(--spacing-sm);
    color: var(--color-text-main);
}

.modal-note {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-style: italic;
    text-align: center;
    margin: 0;
}
`;

// Inject dynamic styles
const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);