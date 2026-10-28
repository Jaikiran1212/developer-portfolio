-- ==============================================================================
-- JAI KIRAN - DEVELOPER PORTFOLIO SEED DATA
-- GENERATED FILE - edit data/portfolio.json, then run: npm run seed:gen
-- ==============================================================================

-- 1. PROFILE
INSERT INTO public.profile (id, greet, name, subs, lead_bio, email, phone, location, resume_url, font_preset, theme, photo_config)
VALUES (1, 'Hi, I am', 'Jai Kiran', ARRAY['Frontend Developer', 'Full-Stack Engineer', 'Cybersecurity Enthusiast']::text[], 'Computer Science & Engineering student at Amrita Vishwa Vidyapeetham with hands-on experience in web development, interactive algorithmic visualizers, and cybersecurity incident analysis.', 'jaikiranjp@gmail.com', '+91 9445187244', 'Trichy / Coimbatore', 'https://drive.google.com/file/d/1YQp_62YhIoTQBWrKt6myzLJA4oJjEzZv/view?usp=drive_link', 'Cyber Geometric', 'Alternating Contrast', '{"src":"/images/profile.png","width":520,"height":620,"scale":1,"x":0,"y":0,"feather":10,"bgMode":"Transparent / None","frame":"cutout","autoCutout":true,"cutoutTolerance":38}'::jsonb)
ON CONFLICT (id) DO UPDATE SET greet = EXCLUDED.greet, name = EXCLUDED.name, subs = EXCLUDED.subs, lead_bio = EXCLUDED.lead_bio,
  email = EXCLUDED.email, phone = EXCLUDED.phone, location = EXCLUDED.location, resume_url = EXCLUDED.resume_url,
  font_preset = EXCLUDED.font_preset, theme = EXCLUDED.theme, photo_config = EXCLUDED.photo_config;

-- 2. PROJECTS
INSERT INTO public.projects (slug, title, category, short_desc, problem_statement, solution, architecture, my_contribution, challenges, measurable_results, notes_markdown, tech_stack, repo_url, live_url, image_url, featured, published, display_order)
VALUES ('spicegarden', 'SpiceGarden – Responsive Restaurant Website', 'Frontend', '4-page responsive restaurant site built with zero frameworks: sticky navbar, tabbed dish filtering, Intersection Observer animations, parallax layers and a validated reservation form.', 'Local restaurant websites often suffer from slow page load times, poor mobile UX, and heavy framework dependencies that cause high latency on mobile networks.', 'Engineered an ultra-lightweight, zero-framework, 4-page responsive website utilizing pure modern HTML5, CSS Grid/Flexbox, and vanilla JavaScript for sub-second page loads and seamless interaction.', 'Static modular architecture; CSS variables for cohesive theme tokens; Intersection Observer API for off-main-thread scroll animations; zero render-blocking libraries.', 'Designed the UI/UX layout from scratch, coded the dynamic tabbed dish filter, implemented the interactive reservation form with client-side regex validation, and deployed to GitHub Pages.', 'Ensuring silky-smooth 60fps animations across low-end mobile viewports without layout jank or memory leaks.', 'Achieved a 99+ Lighthouse performance score, zero external runtime dependencies, and under 50KB total payload.', '## Overview
A 4-page responsive restaurant website (home, menu, about, reservations) built with zero frameworks.

## Architecture
- Mobile-first layout using CSS Grid, Flexbox and CSS variables
- Sticky navbar that reacts to scroll position
- Tabbed menu with dish filtering
- Scroll-reveal animations via Intersection Observer API
- Reservation form with client-side regex validation', ARRAY['HTML5', 'CSS3 (Grid/Flexbox)', 'Vanilla JS', 'GitHub Pages']::text[], 'https://github.com/Jaikiran1212/spicegarden-website', 'https://jaikiran1212.github.io/spicegarden-website/', '', true, true, 1)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, short_desc = EXCLUDED.short_desc, problem_statement = EXCLUDED.problem_statement,
  solution = EXCLUDED.solution, architecture = EXCLUDED.architecture, my_contribution = EXCLUDED.my_contribution, challenges = EXCLUDED.challenges,
  measurable_results = EXCLUDED.measurable_results, notes_markdown = EXCLUDED.notes_markdown, tech_stack = EXCLUDED.tech_stack, repo_url = EXCLUDED.repo_url,
  live_url = EXCLUDED.live_url, image_url = EXCLUDED.image_url, featured = EXCLUDED.featured, published = EXCLUDED.published, display_order = EXCLUDED.display_order;

INSERT INTO public.projects (slug, title, category, short_desc, problem_statement, solution, architecture, my_contribution, challenges, measurable_results, notes_markdown, tech_stack, repo_url, live_url, image_url, featured, published, display_order)
VALUES ('dlx-sudoku', 'DLX Sudoku Solver with Algorithm Visualization', 'DSA', 'Team project: an educational visualizer for Knuth’s Dancing Links (Algorithm X) solving exact cover problems, with step-by-step playback, speed control and live grid rendering.', 'Knuth’s Algorithm X and Dancing Links (DLX) are notoriously difficult for students and engineers to visualize due to the quad-linked toroidal doubly-linked matrix operations.', 'Built an interactive educational visualizer that models Sudoku as an exact cover problem, rendering matrix link unlinking and rewinding in real-time step-by-step playback.', 'Separation of concerns between computation and presentation: high-performance C++ backend logic mapped to an interactive web UI rendering grid states and execution trees.', 'Built the entire interactive frontend UI in HTML, CSS, and modern JavaScript. Implemented step-by-step playback controls, adjustable execution delay, dynamic grid state updates, and constraint violation indicators.', 'Handling high-frequency state updates without freezing the browser DOM during deep recursive backtracking searches.', 'Successfully visualizes 81-cell exact cover matrices with 724 columns in real-time with variable step speeds from 10ms to 1000ms.', '## Overview
Team project from our Data Structures & Algorithms course visualizing Knuth’s Dancing Links (Algorithm X).

## My Contribution
- Built the interactive frontend UI in HTML, CSS and JavaScript
- Step-by-step playback with speed control
- Dynamic grid state rendering as solver covers/uncovers columns

## Solver Logic
- C++ solver logic written by teammates', ARRAY['JavaScript', 'HTML5', 'CSS3', 'C++ Solver Logic']::text[], 'https://github.com/Jaikiran1212/DLX-Sudoku-Constraint-Solver', '', '/images/dlx-sudoku-banner.webp', true, true, 2)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, short_desc = EXCLUDED.short_desc, problem_statement = EXCLUDED.problem_statement,
  solution = EXCLUDED.solution, architecture = EXCLUDED.architecture, my_contribution = EXCLUDED.my_contribution, challenges = EXCLUDED.challenges,
  measurable_results = EXCLUDED.measurable_results, notes_markdown = EXCLUDED.notes_markdown, tech_stack = EXCLUDED.tech_stack, repo_url = EXCLUDED.repo_url,
  live_url = EXCLUDED.live_url, image_url = EXCLUDED.image_url, featured = EXCLUDED.featured, published = EXCLUDED.published, display_order = EXCLUDED.display_order;

INSERT INTO public.projects (slug, title, category, short_desc, problem_statement, solution, architecture, my_contribution, challenges, measurable_results, notes_markdown, tech_stack, repo_url, live_url, image_url, featured, published, display_order)
VALUES ('campus-watch', 'CampusWatch: Campus Infrastructure Anomaly & Incident Management', 'Cybersecurity', 'Full-stack cloud-native anomaly detection & reporting system for campus infrastructure with role-based Firestore access controls, real-time audit logging, and composite query optimization.', 'University campus safety and maintenance reports often face delayed triage, lack of location-tagged evidence, and unauthorized tampering of incident records.', 'Architected a cloud-backed incident management system utilizing Google Cloud Firestore, granular role-based security rules (student vs admin), real-time incident queues, and automated audit trails.', 'Role-based access model; Firestore declarative security rules verifying user token claims; composite indexes for multi-field filtering (category + severity + timestamp); offline data caching.', 'Engineered the database schema, authored Firestore security rules restricting report modifications to authorized staff, designed the admin dashboard with severity badges, and created the DBMS comparison study.', 'Designing secure declarative rules that prevent privilege escalation while permitting anonymous public submission of urgent emergency alerts.', 'Eliminated unauthorized edits via strict RBAC rules and achieved sub-150ms real-time listener updates on incident status transitions.', '## Overview
Campus Infrastructure Anomaly System engineered with Cloud Firestore and strict security rules.

## Security & Architecture
- Role-based security (students submit reports; administrators triage)
- Composite indexing on multi-field queries
- Real-time incident listener updates
- Comprehensive DBMS case study writeup', ARRAY['Cloud Firestore', 'Security Rules', 'JavaScript (ES6)', 'HTML5', 'Access Control (RBAC)']::text[], 'https://github.com/Jaikiran1212', '', '', true, true, 3)
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, category = EXCLUDED.category, short_desc = EXCLUDED.short_desc, problem_statement = EXCLUDED.problem_statement,
  solution = EXCLUDED.solution, architecture = EXCLUDED.architecture, my_contribution = EXCLUDED.my_contribution, challenges = EXCLUDED.challenges,
  measurable_results = EXCLUDED.measurable_results, notes_markdown = EXCLUDED.notes_markdown, tech_stack = EXCLUDED.tech_stack, repo_url = EXCLUDED.repo_url,
  live_url = EXCLUDED.live_url, image_url = EXCLUDED.image_url, featured = EXCLUDED.featured, published = EXCLUDED.published, display_order = EXCLUDED.display_order;

-- 3. EXPERIENCE & CERTIFICATIONS (re-seeding replaces these rows)
DELETE FROM public.experience;
INSERT INTO public.experience (category, organization, role_title, duration, points, tags, credential_url, published, display_order) VALUES
  ('simulation', 'Citi', 'Technology Software Development Simulation', 'Apr 2026 | Forage', ARRAY['Queried and parsed live market data feeds utilizing object-oriented Java', 'Drafted UML state modeling diagrams for fault-tolerant transaction pipelines', 'Built real-time financial reporting visualizations and automated unit tests']::text[], ARRAY['Java', 'UML', 'Financial Systems', 'Software Engineering']::text[], 'https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/Citi/credentials.pdf', true, 1),
  ('simulation', 'Deloitte Australia', 'Cyber Job Simulation', 'Apr 2026 | Forage', ARRAY['Conducted cyber incident response triage following simulated enterprise breach events', 'Analyzed web server and auth logs to trace threat actors and identify command-and-control indicators', 'Drafted executive risk mitigation memos and actionable security remediations']::text[], ARRAY['Incident Response', 'Log Analysis', 'Threat Hunting', 'Cybersecurity']::text[], 'https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/Deloitte/credentials.pdf', true, 2),
  ('simulation', 'Tata Consultancy Services', 'Cybersecurity Analyst Simulation', 'Apr 2026 | Forage', ARRAY['Designed enterprise Identity & Access Management (IAM) architecture and governance policies', 'Configured Principle of Least Privilege role mappings and multi-factor access barriers', 'Formulated enterprise digital transformation security blueprints']::text[], ARRAY['IAM', 'Access Control', 'Enterprise Security', 'Governance']::text[], 'https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/TCS/credentials.pdf', true, 3),
  ('simulation', 'Electronic Arts', 'Product Management Simulation', 'Apr 2026 | Forage', ARRAY['Performed KPI telemetry analysis across active player cohorts', 'Constructed player behavioral segmentation models to enhance feature retention', 'Synthesized data-driven gaming product recommendations and feature roadmaps']::text[], ARRAY['KPI Analysis', 'Telemetry', 'Product Management']::text[], 'https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/EA/credentials.pdf', true, 4),
  ('certification', 'IBM SkillsBuild', 'Getting Started with Artificial Intelligence', 'Mar 2026', ARRAY['Studied foundational artificial intelligence and machine learning pipelines', 'Evaluated enterprise use cases, ethical AI constraints, and neural network concepts']::text[], ARRAY['Artificial Intelligence', 'Machine Learning', 'Ethics in Tech']::text[], 'https://www.credly.com/org/ibm/badges', true, 5);

-- 4. SKILLS (re-seeding replaces these rows)
DELETE FROM public.skills;
INSERT INTO public.skills (tier, name, icon_type, icon_value, proficiency_label, display_order) VALUES
  ('now', 'HTML5', 'slug', 'html5', 'Advanced', 1),
  ('now', 'CSS3', 'slug', 'css3', 'Advanced', 2),
  ('now', 'JavaScript (ES6+)', 'slug', 'javascript', 'Proficient', 3),
  ('now', 'React', 'slug', 'react', 'Working Knowledge', 4),
  ('now', 'Next.js', 'slug', 'nextjs', 'Working Knowledge', 5),
  ('now', 'Tailwind CSS', 'slug', 'tailwind', 'Proficient', 6),
  ('now', 'Java', 'slug', 'java', 'Proficient', 7),
  ('now', 'Python', 'slug', 'python', 'Familiar', 8),
  ('now', 'Git', 'slug', 'git', 'Proficient', 9),
  ('now', 'GitHub', 'slug', 'github', 'Proficient', 10),
  ('learn', 'TypeScript', 'slug', 'typescript', 'Active Learner', 11),
  ('learn', 'Node.js', 'slug', 'nodejs', 'Active Learner', 12),
  ('learn', 'Docker / Containers', 'slug', 'docker', 'Foundational', 13),
  ('learn', 'Cloud & Serverless', 'slug', 'cloud', 'Foundational', 14),
  ('learn', 'Advanced DSA', 'slug', 'dsa', 'Active Practice', 15),
  ('cyber', 'IAM', 'slug', 'iam', 'Applied Practice', 16),
  ('cyber', 'Incident Response', 'slug', 'incident', 'Simulation Verified', 17),
  ('cyber', 'Log Analysis', 'slug', 'log', 'Practical Experience', 18),
  ('cyber', 'UML State Modeling', 'slug', 'uml', 'Proficient', 19),
  ('cyber', 'Linux / Bash', 'slug', 'linux', 'Proficient', 20);

-- 5. SOCIAL LINKS (re-seeding replaces these rows)
DELETE FROM public.social_links;
INSERT INTO public.social_links (name, url, icon, show_hero, show_contact, display_order) VALUES
  ('Email', 'mailto:jaikiranjp@gmail.com', 'email', true, true, 1),
  ('GitHub', 'https://github.com/Jaikiran1212', 'github', true, true, 2),
  ('LinkedIn', 'https://www.linkedin.com/in/jaikiran1212', 'linkedin', true, true, 3),
  ('LeetCode', 'https://leetcode.com/u/Jaikiran1212/', 'leetcode', true, true, 4),
  ('Instagram', 'https://instagram.com/jaikiran.jp', 'instagram', true, true, 5);

-- ==============================================================================
-- CREATE THE ADMIN LINK (run ONCE after creating your user in Supabase -> Authentication):
--   INSERT INTO public.admin_users (id, email, role)
--   VALUES ('<USER_UUID_FROM_AUTH_USERS>', '<your admin email>', 'admin') ON CONFLICT (id) DO NOTHING;
-- ==============================================================================
