// ==============================================================================
// CLIENT-SIDE API WRAPPER & SESSION MANAGER
// Handles all communication with /api endpoints with seamless fallback
// ==============================================================================
import { DEFAULT_PORTFOLIO_DATA } from './data-default.js';

const TOKEN_KEY = 'jk_adm_session_token';

export const apiClient = {
  // Session token handling (stored in sessionStorage for XSS safety across browser restarts)
  getToken() {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) sessionStorage.setItem(TOKEN_KEY, token);
      else sessionStorage.removeItem(TOKEN_KEY);
    } catch {}
  },

  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `HTTP error ${res.status}`);
      }

      return data;
    } catch (err) {
      // Re-throw with clean error message
      throw err;
    }
  },

  // 1. PUBLIC ENDPOINTS
  async getPortfolio() {
    try {
      const data = await this.request('/api/portfolio');
      return data;
    } catch (err) {
      console.warn('Backend unavailable, using resilient default data:', err.message);
      return DEFAULT_PORTFOLIO_DATA;
    }
  },

  async sendContactMessage(payload) {
    return this.request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // 2. AUTHENTICATION ENDPOINTS
  async login(email, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.accessToken) {
      this.setToken(res.accessToken);
    }
    return res;
  },

  async checkSession() {
    const token = this.getToken();
    if (!token) return { authenticated: false };

    try {
      const res = await this.request('/api/auth/session');
      return res;
    } catch {
      this.setToken(null);
      return { authenticated: false };
    }
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignored
    }
    this.setToken(null);
  },

  // 3. CMS DASHBOARD & AUDIT
  async getDashboard() {
    return this.request('/api/cms/dashboard');
  },

  async getAuditLogs(limit = 40) {
    return this.request(`/api/cms/audit-logs?limit=${limit}`);
  },

  // 4. CMS PROJECTS
  async getProjects() {
    return this.request('/api/cms/projects');
  },
  async createProject(data) {
    return this.request('/api/cms/projects', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateProject(data) {
    return this.request('/api/cms/projects', { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteProject(id) {
    return this.request(`/api/cms/projects?id=${id}`, { method: 'DELETE' });
  },
  async patchProject(body) {
    return this.request('/api/cms/projects', { method: 'PATCH', body: JSON.stringify(body) });
  },

  // 5. CMS EXPERIENCE
  async getExperience() {
    return this.request('/api/cms/experience');
  },
  async createExperience(data) {
    return this.request('/api/cms/experience', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateExperience(data) {
    return this.request('/api/cms/experience', { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteExperience(id) {
    return this.request(`/api/cms/experience?id=${id}`, { method: 'DELETE' });
  },
  async reorderExperience(reorder) {
    return this.request('/api/cms/experience', { method: 'PATCH', body: JSON.stringify({ reorder }) });
  },

  // 6. CMS SKILLS
  async getSkills() {
    return this.request('/api/cms/skills');
  },
  async createSkill(data) {
    return this.request('/api/cms/skills', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateSkill(data) {
    return this.request('/api/cms/skills', { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteSkill(id) {
    return this.request(`/api/cms/skills?id=${id}`, { method: 'DELETE' });
  },
  async reorderSkills(reorder) {
    return this.request('/api/cms/skills', { method: 'PATCH', body: JSON.stringify({ reorder }) });
  },

  // 7. CMS PROFILE
  async getProfile() {
    return this.request('/api/cms/profile');
  },
  async updateProfile(data) {
    return this.request('/api/cms/profile', { method: 'PUT', body: JSON.stringify(data) });
  },

  // 8. CMS SOCIALS
  async getSocials() {
    return this.request('/api/cms/socials');
  },
  async createSocial(data) {
    return this.request('/api/cms/socials', { method: 'POST', body: JSON.stringify(data) });
  },
  async updateSocial(data) {
    return this.request('/api/cms/socials', { method: 'PUT', body: JSON.stringify(data) });
  },
  async deleteSocial(id) {
    return this.request(`/api/cms/socials?id=${id}`, { method: 'DELETE' });
  },
  async reorderSocials(reorder) {
    return this.request('/api/cms/socials', { method: 'PATCH', body: JSON.stringify({ reorder }) });
  },

  // 9. CMS MESSAGES
  async getMessages(status = '') {
    const q = status ? `?status=${status}` : '';
    return this.request(`/api/cms/messages${q}`);
  },
  async updateMessageStatus(id, status) {
    return this.request('/api/cms/messages', { method: 'PATCH', body: JSON.stringify({ id, status }) });
  },
  async deleteMessage(id) {
    return this.request(`/api/cms/messages?id=${id}`, { method: 'DELETE' });
  },
};
