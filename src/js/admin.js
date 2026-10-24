// ==============================================================================
// ADMIN CMS CONTROLLER (src/js/admin.js)
// Full-featured Content Management System with Supabase Auth integration
// ==============================================================================
import { apiClient } from './api-client.js';
import { ICONS, SOCIAL_ICONS, DEFAULT_PORTFOLIO_DATA } from './data-default.js';
import { esc } from './portfolio.js';

const $ = (s) => document.querySelector(s);

export class AdminCMS {
  constructor(portfolioApp) {
    this.app = portfolioApp;
    this.currentTab = 'Dashboard';
    this.currentUser = null;
    this.isLoading = false;
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRouting());
    this.handleRouting();
  }

  async handleRouting() {
    const isAdminRoute = window.location.hash === '#admin';
    const admEl = $('#adm');
    const pubEl = $('#pub');

    if (!admEl || !pubEl) return;

    admEl.style.display = isAdminRoute ? 'block' : 'none';
    pubEl.classList.toggle('hp', isAdminRoute);

    if (isAdminRoute) {
      await this.checkAuthAndRender();
    }
  }

  showToast(message, isError = false) {
    if (this.app) this.app.showToast(message, isError);
  }

  async checkAuthAndRender() {
    this.isLoading = true;
    const session = await apiClient.checkSession();
    this.isLoading = false;

    if (!session.authenticated) {
      this.renderLoginForm();
      return;
    }

    this.currentUser = session.user;
    await this.renderCMS();
  }

  renderLoginForm(errorMessage = '', successMessage = '') {
    const adm = $('#adm');
    adm.innerHTML = `
      <div class="am" style="max-width:440px;padding-top:14vh">
        <div class="dash-card" style="border-color:#22d3ee;padding:32px 28px">
          <div style="text-align:center;margin-bottom:24px">
            <h2 style="font:800 1.8rem var(--d);margin:0 0 6px">Admin Sign In</h2>
            <p style="color:#94a3b8;font-size:0.88rem;margin:0">Secure Supabase Authentication</p>
          </div>

          ${
            successMessage
              ? `<div style="background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#10b981;padding:12px 14px;border-radius:4px;font-size:0.85rem;margin-bottom:18px">
                  ✓ ${esc(successMessage)}
                </div>`
              : ''
          }

          ${
            errorMessage
              ? `<div style="background:rgba(244,63,94,0.15);border:1px solid #f43f5e;color:#fff;padding:12px 14px;border-radius:4px;font-size:0.85rem;margin-bottom:18px">
                  ${esc(errorMessage)}
                </div>`
              : ''
          }

          <form id="cms-login-form">
            <label for="admin-email">Administrator Email</label>
            <input id="admin-email" name="email" type="email" placeholder="jaikiranjp@gmail.com" value="jaikiranjp@gmail.com" required autofocus>

            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;margin-bottom:6px">
              <label for="admin-pass" style="margin:0">Password</label>
              <button type="button" id="cms-forgot-link" style="background:none;border:none;color:#22d3ee;font-size:0.8rem;cursor:pointer;padding:0;text-decoration:underline">
                Forgot password?
              </button>
            </div>
            <input id="admin-pass" name="password" type="password" placeholder="••••••••••••" required>

            <button type="submit" class="btn primary" style="width:100%;margin-top:14px">
              Sign In to CMS
            </button>

            <div style="margin-top:16px;text-align:center">
              <a href="#" class="btn" style="width:100%">Return to Portfolio</a>
            </div>
          </form>

          <div style="margin-top:22px;border-top:1px solid #1e293b;padding-top:16px;font-size:0.78rem;color:#94a3b8;line-height:1.5">
            <b>Security Note:</b> Authentication is governed by Supabase Auth with server-side authorization and rate limiting. Default administrator: <code>jaikiranjp@gmail.com</code>.
          </div>
        </div>
      </div>
    `;

    const forgotBtn = $('#cms-forgot-link');
    if (forgotBtn) {
      forgotBtn.onclick = () => {
        const email = $('#admin-email')?.value?.trim() || 'jaikiranjp@gmail.com';
        this.renderForgotPasswordForm(email);
      };
    }

    $('#cms-login-form').onsubmit = async (ev) => {
      ev.preventDefault();
      const form = ev.target;
      const email = form.email.value.trim();
      const password = form.password.value;
      const btn = form.querySelector('button[type="submit"]');

      try {
        btn.disabled = true;
        btn.textContent = 'Verifying...';

        const res = await apiClient.login(email, password);
        this.currentUser = res.user;
        this.showToast('Signed in successfully.');
        await this.renderCMS();
      } catch (err) {
        this.renderLoginForm(err.message || 'Invalid email or password.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In to CMS';
      }
    };
  }

  renderForgotPasswordForm(email = 'jaikiranjp@gmail.com', step = 1, devOtp = '', alertMsg = '', isError = false) {
    const adm = $('#adm');

    adm.innerHTML = `
      <div class="am" style="max-width:460px;padding-top:12vh">
        <div class="dash-card" style="border-color:#22d3ee;padding:32px 28px">
          <div style="text-align:center;margin-bottom:22px">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:rgba(34,211,238,0.12);border:1px solid #22d3ee;margin-bottom:12px;color:#22d3ee">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 style="font:800 1.7rem var(--d);margin:0 0 6px">Reset Password</h2>
            <p style="color:#94a3b8;font-size:0.86rem;margin:0">
              ${step === 1 ? 'Verify your administrator identity via OTP code' : `Enter the 6-digit OTP code sent to <b>${esc(email)}</b>`}
            </p>
          </div>

          ${
            alertMsg
              ? `<div style="background:${isError ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)'};border:1px solid ${isError ? '#f43f5e' : '#10b981'};color:${isError ? '#fff' : '#10b981'};padding:12px 14px;border-radius:4px;font-size:0.85rem;margin-bottom:18px">
                  ${isError ? '✕ ' : '✓ '}${esc(alertMsg)}
                </div>`
              : ''
          }

          ${
            step === 1
              ? `
              <form id="cms-forgot-step1-form">
                <label for="reset-email">Administrator Email</label>
                <input id="reset-email" name="email" type="email" value="${esc(email)}" placeholder="jaikiranjp@gmail.com" required autofocus>

                <button type="submit" class="btn primary" style="width:100%;margin-top:14px">
                  Send Verification Code (OTP)
                </button>

                <div style="margin-top:16px;text-align:center">
                  <button type="button" id="back-to-login-btn" class="btn" style="width:100%">
                    Return to Sign In
                  </button>
                </div>
              </form>
              `
              : `
              <form id="cms-forgot-step2-form">
                ${
                  devOtp
                    ? `<div style="background:rgba(34,211,238,0.12);border:1px dashed #22d3ee;color:#22d3ee;padding:10px 12px;border-radius:4px;font-size:0.82rem;margin-bottom:16px;text-align:center">
                        <b>Verification Code:</b> <span style="font-family:var(--m);font-weight:700;font-size:1.1rem;letter-spacing:3px">${esc(devOtp)}</span>
                      </div>`
                    : ''
                }

                <label for="reset-otp">6-Digit Verification Code</label>
                <input id="reset-otp" name="otp" type="text" maxlength="6" pattern="[0-9]{6}" placeholder="••••••" value="${esc(devOtp)}" style="text-align:center;font-size:1.25rem;font-weight:700;letter-spacing:6px;font-family:var(--m)" required autofocus>

                <label for="reset-pass" style="margin-top:12px">New Password (minimum 8 characters)</label>
                <input id="reset-pass" name="password" type="password" minlength="8" placeholder="••••••••••••" required>

                <label for="reset-pass-confirm" style="margin-top:12px">Confirm New Password</label>
                <input id="reset-pass-confirm" name="password_confirm" type="password" minlength="8" placeholder="••••••••••••" required>

                <button type="submit" class="btn primary" style="width:100%;margin-top:16px">
                  Set New Password & Sign In
                </button>

                <div style="display:flex;gap:10px;margin-top:14px">
                  <button type="button" id="resend-otp-btn" class="btn" style="flex:1;font-size:0.8rem">
                    Resend Code
                  </button>
                  <button type="button" id="back-to-login-btn2" class="btn" style="flex:1;font-size:0.8rem">
                    Cancel
                  </button>
                </div>
              </form>
              `
          }

          <div style="margin-top:20px;border-top:1px solid #1e293b;padding-top:14px;font-size:0.78rem;color:#94a3b8;line-height:1.5">
            <b>Note:</b> A verification code is sent directly to your email inbox. Once verified, your password will be updated and you can log in immediately.
          </div>
        </div>
      </div>
    `;

    if (step === 1) {
      const backBtn = $('#back-to-login-btn');
      if (backBtn) backBtn.onclick = () => this.renderLoginForm();

      const f1 = $('#cms-forgot-step1-form');
      if (f1) {
        f1.onsubmit = async (ev) => {
          ev.preventDefault();
          const mail = $('#reset-email').value.trim();
          const btn = ev.target.querySelector('button[type="submit"]');

          try {
            btn.disabled = true;
            btn.textContent = 'Dispatching Code...';

            const res = await apiClient.forgotPassword(mail);
            this.renderForgotPasswordForm(mail, 2, res.devOtp || '', res.message || 'Verification code sent to your email.');
          } catch (err) {
            btn.disabled = false;
            btn.textContent = 'Send Verification Code (OTP)';
            this.renderForgotPasswordForm(mail, 1, '', err.message || 'Failed to dispatch verification code.', true);
          }
        };
      }
    } else {
      const backBtn2 = $('#back-to-login-btn2');
      if (backBtn2) backBtn2.onclick = () => this.renderLoginForm();

      const resendBtn = $('#resend-otp-btn');
      if (resendBtn) {
        resendBtn.onclick = async (ev) => {
          const btn = ev.target;
          btn.disabled = true;
          btn.textContent = 'Sending...';
          try {
            const res = await apiClient.forgotPassword(email);
            this.renderForgotPasswordForm(email, 2, res.devOtp || '', 'A new verification code has been dispatched.');
          } catch (err) {
            btn.disabled = false;
            btn.textContent = 'Resend Code';
            this.renderForgotPasswordForm(email, 2, devOtp, err.message || 'Failed to resend code.', true);
          }
        };
      }

      const f2 = $('#cms-forgot-step2-form');
      if (f2) {
        f2.onsubmit = async (ev) => {
          ev.preventDefault();
          const form = ev.target;
          const otp = form.otp.value.trim();
          const p1 = form.password.value;
          const p2 = form.password_confirm.value;
          const btn = form.querySelector('button[type="submit"]');

          if (p1 !== p2) {
            this.renderForgotPasswordForm(email, 2, otp, 'Passwords do not match. Please re-enter.', true);
            return;
          }

          try {
            btn.disabled = true;
            btn.textContent = 'Verifying & Updating...';

            const res = await apiClient.verifyOtpAndResetPassword(email, otp, p1);
            this.showToast('Password updated! You can now sign in.');
            this.renderLoginForm('', res.message || 'Password successfully updated! Please sign in with your new password.');
          } catch (err) {
            btn.disabled = false;
            btn.textContent = 'Set New Password & Sign In';
            this.renderForgotPasswordForm(email, 2, otp, err.message || 'Failed to verify code.', true);
          }
        };
      }
    }
  }

  async renderCMS() {
    const adm = $('#adm');
    const tabs = ['Dashboard', 'Projects', 'Experience', 'Skills', 'Profile', 'Socials', 'Messages', 'Audit Logs'];

    // Fetch dashboard unread count
    let unreadCount = 0;
    try {
      const db = await apiClient.getDashboard();
      unreadCount = db.stats?.unreadMessages || 0;
    } catch {}

    const header = `
      <div class="ah">
        <b>Jai Kiran Portfolio <span>Admin CMS</span></b>
        ${tabs
          .map(
            (t) =>
              `<button class="tb ${t === this.currentTab ? 'on' : ''}" data-t="${t}">
                ${t}${t === 'Messages' && unreadCount > 0 ? ` <span class="badge">${unreadCount}</span>` : ''}
              </button>`
          )
          .join('')}
        <a class="tb" href="#">View Site</a>
        <button class="tb lo" id="cms-logout">Logout</button>
      </div>
      <div class="am" id="cms-body">
        <p style="color:#94a3b8">Loading module...</p>
      </div>
    `;

    adm.innerHTML = header;

    adm.querySelectorAll('[data-t]').forEach((btn) => {
      btn.onclick = async () => {
        this.currentTab = btn.dataset.t;
        await this.renderCMS();
      };
    });

    $('#cms-logout').onclick = async () => {
      await apiClient.logout();
      this.currentUser = null;
      window.location.hash = '';
      this.showToast('Logged out.');
    };

    const bodyEl = $('#cms-body');
    if (this.currentTab === 'Dashboard') await this.renderDashboard(bodyEl);
    else if (this.currentTab === 'Projects') await this.renderProjects(bodyEl);
    else if (this.currentTab === 'Experience') await this.renderExperience(bodyEl);
    else if (this.currentTab === 'Skills') await this.renderSkills(bodyEl);
    else if (this.currentTab === 'Profile') await this.renderProfile(bodyEl);
    else if (this.currentTab === 'Socials') await this.renderSocials(bodyEl);
    else if (this.currentTab === 'Messages') await this.renderMessages(bodyEl);
    else if (this.currentTab === 'Audit Logs') await this.renderAuditLogs(bodyEl);
  }

  // ============================================================================
  // MODULE 1: DASHBOARD
  // ============================================================================
  async renderDashboard(container) {
    let data;
    try {
      data = await apiClient.getDashboard();
    } catch (err) {
      container.innerHTML = `<p style="color:#f43f5e">Failed to load dashboard: ${esc(err.message)}</p>`;
      return;
    }

    const { stats, recentActivity } = data;

    container.innerHTML = `
      <div class="sys-banner">
        <div>
          <b>Connected to CMS Database</b>
          <div style="font-size:0.8rem;color:#94a3b8;margin-top:2px">
            Logged in as <code>${esc(this.currentUser?.email || 'admin')}</code> · Row Level Security Active
          </div>
        </div>
        <span class="badge pub">System Online</span>
      </div>

      <div class="dash-grid">
        <div class="dash-card">
          <h4>Case Studies</h4>
          <div class="num">${stats.projects}</div>
        </div>
        <div class="dash-card">
          <h4>Active Skills</h4>
          <div class="num">${stats.skills}</div>
        </div>
        <div class="dash-card">
          <h4>Experience &amp; Certs</h4>
          <div class="num">${stats.experience}</div>
        </div>
        <div class="dash-card">
          <h4>Unread Messages</h4>
          <div class="num" style="color:${stats.unreadMessages > 0 ? '#22d3ee' : '#94a3b8'}">${stats.unreadMessages}</div>
        </div>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:30px;flex-wrap:wrap">
        <button class="btn primary" id="dash-new-proj">+ New Project Case Study</button>
        <button class="btn" id="dash-new-skill">+ Add Skill</button>
        <button class="btn" id="dash-new-exp">+ Add Experience</button>
        <button class="btn" id="dash-view-msg">View Messages (${stats.unreadMessages} unread)</button>
      </div>

      <h3 style="font:800 1.2rem var(--d);margin:0 0 16px">Recent Administrative Activity</h3>
      ${
        recentActivity.length
          ? recentActivity
              .map(
                (act) =>
                  `<div class="row">
                    <span>
                      <b>${esc(act.action.replace(/_/g, ' '))}</b>
                      <small>${esc(act.actor_email)} · ${new Date(act.created_at).toLocaleString()}</small>
                    </span>
                    <span class="tag">${esc(act.resource)}</span>
                  </div>`
              )
              .join('')
          : '<div class="empty-state"><p>No recent activity logs found.</p></div>'
      }
    `;

    $('#dash-new-proj').onclick = () => {
      this.currentTab = 'Projects';
      this.renderCMS().then(() => this.showProjectFormModal());
    };
    $('#dash-new-skill').onclick = () => {
      this.currentTab = 'Skills';
      this.renderCMS().then(() => this.showSkillFormModal());
    };
    $('#dash-new-exp').onclick = () => {
      this.currentTab = 'Experience';
      this.renderCMS().then(() => this.showExperienceFormModal());
    };
    $('#dash-view-msg').onclick = () => {
      this.currentTab = 'Messages';
      this.renderCMS();
    };
  }

  // ============================================================================
  // MODULE 2: PROJECTS CMS
  // ============================================================================
  async renderProjects(container) {
    let res;
    try {
      res = await apiClient.getProjects();
    } catch (err) {
      container.innerHTML = `<p style="color:#f43f5e">Error loading projects: ${esc(err.message)}</p>`;
      return;
    }

    const projects = res.projects || [];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font:800 1.5rem var(--d);margin:0 0 4px">Project Case Studies</h2>
          <p style="color:#94a3b8;margin:0;font-size:0.85rem">Manage your portfolio projects, problem statements, architectures, and metrics.</p>
        </div>
        <button class="btn primary" id="add-proj-btn">+ Add Project Case Study</button>
      </div>

      <div id="projects-list">
        ${
          projects.length
            ? projects
                .map(
                  (p, i) =>
                    `<div class="row">
                      <span style="flex:1">
                        <b>${esc(p.title)}</b>
                        <span class="badge ${p.published ? 'pub' : 'draft'}">${p.published ? 'Published' : 'Draft'}</span>
                        ${p.featured ? '<span class="badge">Featured</span>' : ''}
                        <small>${esc(p.category)} · ${p.tech_stack.slice(0, 3).join(', ')}</small>
                      </span>
                      <span>
                        <button class="sm" data-prev="${p.id}">Preview</button>
                        <button class="sm" data-edit="${p.id}">Edit</button>
                        <button class="sm" data-move="${p.id},-1">↑</button>
                        <button class="sm" data-move="${p.id},1">↓</button>
                        <button class="sm rd" data-del="${p.id}">Delete</button>
                      </span>
                    </div>`
                )
                .join('')
            : '<div class="empty-state"><p>No projects found. Add your first project case study.</p></div>'
        }
      </div>
    `;

    $('#add-proj-btn').onclick = () => this.showProjectFormModal();

    container.querySelectorAll('[data-prev]').forEach((b) => {
      b.onclick = () => this.app.showCaseStudyModal(Number(b.dataset.prev));
    });

    container.querySelectorAll('[data-edit]').forEach((b) => {
      b.onclick = () => {
        const p = projects.find((x) => x.id === Number(b.dataset.edit));
        if (p) this.showProjectFormModal(p);
      };
    });

    container.querySelectorAll('[data-del]').forEach((b) => {
      b.onclick = () => {
        const id = Number(b.dataset.del);
        this.showConfirmModal('Delete this project case study?', 'This action cannot be undone.', async () => {
          await apiClient.deleteProject(id);
          this.showToast('Project deleted.');
          await this.app.init();
          await this.renderCMS();
        });
      };
    });

    container.querySelectorAll('[data-move]').forEach((b) => {
      b.onclick = async () => {
        const [idStr, dirStr] = b.dataset.move.split(',');
        const id = Number(idStr);
        const dir = Number(dirStr);
        const idx = projects.findIndex((x) => x.id === id);
        const targetIdx = idx + dir;

        if (targetIdx >= 0 && targetIdx < projects.length) {
          const reorder = [
            { id: projects[idx].id, display_order: targetIdx + 1 },
            { id: projects[targetIdx].id, display_order: idx + 1 },
          ];
          await apiClient.patchProject({ reorder });
          await this.app.init();
          await this.renderCMS();
        }
      };
    });
  }

  showProjectFormModal(project = null) {
    const isEdit = Boolean(project);
    const p = project || {
      title: '',
      slug: '',
      category: 'Frontend',
      short_desc: '',
      problem_statement: '',
      solution: '',
      architecture: '',
      my_contribution: '',
      challenges: '',
      measurable_results: '',
      notes_markdown: '',
      tech_stack: [],
      repo_url: '',
      live_url: '',
      image_url: '',
      featured: false,
      published: true,
    };

    const modal = this.createModal(`
      <h3 style="margin-top:0;font:800 1.4rem var(--d)">${isEdit ? 'Edit' : 'Create'} Project Case Study</h3>
      <form id="project-form">
        <label for="p-title">Project Title *</label>
        <input id="p-title" name="title" value="${esc(p.title)}" required>

        <label for="p-slug">URL Slug</label>
        <input id="p-slug" name="slug" value="${esc(p.slug)}" placeholder="e.g. spicegarden">

        <label for="p-category">Category *</label>
        <select id="p-category" name="category">
          ${['Frontend', 'Full-Stack', 'Cybersecurity', 'DSA', 'Systems']
            .map((c) => `<option ${c === p.category ? 'selected' : ''}>${c}</option>`)
            .join('')}
        </select>

        <label for="p-desc">Short Summary (Displayed on Card) *</label>
        <textarea id="p-desc" name="short_desc" rows="2" required>${esc(p.short_desc)}</textarea>

        <label for="p-problem">Problem Statement</label>
        <textarea id="p-problem" name="problem_statement" rows="2">${esc(p.problem_statement)}</textarea>

        <label for="p-solution">Solution &amp; Engineering Approach</label>
        <textarea id="p-solution" name="solution" rows="2">${esc(p.solution)}</textarea>

        <label for="p-arch">System Architecture</label>
        <textarea id="p-arch" name="architecture" rows="2">${esc(p.architecture)}</textarea>

        <label for="p-contrib">Individual Contribution</label>
        <textarea id="p-contrib" name="my_contribution" rows="2">${esc(p.my_contribution)}</textarea>

        <label for="p-challenges">Challenges Overcome</label>
        <textarea id="p-challenges" name="challenges" rows="2">${esc(p.challenges)}</textarea>

        <label for="p-results">Measurable Outcomes</label>
        <textarea id="p-results" name="measurable_results" rows="2">${esc(p.measurable_results)}</textarea>

        <label for="p-tech">Tech Stack (comma-separated)</label>
        <input id="p-tech" name="tech_stack" value="${esc(p.tech_stack.join(', '))}" placeholder="React, Node.js, Cloud Firestore">

        <label for="p-repo">GitHub Repository URL</label>
        <input id="p-repo" name="repo_url" value="${esc(p.repo_url)}" placeholder="https://github.com/...">

        <label for="p-live">Live Demo URL</label>
        <input id="p-live" name="live_url" value="${esc(p.live_url)}" placeholder="https://...">

        <label for="p-img">Screenshot / Banner Image URL</label>
        <input id="p-img" name="image_url" value="${esc(p.image_url)}" placeholder="https://...">

        <div style="display:flex;gap:24px;margin:14px 0">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" name="featured" style="width:auto;margin:0" ${p.featured ? 'checked' : ''}> Featured Project
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" name="published" style="width:auto;margin:0" ${p.published ? 'checked' : ''}> Published (Publicly Visible)
          </label>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button type="submit" class="btn primary">Save Project</button>
          <button type="button" class="btn" data-x="1">Cancel</button>
        </div>
      </form>
    `);

    modal.querySelector('#project-form').onsubmit = async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const payload = {
        title: f.get('title'),
        slug: f.get('slug'),
        category: f.get('category'),
        short_desc: f.get('short_desc'),
        problem_statement: f.get('problem_statement'),
        solution: f.get('solution'),
        architecture: f.get('architecture'),
        my_contribution: f.get('my_contribution'),
        challenges: f.get('challenges'),
        measurable_results: f.get('measurable_results'),
        tech_stack: f.get('tech_stack').split(',').map((s) => s.trim()).filter(Boolean),
        repo_url: f.get('repo_url'),
        live_url: f.get('live_url'),
        image_url: f.get('image_url'),
        featured: f.get('featured') === 'on',
        published: f.get('published') === 'on',
      };

      try {
        if (isEdit) {
          await apiClient.updateProject({ id: project.id, ...payload });
          this.showToast('Project updated.');
        } else {
          await apiClient.createProject(payload);
          this.showToast('Project created.');
        }
        modal.remove();
        await this.app.init();
        await this.renderCMS();
      } catch (err) {
        this.showToast(err.message, true);
      }
    };
  }

  // ============================================================================
  // MODULE 3: EXPERIENCE & CERTS CMS
  // ============================================================================
  async renderExperience(container) {
    let res;
    try {
      res = await apiClient.getExperience();
    } catch (err) {
      container.innerHTML = `<p style="color:#f43f5e">Error loading experience: ${esc(err.message)}</p>`;
      return;
    }

    const items = res.experience || [];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font:800 1.5rem var(--d);margin:0 0 4px">Experience &amp; Certifications</h2>
          <p style="color:#94a3b8;margin:0;font-size:0.85rem">Manage industry job simulations, achievements, and technical credentials.</p>
        </div>
        <button class="btn primary" id="add-exp-btn">+ Add Item</button>
      </div>

      <div id="experience-list">
        ${
          items.length
            ? items
                .map(
                  (c) =>
                    `<div class="row">
                      <span style="flex:1">
                        <b>${esc(c.organization)} – ${esc(c.role_title)}</b>
                        <small>${esc(c.duration)}${c.credential_url ? ' · Credential attached' : ''}</small>
                      </span>
                      <span>
                        <button class="sm" data-edit-exp="${c.id}">Edit</button>
                        <button class="sm rd" data-del-exp="${c.id}">Delete</button>
                      </span>
                    </div>`
                )
                .join('')
            : '<div class="empty-state"><p>No items found.</p></div>'
        }
      </div>
    `;

    $('#add-exp-btn').onclick = () => this.showExperienceFormModal();

    container.querySelectorAll('[data-edit-exp]').forEach((b) => {
      b.onclick = () => {
        const item = items.find((x) => x.id === Number(b.dataset.editExp));
        if (item) this.showExperienceFormModal(item);
      };
    });

    container.querySelectorAll('[data-del-exp]').forEach((b) => {
      b.onclick = () => {
        const id = Number(b.dataset.delExp);
        this.showConfirmModal('Delete this item?', 'This cannot be undone.', async () => {
          await apiClient.deleteExperience(id);
          this.showToast('Item deleted.');
          await this.app.init();
          await this.renderCMS();
        });
      };
    });
  }

  showExperienceFormModal(item = null) {
    const isEdit = Boolean(item);
    const exp = item || {
      organization: '',
      role_title: '',
      duration: '',
      category: 'simulation',
      points: [],
      tags: [],
      credential_url: '',
    };

    const modal = this.createModal(`
      <h3 style="margin-top:0;font:800 1.4rem var(--d)">${isEdit ? 'Edit' : 'Add'} Experience / Certification</h3>
      <form id="exp-form">
        <label for="e-org">Organization / Institution *</label>
        <input id="e-org" name="organization" value="${esc(exp.organization)}" required>

        <label for="e-role">Role Title / Simulation Name *</label>
        <input id="e-role" name="role_title" value="${esc(exp.role_title)}" required>

        <label for="e-date">Duration / Date *</label>
        <input id="e-date" name="duration" value="${esc(exp.duration)}" placeholder="Apr 2026 | Forage" required>

        <label for="e-cat">Category</label>
        <select id="e-cat" name="category">
          ${['simulation', 'experience', 'education', 'certification']
            .map((c) => `<option ${c === exp.category ? 'selected' : ''}>${c}</option>`)
            .join('')}
        </select>

        <label for="e-pts">Key Takeaways &amp; Accomplishments (one per line)</label>
        <textarea id="e-pts" name="points_text" rows="3">${esc(exp.points.join('\n'))}</textarea>

        <label for="e-tags">Tech Tags (comma-separated)</label>
        <input id="e-tags" name="tags_text" value="${esc(exp.tags.join(', '))}" placeholder="Java, UML, Cybersecurity">

        <label for="e-url">Credential URL / PDF link</label>
        <input id="e-url" name="credential_url" value="${esc(exp.credential_url)}" placeholder="https://...">

        <div style="display:flex;gap:10px;margin-top:20px">
          <button type="submit" class="btn primary">Save Item</button>
          <button type="button" class="btn" data-x="1">Cancel</button>
        </div>
      </form>
    `);

    modal.querySelector('#exp-form').onsubmit = async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const payload = {
        organization: f.get('organization'),
        role_title: f.get('role_title'),
        duration: f.get('duration'),
        category: f.get('category'),
        points_text: f.get('points_text'),
        tags_text: f.get('tags_text'),
        credential_url: f.get('credential_url'),
      };

      try {
        if (isEdit) {
          await apiClient.updateExperience({ id: item.id, ...payload });
          this.showToast('Experience updated.');
        } else {
          await apiClient.createExperience(payload);
          this.showToast('Experience created.');
        }
        modal.remove();
        await this.app.init();
        await this.renderCMS();
      } catch (err) {
        this.showToast(err.message, true);
      }
    };
  }

  // ============================================================================
  // MODULE 4: SKILLS CMS
  // ============================================================================
  async renderSkills(container) {
    let res;
    try {
      res = await apiClient.getSkills();
    } catch (err) {
      container.innerHTML = `<p style="color:#f43f5e">Error loading skills: ${esc(err.message)}</p>`;
      return;
    }

    const skills = res.skills || [];
    const tiers = [
      ['now', 'Using Now'],
      ['learn', 'Learning / Leveling Up'],
      ['cyber', 'Cybersecurity & Enterprise Tools'],
    ];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font:800 1.5rem var(--d);margin:0 0 4px">Technical Skills</h2>
          <p style="color:#94a3b8;margin:0;font-size:0.85rem">Manage skill categorization, icon mapping, and verified proficiency claims.</p>
        </div>
        <button class="btn primary" id="add-skill-btn">+ Add Skill</button>
      </div>

      <div class="cols">
        ${tiers
          .map(([tKey, tName]) => {
            const tierList = skills.filter((s) => s.tier === tKey);
            return `
              <div>
                <h4 style="font:800 1.05rem var(--d);margin:0 0 12px;color:#22d3ee">${tName}</h4>
                ${
                  tierList.length
                    ? tierList
                        .map(
                          (s) =>
                            `<div class="row">
                              <span style="display:flex;align-items:center;gap:10px">
                                <i style="width:24px;height:24px;display:inline-block">${this.app.getSkillIcon(s.icon_value, s.name)}</i>
                                <span>
                                  <b>${esc(s.name)}</b>
                                  <small>${esc(s.proficiency_label || 'Proficient')}</small>
                                </span>
                              </span>
                              <span>
                                <button class="sm" data-edit-skill="${s.id}">Edit</button>
                                <button class="sm rd" data-del-skill="${s.id}">✕</button>
                              </span>
                            </div>`
                        )
                        .join('')
                    : '<p style="color:#94a3b8;font-size:0.85rem">No skills in this tier.</p>'
                }
              </div>
            `;
          })
          .join('')}
      </div>
    `;

    $('#add-skill-btn').onclick = () => this.showSkillFormModal();

    container.querySelectorAll('[data-edit-skill]').forEach((b) => {
      b.onclick = () => {
        const item = skills.find((x) => x.id === Number(b.dataset.editSkill));
        if (item) this.showSkillFormModal(item);
      };
    });

    container.querySelectorAll('[data-del-skill]').forEach((b) => {
      b.onclick = () => {
        const id = Number(b.dataset.delSkill);
        this.showConfirmModal('Delete this skill?', 'This will remove it from the public portfolio.', async () => {
          await apiClient.deleteSkill(id);
          this.showToast('Skill deleted.');
          await this.app.init();
          await this.renderCMS();
        });
      };
    });
  }

  showSkillFormModal(skill = null) {
    const isEdit = Boolean(skill);
    const s = skill || {
      name: '',
      tier: 'now',
      icon_value: 'javascript',
      proficiency_label: 'Proficient',
    };

    let selectedIcon = s.icon_value;

    const modal = this.createModal(`
      <h3 style="margin-top:0;font:800 1.4rem var(--d)">${isEdit ? 'Edit' : 'Add'} Skill</h3>
      <form id="skill-form">
        <label for="sk-name">Skill Name *</label>
        <input id="sk-name" name="name" value="${esc(s.name)}" required>

        <label for="sk-tier">Category Tier</label>
        <select id="sk-tier" name="tier">
          <option value="now" ${s.tier === 'now' ? 'selected' : ''}>Using Now</option>
          <option value="learn" ${s.tier === 'learn' ? 'selected' : ''}>Learning / Leveling Up</option>
          <option value="cyber" ${s.tier === 'cyber' ? 'selected' : ''}>Cybersecurity &amp; Tools</option>
        </select>

        <label for="sk-prof">Proficiency Label (Technically Credible)</label>
        <select id="sk-prof" name="proficiency_label">
          ${['Advanced', 'Proficient', 'Working Knowledge', 'Active Practice', 'Active Learner', 'Familiar']
            .map((p) => `<option ${p === s.proficiency_label ? 'selected' : ''}>${p}</option>`)
            .join('')}
        </select>

        <label>Pick a Built-in Icon</label>
        <div class="pick">
          ${Object.keys(ICONS)
            .map(
              (k) =>
                `<button type="button" data-pick-icon="${k}" title="${k}">${ICONS[k]}</button>`
            )
            .join('')}
        </div>

        <label for="sk-icon">Or specify icon slug / URL / raw SVG</label>
        <input id="sk-icon" name="icon_value" value="${esc(s.icon_value)}">

        <div style="margin:12px 0;display:flex;align-items:center;gap:12px">
          <label style="margin:0">Live Preview:</label>
          <div id="sk-prev" style="width:40px;height:40px"></div>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button type="submit" class="btn primary">Save Skill</button>
          <button type="button" class="btn" data-x="1">Cancel</button>
        </div>
      </form>
    `);

    const updatePreview = () => {
      const prev = modal.querySelector('#sk-prev');
      const nameVal = modal.querySelector('#sk-name').value;
      if (prev) {
        prev.innerHTML = this.app.getSkillIcon(selectedIcon, nameVal);
      }
    };
    updatePreview();

    modal.querySelectorAll('[data-pick-icon]').forEach((b) => {
      b.onclick = () => {
        selectedIcon = b.dataset.pickIcon;
        modal.querySelector('#sk-icon').value = selectedIcon;
        updatePreview();
      };
    });

    modal.querySelector('#sk-icon').oninput = (ev) => {
      selectedIcon = ev.target.value;
      updatePreview();
    };

    modal.querySelector('#skill-form').onsubmit = async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const payload = {
        name: f.get('name'),
        tier: f.get('tier'),
        icon_value: f.get('icon_value') || selectedIcon,
        proficiency_label: f.get('proficiency_label'),
      };

      try {
        if (isEdit) {
          await apiClient.updateSkill({ id: skill.id, ...payload });
          this.showToast('Skill updated.');
        } else {
          await apiClient.createSkill(payload);
          this.showToast('Skill created.');
        }
        modal.remove();
        await this.app.init();
        await this.renderCMS();
      } catch (err) {
        this.showToast(err.message, true);
      }
    };
  }

  // ============================================================================
  // MODULE 5: PROFILE & PHOTO STUDIO CMS
  // ============================================================================
  async renderProfile(container) {
    let res;
    try {
      res = await apiClient.getProfile();
    } catch (err) {
      container.innerHTML = `<p style="color:#f43f5e">Error loading profile: ${esc(err.message)}</p>`;
      return;
    }

    const p = res.profile || this.app.data.profile;
    const c = p.photo_config || {};

    container.innerHTML = `
      <div style="margin-bottom:20px">
        <h2 style="font:800 1.5rem var(--d);margin:0 0 4px">Profile &amp; Hero Studio</h2>
        <p style="color:#94a3b8;margin:0;font-size:0.85rem">Edit your professional headline, biography, resume URL, and fine-tune your hero portrait.</p>
      </div>

      <!-- PHOTO STUDIO SECTION -->
      <div class="dash-card" style="margin-bottom:30px;padding:24px">
        <h3 style="font:800 1.2rem var(--d);margin:0 0 16px">Hero Portrait Studio</h3>
        <div class="cols">
          <div>
            <label for="pf-img-file">Upload New Portrait (PNG, JPG, WebP)</label>
            <input type="file" id="pf-img-file" accept="image/png,image/jpeg,image/webp">

            <label for="pf-img-url">Or Image URL</label>
            <input id="pf-img-url" value="${esc(c.src || '')}" placeholder="https://...">

            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:10px 0">
              <input type="checkbox" id="pf-ac" style="width:auto;margin:0" ${c.autoCutout ? 'checked' : ''}>
              Auto-Remove Background
            </label>

            <label>Cutout Edge Tolerance: <b id="val-tol">${c.cutoutTolerance || 38}</b></label>
            <input type="range" id="pf-tol" min="0" max="85" step="1" value="${c.cutoutTolerance || 38}">

            <label>Container Width (px): <b id="val-w">${c.width || 400}</b></label>
            <input type="range" id="pf-w" min="240" max="600" step="10" value="${c.width || 400}">

            <label>Container Height (px): <b id="val-h">${c.height || 480}</b></label>
            <input type="range" id="pf-h" min="280" max="680" step="10" value="${c.height || 480}">

            <label>Zoom Scale: <b id="val-scale">${c.scale || 1}</b></label>
            <input type="range" id="pf-scale" min="0.5" max="2" step="0.05" value="${c.scale || 1}">

            <label>Offset X (px): <b id="val-x">${c.x || 0}</b></label>
            <input type="range" id="pf-x" min="-150" max="150" step="1" value="${c.x || 0}">

            <label>Offset Y (px): <b id="val-y">${c.y || 0}</b></label>
            <input type="range" id="pf-y" min="-150" max="150" step="1" value="${c.y || 0}">

            <label>Bottom Feather (%): <b id="val-fe">${c.feather || 10}</b></label>
            <input type="range" id="pf-fe" min="0" max="50" step="1" value="${c.feather || 10}">

            <label for="pf-frame">Frame Style</label>
            <select id="pf-frame">
              <option value="cutout" ${c.frame === 'cutout' ? 'selected' : ''}>Seamless Cutout</option>
              <option value="arch" ${c.frame === 'arch' ? 'selected' : ''}>Glowing Arch</option>
              <option value="circle" ${c.frame === 'circle' ? 'selected' : ''}>Circle Portal</option>
              <option value="squircle" ${c.frame === 'squircle' ? 'selected' : ''}>Rounded Squircle</option>
            </select>
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <label style="margin:0">Live Preview</label>
              <div>
                <button type="button" class="sm tb on" id="prev-mode-d">Desktop</button>
                <button type="button" class="sm tb" id="prev-mode-m">Mobile</button>
              </div>
            </div>
            <div class="pv" id="studio-pv">
              <div class="pvL"></div>
              <div class="P" id="studio-pp">
                <div class="fl">
                  <div class="gb">
                    <div class="arch">
                      <img alt="Portrait preview" src="${esc(c.src || '/images/profile.png')}">
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <small style="color:#94a3b8;display:block;margin-top:6px">Drag directly on the preview to position.</small>
          </div>
        </div>
      </div>

      <!-- MAIN PROFILE DETAILS -->
      <form id="profile-form" class="dash-card" style="padding:24px">
        <h3 style="font:800 1.2rem var(--d);margin:0 0 16px">Professional Identity</h3>

        <label for="pf-greet">Hero Greeting</label>
        <input id="pf-greet" name="greet" value="${esc(p.greet)}" required>

        <label for="pf-name">Full Name *</label>
        <input id="pf-name" name="name" value="${esc(p.name)}" required>

        <label for="pf-subs">Rotating Subtitles (one per line)</label>
        <textarea id="pf-subs" name="subs_text" rows="3">${esc(p.subs.join('\n'))}</textarea>

        <label for="pf-bio">Biography / Summary Paragraph</label>
        <textarea id="pf-bio" name="lead_bio" rows="3">${esc(p.lead_bio)}</textarea>

        <label for="pf-email">Professional Email *</label>
        <input id="pf-email" name="email" type="email" value="${esc(p.email)}" required>

        <label for="pf-phone">Phone Number</label>
        <input id="pf-phone" name="phone" value="${esc(p.phone)}">

        <label for="pf-loc">Location</label>
        <input id="pf-loc" name="location" value="${esc(p.location)}">

        <label for="pf-resume">Resume URL (Google Drive / PDF)</label>
        <input id="pf-resume" name="resume_url" value="${esc(p.resume_url)}">

        <label for="pf-font">Typography Style Preset</label>
        <select id="pf-font" name="font_preset">
          ${['Cyber Geometric', 'Editorial Tech', 'Ultra Modern', 'Brutalist Neo', 'Minimalist Geometric']
            .map((f) => `<option ${f === p.font_preset ? 'selected' : ''}>${f}</option>`)
            .join('')}
        </select>

        <label for="pf-theme">Default Theme</label>
        <select id="pf-theme" name="theme">
          ${['Alternating Contrast', 'Full Cyber Dark', 'Full Clean Light']
            .map((t) => `<option ${t === p.theme ? 'selected' : ''}>${t}</option>`)
            .join('')}
        </select>

        <div style="margin-top:20px">
          <button type="submit" class="btn primary">Save All Changes</button>
        </div>
      </form>
    `;

    // Local photo state
    const studioConfig = { ...c };

    const updateStudio = () => {
      const pp = $('#studio-pp');
      if (!pp) return;
      pp.style.setProperty('--pw', `${studioConfig.width || 400}px`);
      pp.style.setProperty('--ph', `${studioConfig.height || 480}px`);
      pp.style.setProperty('--ps', studioConfig.scale || 1);
      pp.style.setProperty('--pxo', `${studioConfig.x || 0}px`);
      pp.style.setProperty('--pyo', `${studioConfig.y || 0}px`);
      pp.style.setProperty('--fe', `${studioConfig.feather || 10}%`);
      pp.className = `P f-${studioConfig.frame || 'cutout'}`;

      const img = pp.querySelector('img');
      if (img && studioConfig.src) img.src = studioConfig.src;

      $('#val-w').textContent = studioConfig.width;
      $('#val-h').textContent = studioConfig.height;
      $('#val-scale').textContent = studioConfig.scale;
      $('#val-x').textContent = studioConfig.x;
      $('#val-y').textContent = studioConfig.y;
      $('#val-fe').textContent = studioConfig.feather;
      $('#val-tol').textContent = studioConfig.cutoutTolerance;
    };
    updateStudio();

    $('#pf-w').oninput = (e) => { studioConfig.width = Number(e.target.value); updateStudio(); };
    $('#pf-h').oninput = (e) => { studioConfig.height = Number(e.target.value); updateStudio(); };
    $('#pf-scale').oninput = (e) => { studioConfig.scale = Number(e.target.value); updateStudio(); };
    $('#pf-x').oninput = (e) => { studioConfig.x = Number(e.target.value); updateStudio(); };
    $('#pf-y').oninput = (e) => { studioConfig.y = Number(e.target.value); updateStudio(); };
    $('#pf-fe').oninput = (e) => { studioConfig.feather = Number(e.target.value); updateStudio(); };
    $('#pf-tol').oninput = (e) => { studioConfig.cutoutTolerance = Number(e.target.value); updateStudio(); };
    $('#pf-ac').onchange = (e) => { studioConfig.autoCutout = e.target.checked; updateStudio(); };
    $('#pf-frame').onchange = (e) => { studioConfig.frame = e.target.value; updateStudio(); };
    $('#pf-img-url').onchange = (e) => { studioConfig.src = e.target.value.trim(); updateStudio(); };

    // File upload
    $('#pf-img-file').onchange = (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        studioConfig.src = reader.result;
        updateStudio();
      };
      reader.readAsDataURL(file);
    };

    // Mobile vs Desktop preview toggle
    $('#prev-mode-d').onclick = (e) => {
      $('#studio-pv').classList.remove('mob');
      e.target.classList.add('on');
      $('#prev-mode-m').classList.remove('on');
    };
    $('#prev-mode-m').onclick = (e) => {
      $('#studio-pv').classList.add('mob');
      e.target.classList.add('on');
      $('#prev-mode-d').classList.remove('on');
    };

    // Save profile form
    $('#profile-form').onsubmit = async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const payload = {
        greet: f.get('greet'),
        name: f.get('name'),
        subs_text: f.get('subs_text'),
        lead_bio: f.get('lead_bio'),
        email: f.get('email'),
        phone: f.get('phone'),
        location: f.get('location'),
        resume_url: f.get('resume_url'),
        font_preset: f.get('font_preset'),
        theme: f.get('theme'),
        photo_config: studioConfig,
      };

      try {
        await apiClient.updateProfile(payload);
        this.showToast('Profile updated successfully.');
        await this.app.init();
      } catch (err) {
        this.showToast(err.message, true);
      }
    };
  }

  // ============================================================================
  // MODULE 6: SOCIALS CMS
  // ============================================================================
  async renderSocials(container) {
    let res;
    try {
      res = await apiClient.getSocials();
    } catch (err) {
      container.innerHTML = `<p style="color:#f43f5e">Error loading socials: ${esc(err.message)}</p>`;
      return;
    }

    const socials = res.socials || [];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font:800 1.5rem var(--d);margin:0 0 4px">Social &amp; Coding Profiles</h2>
          <p style="color:#94a3b8;margin:0;font-size:0.85rem">Configure links to GitHub, LinkedIn, LeetCode, and contact channels.</p>
        </div>
        <button class="btn primary" id="add-soc-btn">+ Add Social Link</button>
      </div>

      <div id="socials-list">
        ${
          socials.length
            ? socials
                .map(
                  (s) =>
                    `<div class="row">
                      <span style="display:flex;align-items:center;gap:12px">
                        <i style="width:28px;height:28px">${this.app.getSocialIcon(s.icon)}</i>
                        <span>
                          <b>${esc(s.name)}</b>
                          <small>${esc(s.url)}${s.show_hero ? ' · Hero' : ''}${s.show_contact ? ' · Contact' : ''}</small>
                        </span>
                      </span>
                      <span>
                        <button class="sm" data-edit-soc="${s.id}">Edit</button>
                        <button class="sm rd" data-del-soc="${s.id}">Delete</button>
                      </span>
                    </div>`
                )
                .join('')
            : '<div class="empty-state"><p>No social links found.</p></div>'
        }
      </div>
    `;

    $('#add-soc-btn').onclick = () => this.showSocialFormModal();

    container.querySelectorAll('[data-edit-soc]').forEach((b) => {
      b.onclick = () => {
        const item = socials.find((x) => x.id === Number(b.dataset.editSoc));
        if (item) this.showSocialFormModal(item);
      };
    });

    container.querySelectorAll('[data-del-soc]').forEach((b) => {
      b.onclick = () => {
        const id = Number(b.dataset.delSoc);
        this.showConfirmModal('Delete this social link?', 'It will be removed from your portfolio.', async () => {
          await apiClient.deleteSocial(id);
          this.showToast('Social link deleted.');
          await this.app.init();
          await this.renderCMS();
        });
      };
    });
  }

  showSocialFormModal(soc = null) {
    const isEdit = Boolean(soc);
    const s = soc || {
      name: '',
      url: '',
      icon: 'website',
      show_hero: true,
      show_contact: true,
    };

    const modal = this.createModal(`
      <h3 style="margin-top:0;font:800 1.4rem var(--d)">${isEdit ? 'Edit' : 'Add'} Social Link</h3>
      <form id="soc-form">
        <label for="s-name">Platform Name *</label>
        <input id="s-name" name="name" value="${esc(s.name)}" placeholder="GitHub" required>

        <label for="s-url">Profile URL *</label>
        <input id="s-url" name="url" value="${esc(s.url)}" placeholder="https://..." required>

        <label for="s-icon">Platform Icon</label>
        <select id="s-icon" name="icon">
          ${['github', 'linkedin', 'leetcode', 'email', 'instagram', 'phone', 'location', 'website']
            .map((ic) => `<option ${ic === s.icon ? 'selected' : ''}>${ic}</option>`)
            .join('')}
        </select>

        <div style="display:flex;gap:20px;margin:14px 0">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" name="show_hero" style="width:auto;margin:0" ${s.show_hero ? 'checked' : ''}> Show in Hero
          </label>
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
            <input type="checkbox" name="show_contact" style="width:auto;margin:0" ${s.show_contact ? 'checked' : ''}> Show in Contact Section
          </label>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px">
          <button type="submit" class="btn primary">Save Social</button>
          <button type="button" class="btn" data-x="1">Cancel</button>
        </div>
      </form>
    `);

    modal.querySelector('#soc-form').onsubmit = async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target);
      const payload = {
        name: f.get('name'),
        url: f.get('url'),
        icon: f.get('icon'),
        show_hero: f.get('show_hero') === 'on',
        show_contact: f.get('show_contact') === 'on',
      };

      try {
        if (isEdit) {
          await apiClient.updateSocial({ id: soc.id, ...payload });
          this.showToast('Social link updated.');
        } else {
          await apiClient.createSocial(payload);
          this.showToast('Social link added.');
        }
        modal.remove();
        await this.app.init();
        await this.renderCMS();
      } catch (err) {
        this.showToast(err.message, true);
      }
    };
  }

  // ============================================================================
  // MODULE 7: CONTACT MESSAGES CMS
  // ============================================================================
  async renderMessages(container) {
    let res;
    try {
      res = await apiClient.getMessages();
    } catch (err) {
      container.innerHTML = `<p style="color:#f43f5e">Error loading messages: ${esc(err.message)}</p>`;
      return;
    }

    const messages = res.messages || [];

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font:800 1.5rem var(--d);margin:0 0 4px">Contact Submissions</h2>
          <p style="color:#94a3b8;margin:0;font-size:0.85rem">Securely triage inquiries from recruiters, visitors, and collaborators.</p>
        </div>
      </div>

      <div id="messages-list">
        ${
          messages.length
            ? messages
                .map(
                  (m) =>
                    `<div class="row ${m.status === 'unread' ? 'un' : ''}" style="cursor:pointer" data-view-msg="${m.id}">
                      <span style="flex:1">
                        <b>${esc(m.name)}</b> · ${esc(m.subject)}
                        <span class="badge ${m.status === 'unread' ? '' : 'r'}">${m.status}</span>
                        <small>${esc(m.email)} · ${new Date(m.created_at).toLocaleString()}</small>
                        <small style="color:#cbd5e1">${esc(m.message.slice(0, 85))}...</small>
                      </span>
                    </div>`
                )
                .join('')
            : '<div class="empty-state"><p>No messages received yet. Inquiries will appear here securely.</p></div>'
        }
      </div>
    `;

    container.querySelectorAll('[data-view-msg]').forEach((row) => {
      row.onclick = () => {
        const id = Number(row.dataset.viewMsg);
        const m = messages.find((x) => x.id === id);
        if (m) this.showMessageDetailModal(m);
      };
    });
  }

  showMessageDetailModal(m) {
    // Automatically mark read if unread
    if (m.status === 'unread') {
      apiClient.updateMessageStatus(m.id, 'read');
      m.status = 'read';
    }

    const modal = this.createModal(`
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
        <div>
          <span class="badge ${m.status === 'unread' ? '' : 'r'}">${m.status.toUpperCase()}</span>
          <h3 style="margin:8px 0 2px;font:800 1.35rem var(--d)">${esc(m.subject)}</h3>
          <p style="color:#94a3b8;font-size:0.88rem;margin:0">From: <b>${esc(m.name)}</b> &lt;${esc(m.email)}&gt;</p>
          <small style="color:#64748b">${new Date(m.created_at).toLocaleString()}</small>
        </div>
        <button class="sm" data-x="1">✕</button>
      </div>

      <div style="background:#0b1220;border:1px solid #1e293b;padding:18px;border-radius:4px;margin:16px 0;white-space:pre-wrap;line-height:1.65;font-size:0.95rem">
${esc(m.message)}
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">
        <a class="btn primary" href="mailto:${esc(m.email)}?subject=Re: ${encodeURIComponent(m.subject)}">Reply via Email</a>
        <button class="btn" id="msg-toggle-status">Mark as ${m.status === 'read' ? 'Unread' : 'Read'}</button>
        <button class="btn" id="msg-archive">${m.status === 'archived' ? 'Unarchive' : 'Archive'}</button>
        <button class="btn" id="msg-del" style="background:#f43f5e;border-color:#f43f5e;color:#fff;margin-left:auto">Delete</button>
      </div>
    `);

    modal.querySelector('#msg-toggle-status').onclick = async () => {
      const nextStatus = m.status === 'read' ? 'unread' : 'read';
      await apiClient.updateMessageStatus(m.id, nextStatus);
      modal.remove();
      await this.renderCMS();
    };

    modal.querySelector('#msg-archive').onclick = async () => {
      const nextStatus = m.status === 'archived' ? 'read' : 'archived';
      await apiClient.updateMessageStatus(m.id, nextStatus);
      modal.remove();
      await this.renderCMS();
    };

    modal.querySelector('#msg-del').onclick = async () => {
      await apiClient.deleteMessage(m.id);
      this.showToast('Message deleted.');
      modal.remove();
      await this.renderCMS();
    };
  }

  // ============================================================================
  // MODULE 8: AUDIT LOGS CMS
  // ============================================================================
  async renderAuditLogs(container) {
    let res;
    try {
      res = await apiClient.getAuditLogs(60);
    } catch (err) {
      container.innerHTML = `<p style="color:#f43f5e">Error loading audit logs: ${esc(err.message)}</p>`;
      return;
    }

    const logs = res.audit_logs || [];

    container.innerHTML = `
      <div style="margin-bottom:20px">
        <h2 style="font:800 1.5rem var(--d);margin:0 0 4px">Security &amp; Mutation Audit Trail</h2>
        <p style="color:#94a3b8;margin:0;font-size:0.85rem">Immutable record of logins, data mutations, and security events. Passwords and secrets are never logged.</p>
      </div>

      <div>
        ${
          logs.length
            ? logs
                .map(
                  (l) =>
                    `<div class="row">
                      <span style="flex:1">
                        <b>${esc(l.action)}</b>
                        <small>Resource: <code>${esc(l.resource)}</code> · By: <code>${esc(l.actor_email)}</code> · ${new Date(l.created_at).toLocaleString()}</small>
                        ${
                          l.details && Object.keys(l.details).length
                            ? `<small style="color:#cbd5e1;font-family:var(--m)">${esc(JSON.stringify(l.details))}</small>`
                            : ''
                        }
                      </span>
                    </div>`
                )
                .join('')
            : '<div class="empty-state"><p>No audit events recorded yet.</p></div>'
        }
      </div>
    `;
  }

  // ============================================================================
  // MODAL UTILITIES
  // ============================================================================
  createModal(contentHtml) {
    const modal = document.createElement('div');
    modal.className = 'mod';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `<div>${contentHtml}</div>`;

    const close = () => modal.remove();
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal || ev.target.dataset.x) close();
    });
    modal.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') close();
    });

    document.body.appendChild(modal);
    return modal;
  }

  showConfirmModal(title, text, onConfirm) {
    const modal = this.createModal(`
      <h3 style="margin-top:0;font:800 1.3rem var(--d)">${esc(title)}</h3>
      <p style="color:#94a3b8;margin:10px 0 20px">${esc(text)}</p>
      <div style="display:flex;gap:10px">
        <button class="btn" id="confirm-act-btn" style="background:#f43f5e;border-color:#f43f5e;color:#fff">Confirm</button>
        <button class="btn" data-x="1">Cancel</button>
      </div>
    `);

    modal.querySelector('#confirm-act-btn').onclick = async () => {
      modal.remove();
      await onConfirm();
    };
  }
}
