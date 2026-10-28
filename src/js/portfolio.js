// ==============================================================================
// PUBLIC PORTFOLIO RENDERER & INTERACTION CONTROLLER
// ==============================================================================
import { apiClient } from './api-client.js';
import { ICONS, SOCIAL_ICONS, SOCIAL_GLOW, DEFAULT_PORTFOLIO_DATA } from './data-default.js';
import { startTypewriter, scrambleText, burstConfetti, reducedMotion } from './animations.js';
import { renderBrandLogo } from './brand-logo.js';
import { esc, marqueeHtml, leadHtml, pillarsHtml, skillsHtml, timelineHtml, projectsHtml } from './templates.js';
import { openDialog } from './a11y.js';
import { mountTurnstile } from './turnstile.js';

export { esc };

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v, d) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? d : Number(v));

// Typography presets. Only the default pair is loaded up-front; others load on demand.
export const FONT_PRESETS = {
  'Cyber Geometric': ['Syne', 'JetBrains Mono', 'Instrument Serif'],
  'Editorial Tech': ['Space Grotesk', 'JetBrains Mono', 'Instrument Serif'],
  'Ultra Modern': ['Outfit', 'Fira Code', 'Instrument Serif'],
  'Brutalist Neo': ['Syne', 'Fira Code', 'Instrument Serif'],
  'Minimalist Geometric': ['Outfit', 'JetBrains Mono', 'Instrument Serif'],
};
const BASE_FONTS = new Set(['Syne', 'JetBrains Mono', 'Instrument Serif']);
const FONT_QUERY = {
  'Space Grotesk': 'Space+Grotesk:wght@500;700',
  Outfit: 'Outfit:wght@600;800',
  'Fira Code': 'Fira+Code:wght@500;700',
};

const THEMES = ['Alternating Contrast', 'Full Cyber Dark', 'Full Clean Light'];
const THEME_KEY = 'jk_theme';
const THEME_ICONS = [
  '<circle cx="12" cy="12" r="9"/><path fill="currentColor" d="M12 3a9 9 0 000 18z"/>',
  '<path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/>',
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
];
const DEFAULT_PHOTO = '/images/profile.png';
const BG_MAP = {
  'Dark Cyber Glow': 'radial-gradient(circle at 50% 35%,#1e293b,#090d16)',
  'Transparent / None': 'transparent',
  'Frosted Glass': 'rgba(255,255,255,.14)',
  'Light Slate': '#e2e8f0',
};

const readTheme = () => {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return THEMES.includes(t) ? t : null;
  } catch {
    return null;
  }
};

export class PortfolioApp {
  /** @param {{admin?: boolean}} opts admin:true = data/helpers only (used by the /admin page) */
  constructor(opts = {}) {
    this.opts = opts;
    this.data = DEFAULT_PORTFOLIO_DATA;
    this.themeIdx = 0;
    this.io = null;
    this._started = false;
    this._fonts = new Set();
  }

  async init() {
    // Admin page: only (re)load data; no public DOM to render.
    if (this.opts.admin) {
      await this.refresh();
      return;
    }

    if (!this._started) {
      this._started = true;
      // 1. Make the page interactive FIRST so nothing depends on the network.
      this.initIntersectionObserver();
      this.bind();
      // 2. Paint instantly with bundled data, then upgrade if the live data differs.
      this.render();
      const live = await apiClient.getPortfolio();
      if (live && live.profile) {
        this.data = live;
        this.render(); // unchanged sections are skipped, so nothing flashes or replays
      }
      return;
    }

    await this.refresh();
    this.render();
  }

  async refresh() {
    const live = await apiClient.getPortfolio({ fresh: true });
    if (live && live.profile) this.data = live;
  }

  showToast(message, isError = false) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('on');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('on'), 3500);
  }

  // ---------------------------------------------------------------- icons
  getSkillIcon(iconValue, skillName) {
    const val = (iconValue || '').trim();
    if (/^<svg/i.test(val)) {
      // Custom SVG icons are sanitised client-side too (DOMPurify loads on demand; most visitors never need it)
      if (this.purify) {
        const clean = this.purify.sanitize(val, { USE_PROFILES: { svg: true, svgFilters: true } });
        if (clean) return clean;
      } else {
        this.loadPurify();
      }
    } else if (/^(https?:\/\/|\/(?!\/)|data:image\/(png|jpe?g|webp|gif);base64,)/i.test(val)) {
      return `<img alt="" src="${esc(val)}" loading="lazy" decoding="async">`;
    }
    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ICONS[slug]) return ICONS[slug];
    const nameSlug = (skillName || '').toLowerCase().replace(/c\+\+/g, 'cpp').replace(/[^a-z0-9]/g, '');
    if (ICONS[nameSlug]) return ICONS[nameSlug];
    return `<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#334155"/><text x="24" y="31" text-anchor="middle" font-size="18" font-weight="800" fill="#e2e8f0" font-family="Arial,sans-serif">${esc((skillName || '?').slice(0, 2))}</text></svg>`;
  }

  loadPurify() {
    if (this._purifyLoading) return;
    this._purifyLoading = true;
    import('dompurify').then((m) => {
      this.purify = m.default;
      const sk = $('#sk');
      if (sk) sk._h = null; // force the skills grid to re-render with sanitised icons
      this.render();
    });
  }

  getSocialIcon(iconValue) {
    const v = (iconValue || 'website').toLowerCase();
    return SOCIAL_ICONS[v] || SOCIAL_ICONS.website;
  }

  // ---------------------------------------------------------------- look & feel
  ensureFonts(fonts) {
    for (const f of fonts) {
      if (BASE_FONTS.has(f) || this._fonts.has(f) || !FONT_QUERY[f]) continue;
      this._fonts.add(f);
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${FONT_QUERY[f]}&display=swap`;
      document.head.appendChild(link);
    }
  }

  applyFont(fontName) {
    const fonts = FONT_PRESETS[fontName] || FONT_PRESETS['Cyber Geometric'];
    this.ensureFonts(fonts);
    const style = document.documentElement.style;
    style.setProperty('--d', `'${fonts[0]}', sans-serif`);
    style.setProperty('--m', `'${fonts[1]}', monospace`);
    style.setProperty('--s', `'${fonts[2]}', Georgia, serif`);
    style.setProperty('--b', "'Manrope', system-ui, -apple-system, sans-serif");
  }

  /** Saved visitor choice > admin-chosen theme (if not the default) > visitor's OS dark mode > default. */
  resolveTheme(profileTheme) {
    const saved = readTheme();
    if (saved) return saved;
    if (profileTheme && profileTheme !== THEMES[0] && THEMES.includes(profileTheme)) return profileTheme;
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return THEMES[1];
    return THEMES.includes(profileTheme) ? profileTheme : THEMES[0];
  }

  applyTheme(themeName) {
    const idx = Math.max(0, THEMES.indexOf(themeName));
    this.themeIdx = idx;
    const cl = document.body.classList;
    cl.toggle('th-dark', idx === 1);
    cl.toggle('th-light', idx === 2);

    const btn = $('#th');
    if (btn) {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${THEME_ICONS[idx]}</svg>`;
      const next = THEMES[(idx + 1) % THEMES.length];
      btn.setAttribute('aria-label', `Color theme: ${THEMES[idx]}. Switch to ${next}`);
      btn.title = `Theme: ${THEMES[idx]} (click for ${next})`;
    }
  }

  applyPhoto(c) {
    const pp = $('#pp');
    if (!pp || !c) return;
    const s = pp.style;
    s.setProperty('--pw', `${num(c.width, 520)}px`);
    s.setProperty('--ph', `${num(c.height, 620)}px`);
    s.setProperty('--fe', `${num(c.feather, 10)}%`); // ?? semantics: 0 is a valid value
    s.setProperty('--ps', num(c.scale, 1));
    s.setProperty('--pxo', `${num(c.x, 0)}px`);
    s.setProperty('--pyo', `${num(c.y, 0)}px`);
    s.setProperty('--bgm', BG_MAP[c.bgMode] || 'transparent');
    pp.className = `P f-${c.frame || 'cutout'}`;

    const img = pp.querySelector('img');
    if (img && c.src && c.src !== DEFAULT_PHOTO && img.getAttribute('src') !== c.src) {
      pp.querySelector('picture source')?.remove(); // custom photo replaces the optimised default
      img.src = c.src;
    }
  }

  // ---------------------------------------------------------------- rendering
  /** Sets innerHTML only when it changed (prevents flashes/animation replays on re-render). */
  setHtml(el, html) {
    if (!el) return false;
    if (el._h === html) return false;
    el.innerHTML = html;
    el._h = html;
    return true;
  }

  guard(name, fn) {
    try {
      fn();
    } catch (err) {
      console.error(`Section "${name}" failed to render:`, err);
    }
  }

  render() {
    const d = this.data || {};
    const profile = d.profile || {};
    const socials = arr(d.socials);

    this.guard('look', () => {
      this.applyFont(profile.font_preset);
      this.applyTheme(this.resolveTheme(profile.theme));
    });

    this.guard('logo', () => {
      const logo = $('#brandLogo') || $('.mono');
      if (logo) {
        const key = JSON.stringify(profile.logo_config || {});
        if (logo._k !== key) {
          logo._k = key;
          renderBrandLogo(logo, profile.logo_config || { preset: 'hex-ribbon' });
        }
      }
    });

    this.guard('hero-text', () => {
      const greet = String(profile.greet || 'Hi, I am');
      this.setHtml($('#greet'), [...greet].map((c, i) => `<span class="gc" style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join(''));

      const words = String(profile.name || 'Jai Kiran').split(' ');
      this.setHtml(
        $('#nm'),
        words
          .map((w, k) => '<span class="br">' + [...w].map((c, i) => `<span class="c" style="--i:${i + k * 5}">${esc(c)}</span>`).join('') + '</span>')
          .join(' ')
      );

      const subs = arr(profile.subs).filter(Boolean);
      const key = subs.join('|');
      const typ = $('#typ');
      if (typ && subs.length && typ._k !== key) {
        typ._k = key;
        startTypewriter(typ, subs);
        const sr = $('#typ-sr');
        if (sr) sr.textContent = subs.join(', ');
      }
    });

    this.guard('social', () => {
      this.setHtml(
        $('#soc'),
        socials
          .filter((s) => s.show_hero !== false && s.url)
          .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.name)}" style="--sgl:${SOCIAL_GLOW[s.icon] || '#22d3ee'}">${this.getSocialIcon(s.icon)}</a>`)
          .join('')
      );
    });

    this.guard('photo', () => this.applyPhoto(profile.photo_config));
    this.guard('marquee', () => this.setHtml($('#mq'), marqueeHtml(d.skills)));
    this.guard('about', () => {
      this.setHtml($('#ld'), leadHtml(profile.lead_bio));
      this.setHtml($('#pil'), pillarsHtml());
    });
    this.guard('skills', () => this.setHtml($('#sk'), skillsHtml(d.skills, (v, n) => this.getSkillIcon(v, n))));
    this.guard('experience', () => {
      const tl = $('#tl');
      if (!tl) return;
      const html = timelineHtml(d.experience);
      if (tl._h !== html) {
        tl.innerHTML = '<div class="fill" id="fill"></div>' + html;
        tl._h = html;
      }
    });
    this.guard('projects', () => this.setHtml($('#pj'), projectsHtml(d.projects)));

    this.guard('resume', () => {
      const rs = $('#rs');
      if (rs && profile.resume_url) {
        rs.href = profile.resume_url;
        rs.target = '_blank';
        rs.rel = 'noopener noreferrer';
      }
    });

    this.guard('contact', () => {
      const phone = String(profile.phone || '');
      const items = [
        ...socials.filter((s) => s.show_contact !== false && s.url).map((s) => [s.icon, s.name, String(s.url).replace(/^mailto:/, ''), s.url]),
        ['phone', 'Phone', phone, phone ? 'tel:' + phone.replace(/\s/g, '') : ''],
        ['location', 'Location', String(profile.location || ''), ''],
      ].filter((c) => c[2]);

      this.setHtml(
        $('#ctc'),
        items
          .map(
            (c, i) =>
              `<a class="ct rv" style="--i:${i}" ${c[3] ? `href="${esc(c[3])}" target="_blank" rel="noopener noreferrer"` : ''}><u aria-hidden="true">${this.getSocialIcon(c[0])}</u><span><small>${esc(c[1])}</small>${esc(c[2].replace(/^https?:\/\/(www\.)?/, ''))}</span></a>`
          )
          .join('')
      );
    });

    this.observeElements();
  }

  // ---------------------------------------------------------------- reveal-on-scroll
  observeElements() {
    $$('.rv, .ti, .tier, .fr').forEach((el) => {
      if (el.classList.contains('in')) return;
      if (this.io) this.io.observe(el);
      else el.classList.add('in'); // no IntersectionObserver support: just show everything
    });
  }

  initIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;
    this.io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          target.classList.add('in');
          if (target.classList.contains('fr')) scrambleText(target.querySelector('b'));
          else if (target.closest('#pil')) scrambleText(target.querySelector('h3'));
          this.io.unobserve(target);
        });
      },
      { threshold: 0.15 }
    );
    this.observeElements();
  }

  // ---------------------------------------------------------------- case study dialog
  showCaseStudyModal(projectId) {
    const project = arr(this.data?.projects).find((p) => Number(p.id) === Number(projectId));
    if (!project) return;

    const section = (title, text, color = '#22d3ee') =>
      text ? `<div style="margin:16px 0"><h4 style="font-family:var(--d);color:${color};margin:0 0 6px">${esc(title)}</h4><p style="color:#cbd5e1;margin:0;line-height:1.6">${esc(text)}</p></div>` : '';

    const modal = document.createElement('div');
    modal.className = 'mod';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'cs-title');
    modal.innerHTML = `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
          <div>
            <span class="tag">${esc(project.category)}</span>
            <h3 id="cs-title" style="margin:6px 0 0;font:800 1.4rem var(--d)">${esc(project.title)}</h3>
          </div>
          <button class="sm" data-x="1" aria-label="Close dialog" style="font-size:1.2rem;padding:4px 10px">✕</button>
        </div>
        <p style="color:#94a3b8;font-size:1rem;line-height:1.6">${esc(project.short_desc)}</p>
        ${section('Problem Statement', project.problem_statement)}
        ${section('Solution & Approach', project.solution)}
        ${section('System Architecture', project.architecture)}
        ${section('Individual Contribution', project.my_contribution)}
        ${section('Technical Challenges Overcome', project.challenges)}
        ${section('Measurable Outcomes', project.measurable_results, '#10b981')}
        <div style="margin:18px 0">
          <h4 style="font-size:0.85rem;text-transform:uppercase;color:#94a3b8;margin:0 0 8px;letter-spacing:0.1em">Technologies &amp; Tools</h4>
          <div>${arr(project.tech_stack).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        </div>
        <div class="acts" style="border-top:1px solid #1e293b;padding-top:16px;margin-top:20px">
          ${project.live_url ? `<a class="btn primary" href="${esc(project.live_url)}" target="_blank" rel="noopener noreferrer">Launch Live Demo</a>` : ''}
          ${project.repo_url ? `<a class="btn" href="${esc(project.repo_url)}" target="_blank" rel="noopener noreferrer">View GitHub Repository</a>` : ''}
          <button class="btn" data-x="1" style="margin-left:auto">Close</button>
        </div>
      </div>`;
    openDialog(modal);
  }

  // ---------------------------------------------------------------- events (bound once)
  bind() {
    // Theme button: remembers the visitor's choice
    const thBtn = $('#th');
    if (thBtn) {
      thBtn.onclick = () => {
        const next = THEMES[(this.themeIdx + 1) % THEMES.length];
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {
          /* private mode: choice lasts for this visit only */
        }
        this.applyTheme(next);
        this.showToast(`Theme: ${next}`);
      };
    }

    // Framed section headers: replay decode on hover (skipped for reduced motion inside scrambleText)
    $$('.fr').forEach((fr) => fr.addEventListener('mouseenter', () => scrambleText(fr.querySelector('b'))));

    // Brand logo -> smooth scroll to top
    const logo = $('#brandLogo') || $('.mono');
    if (logo) logo.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }));

    // Scroll progress, nav state, timeline fill (batched into one rAF per frame)
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      const bar = $('#bar');
      if (bar) bar.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
      $('#nav')?.classList.toggle('s', window.scrollY > 60);
      const tl = $('#tl');
      const fill = $('#fill');
      if (tl && fill) {
        const rect = tl.getBoundingClientRect();
        fill.style.height = `${Math.max(0, Math.min(rect.height, window.innerHeight * 0.6 - rect.top))}px`;
      }
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(onScroll);
        }
      },
      { passive: true }
    );
    onScroll();

    // Hero glow + damped 3D parallax (lerp 0.07), no layout reads per mouse event
    if (!reducedMotion() && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      const glow = $('#glow');
      const pp = $('#pp');
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      const loop = () => {
        cx += (tx - cx) * 0.07;
        cy += (ty - cy) * 0.07;
        if (pp) {
          pp.style.setProperty('--px', cx.toFixed(3));
          pp.style.setProperty('--py', cy.toFixed(3));
          pp.style.setProperty('--lx', `${(-cx * 10).toFixed(1)}px`);
          pp.style.setProperty('--ly', `${(-cy * 8).toFixed(1)}px`);
        }
        raf = Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(loop) : 0;
      };
      window.addEventListener(
        'mousemove',
        (ev) => {
          if (window.scrollY > window.innerHeight * 1.2) return; // hero is off-screen
          tx = (ev.clientX / window.innerWidth - 0.5) * 2;
          ty = (ev.clientY / window.innerHeight - 0.5) * 2;
          glow?.style.setProperty('--x', `${ev.clientX}px`);
          glow?.style.setProperty('--y', `${ev.clientY + window.scrollY}px`);
          if (!raf) raf = requestAnimationFrame(loop);
        },
        { passive: true }
      );
    }

    // Mobile menu
    const menuBtn = $('#menuBtn');
    const mobNav = $('#mobNav');
    if (menuBtn && mobNav) {
      const setOpen = (open) => {
        document.body.classList.toggle('mo', open);
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      };
      menuBtn.onclick = () => setOpen(!document.body.classList.contains('mo'));
      mobNav.onclick = (ev) => ev.target.closest('a') && setOpen(false);
      document.addEventListener('keydown', (ev) => ev.key === 'Escape' && document.body.classList.contains('mo') && (setOpen(false), menuBtn.focus()));
    }

    // Case study buttons (delegated, bound once)
    document.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-cs]');
      if (btn) this.showCaseStudyModal(Number(btn.dataset.cs));
    });

    this.bindContactForm();
  }

  bindContactForm() {
    const form = $('#cf');
    if (!form) return;
    const status = $('#cf-status');
    const counter = $('#cf-count');
    const rules = {
      name: (v) => (v.length < 2 || v.length > 120 ? 'Please enter your name (2–120 characters).' : ''),
      email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || v.length > 255 ? 'Please enter a valid email address.' : ''),
      subject: (v) => (v.length < 2 || v.length > 200 ? 'Please add a short subject (2–200 characters).' : ''),
      message: (v) => (v.length < 5 || v.length > 4000 ? 'Your message should be 5–4000 characters.' : ''),
    };
    const setStatus = (text, kind = '') => {
      if (!status) return;
      status.textContent = text;
      status.className = `cf-status ${kind}`.trim();
    };
    const check = (name) => {
      const input = form.elements[name];
      const msg = rules[name](String(input.value || '').trim());
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      const err = $(`#err-${name}`);
      if (err) err.textContent = msg;
      return msg;
    };

    Object.keys(rules).forEach((n) => form.elements[n]?.addEventListener('blur', () => check(n)));
    form.elements.message?.addEventListener('input', (ev) => {
      if (counter) counter.textContent = `${ev.target.value.length} / 4000`;
    });

    let turnstile = { getToken: () => '', reset() {} };
    mountTurnstile($('#cf-turnstile')).then((t) => (turnstile = t));

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const firstBad = Object.keys(rules).find((n) => check(n));
      if (firstBad) {
        setStatus('Please fix the highlighted fields.', 'err');
        form.elements[firstBad].focus();
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const label = btn.textContent;
      const fd = new FormData(form);
      const payload = {
        name: String(fd.get('name')).trim(),
        email: String(fd.get('email')).trim(),
        subject: String(fd.get('subject')).trim(),
        message: String(fd.get('message')).trim(),
        website_trap: fd.get('website_trap') || '',
        turnstileToken: turnstile.getToken(),
      };

      try {
        btn.disabled = true;
        btn.textContent = 'Sending…';
        setStatus('Sending your message…');
        const res = await apiClient.sendContactMessage(payload);
        form.reset();
        if (counter) counter.textContent = '0 / 4000';
        burstConfetti(btn);
        setStatus(`${res.message || 'Message sent!'} I usually reply within 24–48 hours.`, 'ok');
        this.showToast('Message sent. Thank you!');
      } catch (err) {
        setStatus(err.message || 'Failed to send your message. Please try again.', 'err');
        this.showToast('Message not sent', true);
      } finally {
        turnstile.reset();
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }
}
