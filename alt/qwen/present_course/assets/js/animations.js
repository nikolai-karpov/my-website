/**
 * Advanced Animation System for AI Implementation Playbook
 * Professional animations with performance optimization
 * UPDATED: Синхронизирован с текущими CSS-классами и ID
 */

class PresentationAnimations {
    constructor() {
        this.observer = null;
        this.animatedElements = new Set();
        this.scrollEffects = new Map();
        this.currentSlideIndex = 0;

        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.initSlideAnimations();
        this.initParallaxEffects();
        this.initStaggerAnimations();
        this.initMagneticEffects();
        this.initGradientAnimations();

        // Listen for slide changes to trigger animations
        document.addEventListener('slideChange', (e) => {
            this.handleSlideChange(e.detail);
        });

        // Инициализация при загрузке
        this.initializeCurrentSlide();
    }

    initializeCurrentSlide() {
        // Находим активный слайд при загрузке
        const activeSlide = document.querySelector('.slide.active');
        if (activeSlide) {
            const slideId = activeSlide.id;
            const slideIndex = parseInt(slideId.replace('slide-', '').split('-')[0]) - 1;
            this.currentSlideIndex = slideIndex;
            this.triggerSlideAnimations(activeSlide, slideIndex);
        }
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '50px 0px',
            threshold: this.calculateThresholds()
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateOnScroll(entry.target);
                }
            });
        }, options);

        // Observe all animatable elements
        document.querySelectorAll('[data-animate]').forEach(el => {
            this.observer.observe(el);
        });
    }

    calculateThresholds() {
        const thresholds = [];
        for (let i = 0; i <= 1.0; i += 0.01) {
            thresholds.push(i);
        }
        return thresholds;
    }

    animateOnScroll(element) {
        if (this.animatedElements.has(element)) return;

        const animationType = element.getAttribute('data-animate');
        const delay = element.getAttribute('data-delay') || 0;
        const duration = element.getAttribute('data-duration') || 800;

        element.style.animationDelay = `${delay}ms`;
        element.style.animationDuration = `${duration}ms`;

        // Add animation class
        element.classList.add(animationType);

        // Mark as animated
        this.animatedElements.add(element);

        // Clean up after animation
        setTimeout(() => {
            element.style.animationDelay = '';
            element.style.animationDuration = '';
        }, duration + parseInt(delay));
    }

    initSlideAnimations() {
        // Добавляем data-атрибуты для анимации существующих элементов

        // Методология блоки
        const methodologyBlocks = document.querySelectorAll('.methodology-block');
        methodologyBlocks.forEach((block, index) => {
            block.setAttribute('data-animate', 'blockEntrance');
            block.setAttribute('data-delay', index * 200);
        });

        // Шаги пайплайна
        const pipelineSteps = document.querySelectorAll('.pipeline-step');
        pipelineSteps.forEach((step, index) => {
            step.setAttribute('data-animate', 'slideInUp');
            step.setAttribute('data-delay', index * 150);
        });

        // Карточки результатов
        const resultItems = document.querySelectorAll('.result-item');
        resultItems.forEach((item, index) => {
            item.setAttribute('data-animate', 'fadeIn');
            item.setAttribute('data-delay', index * 100);
        });

        // Процесс-степы
        const processSteps = document.querySelectorAll('.process-step');
        processSteps.forEach((step, index) => {
            step.setAttribute('data-animate', 'processStepEntrance');
            step.setAttribute('data-delay', index * 200);
        });

        // Колонки проблем
        const problemColumns = document.querySelectorAll('.problem-column');
        problemColumns.forEach((column, index) => {
            column.setAttribute('data-animate', 'slideInUp');
            column.setAttribute('data-delay', index * 150);
        });
    }

    createNeuralNetworkAnimation() {
        const canvas = document.createElement('canvas');
        canvas.className = 'neural-network-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1';
        canvas.style.opacity = '0';
        canvas.style.transition = 'opacity 1s var(--ease-smooth)';

        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let nodes = [];
        let connections = [];
        let animationId = null;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = window.innerHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            this.initNeuralNodes();
        };

        this.initNeuralNodes = () => {
            nodes = [];
            connections = [];

            const nodeCount = Math.floor((canvas.width * canvas.height) / 200000);

            for (let i = 0; i < nodeCount; i++) {
                nodes.push({
                    x: Math.random() * canvas.width / window.devicePixelRatio,
                    y: Math.random() * canvas.height / window.devicePixelRatio,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.4 + 0.1
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

            // Update and draw nodes
            nodes.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;

                // Bounce off edges
                if (node.x < 0 || node.x > canvas.width / window.devicePixelRatio) node.vx *= -1;
                if (node.y < 0 || node.y > canvas.height / window.devicePixelRatio) node.vy *= -1;

                // Draw node
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(74, 144, 226, ${node.opacity})`;
                ctx.fill();
            });

            // Draw connections
            nodes.forEach((nodeA, i) => {
                nodes.forEach((nodeB, j) => {
                    if (i >= j) return;

                    const dx = nodeA.x - nodeB.x;
                    const dy = nodeA.y - nodeB.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        const opacity = (1 - (distance / 100)) * 0.1;
                        ctx.beginPath();
                        ctx.moveTo(nodeA.x, nodeA.y);
                        ctx.lineTo(nodeB.x, nodeB.y);
                        ctx.strokeStyle = `rgba(74, 144, 226, ${opacity})`;
                        ctx.lineWidth = 0.3;
                        ctx.stroke();
                    }
                });
            });

            animationId = requestAnimationFrame(animate);
        };

        // Handle scroll to show/hide neural network
        let lastScrollY = window.scrollY;
        let timeoutId = null;

        const handleScroll = () => {
            if (timeoutId) clearTimeout(timeoutId);

            const scrollY = window.scrollY;
            const scrollDelta = Math.abs(scrollY - lastScrollY);

            if (scrollDelta > 2) {
                canvas.style.opacity = '0.2';
                timeoutId = setTimeout(() => {
                    canvas.style.opacity = '0';
                }, 1000);
            }

            lastScrollY = scrollY;
        };

        // Only activate on specific slides
        const shouldActivate = () => {
            const currentSlide = document.querySelector('.slide.active');
            return currentSlide && (
            currentSlide.id === 'slide-01-title' ||
            currentSlide.id === 'slide-03-solution' ||
            currentSlide.id === 'slide-09-meta'
            );
        };

        const updateActivation = () => {
            if (shouldActivate()) {
                canvas.style.display = 'block';
                if (!animationId) {
                    resizeCanvas();
                    animate();
                }
            } else {
                canvas.style.display = 'none';
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', resizeCanvas);
        document.addEventListener('slideChange', updateActivation);

        updateActivation();

        return {
            destroy: () => {
                if (animationId) cancelAnimationFrame(animationId);
                window.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', resizeCanvas);
                canvas.remove();
            }
        };
    }

    createGradientShiftAnimation() {
        let currentSlide = 0;

        const updateGradient = (slideIndex) => {
            const gradients = [
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            ];

            document.documentElement.style.setProperty(
                '--gradient-dynamic',
                gradients[slideIndex % gradients.length]
            );
        };

        document.addEventListener('slideChange', (e) => {
            currentSlide = e.detail.slideIndex;
            updateGradient(currentSlide);
        });

        updateGradient(0);
    }

    initParallaxEffects() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        parallaxElements.forEach(element => {
            const speed = parseFloat(element.getAttribute('data-parallax-speed')) || 0.5;

            const updateParallax = () => {
                const rect = element.getBoundingClientRect();
                const scrollPercent = (window.scrollY - rect.top) / window.innerHeight;
                const yPos = scrollPercent * speed * 100;

                element.style.transform = `translateY(${yPos}px)`;
            };

            // Throttled scroll handler
            let ticking = false;
            const onScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        updateParallax();
                        ticking = false;
                    });
                    ticking = true;
                }
            };

            window.addEventListener('scroll', onScroll, { passive: true });
            updateParallax();
        });
    }

    initStaggerAnimations() {
        // Stagger animations for lists and grids
        document.addEventListener('slideChange', (e) => {
            const slide = e.detail.slideElement;
            const staggerElements = slide.querySelectorAll('[data-stagger]');

            staggerElements.forEach((container, containerIndex) => {
                const items = container.children;
                const staggerDelay = parseInt(container.getAttribute('data-stagger-delay')) || 100;

                Array.from(items).forEach((item, index) => {
                    item.style.animationDelay = `${(containerIndex * 200) + (index * staggerDelay)}ms`;
                    item.classList.add('stagger-item');
                });
            });
        });
    }

    initMagneticEffects() {
        // Magnetic button effects
        const magneticElements = document.querySelectorAll('[data-magnetic]');

        magneticElements.forEach(element => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;

                const strength = 15;

                element.style.transform = `translate(${deltaX * strength}px, ${deltaY * strength}px)`;
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translate(0, 0)';
            });
        });

        // Добавляем магнитный эффект к CTA кнопкам
        const ctaButtons = document.querySelectorAll('.btn--primary');
        ctaButtons.forEach(button => {
            button.setAttribute('data-magnetic', 'true');
        });
    }

    initGradientAnimations() {
        // Animated gradient backgrounds for specific slides
        const animateGradient = (element) => {
            let hueRotation = 0;

            const animate = () => {
                hueRotation = (hueRotation + 0.1) % 360;
                element.style.background = `linear-gradient(${hueRotation}deg, #667eea, #764ba2, #4facfe, #00f2fe)`;
                element.style.backgroundSize = '400% 400%';

                if (element.isConnected) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        };

        // Apply to specific slides
        document.addEventListener('slideChange', (e) => {
            const slide = e.detail.slideElement;

            if (slide.id === 'slide-01-title') {
                const titleSlide = document.getElementById('slide-01-title');
                if (titleSlide) {
                    animateGradient(titleSlide);
                }
            }
        });
    }

    handleSlideChange(detail) {
        const { slideElement, slideIndex } = detail;
        this.currentSlideIndex = slideIndex;

        // Reset animations for new slide
        this.animatedElements.clear();

        // Trigger slide-specific animations
        this.triggerSlideAnimations(slideElement, slideIndex);

        // Re-observe elements for scroll animations
        setTimeout(() => {
            slideElement.querySelectorAll('[data-animate]').forEach(el => {
                if (this.observer) {
                    this.observer.observe(el);
                }
            });
        }, 100);
    }

    triggerSlideAnimations(slide, index) {
        // Slide-specific animation triggers
        switch(slide.id) {
            case 'slide-01-title':
                this.animateTitleScreen(slide);
                break;
            case 'slide-03-solution':
                this.animateMethodologyDiagram(slide);
                break;
            case 'slide-05-case-2':
                this.animatePipelineSequence(slide);
                break;
            case 'slide-09-meta':
                this.animateProcessSteps(slide);
                break;
        }
    }

    animateTitleScreen(slide) {
        // Title screen entrance animation
        const title = slide.querySelector('.title-header');
        const description = slide.querySelector('.hero-description');
        const concept = slide.querySelector('.title-concept');
        const statsGrid = slide.querySelector('.stats-grid');

        if (title) {
            title.style.animation = 'titleEntrance 1.2s var(--ease-bounce) both';
        }
        if (description) {
            description.style.animation = 'fadeIn 1s var(--ease-out) 0.3s both';
        }
        if (concept) {
            concept.style.animation = 'fadeIn 0.8s var(--ease-out) 0.6s both';
        }
        if (statsGrid) {
            statsGrid.style.animation = 'slideInUp 0.8s var(--ease-out) 0.8s both';
        }
    }

    animateMethodologyDiagram(slide) {
        const diagram = slide.querySelector('.methodology-diagram');
        if (!diagram) return;

        // Animate blocks sequentially
        const blocks = diagram.querySelectorAll('.methodology-block');
        blocks.forEach((block, index) => {
            setTimeout(() => {
                block.style.animation = `blockEntrance 0.8s var(--ease-bounce) both`;
            }, index * 300);
        });

        // Animate connectors
        const connectors = diagram.querySelectorAll('.methodology-connector');
        connectors.forEach((connector, index) => {
            setTimeout(() => {
                connector.style.animation = `connectorDraw 0.5s var(--ease-out) both`;
            }, (blocks.length * 300) + (index * 200));
        });
    }

    animatePipelineSequence(slide) {
        const pipeline = slide.querySelector('.pipeline-diagram');
        if (!pipeline) return;

        // Auto-animate pipeline on slide entry
        setTimeout(() => {
            this.animatePipelineStepByStep(pipeline);
        }, 1000);
    }

    animatePipelineStepByStep(pipeline) {
        const steps = pipeline.querySelectorAll('.pipeline-step');
        const arrows = pipeline.querySelectorAll('.pipeline-arrow');

        pipeline.classList.add('animating');

        // Animate steps sequentially
        steps.forEach((step, index) => {
            setTimeout(() => {
                step.classList.add('active');

                // Animate corresponding arrow
                if (arrows[index]) {
                    arrows[index].style.opacity = '1';
                    arrows[index].style.background = 'var(--gradient-primary)';
                }
            }, index * 600);
        });

        // Reset animation after completion
        setTimeout(() => {
            steps.forEach(step => step.classList.remove('active'));
            arrows.forEach(arrow => {
                arrow.style.opacity = '';
                arrow.style.background = '';
            });
            pipeline.classList.remove('animating');
        }, steps.length * 600 + 1000);
    }

    animateProcessSteps(slide) {
        const steps = slide.querySelectorAll('.process-step');
        steps.forEach((step, index) => {
            setTimeout(() => {
                step.style.animation = `processStepEntrance 0.6s var(--ease-out) both`;
            }, index * 400);
        });
    }

    // Utility methods
    debounce(func, wait) {
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

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Public method to trigger pipeline animation manually
    triggerPipelineAnimation() {
        const currentSlide = document.querySelector('.slide.active');
        if (currentSlide && currentSlide.id === 'slide-05-case-2') {
            const pipeline = currentSlide.querySelector('.pipeline-diagram');
            if (pipeline) {
                this.animatePipelineStepByStep(pipeline);
            }
        }
    }
}

// Additional CSS animations for injection
const animationStyles = `
@keyframes titleEntrance {
    0% {
        opacity: 0;
        transform: translateY(50px) scale(0.9);
    }
    60% {
        transform: translateY(-10px) scale(1.02);
    }
    100% {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes blockEntrance {
    0% {
        opacity: 0;
        transform: translateY(40px) rotateY(20deg);
    }
    100% {
        opacity: 1;
        transform: translateY(0) rotateY(0);
    }
}

@keyframes connectorDraw {
    0% {
        transform: scaleX(0);
        opacity: 0;
    }
    100% {
        transform: scaleX(1);
        opacity: 1;
    }
}

@keyframes processStepEntrance {
    0% {
        opacity: 0;
        transform: translateX(-30px);
    }
    100% {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes gradientShift {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}

.animate-gradient {
    background: linear-gradient(-45deg, #667eea, #764ba2, #4facfe, #00f2fe);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
}

.stagger-item {
    animation: staggerEntrance 0.6s var(--ease-out) both;
}

@keyframes staggerEntrance {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Magnetic effect base */
[data-magnetic] {
    transition: transform 0.3s var(--ease-smooth);
    will-change: transform;
}

/* Animation classes for data-animate attribute */
.slideInUp {
    animation: slideInUp 0.6s var(--ease-out) both;
}

.fadeIn {
    animation: fadeIn 0.8s var(--ease-out) both;
}

.blockEntrance {
    animation: blockEntrance 0.8s var(--ease-bounce) both;
}

/* Performance optimizations */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }

    [data-animate] {
        animation: none !important;
        transition: none !important;
    }
}

/* Neural network canvas */
.neural-network-canvas {
    pointer-events: none;
    position: fixed;
    z-index: -1;
}

/* Existing keyframes that должны быть в CSS */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
`;

// Inject animation styles
const animationStyleSheet = document.createElement('style');
animationStyleSheet.textContent = animationStyles;
document.head.appendChild(animationStyleSheet);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for slides to load
    setTimeout(() => {
        window.presentationAnimations = new PresentationAnimations();

        // Start neural network animation if on title slide
        const activeSlide = document.querySelector('.slide.active');
        if (activeSlide && activeSlide.id === 'slide-01-title') {
            window.presentationAnimations.createNeuralNetworkAnimation();
        }
    }, 500);
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresentationAnimations;
}