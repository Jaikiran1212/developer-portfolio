// ==============================================================================
// BRAND LOGO SYSTEM & AUTO-FAVICON SYNC ENGINE
// 5 Built-in Geometric Vector Presets + Custom PNG/SVG Upload Support
// ==============================================================================

/**
 * 5 Built-in Vector Logo Presets
 */
export const LOGO_PRESETS = {
  'hex-ribbon': {
    id: 'hex-ribbon',
    name: 'Hex Ribbon Monogram',
    description: 'Interlocking hexagonal geometric ribbon monogram (JK) inspired by Tomasz Gajda emblem',
    isDefault: true,
    svg: (c1 = '#22d3ee', c2 = '#8b5cf6') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hr-cyan" x1="12" y1="6" x2="88" y2="94" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="hr-purp" x1="88" y1="6" x2="12" y2="94" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="hr-dark" x1="50" y1="20" x2="50" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="hr-lite" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="hr-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Ambient Outer Glow -->
  <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" stroke="url(#hr-cyan)" stroke-width="1.5" stroke-opacity="0.35" fill="none"/>

  <!-- Tomasz Gajda Inspired Interlocking Hexagonal Ribbon Structure -->
  <!-- Facet 1: Top Right Hex Ridge -->
  <polygon points="50,11 83,30 68,39 50,28" fill="url(#hr-cyan)"/>
  <polygon points="50,11 83,30 68,39 50,28" fill="url(#hr-lite)"/>

  <!-- Facet 2: Left J-Drop Band -->
  <polygon points="17,30 50,11 50,28 32,39 32,67 17,59" fill="url(#hr-cyan)"/>
  
  <!-- Facet 3: J-Hook Bottom Curve Fold -->
  <polygon points="17,59 32,67 32,74 50,84 50,68 62,61 62,77 50,84 17,65" fill="url(#hr-purp)"/>
  
  <!-- Facet 4: Center Spine Interlock -->
  <polygon points="50,28 68,39 68,54 50,43" fill="#0891b2"/>
  
  <!-- Facet 5: K Upper Diagonal Branch -->
  <polygon points="50,43 68,54 83,30 65,20" fill="url(#hr-purp)"/>
  <polygon points="68,39 83,30 83,47 68,57" fill="#7c3aed"/>

  <!-- Facet 6: K Lower Diagonal Branch -->
  <polygon points="50,43 68,54 83,70 65,80" fill="url(#hr-cyan)"/>
  <polygon points="68,54 83,70 83,53 68,40" fill="#0284c7"/>

  <!-- Facet 7: Center Overlap Shadow Ribbon -->
  <polygon points="44,35 56,42 56,58 44,51" fill="url(#hr-dark)"/>
  <polygon points="46,37 54,42 54,56 46,51" fill="${c1}" fill-opacity="0.8"/>

  <!-- Dynamic J-Stem Accent Hook -->
  <path d="M32 42V67L50 78V66L38 59V42H32Z" fill="#38bdf8"/>

  <!-- Monogram Accent Nodes -->
  <circle cx="50" cy="11" r="2.5" fill="#ffffff" filter="url(#hr-glow)"/>
  <circle cx="83" cy="30" r="2" fill="${c1}"/>
  <circle cx="83" cy="70" r="2" fill="${c2}"/>
  <circle cx="50" cy="84" r="2" fill="#ffffff"/>
  <circle cx="17" cy="30" r="2" fill="${c1}"/>
  <circle cx="17" cy="59" r="2" fill="${c2}"/>
</svg>`
  },

  'cyber-cube': {
    id: 'cyber-cube',
    name: 'Cyber Cube 3D',
    description: 'Isometric 3D cyber cube monogram with neon cyan/purple wireframe facets forming JK',
    svg: (c1 = '#22d3ee', c2 = '#8b5cf6') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cc-top" x1="50" y1="10" x2="50" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${c2}" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="cc-left" x1="14" y1="30" x2="50" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="cc-right" x1="86" y1="30" x2="50" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>

  <!-- Isometric Outer Cube Boundary -->
  <polygon points="50,10 86,30 86,72 50,92 14,72 14,30" stroke="${c1}" stroke-width="2" fill="none"/>

  <!-- Top Diamond Face -->
  <polygon points="50,12 82,30 50,48 18,30" fill="url(#cc-top)" stroke="${c1}" stroke-width="1.5"/>
  <line x1="50" y1="12" x2="50" y2="48" stroke="${c2}" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="18" y1="30" x2="82" y2="30" stroke="${c2}" stroke-width="1" stroke-dasharray="3 3"/>

  <!-- Left Face: Stylized 'J' Geometry -->
  <polygon points="18,32 50,50 50,88 18,70" fill="url(#cc-left)" stroke="${c1}" stroke-width="1.5"/>
  <!-- J Monogram Inscription -->
  <path d="M26 42H38V66L32 70L24 65V56H29V62L32 64L34 62V46H26V42Z" fill="${c1}"/>

  <!-- Right Face: Stylized 'K' Geometry -->
  <polygon points="50,50 82,32 82,70 50,88" fill="url(#cc-right)" stroke="${c2}" stroke-width="1.5"/>
  <!-- K Monogram Inscription -->
  <path d="M56 46H62V58L72 46H79L68 59L80 74H72L62 62V74H56V46Z" fill="${c2}"/>

  <!-- Center Vertex Node -->
  <circle cx="50" cy="50" r="3.5" fill="#ffffff"/>
  <circle cx="50" cy="50" r="6" stroke="${c1}" stroke-width="1.2"/>
</svg>`
  },

  'code-crest': {
    id: 'code-crest',
    name: 'Code Crest Heraldic',
    description: 'Geometric heraldic coding crest with < / > brackets and shield monogram',
    svg: (c1 = '#22d3ee', c2 = '#10b981') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="crest-bg" x1="50" y1="10" x2="50" y2="92" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
    <linearGradient id="crest-stroke" x1="16" y1="10" x2="84" y2="92" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
  </defs>

  <!-- Outer Shield Crest -->
  <path d="M50 8L84 18V54C84 72 68 86 50 92C32 86 16 72 16 54V18L50 8Z" fill="url(#crest-bg)" stroke="url(#crest-stroke)" stroke-width="2.5"/>

  <!-- Top Bracket Banner -->
  <path d="M34 26L28 32L34 38" stroke="${c1}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="54" y1="24" x2="46" y2="40" stroke="${c2}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M66 26L72 32L66 38" stroke="${c1}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Inner Geometric JK Monogram -->
  <!-- J -->
  <path d="M36 46H44V64C44 68 41 71 36 71C32 71 28 68 28 64H34C34 65 35 66 36 66C37.5 66 38 65 38 63V52H36V46Z" fill="${c1}"/>
  <!-- K -->
  <path d="M52 46H58V56L68 46H76L64 58L77 72H68L58 61V72H52V46Z" fill="${c2}"/>

  <!-- Tech Dots / Accents -->
  <circle cx="50" cy="82" r="2.5" fill="#ffffff"/>
  <line x1="26" y1="50" x2="26" y2="60" stroke="${c1}" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="74" y1="50" x2="74" y2="60" stroke="${c2}" stroke-width="1.5" stroke-linecap="round"/>
</svg>`
  },

  'neon-shield': {
    id: 'neon-shield',
    name: 'Neon Cyber Shield',
    description: 'Futuristic neon cybersecurity polygon shield with glowing angled JK monogram',
    svg: (c1 = '#22d3ee', c2 = '#ec4899') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ns-glow" x1="12" y1="12" x2="88" y2="92" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="ns-bloom" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Outer Neon Polygonal Plate -->
  <polygon points="50,8 86,20 86,60 50,92 14,60 14,20" stroke="url(#ns-glow)" stroke-width="2.5" fill="#090d16" filter="url(#ns-bloom)"/>

  <!-- Inner Defensive Mesh Lines -->
  <polygon points="50,16 78,26 78,56 50,82 22,56 22,26" stroke="${c1}" stroke-width="1" stroke-opacity="0.35" fill="none"/>
  <line x1="50" y1="16" x2="50" y2="82" stroke="${c2}" stroke-width="1" stroke-opacity="0.4" stroke-dasharray="2 4"/>

  <!-- Center Cyber Monogram JK -->
  <!-- J -->
  <path d="M34 36H44V58C44 64 38 68 32 68H28V62H32C35 62 37 60 37 57V42H34V36Z" fill="${c1}"/>
  <!-- K -->
  <path d="M52 36H59V50L70 36H78L66 52L79 68H70L59 54V68H52V36Z" fill="${c2}"/>

  <!-- Node Flares -->
  <circle cx="50" cy="8" r="3" fill="#ffffff"/>
  <circle cx="86" cy="20" r="2" fill="${c1}"/>
  <circle cx="14" cy="20" r="2" fill="${c2}"/>
  <circle cx="50" cy="92" r="3" fill="${c1}"/>
</svg>`
  },

  'minimal-seal': {
    id: 'minimal-seal',
    name: 'Minimalist Seal',
    description: 'Clean minimalist circular geometric seal with modern precision typography',
    svg: (c1 = '#22d3ee', c2 = '#8b5cf6') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ms-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>

  <!-- Outer Precision Dashed Ring -->
  <circle cx="50" cy="50" r="44" stroke="url(#ms-grad)" stroke-width="1.5" stroke-dasharray="2 6"/>

  <!-- Inner Solid Precision Border -->
  <circle cx="50" cy="50" r="38" stroke="${c1}" stroke-width="2" fill="#090d16"/>

  <!-- Cardinal Precision Coordinate Ticks -->
  <line x1="50" y1="2" x2="50" y2="8" stroke="${c1}" stroke-width="2"/>
  <line x1="50" y1="92" x2="50" y2="98" stroke="${c1}" stroke-width="2"/>
  <line x1="2" y1="50" x2="8" y2="50" stroke="${c1}" stroke-width="2"/>
  <line x1="92" y1="50" x2="98" y2="50" stroke="${c1}" stroke-width="2"/>

  <!-- Precision Monogram JK -->
  <!-- J -->
  <path d="M33 34H43V55C43 62 38 66 31 66C26 66 23 63 23 59H29C29 60.5 30 61.5 31.5 61.5C34 61.5 35.5 59.5 35.5 55V40H33V34Z" fill="${c1}"/>
  <!-- K -->
  <path d="M51 34H58.5V47.5L68 34H77L64.5 50L78 66H69L58.5 52.5V66H51V34Z" fill="${c2}"/>

  <!-- Central Diamond Intersection Node -->
  <polygon points="50,47 53,50 50,53 47,50" fill="#ffffff"/>
</svg>`
  },
};

/**
 * Returns raw standalone SVG string for the requested preset
 */
export function getLogoSvg(presetName = 'hex-ribbon', options = {}) {
  const preset = LOGO_PRESETS[presetName] || LOGO_PRESETS['hex-ribbon'];
  const c1 = options.primary_color || '#22d3ee';
  const c2 = options.secondary_color || '#8b5cf6';
  return preset.svg(c1, c2).trim();
}

/**
 * Converts an SVG string or URL into a browser-compatible favicon data URI
 */
export function toFaviconUri(svgOrUrl) {
  if (!svgOrUrl) return '/favicon.svg';
  if (svgOrUrl.startsWith('<svg')) {
    const clean = svgOrUrl.includes('xmlns')
      ? svgOrUrl
      : svgOrUrl.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clean)}`;
  }
  return svgOrUrl;
}

/**
 * Dynamically synchronizes <link rel="icon"> and <link rel="apple-touch-icon">
 */
export function syncBrowserFavicon(logoConfig = {}) {
  try {
    let sourceUri;
    if (logoConfig.preset === 'custom' && logoConfig.custom_url) {
      sourceUri = logoConfig.custom_url;
    } else {
      const svg = getLogoSvg(logoConfig.preset || 'hex-ribbon', logoConfig);
      sourceUri = toFaviconUri(svg);
    }

    // Update or create <link rel="icon">
    let iconLink = document.querySelector('link[rel="icon"]');
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.type = sourceUri.startsWith('data:image/svg+xml') ? 'image/svg+xml' : 'image/png';
    iconLink.href = sourceUri;

    // Update or create <link rel="apple-touch-icon">
    let appleLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = sourceUri;
  } catch (err) {
    console.warn('Failed to sync browser favicon:', err);
  }
}

/**
 * Renders the brand logo into a container element (.mono)
 */
export function renderBrandLogo(containerEl, logoConfig = {}) {
  if (!containerEl) return;

  const isCustom = logoConfig.preset === 'custom' && logoConfig.custom_url;

  if (isCustom) {
    containerEl.innerHTML = `<img src="${logoConfig.custom_url}" alt="Jai Kiran Brand Monogram" style="width:100%;height:100%;object-fit:contain;border-radius:8px;display:block">`;
  } else {
    const preset = logoConfig.preset || 'hex-ribbon';
    const svgStr = getLogoSvg(preset, logoConfig);
    containerEl.innerHTML = svgStr;
  }

  // Set accessibility label and title
  containerEl.setAttribute('role', 'img');
  containerEl.setAttribute('aria-label', 'Jai Kiran Brand Monogram Logo');
  containerEl.removeAttribute('aria-hidden');

  // Sync browser favicon
  syncBrowserFavicon(logoConfig);
}
