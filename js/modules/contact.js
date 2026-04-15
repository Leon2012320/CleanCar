// ============================================
// Contact Form – Validation & Formspree Submission
// ============================================

// Replace with your Formspree form ID after registering at https://formspree.io
const FORMSPREE_URL = 'https://formspree.io/f/YOUR_FORM_ID';

const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const initContactForm = () => {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const statusEl = document.getElementById('formStatus');
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');

    const clearErrors = () => {
        if (nameError) nameError.textContent = '';
        if (emailError) emailError.textContent = '';
    };

    const validate = () => {
        clearErrors();
        let valid = true;

        if (!nameInput?.value.trim()) {
            if (nameError) nameError.textContent = 'Bitte geben Sie Ihren Namen ein.';
            valid = false;
        }

        if (!emailInput?.value.trim() || !validateEmail(emailInput.value.trim())) {
            if (emailError) emailError.textContent = 'Bitte geben Sie eine gültige E-Mail ein.';
            valid = false;
        }

        return valid;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Wird gesendet…';
        }

        const formData = new FormData(form);

        try {
            const response = await fetch(FORMSPREE_URL, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Formspree error: ${response.status}`);
            }

            if (statusEl) {
                statusEl.textContent = 'Vielen Dank! Wir melden uns bald bei Ihnen.';
                statusEl.className = 'form-status success';
            }
            form.reset();
        } catch {
            if (statusEl) {
                statusEl.textContent = 'Fehler beim Senden. Bitte versuchen Sie es erneut.';
                statusEl.className = 'form-status error';
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Nachricht senden';
            }
        }
    });
};
