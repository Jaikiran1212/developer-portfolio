// ==============================================================================
// PURE HTML TEMPLATES (no DOM access)
// Used by the browser AND by the build-time prerender plugin, so the HTML that search
// engines/no-JS visitors see is identical to what the app renders.
// ==============================================================================
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const arr = (v) => (Array.isArray(v) ? v : []);

/** https://drive.google.com/file/d/<ID>/view -> direct download link (or '' if not a Drive file link) */
export function driveDownloadUrl(url) {
  const m = String(url || '').match(/drive\.google\.com\/file\/d\/([\w-]+)|drive\.google\.com\/open\?id=([\w-]+)/);
  const id = m && (m[1] || m[2]);
  return id ? `https://drive.google.com/uc?export=download&id=${id}` : '';
}

export function marqueeHtml(skills) {
  const names = arr(skills).map((s) => s.name);
  return [0, 1].map(() => names.map((n) => `<span>${esc(n)}</span><span aria-hidden="true">✦</span>`).join('')).join('');
}

export const DEFAULT_LEAD =
  '“Computer Science & Engineering student at |Amrita Vishwa Vidyapeetham| with hands-on experience in |web development|, interactive |algorithmic visualizers|, and |cybersecurity| incident analysis.”';

export function leadHtml(bio) {
  let raw = bio || DEFAULT_LEAD;
  if (!raw.includes('|')) {
    raw = raw.replace(/(Amrita Vishwa Vidyapeetham|web development|algorithmic visualizers|cybersecurity|full-stack|software engineering)/gi, '|$1|');
  }
  let i = 0;
  return raw
    .split('|')
    .map((chunk, j) => chunk.replace(/(\S+)(\s*)/g, (m, w, sp) => `<span class="w${j % 2 ? ' k' : ''}" style="--i:${i++}">${esc(w)}</span>${sp}`))
    .join('');
}

const PILLARS = [
  ['DEVELOPMENT', 'Engineering high-performance web applications, responsive user interfaces, and modular component architectures with modern frameworks.', '<path d="M8 6l-6 6 6 6M16 6l6 6-6 6"/>'],
  ['CYBERSECURITY & SYSTEMS', 'Analyzing security breaches, implementing Identity & Access Management (IAM), access controls, and threat mitigation strategies.', '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>'],
  ['PROBLEM SOLVING & ALGORITHMS', 'Designing data structures and interactive algorithm visualizations such as Knuth’s Dancing Links (Algorithm X) for complex constraint satisfaction.', '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 6h10M6 8l5 8M18 8l-5 8"/>'],
];

export const pillarsHtml = () =>
  PILLARS.map(
    (p, i) => `<article class="card tilt rv" style="--i:${i}"><div class="ico" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p[2]}</svg></div><h3>${esc(p[0])}</h3><p>${esc(p[1])}</p></article>`
  ).join('');

const TIERS = [
  ['now', 'USING NOW:'],
  ['learn', 'LEARNING / LEVELING UP:'],
  ['cyber', 'CYBERSECURITY & ENTERPRISE TOOLS:'],
];

/** @param getIcon (iconValue, name) => safe SVG/IMG markup */
export function skillsHtml(skills, getIcon) {
  return TIERS.map(([key, title], t) => {
    const items = arr(skills).filter((s) => s.tier === key);
    return `<div class="tier rv"><h3><span class="px">0${t + 1} //</span>${esc(title)}</h3><div class="ig">${items
      .map((s, i) => `<div class="sk" style="--i:${i}">${getIcon(s.icon_value, s.name)}<span>${esc(s.name)}</span></div>`)
      .join('')}</div></div>`;
  }).join('');
}

export const timelineHtml = (experience) =>
  arr(experience)
    .map((c, i) => {
      const dl = driveDownloadUrl(c.credential_url);
      return `<div class="ti card tilt rv" style="--i:${i}"><h3>${esc(c.organization)} – ${esc(c.role_title)}</h3><div class="m">${esc(c.duration)}</div><ul>${arr(c.points)
        .map((pt, j) => `<li style="--j:${j}">${esc(pt)}</li>`)
        .join('')}</ul><div>${arr(c.tags).map((tg) => `<span class="tag">${esc(tg)}</span>`).join('')}</div><div class="acts">${
        c.credential_url ? `<a class="btn" href="${esc(c.credential_url)}" target="_blank" rel="noopener noreferrer">View Certificate</a>` : ''
      }${dl ? `<a class="btn" href="${esc(dl)}" target="_blank" rel="noopener noreferrer">Download PDF</a>` : ''}</div></div>`;
    })
    .join('');

export const projectsHtml = (projects) =>
  arr(projects)
    .map(
      (p, i) => `<article class="card tilt pj rv" data-slug="${esc(p.slug)}" style="--i:${i}"><div class="art g${(i % 3) + 1}">${
        p.image_url
          ? `<img alt="Screenshot of ${esc(p.title)}" src="${esc(p.image_url)}" loading="lazy" decoding="async">`
          : `<b class="ini">${esc(String(p.title || '').slice(0, 2))}</b>`
      }${p.featured ? '<span class="star">FEATURED</span>' : ''}</div><div class="bd"><div><span class="tag">${esc(p.category)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.short_desc)}</p><div>${arr(p.tech_stack)
        .map((t) => `<span class="tag">${esc(t)}</span>`)
        .join('')}</div><div class="acts"><button class="btn primary" data-cs="${esc(p.id)}" aria-label="View case study for ${esc(p.title)}">Case Study / Details</button>${
        p.live_url ? `<a class="btn" href="${esc(p.live_url)}" target="_blank" rel="noopener noreferrer">Live Demo</a>` : ''
      }${p.repo_url ? `<a class="btn" href="${esc(p.repo_url)}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}</div></div></article>`
    )
    .join('');
