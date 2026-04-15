// ============================================
// Scroll Animations (IntersectionObserver)
// ============================================

export const initAnimations = () => {
    const animatedElements = document.querySelectorAll('[data-animate]');
    const specFills = document.querySelectorAll('.spec-fill');

    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = [...el.parentElement.children].indexOf(el) * 100;
                    setTimeout(() => el.classList.add('animated'), delay);
                    observer.unobserve(el);
                }
            }
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    for (const el of animatedElements) {
        observer.observe(el);
    }

    // Spec bars
    const specObserver = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const fill = entry.target;
                    const width = fill.dataset.width ?? '50';
                    setTimeout(() => {
                        fill.style.width = `${width}%`;
                    }, 200);
                    specObserver.unobserve(fill);
                }
            }
        },
        { threshold: 0.5 }
    );

    for (const fill of specFills) {
        specObserver.observe(fill);
    }
};
