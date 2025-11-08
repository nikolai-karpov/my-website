/**
 * Navigation System for AI Implementation Playbook Presentation
 * Professional slide navigation with keyboard, scroll, and URL hash support
 */

class PresentationNavigation {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.progressDots = document.querySelectorAll('.progress-dot');
        this.currentSlide = 0;
        this.isAnimating = false;
        this.scrollTimeout = null;
        this.touchStartY = 0;

        this.init();
    }

    init() {
        // Initialize progress indicator
        this.initProgressIndicator();

        // Set up event listeners
        this.initKeyboardNavigation();
        this.initScrollNavigation();
        this.initTouchNavigation();
        this.initHashNavigation();

        // Show initial slide
        this.goToSlide(this.getSlideIndexFromHash() || 0);

        // Preload next slide for smoother transitions
        this.preloadAdjacentSlides();
    }

    initProgressIndicator() {
        const progressContainer = document.getElementById('progress-indicator');
        if (!progressContainer) return;

        // Clear existing dots
        progressContainer.innerHTML = '';

        // Create progress dots with titles
        this.slides.forEach((slide, index) => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            dot.setAttribute('data-slide', index);
            dot.setAttribute('data-title', slide.querySelector('.title-concept')?.textContent || `Slide ${index + 1}`);

            dot.addEventListener('click', () => {
                this.goToSlide(index);
            });

            progressContainer.appendChild(dot);
        });

        this.progressDots = document.querySelectorAll('.progress-dot');
    }

    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.isAnimating) return;

            switch(e.key) {
                case 'ArrowRight':
                case 'PageDown':
                case ' ':
                    e.preventDefault();
                    this.next();
                    break;

                case 'ArrowLeft':
                case 'PageUp':
                    e.preventDefault();
                    this.prev();
                    break;

                case 'Home':
                    e.preventDefault();
                    this.goToSlide(0);
                    break;

                case 'End':
                    e.preventDefault();
                    this.goToSlide(this.slides.length - 1);
                    break;

                case 'Escape':
                    // Close any open modals
                    this.closeAllModals();
                    break;
            }
        });
    }

    initScrollNavigation() {
        let scrollTimeout;

        const handleScroll = (e) => {
            if (this.isAnimating) return;

            // Clear existing timeout
            if (scrollTimeout) clearTimeout(scrollTimeout);

            // Set new timeout
            scrollTimeout = setTimeout(() => {
                const delta = e.deltaY || e.detail || (-e.wheelDelta);

                if (delta > 0) {
                    this.next();
                } else if (delta < 0) {
                    this.prev();
                }
            }, 100);
        };

        // Modern browsers
        document.addEventListener('wheel', handleScroll, { passive: true });

        // Older Firefox
        document.addEventListener('DOMMouseScroll', handleScroll);
    }

    initTouchNavigation() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (this.isAnimating) return;

            const touchEndY = e.changedTouches[0].clientY;
            const diff = this.touchStartY - touchEndY;
            const swipeThreshold = 50;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
        }, { passive: true });
    }

    initHashNavigation() {
        // Update hash when slide changes
        window.addEventListener('hashchange', () => {
            const targetSlide = this.getSlideIndexFromHash();
            if (targetSlide !== null && targetSlide !== this.currentSlide) {
                this.goToSlide(targetSlide);
            }
        });
    }

    getSlideIndexFromHash() {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        const targetSlide = Array.from(this.slides).findIndex(slide =>
        slide.id === hash || slide.getAttribute('data-slug') === hash
        );

        return targetSlide !== -1 ? targetSlide : null;
    }

    updateHash() {
        const currentSlide = this.slides[this.currentSlide];
        const slideId = currentSlide.id;

        if (history.replaceState) {
            history.replaceState(null, null, `#${slideId}`);
        } else {
            window.location.hash = slideId;
        }
    }

    async goToSlide(index) {
        if (this.isAnimating || index < 0 || index >= this.slides.length) {
            return;
        }

        this.isAnimating = true;

        // Get current and target slides
        const currentSlide = this.slides[this.currentSlide];
        const targetSlide = this.slides[index];

        // Calculate direction for animation
        const direction = index > this.currentSlide ? 'next' : 'prev';

        // Add transition classes
        currentSlide.classList.add(`slide-out-${direction}`);
        targetSlide.classList.add(`slide-in-${direction}`, 'active');

        // Wait for animation to complete
        await this.waitForTransition(targetSlide);

        // Clean up classes
        currentSlide.classList.remove('active', `slide-out-${direction}`);
        targetSlide.classList.remove(`slide-in-${direction}`);

        // Update current slide
        this.currentSlide = index;

        // Update UI
        this.updateProgressIndicator();
        this.updateNavButtons();
        this.updateHash();

        // Preload adjacent slides for smoother transitions
        this.preloadAdjacentSlides();

        // Initialize slide-specific interactions
        this.initSlideInteractions(targetSlide);

        this.isAnimating = false;

        // Dispatch custom event
        this.dispatchSlideChangeEvent();
    }

    waitForTransition(element) {
        return new Promise(resolve => {
            const onTransitionEnd = () => {
                element.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            };

            if (this.getTransitionDuration(element) > 0) {
                element.addEventListener('transitionend', onTransitionEnd);
            } else {
                resolve();
            }
        });
    }

    getTransitionDuration(element) {
        const style = window.getComputedStyle(element);
        const duration = parseFloat(style.transitionDuration) || 0;
        const delay = parseFloat(style.transitionDelay) || 0;
        return (duration + delay) * 1000; // Convert to milliseconds
    }

    next() {
        if (this.currentSlide < this.slides.length - 1) {
            this.goToSlide(this.currentSlide + 1);
        } else {
            // Optional: loop to first slide
            // this.goToSlide(0);
        }
    }

    prev() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    updateProgressIndicator() {
        this.progressDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }

    updateNavButtons() {
        const prevBtn = document.querySelector('.nav-btn-prev');
        const nextBtn = document.querySelector('.nav-btn-next');

        if (prevBtn) {
            prevBtn.classList.toggle('disabled', this.currentSlide === 0);
            prevBtn.disabled = this.currentSlide === 0;
        }

        if (nextBtn) {
            const isLastSlide = this.currentSlide === this.slides.length - 1;
            nextBtn.classList.toggle('disabled', isLastSlide);
            nextBtn.disabled = isLastSlide;
            nextBtn.textContent = isLastSlide ? 'Finish' : 'Next';
        }
    }

    preloadAdjacentSlides() {
        const preloadSlides = [];

        if (this.currentSlide > 0) {
            preloadSlides.push(this.currentSlide - 1);
        }
        if (this.currentSlide < this.slides.length - 1) {
            preloadSlides.push(this.currentSlide + 1);
        }

        preloadSlides.forEach(index => {
            const slide = this.slides[index];
            // Force browser to load background images and other resources
            slide.style.contain = 'layout style paint';
        });
    }

    initSlideInteractions(slide) {
        // Initialize interactive elements specific to this slide
        const interactiveElements = slide.querySelectorAll('[data-interactive]');

        interactiveElements.forEach(element => {
            const type = element.getAttribute('data-interactive');

            switch(type) {
                case 'methodology-block':
                    this.initMethodologyBlock(element);
                    break;
                case 'document-icon':
                    this.initDocumentIcon(element);
                    break;
                case 'pipeline-step':
                    this.initPipelineStep(element);
                    break;
            }
        });

        // Initialize any animations for this slide
        this.initSlideAnimations(slide);
    }

    initMethodologyBlock(block) {
        // Hover effects are handled by CSS
        // Additional JavaScript interactions can be added here
    }

    initDocumentIcon(icon) {
        // Click handlers for document icons will be in interactions.js
    }

    initPipelineStep(step) {
        // Pipeline animations will be handled in animations.js
    }

    initSlideAnimations(slide) {
        // Add entrance animations to elements within the slide
        const animatableElements = slide.querySelectorAll('[data-animate]');

        animatableElements.forEach((element, index) => {
            const animationType = element.getAttribute('data-animate') || 'slideInUp';
            const delay = element.getAttribute('data-delay') || index * 100;

            element.style.animationDelay = `${delay}ms`;
            element.classList.add(animationType);
        });
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => modal.classList.remove('active'));
    }

    dispatchSlideChangeEvent() {
        const event = new CustomEvent('slideChange', {
            detail: {
                slideIndex: this.currentSlide,
                slideElement: this.slides[this.currentSlide],
                totalSlides: this.slides.length
            }
        });
        document.dispatchEvent(event);
    }

    // Public API
    getCurrentSlide() {
        return this.currentSlide;
    }

    getTotalSlides() {
        return this.slides.length;
    }

    goToFirstSlide() {
        this.goToSlide(0);
    }

    goToLastSlide() {
        this.goToSlide(this.slides.length - 1);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.presentationNavigation = new PresentationNavigation();

    // Add navigation buttons to DOM if they don't exist
    if (!document.querySelector('.nav-buttons')) {
        const navButtons = document.createElement('div');
        navButtons.className = 'nav-buttons';
        navButtons.innerHTML = `
            <button class="nav-btn nav-btn-prev" aria-label="Previous slide">
                ← Previous
            </button>
            <button class="nav-btn nav-btn-next" aria-label="Next slide">
                Next →
            </button>
        `;
        document.body.appendChild(navButtons);

        // Add event listeners to navigation buttons
        document.querySelector('.nav-btn-prev').addEventListener('click', () => {
            window.presentationNavigation.prev();
        });

        document.querySelector('.nav-btn-next').addEventListener('click', () => {
            window.presentationNavigation.next();
        });
    }
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresentationNavigation;
}