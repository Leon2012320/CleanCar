// ============================================
// Contact Form – Validation & Server Submission
// ============================================

import { isLoggedIn, openModal } from './auth.js';

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

        // Require login to send a message
        if (!isLoggedIn()) {
            if (statusEl) {
                statusEl.textContent = 'Bitte melden Sie sich an, um eine Nachricht zu senden.';
                statusEl.className = 'form-status error';
            }
            openModal('login');
            return;
        }

        if (!validate()) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Wird gesendet…';
        }

        const payload = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            model: form.querySelector('#model')?.value || '',
            message: form.querySelector('#message')?.value || '',
        };

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                if (statusEl) {
                    statusEl.textContent = result.message || 'Vielen Dank! Wir melden uns bald bei Ihnen.';
                    statusEl.className = 'form-status success';
                }
                form.reset();
            } else if (response.status === 401) {
                if (statusEl) {
                    statusEl.textContent = 'Bitte melden Sie sich an, um eine Nachricht zu senden.';
                    statusEl.className = 'form-status error';
                }
                openModal('login');
            } else {
                throw new Error(result.error || result.errors?.join(' ') || 'Fehler');
            }
        } catch (err) {
            if (statusEl) {
                statusEl.textContent = err.message || 'Fehler beim Senden. Bitte versuchen Sie es erneut.';
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
