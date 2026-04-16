// ============================================
// Auth – Firebase Registration, Login, Email Verification
// ============================================

import {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    updateProfile,
    getFirebaseError,
} from './firebase-config.js';

let currentUser = null;

const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ---------- UI update ----------

function updateUI() {
    const loginBtn = document.getElementById('authLoginBtn');
    const registerBtn = document.getElementById('authRegisterBtn');
    const userInfo = document.getElementById('authUserInfo');
    const userName = document.getElementById('authUserName');

    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = currentUser.displayName || currentUser.email;
    } else {
        if (loginBtn) loginBtn.style.display = '';
        if (registerBtn) registerBtn.style.display = '';
        if (userInfo) userInfo.style.display = 'none';
    }

    // Update purchase buttons
    document.querySelectorAll('.pricing-card .btn').forEach(btn => {
        btn.removeEventListener('click', handlePurchaseClick);
        btn.addEventListener('click', handlePurchaseClick);
    });
}

function handlePurchaseClick(e) {
    if (!currentUser) {
        e.preventDefault();
        openModal('login');
        showModalMessage('Bitte melden Sie sich an, um ein Auto zu bestellen.', 'error');
    } else if (!currentUser.emailVerified) {
        e.preventDefault();
        openModal('login');
        showModalMessage('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.', 'error');
    }
}

// ---------- Modal ----------

export function openModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.add('active');
    switchTab(tab);
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    clearModalErrors();
}

function switchTab(tab) {
    const loginTab = document.getElementById('authTabLogin');
    const registerTab = document.getElementById('authTabRegister');
    const loginForm = document.getElementById('authLoginForm');
    const registerForm = document.getElementById('authRegisterForm');

    clearModalErrors();

    if (tab === 'login') {
        loginTab?.classList.add('active');
        registerTab?.classList.remove('active');
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
    } else {
        loginTab?.classList.remove('active');
        registerTab?.classList.add('active');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
    }
}

function clearModalErrors() {
    const msg = document.getElementById('authMessage');
    if (msg) { msg.textContent = ''; msg.className = 'auth-message'; }
}

function showModalMessage(text, type = 'error') {
    const msg = document.getElementById('authMessage');
    if (msg) {
        msg.textContent = text;
        msg.className = `auth-message ${type}`;
    }
}

// ---------- Form handlers ----------

async function handleRegister(e) {
    e.preventDefault();
    clearModalErrors();

    const name = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const password2 = document.getElementById('regPassword2')?.value;

    if (!name) { showModalMessage('Bitte geben Sie Ihren Namen ein.'); return; }
    if (!email || !validateEmail(email)) { showModalMessage('Bitte geben Sie eine gültige E-Mail ein.'); return; }
    if (!password || password.length < 8) { showModalMessage('Passwort muss mindestens 8 Zeichen lang sein.'); return; }
    if (password !== password2) { showModalMessage('Passwörter stimmen nicht überein.'); return; }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird erstellt…'; }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await sendEmailVerification(userCredential.user);
        // Sign out – user must verify email before logging in
        await signOut(auth);
        showModalMessage('Account erstellt! Bitte prüfen Sie Ihre E-Mails und bestätigen Sie Ihre Adresse.', 'success');
        e.target.reset();
    } catch (error) {
        showModalMessage(getFirebaseError(error));
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Registrieren'; }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    clearModalErrors();

    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !validateEmail(email)) { showModalMessage('Bitte geben Sie eine gültige E-Mail ein.'); return; }
    if (!password) { showModalMessage('Bitte geben Sie Ihr Passwort ein.'); return; }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird eingeloggt…'; }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
            showModalMessage('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Prüfen Sie Ihren Posteingang.', 'error');
            await signOut(auth);
            return;
        }
        // onAuthStateChanged handles the rest
        closeModal();
    } catch (error) {
        showModalMessage(getFirebaseError(error));
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Einloggen'; }
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch { /* ignore */ }
}

// ---------- Init ----------

export const initAuth = () => {
    // Modal close
    document.getElementById('authModalClose')?.addEventListener('click', closeModal);
    document.getElementById('authModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'authModal') closeModal();
    });

    // Tabs
    document.getElementById('authTabLogin')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('authTabRegister')?.addEventListener('click', () => switchTab('register'));

    // Forms
    document.getElementById('authLoginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('authRegisterForm')?.addEventListener('submit', handleRegister);

    // Navbar buttons
    document.getElementById('authLoginBtn')?.addEventListener('click', () => openModal('login'));
    document.getElementById('authRegisterBtn')?.addEventListener('click', () => openModal('register'));
    document.getElementById('authLogoutBtn')?.addEventListener('click', handleLogout);

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Firebase auth state listener – fires on login, logout, and page load
    onAuthStateChanged(auth, (user) => {
        if (user && user.emailVerified) {
            currentUser = user;
        } else {
            currentUser = null;
        }
        updateUI();
    });
};

export const isLoggedIn = () => !!currentUser;
