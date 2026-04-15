// ============================================
// Airflow Canvas Animation (How It Works)
// ============================================

export const initAirflowCanvas = () => {
    const canvas = document.getElementById('airflowCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
            canvas.width = Math.min(rect.width, 800);
            canvas.height = 300;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const PARTICLE_COUNT = 80;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: Math.random() * 2 + 0.5,
            vy: (Math.random() - 0.5) * 0.8,
            radius: Math.random() * 2.5 + 1,
            opacity: Math.random() * 0.5 + 0.2,
        });
    }

    // Draw a simplified tank
    const drawTank = () => {
        ctx.save();
        ctx.strokeStyle = 'rgba(78, 205, 196, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(30, 80, 100, 140, 20);
        ctx.stroke();

        ctx.fillStyle = 'rgba(78, 205, 196, 0.08)';
        ctx.fill();

        ctx.fillStyle = 'rgba(78, 205, 196, 0.7)';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('300 bar', 80, 155);

        ctx.fillStyle = 'rgba(78, 205, 196, 0.4)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('Druckluft-Tank', 80, 175);
        ctx.restore();
    };

    // Draw simplified engine
    const drawEngine = () => {
        ctx.save();
        const cx = canvas.width - 120;

        ctx.strokeStyle = 'rgba(78, 205, 196, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx - 50, 80, 100, 140, 20);
        ctx.stroke();

        ctx.fillStyle = 'rgba(78, 205, 196, 0.08)';
        ctx.fill();

        ctx.fillStyle = 'rgba(78, 205, 196, 0.7)';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Motor', cx, 155);

        ctx.fillStyle = 'rgba(78, 205, 196, 0.4)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('Expansion', cx, 175);
        ctx.restore();
    };

    // Arrow in the middle
    const drawArrow = () => {
        ctx.save();
        const midX = canvas.width / 2;
        const midY = 150;

        ctx.strokeStyle = 'rgba(78, 205, 196, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(140, midY);
        ctx.lineTo(canvas.width - 180, midY);
        ctx.stroke();

        // Arrow head
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(78, 205, 196, 0.5)';
        ctx.beginPath();
        ctx.moveTo(canvas.width - 180, midY - 8);
        ctx.lineTo(canvas.width - 165, midY);
        ctx.lineTo(canvas.width - 180, midY + 8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(78, 205, 196, 0.5)';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Komprimierte Luft →', midX, midY - 16);
        ctx.restore();
    };

    let animFrame;
    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawTank();
        drawArrow();
        drawEngine();

        // Animate particles flowing from left to right
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            // Reset when out of bounds
            if (p.x > canvas.width + 10) {
                p.x = -10;
                p.y = Math.random() * canvas.height;
            }
            if (p.y < 0 || p.y > canvas.height) {
                p.vy *= -1;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(78, 205, 196, ${p.opacity})`;
            ctx.fill();
        }

        animFrame = requestAnimationFrame(animate);
    };

    // Only run animation when visible
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    animate();
                } else {
                    cancelAnimationFrame(animFrame);
                }
            }
        },
        { threshold: 0.1 }
    );
    observer.observe(canvas);
};
