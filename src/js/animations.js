// ==============================================================================
// 60FPS SMOOTH ANIMATIONS, PARTICLES, TILT & INTERACTION ENGINE
// High-performance, pauses when tab is hidden or prefers-reduced-motion is active
// ==============================================================================

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const escHtml = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Initializes the particle constellation canvas in the background.
 * Performance: fewer nodes on phones / low-core devices, ~30fps on phones, and the loop
 * sleeps entirely while neither the hero nor a dark section (where the canvas is visible) is on screen.
 */
export function initConstellationCanvas(canvasId = '#bgCanvas') {
  const canvas = document.querySelector(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const small = window.innerWidth < 768;
  const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
  const N = small ? 20 : lowPower ? 28 : 45;
  const mouse = { x: -999, y: -999 };
  let W, H;
  const particles = [];

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    W = window.innerWidth;
    H = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < N; i++) {
    particles.push({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45 });
  }

  const updateMouse = (x, y) => {
    mouse.x = x;
    mouse.y = y;
  };
  window.addEventListener('mousemove', (ev) => updateMouse(ev.clientX, ev.clientY), { passive: true });
  window.addEventListener('touchmove', (ev) => updateMouse(ev.touches[0].clientX, ev.touches[0].clientY), { passive: true });
  window.addEventListener('touchend', () => updateMouse(-999, -999));

  if (reducedMotion()) return;

  // Only animate while a section that shows the canvas is visible
  let visibleCount = 0;
  const watched = document.querySelectorAll('#hero, section.dk');
  if ('IntersectionObserver' in window && watched.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.__vis = e.isIntersecting;
      });
      visibleCount = [...watched].filter((el) => el.__vis).length;
    });
    watched.forEach((el) => io.observe(el));
  } else {
    visibleCount = 1;
  }

  let animId;
  let frame = 0;
  function animate() {
    animId = requestAnimationFrame(animate);
    if (document.hidden || visibleCount === 0) return;
    if (small && (frame++ & 1)) return; // ~30fps on phones

    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      if (Math.hypot(dx, dy) < 160) {
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
      const mouseDist = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (mouseDist < 150) {
        ctx.strokeStyle = `rgba(167,139,250,${(1 - mouseDist / 150) * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(34,211,238,0.85)';
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = small ? 0 : 8;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  animate();

  return () => cancelAnimationFrame(animId);
}

/**
 * Scramble text cyber glyph hacker decoding animation
 * Supports numbered prefixes (.pfx) and triggers staggered 3D character wave flips
 */
const GLYPHS = '01/<>#*✦_~';

export function scrambleText(el) {
  if (!el) return;

  // Check for prefix span (.pfx) like '01 //'
  const pfxEl = el.querySelector('.pfx');
  const pfxText = pfxEl ? pfxEl.textContent.trim() : '';

  // Extract raw text to decode
  const fullRaw = el.dataset.rawText || (el.dataset.rawText = el.textContent.trim());
  const textToDecode = pfxText && fullRaw.startsWith(pfxText)
    ? fullRaw.slice(pfxText.length).trim()
    : (pfxEl ? el.textContent.replace(pfxEl.textContent, '').trim() : fullRaw);

  if (reducedMotion()) {
    el.innerHTML = (pfxText ? `<span class="pfx">${escHtml(pfxText)}</span> ` : '') + escHtml(textToDecode);
    return;
  }

  const t0 = performance.now();
  const duration = 650; // ms

  function step(now) {
    const progress = Math.min(1, (now - t0) / duration);
    const decodedLen = Math.floor(progress * textToDecode.length);

    const scrambled = [...textToDecode]
      .map((c, i) => {
        if (c === ' ') return ' ';
        if (i < decodedLen) return c;
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      })
      .join('');

    const prefixHtml = pfxText ? `<span class="pfx">${pfxText}</span> ` : '';

    if (progress < 1) {
      el.innerHTML = prefixHtml + scrambled;
      requestAnimationFrame(step);
    } else {
      // Completed decode: wrap characters in .fc for staggered 3D wave flip
      const flipChars = [...textToDecode]
        .map((c, i) => `<span class="fc" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`)
        .join('');
      el.innerHTML = prefixHtml + flipChars;
    }
  }

  requestAnimationFrame(step);
}

/**
 * Typewriter ticker effect with leading-edge cyber glyph flash and flowing gradient text
 */
export function startTypewriter(el, phrases) {
  if (!el || !phrases || phrases.length === 0) return;
  const token = ++startTypewriter.tok;
  let phraseIdx = 0;

  // Reduced motion: no typing/glyph effects, just calmly rotate the finished phrases.
  if (reducedMotion()) {
    const show = () => {
      if (token !== startTypewriter.tok) return;
      el.innerHTML = `<span class="typ-txt">${escHtml(phrases[phraseIdx % phrases.length])}</span>`;
      phraseIdx++;
      setTimeout(show, 3500);
    };
    show();
    return;
  }

  let charIdx = 0;
  let isDeleting = false;

  function tick() {
    if (token !== startTypewriter.tok) return;
    if (document.hidden) {
      setTimeout(tick, 400); // do nothing while the tab is in the background
      return;
    }
    const current = phrases[phraseIdx % phrases.length];

    charIdx += isDeleting ? -1 : 1;
    const displayed = current.slice(0, charIdx);

    const randomGlyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    const glyphFlash = !isDeleting && charIdx < current.length ? `<span class="typ-flash gf" aria-hidden="true">${escHtml(randomGlyph)}</span>` : '';

    el.innerHTML = `<span class="typ-txt">${escHtml(displayed)}</span>${glyphFlash}<i class="typ-cursor" aria-hidden="true"></i>`;

    let delay = isDeleting ? 32 : 68;
    if (!isDeleting && charIdx === current.length) {
      isDeleting = true;
      delay = 1800;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      phraseIdx++;
      delay = 380;
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
  if (!button || reducedMotion()) return;
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
  if (reducedMotion() || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

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
