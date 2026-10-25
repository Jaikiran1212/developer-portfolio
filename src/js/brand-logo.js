// ==============================================================================
// CREATIVE BRAND LOGO SYSTEM & AUTO-FAVICON SYNC ENGINE
// Abstract Geometric Emblems with Subliminal, Non-Explicit "JK" Integration
// Inspired by Tomasz Gajda, Penrose Optical Geometry & Swiss Modernism
// ==============================================================================

/**
 * 5 Built-in Creative Vector Logo Presets
 * Each logo creatively and subliminally integrates the essence of "JK" into pure abstract geometry.
 */
export const LOGO_PRESETS = {
  'hex-ribbon': {
    id: 'hex-ribbon',
    name: 'Hex Ribbon Monogram',
    description: 'Interlocking isometric geometric ribbon emblem with origami facet folds and subliminal JK flow (Tomasz Gajda inspired)',
    isDefault: true,
    svg: (c1 = '#22d3ee', c2 = '#8b5cf6') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Cyan to Deep Sky Gradient -->
    <linearGradient id="hr-c1" x1="15" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <!-- Electric Violet to Magenta Gradient -->
    <linearGradient id="hr-c2" x1="85" y1="10" x2="15" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>

    <!-- Emerald / Cyan Transition -->
    <linearGradient id="hr-c3" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>

    <!-- Ambient Occlusion Shadow for 3D Ribbon Overlap -->
    <linearGradient id="hr-shadow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#030712" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#030712" stop-opacity="0.15"/>
    </linearGradient>

    <!-- Specular Highlight for Top Bevels -->
    <linearGradient id="hr-specular" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>

    <filter id="hr-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Ambient Geometric Hexagon Wireframe Aura -->
  <polygon points="50,8 86,28 86,72 50,92 14,72 14,28" stroke="url(#hr-c1)" stroke-width="1.2" stroke-opacity="0.28" fill="none"/>

  <!-- ========================================================================
       TOMASZ GAJDA INSPIRED INTERLOCKING RIBBON ARCHITECTURE
       A continuous 3D isometric ribbon loop where the flowing facets subliminally
       encode the descending leftward-to-bottom hook of 'J' and the interlocking
       60° diagonal branching chevron facets of 'K'.
       ======================================================================== -->

  <!-- [Facet A: Top-Left Header Bevel] -->
  <polygon points="50,11 83,30 68,38 50,27" fill="url(#hr-c3)"/>
  <polygon points="50,11 83,30 68,38 50,27" fill="url(#hr-specular)"/>

  <!-- [Facet B: Left Descending J-Spine Outer Ribbon] -->
  <polygon points="17,30 50,11 50,27 32,38 32,66 17,58" fill="url(#hr-c1)"/>

  <!-- [Facet C: Left Descending J-Spine Inner Plane (Depth Shadow)] -->
  <polygon points="32,38 50,27 50,44 32,54" fill="#0369a1"/>

  <!-- [Facet D: J-Hook Bottom Sweep & Terminal Isometric Rise] -->
  <polygon points="17,58 32,66 32,74 50,84 50,68 62,61 62,77 50,84 17,65" fill="url(#hr-c2)"/>
  <polygon points="50,68 62,61 62,77 50,84" fill="#6d28d9"/>

  <!-- [Facet E: Central Chiral Interlock Node] -->
  <polygon points="46,39 54,43 54,58 46,53" fill="url(#hr-shadow)"/>
  <polygon points="48,41 52,43 52,56 48,53" fill="${c1}" fill-opacity="0.9"/>

  <!-- [Facet F: K Upper Diagonal Branch (Isometric 30° Ascent)] -->
  <polygon points="50,44 68,38 83,29 65,20" fill="url(#hr-c2)"/>
  <polygon points="68,38 83,29 83,47 68,56" fill="#7c3aed"/>
  <polygon points="68,38 83,29 83,47 68,56" fill="url(#hr-specular)"/>

  <!-- [Facet G: K Lower Diagonal Branch (Isometric -30° Descent)] -->
  <polygon points="50,44 68,56 83,70 65,80" fill="url(#hr-c1)"/>
  <polygon points="68,56 83,70 83,52 68,38" fill="#0284c7"/>

  <!-- [Central Negative-Space Diamond Core Glow] -->
  <polygon points="50,38 60,44 50,50 40,44" fill="${c1}" fill-opacity="0.2" stroke="${c1}" stroke-width="0.8"/>

  <!-- Precision Vertex Flares -->
  <circle cx="50" cy="11" r="2.5" fill="#ffffff" filter="url(#hr-glow)"/>
  <circle cx="83" cy="29" r="1.8" fill="${c1}"/>
  <circle cx="83" cy="70" r="1.8" fill="${c2}"/>
  <circle cx="50" cy="84" r="2" fill="#ffffff"/>
  <circle cx="17" cy="30" r="1.8" fill="${c1}"/>
  <circle cx="17" cy="58" r="1.8" fill="${c2}"/>
</svg>`
  },

  'cyber-knot': {
    id: 'cyber-knot',
    name: 'Cyber Knot 3D',
    description: 'Impossible Penrose hex-knot with isometric prismatic beams and subliminal JK optical flow',
    svg: (c1 = '#22d3ee', c2 = '#8b5cf6') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ck-b1" x1="16" y1="20" x2="84" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="ck-b2" x1="84" y1="20" x2="16" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="ck-top" x1="50" y1="12" x2="50" y2="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <!-- Outer Isometric Cube / Hexagon Envelope -->
  <polygon points="50,10 86,30 86,72 50,92 14,72 14,30" stroke="${c1}" stroke-width="1.5" stroke-opacity="0.4" fill="#090d16"/>

  <!-- Optical Impossible Prismatic Beams -->
  <!-- Beam 1: Descending Vertical Spine looping inward at base (Abstract 'J' flow) -->
  <polygon points="22,34 38,26 38,62 54,71 54,82 22,64" fill="url(#ck-b1)"/>
  <polygon points="22,34 38,26 38,62 54,71 54,82 22,64" fill="url(#ck-top)"/>

  <!-- Beam 2: Interlocking Upper Cross-Branch (Abstract Upper 'K' arm) -->
  <polygon points="38,26 68,10 82,18 52,35 52,48 38,40" fill="url(#ck-b2)"/>

  <!-- Beam 3: Interlocking Lower Diagonal Branch (Abstract Lower 'K' arm) -->
  <polygon points="52,48 78,63 78,74 52,60" fill="url(#ck-b1)"/>
  <polygon points="62,39 78,48 78,63 62,54" fill="#7c3aed"/>

  <!-- Negative Space Isometric Core -->
  <polygon points="50,42 64,50 50,58 36,50" fill="#030712" stroke="${c1}" stroke-width="1.2"/>
  <circle cx="50" cy="50" r="2.5" fill="#ffffff"/>

  <!-- Isometric Perimeter Nodes -->
  <circle cx="50" cy="10" r="2" fill="${c1}"/>
  <circle cx="86" cy="30" r="2" fill="${c2}"/>
  <circle cx="86" cy="72" r="2" fill="${c1}"/>
  <circle cx="50" cy="92" r="2" fill="${c2}"/>
  <circle cx="14" cy="72" r="2" fill="${c1}"/>
  <circle cx="14" cy="30" r="2" fill="${c2}"/>
</svg>`
  },

  'quantum-fold': {
    id: 'quantum-fold',
    name: 'Quantum Möbius Fold',
    description: 'Dynamic origami Möbius ribbon with continuous folding geometry and hidden JK cadence',
    svg: (c1 = '#22d3ee', c2 = '#8b5cf6') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="qf-grad1" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <linearGradient id="qf-grad2" x1="90" y1="10" x2="10" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ec4899"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>

  <!-- Hexagonal Shield Backplate -->
  <polygon points="50,8 86,22 86,64 50,92 14,64 14,22" stroke="url(#qf-grad1)" stroke-width="1.5" stroke-opacity="0.3" fill="#090d16"/>

  <!-- Continuous Origami Ribbon Topology (Subtle JK Silhouette) -->
  <!-- Segment 1: Descending Left Hook Ribbon ('J' sweep) -->
  <path d="M50 16L24 28V60L50 78V66L34 54V36L50 26V16Z" fill="url(#qf-grad1)"/>

  <!-- Segment 2: Central Crossover Fold with Negative Space Window -->
  <polygon points="50,26 66,36 50,46 34,36" fill="#0f172a" stroke="${c1}" stroke-width="1"/>

  <!-- Segment 3: Upper Diagonal Chevron Wing (Upper 'K' arm) -->
  <polygon points="50,46 76,28 84,34 58,52" fill="url(#qf-grad2)"/>

  <!-- Segment 4: Lower Diagonal Chevron Wing (Lower 'K' arm) -->
  <polygon points="50,46 58,52 84,68 76,74" fill="url(#qf-grad1)"/>

  <!-- Terminal Optical Fold Core -->
  <polygon points="50,46 58,52 50,58 42,52" fill="#ffffff" fill-opacity="0.85"/>
  <circle cx="50" cy="52" r="1.5" fill="#090d16"/>
</svg>`
  },

  'neon-prism': {
    id: 'neon-prism',
    name: 'Neon Prism Hex-Shield',
    description: 'Negative space geometric hexagon divided by neon energy fissures into abstract JK silhouettes',
    svg: (c1 = '#22d3ee', c2 = '#ec4899') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="np-glow" x1="14" y1="14" x2="86" y2="86" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="np-bloom" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Outer Neon Polygonal Rim -->
  <polygon points="50,8 86,22 86,64 50,92 14,64 14,22" stroke="url(#np-glow)" stroke-width="2" fill="#090d16" filter="url(#np-bloom)"/>
  <polygon points="50,8 86,22 86,64 50,92 14,64 14,22" stroke="#ffffff" stroke-width="1" stroke-opacity="0.5" fill="none"/>

  <!-- Monolithic Segment 1 (Left Block - Subtly forming an abstract 'J' silhouette) -->
  <path d="M46 16L20 28V60L46 76V64L30 54V34L46 25V16Z" fill="${c1}" fill-opacity="0.9"/>

  <!-- Monolithic Segment 2 (Upper Right Fin - Subtly forming the upper arm of 'K') -->
  <polygon points="54,20 80,32 80,44 54,32" fill="${c2}" fill-opacity="0.9"/>

  <!-- Monolithic Segment 3 (Lower Right Fin - Subtly forming the lower arm of 'K') -->
  <polygon points="54,40 80,52 80,64 54,76" fill="url(#np-glow)"/>

  <!-- Central Optical Spine Diamond -->
  <polygon points="50,34 54,38 50,42 46,38" fill="#ffffff"/>
  <polygon points="50,54 54,58 50,62 46,58" fill="#ffffff"/>

  <!-- Ambient Micro Dots -->
  <circle cx="50" cy="8" r="2.5" fill="#ffffff"/>
  <circle cx="50" cy="92" r="2.5" fill="${c1}"/>
</svg>`
  },

  'minimal-seal': {
    id: 'minimal-seal',
    name: 'Minimalist Monoline Knot',
    description: 'Precision circular seal featuring an unbroken continuous-stroke geometric monoline knot',
    svg: (c1 = '#22d3ee', c2 = '#8b5cf6') => `
<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ms-neon" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>

  <!-- Outer Precision Dashed Orbital Ring -->
  <circle cx="50" cy="50" r="44" stroke="url(#ms-neon)" stroke-width="1.2" stroke-dasharray="2 6"/>

  <!-- Inner High-Tech Frame -->
  <circle cx="50" cy="50" r="38" stroke="#334155" stroke-width="1.5" fill="#090d16"/>

  <!-- Cardinal Coordinate Hash Marks -->
  <line x1="50" y1="2" x2="50" y2="7" stroke="${c1}" stroke-width="2"/>
  <line x1="50" y1="93" x2="50" y2="98" stroke="${c1}" stroke-width="2"/>
  <line x1="2" y1="50" x2="7" y2="50" stroke="${c1}" stroke-width="2"/>
  <line x1="93" y1="50" x2="98" y2="50" stroke="${c1}" stroke-width="2"/>

  <!-- Unbroken Continuous Geometric Monoline Knot (Abstract JK Path) -->
  <!-- Left Descending Loop ('J' movement) and Interlocking Angled Chevron ('K' movement) -->
  <path d="M42 24H32V56C32 63 36 67 43 67C47 67 50 64 50 60V38L68 24M50 48L70 66"
        stroke="url(#ms-neon)"
        stroke-width="3.6"
        stroke-linecap="round"
        stroke-linejoin="round"/>

  <!-- Interlocking Central Tech Crosshair & Accents -->
  <circle cx="50" cy="38" r="2" fill="#ffffff"/>
  <circle cx="50" cy="60" r="2" fill="#ffffff"/>
  <circle cx="68" cy="24" r="2" fill="${c1}"/>
  <circle cx="70" cy="66" r="2" fill="${c2}"/>
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
    containerEl.innerHTML = `<img src="${logoConfig.custom_url}" alt="Brand Emblem" style="width:100%;height:100%;object-fit:contain;border-radius:8px;display:block">`;
  } else {
    const preset = logoConfig.preset || 'hex-ribbon';
    const svgStr = getLogoSvg(preset, logoConfig);
    containerEl.innerHTML = svgStr;
  }

  // Set accessibility label
  containerEl.setAttribute('role', 'img');
  containerEl.setAttribute('aria-label', 'Brand Geometric Monogram Logo');
  containerEl.removeAttribute('aria-hidden');

  // Sync browser favicon
  syncBrowserFavicon(logoConfig);
}
