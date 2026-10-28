// ==============================================================================
// CLIENT-SIDE API WRAPPER
// - Sessions are HttpOnly cookies set by the server (no token is ever stored in JS/storage).
// - Every request has a timeout; a 401 triggers ONE silent token refresh and a retry.
// ==============================================================================
import { DEFAULT_PORTFOLIO_DATA } from './data-default.js';

const CSRF = { 'X-Requested-With': 'jk-admin' };

async function fetchWithTimeout(url, options, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { credentials: 'same-origin', ...options, signal: ctrl.signal });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('The request timed out. Please check your connection and try again.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  _refreshing: null,

  async request(url, options = {}, { timeout = 15000, retry = true } = {}) {
    const headers = { 'Content-Type': 'application/json', ...CSRF, ...(options.headers || {}) };
    const res = await fetchWithTimeout(url, { ...options, headers }, timeout);

    if (res.status === 401 && retry && !url.startsWith('/api/auth/')) {
      if (await this.refreshSession()) return this.request(url, options, { timeout, retry: false });
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status}).`);
      err.status = res.status;
      throw err;
    }
    return data;
  },

  /** Silent refresh of the admin session (shared promise so parallel calls refresh once). */
  async refreshSession() {
    if (!this._refreshing) {
      this._refreshing = fetchWithTimeout('/api/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json', ...CSRF }, body: '{}' }, 8000)
        .then((r) => r.ok)
        .catch(() => false)
        .finally(() => {
          this._refreshing = null;
        });
    }
    return this._refreshing;
  },

  // 1. PUBLIC ENDPOINTS ---------------------------------------------------------
  /** Returns live data, or the bundled defaults if the API is slow/unavailable. */
  async getPortfolio({ fresh = false } = {}) {
    try {
      return await this.request(`/api/portfolio${fresh ? `?t=${Date.now()}` : ''}`, {}, { timeout: 4000, retry: false });
    } catch (err) {
      console.warn('Backend unavailable, using bundled default data:', err.message);
      return DEFAULT_PORTFOLIO_DATA;
    }
  },

  sendContactMessage(payload) {
    return this.request('/api/contact', { method: 'POST', body: JSON.stringify(payload) }, { timeout: 12000, retry: false });
  },

  // 2. AUTH ---------------------------------------------------------------------
  login(email, password, turnstileToken = '') {
    return this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password, turnstileToken }) });
  },

  async checkSession() {
    try {
      const res = await this.request('/api/auth/session', {}, { retry: false });
      if (res.authenticated) return res;
    } catch {
      /* fall through to a refresh attempt */
    }
    if (await this.refreshSession()) {
      try {
        return await this.request('/api/auth/session', {}, { retry: false });
      } catch {
        /* not authenticated */
      }
    }
    return { authenticated: false };
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST', body: '{}' }, { retry: false });
    } catch {
      /* ignore */
    }
  },

  forgotPassword(email, turnstileToken = '') {
    return this.request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email, turnstileToken }) });
  },

  verifyOtpAndResetPassword(email, otp, newPassword) {
    return this.request('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp, newPassword }) });
  },

  // 3. CMS ----------------------------------------------------------------------
  getDashboard() { return this.request('/api/cms/dashboard'); },
  getAuditLogs(limit = 40) { return this.request(`/api/cms/audit-logs?limit=${limit}`); },

  getProjects() { return this.request('/api/cms/projects'); },
  createProject(data) { return this.request('/api/cms/projects', { method: 'POST', body: JSON.stringify(data) }); },
  updateProject(data) { return this.request('/api/cms/projects', { method: 'PUT', body: JSON.stringify(data) }); },
  deleteProject(id) { return this.request(`/api/cms/projects?id=${id}`, { method: 'DELETE' }); },
  patchProject(body) { return this.request('/api/cms/projects', { method: 'PATCH', body: JSON.stringify(body) }); },

  getExperience() { return this.request('/api/cms/experience'); },
  createExperience(data) { return this.request('/api/cms/experience', { method: 'POST', body: JSON.stringify(data) }); },
  updateExperience(data) { return this.request('/api/cms/experience', { method: 'PUT', body: JSON.stringify(data) }); },
  deleteExperience(id) { return this.request(`/api/cms/experience?id=${id}`, { method: 'DELETE' }); },
  reorderExperience(reorder) { return this.request('/api/cms/experience', { method: 'PATCH', body: JSON.stringify({ reorder }) }); },

  getSkills() { return this.request('/api/cms/skills'); },
  createSkill(data) { return this.request('/api/cms/skills', { method: 'POST', body: JSON.stringify(data) }); },
  updateSkill(data) { return this.request('/api/cms/skills', { method: 'PUT', body: JSON.stringify(data) }); },
  deleteSkill(id) { return this.request(`/api/cms/skills?id=${id}`, { method: 'DELETE' }); },
  reorderSkills(reorder) { return this.request('/api/cms/skills', { method: 'PATCH', body: JSON.stringify({ reorder }) }); },

  getProfile() { return this.request('/api/cms/profile'); },
  updateProfile(data) { return this.request('/api/cms/profile', { method: 'PUT', body: JSON.stringify(data) }); },

  getSocials() { return this.request('/api/cms/socials'); },
  createSocial(data) { return this.request('/api/cms/socials', { method: 'POST', body: JSON.stringify(data) }); },
  updateSocial(data) { return this.request('/api/cms/socials', { method: 'PUT', body: JSON.stringify(data) }); },
  deleteSocial(id) { return this.request(`/api/cms/socials?id=${id}`, { method: 'DELETE' }); },
  reorderSocials(reorder) { return this.request('/api/cms/socials', { method: 'PATCH', body: JSON.stringify({ reorder }) }); },

  getMessages(status = '') { return this.request(`/api/cms/messages${status ? `?status=${status}` : ''}`); },
  updateMessageStatus(id, status) { return this.request('/api/cms/messages', { method: 'PATCH', body: JSON.stringify({ id, status }) }); },
  deleteMessage(id) { return this.request(`/api/cms/messages?id=${id}`, { method: 'DELETE' }); },
};
