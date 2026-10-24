// ==============================================================================
// 60FPS SMOOTH ANIMATIONS, PARTICLES, TILT & INTERACTION ENGINE
// High-performance, pauses when tab is hidden or prefers-reduced-motion is active
// ==============================================================================

/**
 * Initializes the particle constellation canvas in the background
 */
export function initConstellationCanvas(canvasId = '#bgCanvas') {
  const canvas = document.querySelector(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const N = 45;
  const mouse = { x: -999, y: -999 };
  let W, H;
  const particles = [];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = window.innerWidth;
    H = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < N; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
    });
  }

  const updateMouse = (x, y) => {
    mouse.x = x;
    mouse.y = y;
  };
  window.addEventListener('mousemove', (ev) => updateMouse(ev.clientX, ev.clientY), { passive: true });
  window.addEventListener('touchmove', (ev) => updateMouse(ev.touches[0].clientX, ev.touches[0].clientY), { passive: true });
  window.addEventListener('touchend', () => updateMouse(-999, -999));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  let animId;
  function animate() {
    if (!document.hidden) {
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 160) {
          p.vx += dx * 0.00008;
          p.vy += dy * 0.00008;
        }

        p.vx *= 0.999;
        p.vy *= 0.999;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }

      // Draw connection lines between nearby particles
      for (let i = 0; i < N; i++) {
        const a = particles[i];
        for (let j = i + 1; j < N; j++) {
          const b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(34,211,238,${(1 - dist / 120) * 0.32})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // Draw mouse connection lines
        const mouseDist = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (mouseDist < 150) {
          ctx.strokeStyle = `rgba(167,139,250,${(1 - mouseDist / 150) * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        // Draw particle dot with cyan glow
        ctx.fillStyle = 'rgba(34,211,238,0.85)';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(a.x, a.y, 1.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    animId = requestAnimationFrame(animate);
  }
  animate();

  return () => cancelAnimationFrame(animId);
}

/**
 * Scramble text hacker decoding animation
 */
const GLYPHS = '01/<>#*✦_~';
export function scrambleText(el) {
  if (!el) return;
  const final = el.dataset.f || (el.dataset.f = el.textContent);
  const t0 = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - t0) / 700);
    el.textContent = [...final]
      .map((c, i) =>
        c === ' ' || i < progress * final.length
          ? c
          : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      )
      .join('');

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.innerHTML = [...final]
        .map((c, i) => `<span class="fc" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`)
        .join('');
    }
  }
  requestAnimationFrame(step);
}

/**
 * Typewriter ticker effect with blinking cursor
 */
export function startTypewriter(el, phrases) {
  if (!el || !phrases || phrases.length === 0) return;
  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let activeToken = ++startTypewriter.tok;

  function tick() {
    if (activeToken !== startTypewriter.tok) return;
    const current = phrases[phraseIdx % phrases.length];

    charIdx += isDeleting ? -1 : 1;
    const displayed = current.slice(0, charIdx);
    const cursor = `<b class="gf">${GLYPHS[Math.floor(Math.random() * GLYPHS.length)]}</b>`;

    el.innerHTML =
      displayed +
      (!isDeleting && charIdx < current.length ? cursor : '') +
      '<i></i>';

    let delay = isDeleting ? 35 : 70;

    if (!isDeleting && charIdx === current.length) {
      isDeleting = true;
      delay = 1400; // Hold at full text
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      phraseIdx++;
      delay = 350; // Pause before typing next
    }

    setTimeout(tick, delay);
  }
  tick();
}
startTypewriter.tok = 0;

/**
 * Confetti celebration burst on form submission
 */
export function burstConfetti(button) {
  if (!button) return;
  const rect = button.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const colors = ['#22d3ee', '#34d399', '#a78bfa', '#fff'];

  for (let i = 0; i < 40; i++) {
    const conf = document.createElement('i');
    conf.className = 'cf';
    conf.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % 4]}`;
    document.body.appendChild(conf);

    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 160;

    conf
      .animate(
        [
          { transform: 'translate(0,0) rotate(0)', opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist + 60}px) rotate(${Math.random() * 720}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 900 + Math.random() * 700,
          easing: 'cubic-bezier(.2,.8,.3,1)',
        }
      )
      .onfinish = () => conf.remove();
  }
}

/**
 * Click ripple effect
 */
export function initClickRipple() {
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  window.addEventListener('mousedown', (ev) => {
    // Only fire on background or buttons without blocking
    const ripple = document.createElement('i');
    ripple.className = 'rip';
    ripple.style.left = ev.clientX + 'px';
    ripple.style.top = ev.clientY + 'px';
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
}
