document.addEventListener('DOMContentLoaded', () => {
    // Анимация плавающих карточек
    gsap.to(".floating-card.card-1", {
        y: -20,
        x: 10,
        rotation: 2,
        duration: 3,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true
    });

    gsap.to(".floating-card.card-2", {
        y: 25,
        x: -15,
        rotation: -3,
        duration: 3.5,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.5
    });

    gsap.to(".floating-card.card-3", {
        y: -15,
        x: 20,
        rotation: 1,
        duration: 4,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1
    });

    // Анимация изображения профиля и свечения
    gsap.to(".profile-image", {
        y: 10,
        rotation: 0.5,
        duration: 4,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true
    });

    gsap.to(".image-glow", {
        scale: 1.05,
        opacity: 0.8,
        duration: 4,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true
    });
});