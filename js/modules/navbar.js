// ============================================
// Navbar – Scroll & Mobile Toggle
// ============================================

export const initNavbar = () => {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const links = navLinks?.querySelectorAll('a') ?? [];

    // Scroll effect
    const handleScroll = () => {
        navbar?.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Mobile toggle
    navToggle?.addEventListener('click', () => {
        navLinks?.classList.toggle('open');
    });

    // Close mobile menu on link click
    for (const link of links) {
        link.addEventListener('click', () => {
            navLinks?.classList.remove('open');
        });
    }

    // Active link tracking
    const sections = document.querySelectorAll('section[id]');
    const updateActiveLink = () => {
        const scrollY = window.scrollY + 120;
        for (const section of sections) {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = navLinks?.querySelector(`a[href="#${id}"]`);
            if (scrollY >= top && scrollY < top + height) {
                links.forEach(l => l.classList.remove('active'));
                link?.classList.add('active');
            }
        }
    };
    window.addEventListener('scroll', updateActiveLink, { passive: true });
};
