// ==============================================================================
// DEFAULT SEED DATA & SVG ICONS CATALOG
// Guarantees instant client-side rendering and resilient offline fallback
// ==============================================================================

const S = (b) => `<svg viewBox="0 0 48 48">${b}</svg>`;
const T = (x, y, s, f, t) =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-size="${s}" font-weight="800" fill="${f}" font-family="Arial,sans-serif">${t}</text>`;

export const ICONS = {
  html5: S('<path fill="#E34F26" d="M6 4l3.3 37L24 45l14.7-4L42 4z"/><path fill="#EF652A" d="M24 41.6l11.9-3.3L38.7 7.5H24z"/>' + T(24, 31, 22, '#fff', '5')),
  css3: S('<path fill="#1572B6" d="M6 4l3.3 37L24 45l14.7-4L42 4z"/><path fill="#33A9DC" d="M24 41.6l11.9-3.3L38.7 7.5H24z"/>' + T(24, 31, 22, '#fff', '3')),
  javascript: S('<rect x="4" y="4" width="40" height="40" rx="3" fill="#F7DF1E"/>' + T(33, 40, 17, '#000', 'JS')),
  typescript: S('<rect x="4" y="4" width="40" height="40" rx="3" fill="#3178C6"/>' + T(33, 40, 17, '#fff', 'TS')),
  react: S('<g fill="none" stroke="#61DAFB" stroke-width="2.4"><ellipse cx="24" cy="24" rx="20" ry="7.5"/><ellipse cx="24" cy="24" rx="20" ry="7.5" transform="rotate(60 24 24)"/><ellipse cx="24" cy="24" rx="20" ry="7.5" transform="rotate(120 24 24)"/></g><circle cx="24" cy="24" r="3.5" fill="#61DAFB"/>'),
  nextjs: S('<circle cx="24" cy="24" r="21" fill="#000" stroke="#e2e8f0" stroke-width="2"/>' + T(24, 32, 22, '#fff', 'N')),
  tailwind: '<svg viewBox="0 0 24 24"><path fill="#06B6D4" d="M12 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.9.2 1.6.9 2.3 1.6C13.7 10.6 15 12 18 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.2-1.6-.9-2.3-1.6C16.3 6.2 15 4.8 12 4.8zM6 12c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.9.2 1.6.9 2.3 1.6C7.7 17.8 9 19.2 12 19.2c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.9-.2-1.6-.9-2.3-1.6C10.3 13.4 9 12 6 12z"/></svg>',
  java: S('<path fill="#E76F00" d="M16 33c-4 0-6 2-6 3.5 0 3 4 5 14 5s14-2 14-5c0-1.5-2-3-6-3.5l-2 1.5c3 .3 5 .8 5 1.5s-3 2-11 2-11-1.2-11-2 2-1.2 5-1.5z"/><path fill="#5382A1" d="M12 22h20v8c0 4-4 6-10 6s-10-2-10-6z"/><path fill="none" stroke="#5382A1" stroke-width="3" d="M32 24h3c3 0 3 7 0 7h-3"/><path fill="none" stroke="#E76F00" stroke-width="2.4" stroke-linecap="round" d="M20 5c4 3-4 6 0 9M27 7c3 2-2 4 0 7"/>'),
  python: S('<path fill="#3776AB" d="M24 4c-8 0-8 3.5-8 3.5V12h8v1.5H12S5 13 5 22s6 9 6 9h4v-4.5s0-6 6-6h8s5.5 0 5.5-5.3V10S36 4 24 4zm-4.5 3a1.6 1.6 0 110 3.2 1.6 1.6 0 010-3.2z"/><path fill="#FFD43B" d="M24 44c8 0 8-3.5 8-3.5V36h-8v-1.5h12S43 35 43 26s-6-9-6-9h-4v4.5s0 6-6 6h-8s-5.5 0-5.5 5.3V38S12 44 24 44zm4.5-3a1.6 1.6 0 110-3.2 1.6 1.6 0 010 3.2z"/>'),
  git: S('<path fill="#F05032" d="M45 22.5L25.5 3a2.8 2.8 0 00-4 0l-4 4 5 5a3.3 3.3 0 014.2 4.2l4.8 4.8a3.3 3.3 0 11-2 2l-4.5-4.5v11.8a3.3 3.3 0 11-2.7 0V19.7a3.3 3.3 0 01-1.8-4.3l-4.9-4.9L2.8 22.5a2.8 2.8 0 000 4L22.5 46a2.8 2.8 0 004 0L45 27.5a2.8 2.8 0 000-4z"/>'),
  github: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .3"/></svg>',
  nodejs: S('<path fill="#339933" d="M24 3l18 10.5v21L24 45 6 34.5v-21z"/>' + T(24, 30, 13, '#fff', 'node')),
  docker: S('<g fill="#2496ED"><rect x="8" y="19" width="6" height="5"/><rect x="15" y="19" width="6" height="5"/><rect x="22" y="19" width="6" height="5"/><rect x="15" y="13" width="6" height="5"/><rect x="22" y="13" width="6" height="5"/><rect x="22" y="7" width="6" height="5"/><path d="M3 26h36c2-.5 3-2 3-4 2 .5 3 2 3 3-1 3-4 4-6 4-3 8-10 12-20 12C8 41 3 35 3 26z"/></g>'),
  cloud: S('<path fill="#38bdf8" d="M12 36a8 8 0 010-16 11 11 0 0120-3 9 9 0 014 19z"/><path fill="#f59e0b" d="M24 22l7 8h-4v8h-6v-8h-4z"/>'),
  iam: S('<path fill="#22d3ee" d="M24 3l16 6v12c0 11-7 18-16 22C15 39 8 32 8 21V9z"/><circle cx="24" cy="19" r="5" fill="#0f172a"/><path fill="#0f172a" d="M22 23h4v10h-4z"/>'),
  incident: S('<rect x="9" y="21" width="30" height="22" rx="4" fill="#f43f5e"/><path fill="none" stroke="#fda4af" stroke-width="4" d="M15 21v-6a9 9 0 0118 0v6"/><circle cx="24" cy="32" r="3.5" fill="#fff"/>'),
  log: S('<rect x="5" y="6" width="26" height="32" rx="3" fill="#6366f1"/><path stroke="#c7d2fe" stroke-width="3" d="M10 14h16M10 21h16M10 28h10"/><circle cx="33" cy="32" r="8" fill="none" stroke="#fbbf24" stroke-width="4"/><path stroke="#fbbf24" stroke-width="4" stroke-linecap="round" d="M39 38l5 5"/>'),
  uml: S('<rect x="4" y="5" width="18" height="12" rx="2" fill="#a78bfa"/><rect x="26" y="31" width="18" height="12" rx="2" fill="#34d399"/><path fill="none" stroke="#e2e8f0" stroke-width="2.5" d="M13 17v14h13"/><circle cx="35" cy="11" r="6" fill="#fbbf24"/>'),
  linux: S('<rect x="3" y="7" width="42" height="34" rx="5" fill="#111827" stroke="#e2e8f0" stroke-width="2"/><path stroke="#e2e8f0" stroke-width="2" d="M3 15h42"/>' + T(17, 34, 16, '#22c55e', '>_')),
  dsa: S('<circle cx="12" cy="10" r="5" fill="#22d3ee"/><circle cx="36" cy="10" r="5" fill="#8b5cf6"/><circle cx="24" cy="38" r="5" fill="#f59e0b"/><path stroke="#e2e8f0" stroke-width="2.5" d="M12 10h24M12 10l12 28M36 10L24 38"/>'),
  cpp: S('<path fill="#00599C" d="M24 3l18 10.5v21L24 45 6 34.5v-21z"/>' + T(24, 30, 14, '#fff', 'C++')),
  mongodb: S('<path fill="#47A248" d="M24 3c4 6 10 11 10 20s-5 15-10 18c-5-3-10-9-10-18S20 9 24 3z"/><path stroke="#fff" stroke-width="2" d="M24 14v30"/>'),
  mysql: S('<rect x="4" y="10" width="40" height="28" rx="6" fill="#00758F"/>' + T(24, 30, 15, '#F29111', 'SQL')),
  sass: S('<circle cx="24" cy="24" r="21" fill="#CC6699"/>' + T(24, 32, 22, '#fff', 'S')),
  figma: S('<path fill="#F24E1E" d="M16 4h8v13h-8a6.5 6.5 0 010-13z"/><path fill="#FF7262" d="M24 4h8a6.5 6.5 0 010 13h-8z"/><path fill="#A259FF" d="M16 17h8v13h-8a6.5 6.5 0 010-13z"/><circle cx="32" cy="23.5" r="6.5" fill="#1ABCFE"/><path fill="#0ACF83" d="M16 30h8v6.5A6.5 6.5 0 1116 30z"/>'),
};

export const SOCIAL_ICONS = {
  email: S('<rect x="4" y="9" width="40" height="30" rx="4" fill="#fff"/><path fill="#4285F4" d="M4 13v24a2 2 0 002 2h6V19z"/><path fill="#34A853" d="M44 13v24a2 2 0 01-2 2h-6V19z"/><path fill="#FBBC05" d="M12 39V19l12 9 12-9v20z"/><path fill="#EA4335" d="M4 13l20 15 20-15v-1a3 3 0 00-3-3H7a3 3 0 00-3 3z"/>'),
  github: S('<rect x="3" y="3" width="42" height="42" rx="11" fill="#181717" stroke="#9ca3af" stroke-width="1.5"/><g transform="translate(12 12) scale(1)"><path fill="#fff" d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .3"/></g>'),
  linkedin: S('<rect x="3" y="3" width="42" height="42" rx="9" fill="#0A66C2"/>' + T(24, 34, 24, '#fff', 'in')),
  leetcode: S('<rect x="3" y="3" width="42" height="42" rx="11" fill="#111827"/><path d="M29 12L15 26a5 5 0 000 7l3 3a5 5 0 007 0l3-3" fill="none" stroke="#FFA116" stroke-width="4" stroke-linecap="round"/><path d="M19 24h18" stroke="#B3B3B3" stroke-width="4" stroke-linecap="round"/>'),
  instagram: S('<defs><radialGradient id="igr" cx=".3" cy="1.1" r="1.3"><stop offset="0" stop-color="#fdf497"/><stop offset=".25" stop-color="#fd5949"/><stop offset=".6" stop-color="#d6249f"/><stop offset="1" stop-color="#285AEB"/></radialGradient></defs><rect x="3" y="3" width="42" height="42" rx="12" fill="url(#igr)"/><rect x="12" y="12" width="24" height="24" rx="7" fill="none" stroke="#fff" stroke-width="3"/><circle cx="24" cy="24" r="6" fill="none" stroke="#fff" stroke-width="3"/><circle cx="32" cy="16" r="1.8" fill="#fff"/>'),
  phone: S('<rect x="3" y="3" width="42" height="42" rx="11" fill="#10b981"/><path fill="#fff" d="M16 13h5l2 6-3 2a14 14 0 006 6l2-3 6 2v5a3 3 0 01-3 3C23 34 13 24 13 16a3 3 0 013-3z"/>'),
  location: S('<rect x="3" y="3" width="42" height="42" rx="11" fill="#06b6d4"/><path fill="#fff" d="M24 11a9 9 0 00-9 9c0 7 9 17 9 17s9-10 9-17a9 9 0 00-9-9z"/><circle cx="24" cy="20" r="3.5" fill="#06b6d4"/>'),
  website: S('<defs><linearGradient id="gw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><circle cx="24" cy="24" r="20" fill="none" stroke="url(#gw)" stroke-width="3.5"/><ellipse cx="24" cy="24" rx="8.5" ry="20" fill="none" stroke="url(#gw)" stroke-width="3"/><path stroke="url(#gw)" stroke-width="3" d="M4 24h40"/>'),
};

export const SOCIAL_GLOW = {
  email: '#EA4335',
  github: '#a78bfa',
  linkedin: '#0A66C2',
  leetcode: '#FFA116',
  instagram: '#d6249f',
  phone: '#10b981',
  location: '#06b6d4',
  website: '#22d3ee',
};

export const DEFAULT_PORTFOLIO_DATA = {
  profile: {
    greet: 'Hi, I am',
    name: 'Jai Kiran',
    subs: ['Frontend Developer', 'Full-Stack Engineer', 'Cybersecurity Enthusiast'],
    lead_bio:
      'Computer Science & Engineering student at Amrita Vishwa Vidyapeetham with hands-on experience in web development, interactive algorithmic visualizers, and cybersecurity incident analysis.',
    email: 'jaikiranjp@gmail.com',
    phone: '+91 9445187244',
    location: 'Trichy / Coimbatore',
    resume_url: 'https://drive.google.com/file/d/1YQp_62YhIoTQBWrKt6myzLJA4oJjEzZv/view?usp=drive_link',
    font_preset: 'Cyber Geometric',
    theme: 'Alternating Contrast',
    photo_config: {
      src: '/images/profile.png',
      width: 400,
      height: 480,
      scale: 1,
      x: 0,
      y: 0,
      feather: 10,
      bgMode: 'Transparent / None',
      frame: 'cutout',
      autoCutout: true,
      cutoutTolerance: 38,
    },
    logo_config: {
      preset: 'hex-ribbon',
      custom_url: '',
      primary_color: '#22d3ee',
      secondary_color: '#8b5cf6',
    },
  },
  projects: [
    {
      id: 1,
      slug: 'spicegarden',
      title: 'SpiceGarden – Responsive Restaurant Website',
      category: 'Frontend',
      short_desc:
        '4-page responsive restaurant site built with zero frameworks: sticky navbar, tabbed dish filtering, Intersection Observer animations, parallax layers and a validated reservation form.',
      problem_statement:
        'Local restaurant websites often suffer from slow page load times, poor mobile UX, and heavy framework dependencies that cause high latency on mobile networks.',
      solution:
        'Engineered an ultra-lightweight, zero-framework, 4-page responsive website utilizing pure modern HTML5, CSS Grid/Flexbox, and vanilla JavaScript for sub-second page loads and seamless interaction.',
      architecture:
        'Static modular architecture; CSS variables for cohesive theme tokens; Intersection Observer API for off-main-thread scroll animations; zero render-blocking libraries.',
      my_contribution:
        'Designed the UI/UX layout from scratch, coded the dynamic tabbed dish filter, implemented the interactive reservation form with client-side regex validation, and deployed to GitHub Pages.',
      challenges:
        'Ensuring silky-smooth 60fps animations across low-end mobile viewports without layout jank or memory leaks.',
      measurable_results:
        'Achieved a 99+ Lighthouse performance score, zero external runtime dependencies, and under 50KB total payload.',
      notes_markdown:
        '## Overview\nA 4-page responsive restaurant website (home, menu, about, reservations) built with zero frameworks.\n\n## Architecture\n- Mobile-first layout using CSS Grid, Flexbox and CSS variables\n- Sticky navbar that reacts to scroll position\n- Tabbed menu with dish filtering\n- Scroll-reveal animations via Intersection Observer API\n- Reservation form with client-side regex validation',
      tech_stack: ['HTML5', 'CSS3 (Grid/Flexbox)', 'Vanilla JS', 'GitHub Pages'],
      repo_url: 'https://github.com/Jaikiran1212/spicegarden-website',
      live_url: 'https://jaikiran1212.github.io/spicegarden-website/',
      image_url: '',
      featured: true,
      published: true,
      display_order: 1,
    },
    {
      id: 2,
      slug: 'dlx-sudoku',
      title: 'DLX Sudoku Solver with Algorithm Visualization',
      category: 'DSA',
      short_desc:
        'Team project: an educational visualizer for Knuth’s Dancing Links (Algorithm X) solving exact cover problems, with step-by-step playback, speed control and live grid rendering.',
      problem_statement:
        'Knuth’s Algorithm X and Dancing Links (DLX) are notoriously difficult for students and engineers to visualize due to the quad-linked toroidal doubly-linked matrix operations.',
      solution:
        'Built an interactive educational visualizer that models Sudoku as an exact cover problem, rendering matrix link unlinking and rewinding in real-time step-by-step playback.',
      architecture:
        'Separation of concerns between computation and presentation: high-performance C++ backend logic mapped to an interactive web UI rendering grid states and execution trees.',
      my_contribution:
        'Built the entire interactive frontend UI in HTML, CSS, and modern JavaScript. Implemented step-by-step playback controls, adjustable execution delay, dynamic grid state updates, and constraint violation indicators.',
      challenges:
        'Handling high-frequency state updates without freezing the browser DOM during deep recursive backtracking searches.',
      measurable_results:
        'Successfully visualizes 81-cell exact cover matrices with 724 columns in real-time with variable step speeds from 10ms to 1000ms.',
      notes_markdown:
        '## Overview\nTeam project from our Data Structures & Algorithms course visualizing Knuth’s Dancing Links (Algorithm X).\n\n## My Contribution\n- Built the interactive frontend UI in HTML, CSS and JavaScript\n- Step-by-step playback with speed control\n- Dynamic grid state rendering as solver covers/uncovers columns\n\n## Solver Logic\n- C++ solver logic written by teammates',
      tech_stack: ['JavaScript', 'HTML5', 'CSS3', 'C++ Solver Logic'],
      repo_url: 'https://github.com/Jaikiran1212/DLX-Sudoku-Constraint-Solver',
      live_url: '',
      image_url: '',
      featured: true,
      published: true,
      display_order: 2,
    },
    {
      id: 3,
      slug: 'campus-watch',
      title: 'CampusWatch: Campus Infrastructure Anomaly & Incident Management',
      category: 'Cybersecurity',
      short_desc:
        'Full-stack cloud-native anomaly detection & reporting system for campus infrastructure with role-based Firestore access controls, real-time audit logging, and composite query optimization.',
      problem_statement:
        'University campus safety and maintenance reports often face delayed triage, lack of location-tagged evidence, and unauthorized tampering of incident records.',
      solution:
        'Architected a cloud-backed incident management system utilizing Google Cloud Firestore, granular role-based security rules (student vs admin), real-time incident queues, and automated audit trails.',
      architecture:
        'Role-based access model; Firestore declarative security rules verifying user token claims; composite indexes for multi-field filtering (category + severity + timestamp); offline data caching.',
      my_contribution:
        'Engineered the database schema, authored Firestore security rules restricting report modifications to authorized staff, designed the admin dashboard with severity badges, and created the DBMS comparison study.',
      challenges:
        'Designing secure declarative rules that prevent privilege escalation while permitting anonymous public submission of urgent emergency alerts.',
      measurable_results:
        'Eliminated unauthorized edits via strict RBAC rules and achieved sub-150ms real-time listener updates on incident status transitions.',
      notes_markdown:
        '## Overview\nCampus Infrastructure Anomaly System engineered with Cloud Firestore and strict security rules.\n\n## Security & Architecture\n- Role-based security (students submit reports; administrators triage)\n- Composite indexing on multi-field queries\n- Real-time incident listener updates\n- Comprehensive DBMS case study writeup',
      tech_stack: ['Cloud Firestore', 'Security Rules', 'JavaScript (ES6)', 'HTML5', 'Access Control (RBAC)'],
      repo_url: 'https://github.com/Jaikiran1212',
      live_url: '',
      image_url: '',
      featured: true,
      published: true,
      display_order: 3,
    },
  ],
  experience: [
    {
      id: 1,
      category: 'simulation',
      organization: 'Citi',
      role_title: 'Technology Software Development Simulation',
      duration: 'Apr 2026 | Forage',
      points: [
        'Queried and parsed live market data feeds utilizing object-oriented Java',
        'Drafted UML state modeling diagrams for fault-tolerant transaction pipelines',
        'Built real-time financial reporting visualizations and automated unit tests',
      ],
      tags: ['Java', 'UML', 'Financial Systems', 'Software Engineering'],
      credential_url: 'https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/Citi/credentials.pdf',
      display_order: 1,
      published: true,
    },
    {
      id: 2,
      category: 'simulation',
      organization: 'Deloitte Australia',
      role_title: 'Cyber Job Simulation',
      duration: 'Apr 2026 | Forage',
      points: [
        'Conducted cyber incident response triage following simulated enterprise breach events',
        'Analyzed web server and auth logs to trace threat actors and identify command-and-control indicators',
        'Drafted executive risk mitigation memos and actionable security remediations',
      ],
      tags: ['Incident Response', 'Log Analysis', 'Threat Hunting', 'Cybersecurity'],
      credential_url: 'https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/Deloitte/credentials.pdf',
      display_order: 2,
      published: true,
    },
    {
      id: 3,
      category: 'simulation',
      organization: 'Tata Consultancy Services',
      role_title: 'Cybersecurity Analyst Simulation',
      duration: 'Apr 2026 | Forage',
      points: [
        'Designed enterprise Identity & Access Management (IAM) architecture and governance policies',
        'Configured Principle of Least Privilege role mappings and multi-factor access barriers',
        'Formulated enterprise digital transformation security blueprints',
      ],
      tags: ['IAM', 'Access Control', 'Enterprise Security', 'Governance'],
      credential_url: 'https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/TCS/credentials.pdf',
      display_order: 3,
      published: true,
    },
    {
      id: 4,
      category: 'simulation',
      organization: 'Electronic Arts',
      role_title: 'Product Management Simulation',
      duration: 'Apr 2026 | Forage',
      points: [
        'Performed KPI telemetry analysis across active player cohorts',
        'Constructed player behavioral segmentation models to enhance feature retention',
        'Synthesized data-driven gaming product recommendations and feature roadmaps',
      ],
      tags: ['KPI Analysis', 'Telemetry', 'Product Management'],
      credential_url: 'https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/EA/credentials.pdf',
      display_order: 4,
      published: true,
    },
    {
      id: 5,
      category: 'certification',
      organization: 'IBM SkillsBuild',
      role_title: 'Getting Started with Artificial Intelligence',
      duration: 'Mar 2026',
      points: [
        'Studied foundational artificial intelligence and machine learning pipelines',
        'Evaluated enterprise use cases, ethical AI constraints, and neural network concepts',
      ],
      tags: ['Artificial Intelligence', 'Machine Learning', 'Ethics in Tech'],
      credential_url: 'https://www.credly.com/org/ibm/badges',
      display_order: 5,
      published: true,
    },
  ],
  skills: [
    { id: 1, tier: 'now', name: 'HTML5', icon_type: 'slug', icon_value: 'html5', proficiency_label: 'Advanced', display_order: 1 },
    { id: 2, tier: 'now', name: 'CSS3', icon_type: 'slug', icon_value: 'css3', proficiency_label: 'Advanced', display_order: 2 },
    { id: 3, tier: 'now', name: 'JavaScript (ES6+)', icon_type: 'slug', icon_value: 'javascript', proficiency_label: 'Proficient', display_order: 3 },
    { id: 4, tier: 'now', name: 'React', icon_type: 'slug', icon_value: 'react', proficiency_label: 'Working Knowledge', display_order: 4 },
    { id: 5, tier: 'now', name: 'Next.js', icon_type: 'slug', icon_value: 'nextjs', proficiency_label: 'Working Knowledge', display_order: 5 },
    { id: 6, tier: 'now', name: 'Tailwind CSS', icon_type: 'slug', icon_value: 'tailwind', proficiency_label: 'Proficient', display_order: 6 },
    { id: 7, tier: 'now', name: 'Java', icon_type: 'slug', icon_value: 'java', proficiency_label: 'Proficient', display_order: 7 },
    { id: 8, tier: 'now', name: 'Python', icon_type: 'slug', icon_value: 'python', proficiency_label: 'Familiar', display_order: 8 },
    { id: 9, tier: 'now', name: 'Git', icon_type: 'slug', icon_value: 'git', proficiency_label: 'Proficient', display_order: 9 },
    { id: 10, tier: 'now', name: 'GitHub', icon_type: 'slug', icon_value: 'github', proficiency_label: 'Proficient', display_order: 10 },
    { id: 11, tier: 'learn', name: 'TypeScript', icon_type: 'slug', icon_value: 'typescript', proficiency_label: 'Active Learner', display_order: 11 },
    { id: 12, tier: 'learn', name: 'Node.js', icon_type: 'slug', icon_value: 'nodejs', proficiency_label: 'Active Learner', display_order: 12 },
    { id: 13, tier: 'learn', name: 'Docker / Containers', icon_type: 'slug', icon_value: 'docker', proficiency_label: 'Foundational', display_order: 13 },
    { id: 14, tier: 'learn', name: 'Cloud & Serverless', icon_type: 'slug', icon_value: 'cloud', proficiency_label: 'Foundational', display_order: 14 },
    { id: 15, tier: 'learn', name: 'Advanced DSA', icon_type: 'slug', icon_value: 'dsa', proficiency_label: 'Active Practice', display_order: 15 },
    { id: 16, tier: 'cyber', name: 'IAM (Identity & Access)', icon_type: 'slug', icon_value: 'iam', proficiency_label: 'Applied Practice', display_order: 16 },
    { id: 17, tier: 'cyber', name: 'Incident Response', icon_type: 'slug', icon_value: 'incident', proficiency_label: 'Simulation Verified', display_order: 17 },
    { id: 18, tier: 'cyber', name: 'Log Analysis', icon_type: 'slug', icon_value: 'log', proficiency_label: 'Practical Experience', display_order: 18 },
    { id: 19, tier: 'cyber', name: 'UML State Modeling', icon_type: 'slug', icon_value: 'uml', proficiency_label: 'Proficient', display_order: 19 },
    { id: 20, tier: 'cyber', name: 'Linux / Bash', icon_type: 'slug', icon_value: 'linux', proficiency_label: 'Proficient', display_order: 20 },
  ],
  socials: [
    { id: 1, name: 'Email', url: 'mailto:jaikiranjp@gmail.com', icon: 'email', show_hero: true, show_contact: true, display_order: 1 },
    { id: 2, name: 'GitHub', url: 'https://github.com/Jaikiran1212', icon: 'github', show_hero: true, show_contact: true, display_order: 2 },
    { id: 3, name: 'LinkedIn', url: 'https://www.linkedin.com/in/jaikiran1212', icon: 'linkedin', show_hero: true, show_contact: true, display_order: 3 },
    { id: 4, name: 'LeetCode', url: 'https://leetcode.com/u/Jaikiran1212/', icon: 'leetcode', show_hero: true, show_contact: true, display_order: 4 },
    { id: 5, name: 'Instagram', url: 'https://instagram.com/jaikiran.jp', icon: 'instagram', show_hero: true, show_contact: true, display_order: 5 },
  ],
};
