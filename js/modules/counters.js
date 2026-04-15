// ============================================
// Animated Number Counters
// ============================================

export const initCounters = () => {
    const counters = document.querySelectorAll('[data-target]');

    const animateValue = (el, target) => {
        const duration = 2000;
        const startTime = performance.now();
        const format = (n) => n.toLocaleString('de-DE');

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - (1 - progress) ** 3;
            const current = Math.round(eased * target);
            el.textContent = format(current);

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };
        requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.target, 10);
                    animateValue(el, target);
                    observer.unobserve(el);
                }
            }
        },
        { threshold: 0.5 }
    );

    for (const counter of counters) {
        observer.observe(counter);
    }
};
