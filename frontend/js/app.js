// SSA Esiti - Main App (Router, Auth, API)
const app = {
  user: null,
  token: null,

  init() {
    const saved = sessionStorage.getItem('ssa_auth');
    if (saved) {
      try {
        const { token, user } = JSON.parse(saved);
        this.token = token;
        this.user = user;
      } catch (e) { sessionStorage.removeItem('ssa_auth'); }
    }
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  route() {
    const hash = location.hash.slice(1) || '';
    if (!this.user && hash !== '/login') { location.hash = '/login'; return; }
    if (this.user && (hash === '/login' || hash === '')) {
      location.hash = this.user.ruolo === 'professore' ? '/dashboard' : '/esiti-miei';
      return;
    }

    const parts = hash.split('/').filter(Boolean);
    const page = parts[0];
    const param = parts[1];

    const pages = {
      'login': () => loginPage.render(),
      'dashboard': () => dashboardPage.render(),
      'corsi': () => corsiPage.render(),
      'esami': () => param ? esameDetailPage.render(param) : esamiPage.render(),
      'domande': () => domandePage.render(param),
      'valutazione': () => valutazionePage.render(),
      'studenti': () => studentiPage.render(),
      'esiti': () => param ? esitoDetailPage.render(param) : esitiPage.render(),
      'esiti-miei': () => esitiPage.render(true),
      'email': () => emailPage.render(),
      'notifiche': () => notifichePage.render(),
      'knowledge-base': () => kbPage.render(),
      'api-keys': () => apiKeysPage.render(),
      'impostazioni': () => impostazioniPage.render(),
    };

    const render = pages[page];
    if (render) render();
    else if (this.user) { location.hash = '/dashboard'; }
  },

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    sessionStorage.setItem('ssa_auth', JSON.stringify({ token, user }));
    location.hash = user.ruolo === 'professore' ? '/dashboard' : '/esiti-miei';
  },

  logout() {
    this.token = null; this.user = null;
    sessionStorage.removeItem('ssa_auth');
    location.hash = '/login';
  },

  layout(title, content) {
    const isProf = this.user?.ruolo === 'professore';
    const nav = isProf ? `
      <a href="#/dashboard" class="nav-item">Dashboard</a>
      <div class="nav-sep">Gestione</div>
      <a href="#/corsi" class="nav-item">🍶 Corsi</a>
      <a href="#/esami" class="nav-item">📝 Esami</a>
      <a href="#/domande" class="nav-item">❓ Domande</a>
      <a href="#/valutazione" class="nav-item">✅ Valutazione</a>
      <a href="#/studenti" class="nav-item">👥 Studenti</a>
      <div class="nav-sep">Analisi & Comunicazione</div>
      <a href="#/esiti" class="nav-item">📊 Esiti</a>
      <a href="#/email" class="nav-item">📧 Email Esiti</a>
      <a href="#/notifiche" class="nav-item">🔔 Notifiche</a>
      <div class="nav-sep">Config</div>
      <a href="#/knowledge-base" class="nav-item">📚 Knowledge Base</a>
      <a href="#/api-keys" class="nav-item">🔑 API Keys</a>
      <a href="#/impostazioni" class="nav-item">⚙️ Impostazioni</a>
    ` : `
      <a href="#/esiti-miei" class="nav-item">📊 I miei Esiti</a>
      <a href="#/impostazioni" class="nav-item">⚙️ Profilo</a>
    `;

    document.getElementById('app').innerHTML = `
      <div class="layout">
        <aside class="sidebar">
          <div class="sidebar-logo">
            <span class="logo-icon">&#127862;</span> SSA Esiti
          </div>
          <nav>${nav}</nav>
          <div class="sidebar-footer">
            <div class="user-badge">${this.user?.email || ''}</div>
            <button class="btn-sm" onclick="app.logout()">Esci</button>
          </div>
        </aside>
        <main class="main">
          <header class="topbar"><h1>${title}</h1></header>
          <div class="content">${content}</div>
        </main>
      </div>`;

    // Highlight active nav
    document.querySelectorAll('.nav-item').forEach(a => {
      const href = a.getAttribute('href');
      a.classList.toggle('active', location.hash.startsWith(href));
    });
  },

  async api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...opts.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(`/api${path}`, { ...opts, headers });
    if (res.status === 401) { this.logout(); throw new Error('Unauthorized'); }
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  },

  async apiUpload(path, formData) {
    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const res = await fetch(`/api${path}`, { method: 'POST', headers, body: formData });
    if (!res.ok) throw new Error(`Upload ${res.status}`);
    return res.json();
  },

  toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
};

window.addEventListener('DOMContentLoaded', () => app.init());
