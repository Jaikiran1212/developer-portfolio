// ==============================================================================
// PUBLIC PORTFOLIO RENDERER & INTERACTION CONTROLLER
// ==============================================================================
import { apiClient } from './api-client.js';
import { ICONS, SOCIAL_ICONS, SOCIAL_GLOW, DEFAULT_PORTFOLIO_DATA } from './data-default.js';
import { startTypewriter, scrambleText, burstConfetti } from './animations.js';
import { renderBrandLogo, syncBrowserFavicon, LOGO_PRESETS } from './brand-logo.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Helper for safe HTML escaping
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Typography Presets (Google Fonts Suite)
export const FONT_PRESETS = {
  'Cyber Geometric': ['Syne', 'JetBrains Mono', 'Instrument Serif'],
  'Editorial Tech': ['Space Grotesk', 'JetBrains Mono', 'Instrument Serif'],
  'Ultra Modern': ['Outfit', 'Fira Code', 'Instrument Serif'],
  'Brutalist Neo': ['Syne', 'Fira Code', 'Instrument Serif'],
  'Minimalist Geometric': ['Outfit', 'JetBrains Mono', 'Instrument Serif'],
};

// Theme presets
const THEMES = ['Alternating Contrast', 'Full Cyber Dark', 'Full Clean Light'];
const THEME_ICONS = [
  '<circle cx="12" cy="12" r="9"/><path fill="currentColor" d="M12 3a9 9 0 000 18z"/>',
  '<path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/>',
  '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
];

export class PortfolioApp {
  constructor() {
    this.data = DEFAULT_PORTFOLIO_DATA;
    this.themeIdx = 0;
    this.io = null;
  }

  async init() {
    // 1. Initial render with default data for instant display
    this.render();

    // 2. Fetch live published data from API
    try {
      const live = await apiClient.getPortfolio();
      if (live && live.profile) {
        this.data = live;
        this.render();
      }
    } catch (err) {
      console.warn('Using local seeded portfolio data:', err.message);
    }

    this.initEvents();
    this.initIntersectionObserver();
  }

  showToast(message, isError = false) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('on');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('on'), 3000);
  }

  getSkillIcon(iconValue, skillName) {
    const val = (iconValue || '').trim();
    if (val.startsWith('<svg')) return val;
    if (/^(https?:|data:)/.test(val)) return `<img alt="" src="${esc(val)}">`;
    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (ICONS[slug]) return ICONS[slug];
    const nameSlug = (skillName || '').toLowerCase().replace(/c\+\+/g, 'cpp').replace(/[^a-z0-9]/g, '');
    if (ICONS[nameSlug]) return ICONS[nameSlug];
    return `<svg viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="#334155"/><text x="24" y="31" text-anchor="middle" font-size="18" font-weight="800" fill="#e2e8f0" font-family="Arial,sans-serif">${esc((skillName || '?').slice(0, 2))}</text></svg>`;
  }

  getSocialIcon(iconValue) {
    const v = (iconValue || 'website').toLowerCase();
    return SOCIAL_ICONS[v] || SOCIAL_ICONS.website;
  }

  applyFont(fontName) {
    const fonts = FONT_PRESETS[fontName] || FONT_PRESETS['Cyber Geometric'];
    const style = document.documentElement.style;
    style.setProperty('--d', `'${fonts[0]}', sans-serif`);
    style.setProperty('--m', `'${fonts[1]}', monospace`);
    style.setProperty('--s', `'${fonts[2]}', Georgia, serif`);
    style.setProperty('--b', "'Manrope', system-ui, -apple-system, sans-serif");
  }

  applyTheme(themeName) {
    const idx = Math.max(0, THEMES.indexOf(themeName));
    this.themeIdx = idx;
    const bodyClass = document.body.classList;
    bodyClass.toggle('th-dark', idx === 1);
    bodyClass.toggle('th-light', idx === 2);

    const btn = $('#th');
    if (btn) {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${THEME_ICONS[idx]}</svg>`;
    }
  }

  applyPhoto(c) {
    const pp = $('#pp');
    if (!pp || !c) return;
    const s = pp.style;
    s.setProperty('--pw', `${c.width || 400}px`);
    s.setProperty('--ph', `${c.height || 480}px`);
    s.setProperty('--fe', `${c.feather || 10}%`);
    s.setProperty('--ps', c.scale || 1);
    s.setProperty('--pxo', `${c.x || 0}px`);
    s.setProperty('--pyo', `${c.y || 0}px`);

    const bgMap = {
      'Dark Cyber Glow': 'radial-gradient(circle at 50% 35%,#1e293b,#090d16)',
      'Transparent / None': 'transparent',
      'Frosted Glass': 'rgba(255,255,255,.14)',
      'Light Slate': '#e2e8f0',
    };
    s.setProperty('--bgm', bgMap[c.bgMode] || 'transparent');

    pp.className = `P f-${c.frame || 'cutout'}`;
    const img = pp.querySelector('img');
    if (img && c.src) {
      img.src = c.src;
    }
  }

  render() {
    const { profile, projects, experience, skills, socials } = this.data;

    // Apply Typography and Theme
    this.applyFont(profile.font_preset);
    this.applyTheme(profile.theme);

    // Customizable Brand Logo System (.mono) & Auto-Favicon Sync
    const brandLogoEl = $('#brandLogo') || $('.mono');
    if (brandLogoEl) {
      renderBrandLogo(brandLogoEl, profile.logo_config || { preset: 'hex-ribbon' });
    }

    // 1. Hero Greeting: Staggered character wave entrance with glowing underline sweep
    const greetEl = $('#greet');
    if (greetEl) {
      greetEl.innerHTML = [...profile.greet]
        .map((c, i) => `<span class="gc" style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`)
        .join('');
    }

    // Hero Name: 3D perspective drop-in, continuous sine levitation, iridescent shimmer, rubber-band hover
    const nameEl = $('#nm');
    if (nameEl) {
      const words = profile.name.split(' ');
      nameEl.innerHTML = words
        .map(
          (w, k) =>
            '<span class="br">' +
            [...w].map((c, i) => `<span class="c" style="--i:${i + k * 5}">${esc(c)}</span>`).join('') +
            '</span>'
        )
        .join(' ');
    }

    // Rotating Typewriter Subtitles with leading-edge cyber glyph flash
    const typEl = $('#typ');
    if (typEl && profile.subs) {
      startTypewriter(typEl, profile.subs);
    }

    // Hero Social Links
    const socEl = $('#soc');
    if (socEl && socials) {
      socEl.innerHTML = socials
        .filter((s) => s.show_hero !== false && s.url)
        .map(
          (s) =>
            `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.name)}" style="--sgl:${SOCIAL_GLOW[s.icon] || '#22d3ee'}">${this.getSocialIcon(s.icon)}</a>`
        )
        .join('');
    }

    // Hero Photo Frame
    this.applyPhoto(profile.photo_config);

    // 2. Marquee Skills Ticker
    const mqEl = $('#mq');
    if (mqEl && skills) {
      const skillNames = skills.map((s) => s.name);
      mqEl.innerHTML = [0, 1]
        .map(() => skillNames.map((n) => `<span>${esc(n)}</span><span>✦</span>`).join(''))
        .join('');
    }

    // 3. About Me Lead Sentence: Word-by-word blur-to-crisp reveal & editorial serif keyword highlights
    const leadEl = $('#ld');
    if (leadEl) {
      let rawBio = profile.lead_bio ||
        `“Computer Science & Engineering student at |Amrita Vishwa Vidyapeetham| with hands-on experience in |web development|, interactive |algorithmic visualizers|, and |cybersecurity| incident analysis.”`;
      if (!rawBio.includes('|')) {
        rawBio = rawBio.replace(/(Amrita Vishwa Vidyapeetham|web development|algorithmic visualizers|cybersecurity|full-stack|software engineering)/gi, '|$1|');
      }
      let wordIdx = 0;
      leadEl.innerHTML = rawBio
        .split('|')
        .map((chunk, j) =>
          chunk.replace(
            /(\S+)(\s*)/g,
            (m, w, s) => `<span class="w${j % 2 ? ' k' : ''}" style="--i:${wordIdx++}">${esc(w)}</span>${s}`
          )
        )
        .join('');
    }

    // 3 Pillars
    const pilEl = $('#pil');
    if (pilEl) {
      const pillars = [
        [
          'DEVELOPMENT',
          'Engineering high-performance web applications, responsive user interfaces, and modular component architectures with modern frameworks.',
          '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>',
        ],
        [
          'CYBERSECURITY & SYSTEMS',
          'Analyzing security breaches, implementing Identity & Access Management (IAM), access controls, and threat mitigation strategies.',
          '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>',
        ],
        [
          'PROBLEM SOLVING & ALGORITHMS',
          'Designing data structures and interactive algorithm visualizations such as Knuth’s Dancing Links (Algorithm X) for complex constraint satisfaction.',
          '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6 8l5 8M18 8l-5 8"/>',
        ],
      ];
      pilEl.innerHTML = pillars
        .map(
          (p, i) =>
            `<article class="card tilt rv" style="--i:${i}">
              <div class="ico" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p[2]}</svg>
              </div>
              <h3>${esc(p[0])}</h3>
              <p>${esc(p[1])}</p>
            </article>`
        )
        .join('');
    }

    // 4. Skills Tiers
    const skEl = $('#sk');
    if (skEl && skills) {
      const tiers = [
        ['now', 'USING NOW:'],
        ['learn', 'LEARNING / LEVELING UP:'],
        ['cyber', 'CYBERSECURITY & ENTERPRISE TOOLS:'],
      ];

      skEl.innerHTML = tiers
        .map(([tierKey, tierTitle], tIdx) => {
          const tierSkills = skills.filter((s) => s.tier === tierKey);
          return `<div class="tier rv">
            <h3><span class="px">0${tIdx + 1} //</span>${tierTitle}</h3>
            <div class="ig">
              ${tierSkills
                .map((s, i) => {
                  const iconSvg = this.getSkillIcon(s.icon_value, s.name);
                  return `<div class="sk" style="--i:${i}">
                    ${iconSvg}
                    <span>${esc(s.name)}</span>
                  </div>`;
                })
                .join('')}
            </div>
          </div>`;
        })
        .join('');
    }

    // 5. Experience & Certifications Timeline
    const tlEl = $('#tl');
    if (tlEl && experience) {
      tlEl.innerHTML =
        '<div class="fill" id="fill"></div>' +
        experience
          .map(
            (c, i) =>
              `<div class="ti card tilt rv" style="--i:${i}">
                <h3>${esc(c.organization)} – ${esc(c.role_title)}</h3>
                <div class="m">${esc(c.duration)}</div>
                <ul>
                  ${c.points.map((pt, j) => `<li style="--j:${j}">${esc(pt)}</li>`).join('')}
                </ul>
                <div>
                  ${c.tags.map((tg) => `<span class="tag">${esc(tg)}</span>`).join('')}
                </div>
                <div class="acts">
                  ${
                    c.credential_url
                      ? `<a class="btn" href="${esc(c.credential_url)}" target="_blank" rel="noopener noreferrer">View Certificate</a>`
                      : ''
                  }
                </div>
              </div>`
          )
          .join('');
    }

    // 6. Portfolio Projects
    const pjEl = $('#pj');
    if (pjEl && projects) {
      pjEl.innerHTML = projects
        .map(
          (p, i) =>
            `<article class="card tilt pj rv" style="--i:${i}">
              <div class="art g${(i % 3) + 1}">
                ${
                  p.image_url
                    ? `<img alt="Screenshot of ${esc(p.title)}" src="${esc(p.image_url)}" loading="lazy">`
                    : `<b class="ini">${esc(p.title.slice(0, 2))}</b>`
                }
                ${p.featured ? '<span class="star">FEATURED</span>' : ''}
              </div>
              <div class="bd">
                <div><span class="tag">${esc(p.category)}</span></div>
                <h3>${esc(p.title)}</h3>
                <p>${esc(p.short_desc)}</p>
                <div>
                  ${p.tech_stack.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}
                </div>
                <div class="acts">
                  <button class="btn primary" data-cs="${p.id}" aria-label="View case study for ${esc(p.title)}">Case Study / Details</button>
                  ${
                    p.live_url
                      ? `<a class="btn" href="${esc(p.live_url)}" target="_blank" rel="noopener noreferrer">Live Demo</a>`
                      : ''
                  }
                  ${
                    p.repo_url
                      ? `<a class="btn" href="${esc(p.repo_url)}" target="_blank" rel="noopener noreferrer">GitHub</a>`
                      : ''
                  }
                </div>
              </div>
            </article>`
        )
        .join('');
    }

    // Resume Button
    const rsEl = $('#rs');
    if (rsEl && profile.resume_url) {
      rsEl.href = profile.resume_url;
      rsEl.target = '_blank';
      rsEl.rel = 'noopener noreferrer';
    }

    // 7. Contact Section Items
    const ctcEl = $('#ctc');
    if (ctcEl) {
      const contactItems = [
        ...socials.filter((s) => s.show_contact !== false && s.url).map((s) => [s.icon, s.name, s.url.replace(/^mailto:/, ''), s.url]),
        ['phone', 'Phone', profile.phone, 'tel:' + profile.phone.replace(/\s/g, '')],
        ['location', 'Location', profile.location, ''],
      ].filter((c) => c[2]);

      ctcEl.innerHTML = contactItems
        .map(
          (c, i) =>
            `<a class="ct rv" style="--i:${i}" ${c[3] ? `href="${esc(c[3])}" target="_blank" rel="noopener noreferrer"` : ''}>
              <u aria-hidden="true">${this.getSocialIcon(c[0])}</u>
              <span>
                <small>${esc(c[1])}</small>
                ${esc(c[2].replace(/^https?:\/\/(www\.)?/, ''))}
              </span>
            </a>`
        )
        .join('');
    }

    this.observeElements();
  }

  observeElements() {
    if (!this.io) return;
    $$('.rv, .ti, .tier, .fr').forEach((el) => {
      if (!el.classList.contains('in')) {
        this.io.observe(el);
      }
    });
  }

  initIntersectionObserver() {
    this.io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target;
            target.classList.add('in');
            if (target.classList.contains('fr')) {
              scrambleText(target.querySelector('b'));
            } else if (target.closest('#pil')) {
              scrambleText(target.querySelector('h3'));
            }
            this.io.unobserve(target);
          }
        });
      },
      { threshold: 0.15 }
    );
    this.observeElements();
  }

  showCaseStudyModal(projectId) {
    const project = this.data.projects.find((p) => p.id === projectId);
    if (!project) return;

    const modal = document.createElement('div');
    modal.className = 'mod';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'cs-title');

    modal.innerHTML = `
      <div tabindex="-1">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
          <div>
            <span class="tag">${esc(project.category)}</span>
            <h3 id="cs-title" style="margin:6px 0 0;font:800 1.4rem var(--d)">${esc(project.title)}</h3>
          </div>
          <button class="sm" data-x="1" aria-label="Close dialog" style="font-size:1.2rem;padding:4px 10px">✕</button>
        </div>

        <p style="color:#94a3b8;font-size:1rem;line-height:1.6">${esc(project.short_desc)}</p>

        ${
          project.problem_statement
            ? `<div style="margin:16px 0">
                <h4 style="font-family:var(--d);color:#22d3ee;margin:0 0 6px">Problem Statement</h4>
                <p style="color:#cbd5e1;margin:0;line-height:1.6">${esc(project.problem_statement)}</p>
              </div>`
            : ''
        }

        ${
          project.solution
            ? `<div style="margin:16px 0">
                <h4 style="font-family:var(--d);color:#22d3ee;margin:0 0 6px">Solution & Approach</h4>
                <p style="color:#cbd5e1;margin:0;line-height:1.6">${esc(project.solution)}</p>
              </div>`
            : ''
        }

        ${
          project.architecture
            ? `<div style="margin:16px 0">
                <h4 style="font-family:var(--d);color:#22d3ee;margin:0 0 6px">System Architecture</h4>
                <p style="color:#cbd5e1;margin:0;line-height:1.6">${esc(project.architecture)}</p>
              </div>`
            : ''
        }

        ${
          project.my_contribution
            ? `<div style="margin:16px 0">
                <h4 style="font-family:var(--d);color:#22d3ee;margin:0 0 6px">Individual Contribution</h4>
                <p style="color:#cbd5e1;margin:0;line-height:1.6">${esc(project.my_contribution)}</p>
              </div>`
            : ''
        }

        ${
          project.challenges
            ? `<div style="margin:16px 0">
                <h4 style="font-family:var(--d);color:#22d3ee;margin:0 0 6px">Technical Challenges Overcome</h4>
                <p style="color:#cbd5e1;margin:0;line-height:1.6">${esc(project.challenges)}</p>
              </div>`
            : ''
        }

        ${
          project.measurable_results
            ? `<div style="margin:16px 0">
                <h4 style="font-family:var(--d);color:#10b981;margin:0 0 6px">Measurable Outcomes</h4>
                <p style="color:#cbd5e1;margin:0;line-height:1.6">${esc(project.measurable_results)}</p>
              </div>`
            : ''
        }

        <div style="margin:18px 0">
          <h4 style="font-size:0.8rem;text-transform:uppercase;color:#94a3b8;margin:0 0 8px;letter-spacing:0.1em">Technologies & Tools</h4>
          <div>${project.tech_stack.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        </div>

        <div class="acts" style="border-top:1px solid #1e293b;padding-top:16px;margin-top:20px">
          ${
            project.live_url
              ? `<a class="btn primary" href="${esc(project.live_url)}" target="_blank" rel="noopener noreferrer">Launch Live Demo</a>`
              : ''
          }
          ${
            project.repo_url
              ? `<a class="btn" href="${esc(project.repo_url)}" target="_blank" rel="noopener noreferrer">View GitHub Repository</a>`
              : ''
          }
          <button class="btn" data-x="1" style="margin-left:auto">Close</button>
        </div>
      </div>
    `;

    const close = () => modal.remove();
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal || ev.target.dataset.x) close();
    });
    modal.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') close();
    });

    document.body.appendChild(modal);
    modal.querySelector('div').focus();
  }

  initEvents() {
    // Theme Button
    const thBtn = $('#th');
    if (thBtn) {
      thBtn.onclick = () => {
        const nextTheme = THEMES[(this.themeIdx + 1) % THEMES.length];
        this.data.profile.theme = nextTheme;
        this.applyTheme(nextTheme);
        this.showToast(`Theme: ${nextTheme}`);
      };
    }

    // Framed Section Header hover interaction (triggers cyber glyph decode + 3D flip)
    $$('.fr').forEach((frEl) => {
      frEl.addEventListener('mouseenter', () => {
        const b = frEl.querySelector('b');
        if (b) scrambleText(b);
      });
    });

    // Brand Logo click to smooth-scroll to top
    const brandLogo = $('#brandLogo') || $('.mono');
    if (brandLogo) {
      brandLogo.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Scroll Progress & Nav Background
    window.addEventListener(
      'scroll',
      () => {
        const doc = document.documentElement;
        const maxScroll = doc.scrollHeight - window.innerHeight;
        const bar = $('#bar');
        if (bar) {
          bar.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
        }

        const nav = $('#nav');
        if (nav) {
          nav.classList.toggle('s', window.scrollY > 60);
        }

        const tl = $('#tl');
        const fill = $('#fill');
        if (tl && fill) {
          const rect = tl.getBoundingClientRect();
          fill.style.height = `${Math.max(0, Math.min(rect.height, window.innerHeight * 0.6 - rect.top))}px`;
        }
      },
      { passive: true }
    );

    // Mouse Movement for Hero Glow & 3D Tilt
    window.addEventListener('mousemove', (ev) => {
      const hero = $('#hero');
      const glow = $('#glow');
      if (hero && glow) {
        const hRect = hero.getBoundingClientRect();
        glow.style.setProperty('--x', `${ev.clientX - hRect.left}px`);
        glow.style.setProperty('--y', `${ev.clientY - hRect.top}px`);
      }

      // Parallax portrait orientation
      const ox = (ev.clientX / window.innerWidth - 0.5) * 2;
      const oy = (ev.clientY / window.innerHeight - 0.5) * 2;
      const pp = $('#pp');
      if (pp) {
        pp.style.setProperty('--px', ox.toFixed(3));
        pp.style.setProperty('--py', oy.toFixed(3));
        pp.style.setProperty('--lx', `${(-ox * 10).toFixed(1)}px`);
        pp.style.setProperty('--ly', `${(-oy * 8).toFixed(1)}px`);
      }
    });

    // Mobile Menu Toggle
    const menuBtn = $('#menuBtn');
    const mobNav = $('#mobNav');
    if (menuBtn && mobNav) {
      menuBtn.onclick = () => {
        const isOpen = document.body.classList.toggle('mo');
        menuBtn.setAttribute('aria-expanded', String(isOpen));
      };
      mobNav.onclick = (ev) => {
        if (ev.target.closest('a')) {
          document.body.classList.remove('mo');
          menuBtn.setAttribute('aria-expanded', 'false');
        }
      };
    }

    // Delegate Case Study button clicks
    document.addEventListener('click', (ev) => {
      const csBtn = ev.target.closest('[data-cs]');
      if (csBtn) {
        this.showCaseStudyModal(Number(csBtn.dataset.cs));
      }
    });

    // Contact Form Submission with backend integration
    const cf = $('#cf');
    if (cf) {
      cf.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const form = ev.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const origText = submitBtn.textContent;

        const formData = new FormData(form);
        const payload = {
          name: formData.get('name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message') || formData.get('msg'),
          website_trap: formData.get('website_trap') || '', // Honeypot
        };

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';

          const res = await apiClient.sendContactMessage(payload);
          form.reset();
          burstConfetti(submitBtn);
          this.showToast(res.message || 'Message sent! Thank you.');
        } catch (err) {
          this.showToast(err.message || 'Failed to send message. Please try again.', true);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = origText;
        }
      });
    }
  }
}
