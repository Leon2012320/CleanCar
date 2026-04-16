// ============================================
// Clean Car – Main Application
// ============================================

import { initNavbar } from './modules/navbar.js';
import { initAnimations } from './modules/animations.js';
import { initCounters } from './modules/counters.js';
import { initContactForm } from './modules/contact.js';
import { initParticles } from './modules/particles.js';
import { initAirflowCanvas } from './modules/airflow.js';
import { initLightbox } from './modules/lightbox.js';
import { initAuth } from './modules/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initAnimations();
    initCounters();
    initParticles();
    initAirflowCanvas();
    initLightbox();
    initAuth();
    initContactForm();
});
