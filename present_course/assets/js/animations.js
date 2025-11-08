/**
 * Advanced Animation System for AI Implementation Playbook
 * Professional animations with performance optimization
 */

class PresentationAnimations {
    constructor() {
        this.observer = null;
        this.animatedElements = new Set();
        this.scrollEffects = new Map();

        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.initScrollAnimations();
        this.initParallaxEffects();
        this.initStaggerAnimations();
        this.initMagneticEffects();
        this.initGradientAnimations();

        // Listen for slide changes to trigger animations
        document.addEventListener('slideChange', (e) => {
            this.handleSlideChange(e.detail);
        });
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

    initScrollAnimations() {
        // Advanced scroll-triggered animations
        this.scrollEffects.set('neuralNetwork', this.createNeuralNetworkAnimation());
        this.scrollEffects.set('gradientShift', this.createGradientShiftAnimation());
        this.scrollEffects.set('particleSystem', this.createParticleSystem());
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
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            this.initNeuralNodes();
        };

        this.initNeuralNodes = () => {
            nodes = [];
            connections = [];

            const nodeCount = Math.floor((canvas.width * canvas.height) / 20000);

            for (let i = 0; i < nodeCount; i++) {
                nodes.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.1
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw nodes
            nodes.forEach(node => {
                node.x += node.vx;
                node.y += node.vy;

                // Bounce off edges
                if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
                if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

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

                    if (distance < 150) {
                        const opacity = 1 - (distance / 150);
                        ctx.beginPath();
                        ctx.moveTo(nodeA.x, nodeA.y);
                        ctx.lineTo(nodeB.x, nodeB.y);
                        ctx.strokeStyle = `rgba(74, 144, 226, ${opacity * 0.2})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            animationId = requestAnimationFrame(animate);
        };

        // Handle scroll to show/hide neural network
        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const scrollY = window.scrollY;
            const scrollDelta = Math.abs(scrollY - lastScrollY);

            if (scrollDelta > 5) {
                canvas.style.opacity = '0.3';
            } else {
                canvas.style.opacity = '0';
            }

            lastScrollY = scrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', resizeCanvas);

        resizeCanvas();
        animate();

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
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
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

    createParticleSystem() {
        // Simplified particle system for background effects
        return {
            activate: (element) => {
                const particles = [];
                const particleCount = 30;

                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.cssText = `
                        position: absolute;
                        width: 4px;
                        height: 4px;
                        background: var(--color-primary-500);
                        border-radius: 50%;
                        pointer-events: none;
                        opacity: 0;
                    `;

                    element.appendChild(particle);
                    particles.push({
                        element: particle,
                        x: Math.random() * 100,
                        y: Math.random() * 100,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        life: 1
                    });
                }

                const animateParticles = () => {
                    particles.forEach(particle => {
                        particle.x += particle.vx;
                        particle.y += particle.vy;
                        particle.life -= 0.01;

                        if (particle.life <= 0) {
                            particle.x = Math.random() * 100;
                            particle.y = Math.random() * 100;
                            particle.life = 1;
                        }

                        particle.element.style.left = `${particle.x}%`;
                        particle.element.style.top = `${particle.y}%`;
                        particle.element.style.opacity = particle.life;
                        particle.element.style.transform = `scale(${particle.life})`;
                    });

                    requestAnimationFrame(animateParticles);
                };

                animateParticles();
            }
        };
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

                const strength = 10;

                element.style.transform = `translate(${deltaX * strength}px, ${deltaY * strength}px)`;
            });

            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translate(0, 0)';
            });
        });
    }

    initGradientAnimations() {
        // Animated gradient backgrounds
        const animateGradient = () => {
            const hueRotation = (Date.now() / 20000) % 360;
            document.documentElement.style.setProperty(
                '--gradient-rotation',
                `${hueRotation}deg`
            );
            requestAnimationFrame(animateGradient);
        };

        // Only animate on specific slides
        document.addEventListener('slideChange', (e) => {
            const shouldAnimate = e.detail.slideElement.classList.contains('animate-gradient');
            if (shouldAnimate) {
                animateGradient();
            }
        });
    }

    handleSlideChange(detail) {
        const { slideElement, slideIndex } = detail;

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
            case 'title-screen':
                this.animateTitleScreen(slide);
                break;
            case 'solution':
                this.animateMethodologyDiagram(slide);
                break;
            case 'case-2-pipeline':
                this.animatePipelineSequence(slide);
                break;
            case 'creation-process':
                this.animateProcessSteps(slide);
                break;
        }
    }

    animateTitleScreen(slide) {
        // Title screen entrance animation
        const title = slide.querySelector('.title-header');
        const subtitle = slide.querySelector('.title-subheader');
        const concept = slide.querySelector('.title-concept');

        if (title) {
            title.style.animation = 'titleEntrance 1.2s var(--ease-bounce) both';
        }
        if (subtitle) {
            subtitle.style.animation = 'subtitleEntrance 1s var(--ease-out) 0.3s both';
        }
        if (concept) {
            concept.style.animation = 'conceptEntrance 0.8s var(--ease-out) 0.6s both';
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
        // Auto-animate pipeline on slide entry
        setTimeout(() => {
            if (window.presentationInteractions) {
                window.presentationInteractions.animatePipeline();
            }
        }, 1000);
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
}

// Additional CSS animations
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

@keyframes subtitleEntrance {
    0% {
        opacity: 0;
        transform: translateY(30px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes conceptEntrance {
    0% {
        opacity: 0;
        transform: translateY(20px) rotateX(90deg);
    }
    100% {
        opacity: 1;
        transform: translateY(0) rotateX(0);
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
    background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
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
}
`;

// Inject animation styles
const animationStyleSheet = document.createElement('style');
animationStyleSheet.textContent = animationStyles;
document.head.appendChild(animationStyleSheet);

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.presentationAnimations = new PresentationAnimations();
});