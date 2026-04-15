// ============================================
// Floating Particles (Hero Background)
// ============================================

export const initParticles = () => {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const PARTICLE_COUNT = 35;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 4 + 2;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 10;
        const opacity = Math.random() * 0.3 + 0.05;

        Object.assign(particle.style, {
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: `rgba(78, 205, 196, ${opacity})`,
            left: `${x}%`,
            top: `${y}%`,
            animation: `particleFloat ${duration}s ease-in-out ${delay}s infinite alternate`,
            pointerEvents: 'none',
        });

        container.appendChild(particle);
    }

    // Inject keyframes once
    if (!document.getElementById('particleKeyframes')) {
        const style = document.createElement('style');
        style.id = 'particleKeyframes';
        style.textContent = `
            @keyframes particleFloat {
                0% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(${randomDrift()}px, ${randomDrift()}px) scale(1.2); }
                100% { transform: translate(${randomDrift()}px, ${randomDrift()}px) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }
};

const randomDrift = () => Math.round((Math.random() - 0.5) * 60);
