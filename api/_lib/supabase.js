// ==============================================================================
// SUPABASE CLIENT INITIALIZATION & RESILIENT FALLBACK PROVIDER
// ==============================================================================
import { createClient } from '@supabase/supabase-js';

function normalizeConfig(rawUrl, rawAnon, rawService) {
  let url = (rawUrl || '').trim().replace(/^["']|["']$/g, '').trim();
  let anon = (rawAnon || '').trim().replace(/^["']|["']$/g, '').trim();
  let service = (rawService || '').trim().replace(/^["']|["']$/g, '').trim();

  // Handle accidental swap of URL and Key
  if (url.startsWith('eyJ') && (anon.startsWith('http') || anon.includes('.supabase.co'))) {
    const temp = url;
    url = anon;
    anon = temp;
  }

  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    try {
      const parsed = new URL(url);
      url = parsed.origin;
    } catch (_) {
      url = url.replace(/\/+(auth|rest)(\/v\d+)?\/?$/i, '').replace(/\/+$/, '');
    }
  }

  return { url, anon, service };
}

const config = normalizeConfig(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const SUPABASE_URL = config.url;
export const SUPABASE_ANON_KEY = config.anon;
export const SUPABASE_SERVICE_KEY = config.service;

export const hasSupabaseConfig = Boolean(SUPABASE_URL && (SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY));

// Initialize standard Supabase client with cleaned URL
export const supabase = hasSupabaseConfig
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    })
  : null;

// ==============================================================================
// IN-MEMORY FALLBACK STORE (USED WHEN SUPABASE CREDENTIALS ARE NOT YET CONFIGURED)
// Ensures local development, testing, and initial setup work out-of-the-box!
// ==============================================================================
export const memoryStore = {
  profile: {
    id: 1,
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
    updated_at: new Date().toISOString(),
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
        '## Overview\nA 4-page responsive restaurant website (home, menu, about, reservations) built with zero frameworks.',
      tech_stack: ['HTML5', 'CSS3 (Grid/Flexbox)', 'Vanilla JavaScript', 'Intersection Observer', 'GitHub Pages'],
      repo_url: 'https://github.com/Jaikiran1212/spicegarden-website',
      live_url: 'https://jaikiran1212.github.io/spicegarden-website/',
      image_url: '',
      featured: true,
      published: true,
      display_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
        '## Overview\nTeam project from our Data Structures & Algorithms course visualizing Knuth’s Dancing Links (Algorithm X).',
      tech_stack: ['JavaScript', 'HTML5', 'CSS3', 'C++ Solver Logic', 'Algorithm Visualization'],
      repo_url: 'https://github.com/Jaikiran1212/DLX-Sudoku-Constraint-Solver',
      live_url: '',
      image_url: '',
      featured: true,
      published: true,
      display_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
        '## Overview\nCampus Infrastructure Anomaly System engineered with Cloud Firestore and strict security rules.',
      tech_stack: ['Cloud Firestore', 'Security Rules', 'JavaScript (ES6)', 'HTML5', 'Access Control (RBAC)'],
      repo_url: 'https://github.com/Jaikiran1212',
      live_url: '',
      image_url: '',
      featured: true,
      published: true,
      display_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
  messages: [],
  audit_logs: [
    {
      id: 1,
      actor_email: 'system',
      action: 'SYSTEM_INITIALIZED',
      resource: 'database',
      details: { note: 'Initial seed records initialized' },
      created_at: new Date().toISOString(),
    },
  ],
  admin_users: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'jaikiranjp@gmail.com',
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  ],
  devAdminPassword: null,
  recoveryOtps: {},
};
