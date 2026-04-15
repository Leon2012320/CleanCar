// ============================================
// Clean Car – Main Application
// ============================================

import { initNavbar } from './modules/navbar.js';
import { initAnimations } from './modules/animations.js';
import { initCounters } from './modules/counters.js';
import { initContactForm } from './modules/contact.js';
import { initParticles } from './modules/particles.js';
import { initAirflowCanvas } from './modules/airflow.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initAnimations();
    initCounters();
    initContactForm();
    initParticles();
    initAirflowCanvas();
});
