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
    const moreInfoBtn = document.getElementById('cookieMoreInfo');
    const detailsEl = document.getElementById('cookieDetails');

    if (!banner) return;

    // Already answered → don't show
    if (getConsent()) return;

    // Show banner with short delay
    setTimeout(() => banner.classList.add('visible'), 800);

    moreInfoBtn?.addEventListener('click', () => {
        if (!detailsEl) return;
        const isHidden = detailsEl.hasAttribute('hidden');
        if (isHidden) {
            detailsEl.removeAttribute('hidden');
            moreInfoBtn.setAttribute('aria-expanded', 'true');
        } else {
            detailsEl.setAttribute('hidden', '');
            moreInfoBtn.setAttribute('aria-expanded', 'false');
        }
    });

    acceptBtn?.addEventListener('click', () => {
        setConsent('all');
        banner.classList.remove('visible');
    });

    rejectBtn?.addEventListener('click', () => {
        setConsent('essential');
        banner.classList.remove('visible');
    });
};
