// ============================================
// Cookie Consent Banner
// ============================================

const COOKIE_KEY = 'cleancar_cookie_consent';

function getConsent() {
    return localStorage.getItem(COOKIE_KEY);
}

function setConsent(value) {
    localStorage.setItem(COOKIE_KEY, value);
}

export const initCookies = () => {
    const banner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('cookieAccept');
    const rejectBtn = document.getElementById('cookieReject');

    if (!banner) return;

    // Already answered → don't show
    if (getConsent()) return;

    // Show banner with short delay
    setTimeout(() => banner.classList.add('visible'), 800);

    acceptBtn?.addEventListener('click', () => {
        setConsent('all');
        banner.classList.remove('visible');
    });

    rejectBtn?.addEventListener('click', () => {
        setConsent('essential');
        banner.classList.remove('visible');
    });
};
