// API Keys Management Page
const apiKeysPage = {
  keys: [],

  async render() {
    try {
      const res = await app.api('/api/api-keys');
      this.keys = res;

      const html = `
        <div class="page-header">
          <h1>API Keys</h1>
          <button class="btn btn-primary" onclick="apiKeysPage.showCreateModal()">
            ➕ Nuova Chiave
          </button>
        </div>

        <div class="card">
          <div style="padding: 16px; font-weight: 600; border-bottom: 1px solid #E5E7EB;">
            Chiavi API (${this.keys.length})
          </div>
          <div id="keys-list">
            ${this.renderKeys()}
          </div>
        </div>
      `;
      app.layout('API Keys', html);
    } catch (err) {
      app.toast('Errore nel caricamento', 'error');
    }
  },

  renderKeys() {
    if (!this.keys.length) {
      return `<div style="padding: 24px; text-align: center; color: #9CA3AF;">
        Nessuna chiave API. Creane una nuova.
      </div>`;
    }

    return this.keys.map(k => `
      <div style="padding: 16px; border-bottom: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="font-weight: 600; margin-bottom: 4px;">${k.nome}</div>
            <div style="font-family: monospace; font-size: 0.85rem; color: #9CA3AF; margin-bottom: 4px;">
              ${k.chiave.substring(0, 10)}...${k.chiave.substring(k.chiave.length - 10)}
            </div>
            <div style="font-size: 0.875rem; color: #6B7280;">
              ${new Date(k.created_at).toLocaleDateString('it-IT')}
              <span class="badge" style="margin-left: 8px;">
                ${k.attiva ? 'Attiva' : 'Disattiva'}
              </span>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-secondary"
                    onclick="apiKeysPage.copyKey('${k.chiave}')">
              📋 Copia
            </button>
            <button class="btn btn-sm btn-error"
                    onclick="apiKeysPage.deleteKey('${k.id}')">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  showCreateModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 1000;
    `;
    modal.innerHTML = `
      <div class="card" style="max-width: 400px; width: 90%;">
        <h2 style="margin-bottom: 16px;">Nuova Chiave API</h2>
        <form onsubmit="apiKeysPage.createKey(event)">
          <div class="form-group">
            <label class="form-label">Nome</label>
            <input type="text" name="nome" class="form-input" required
                   placeholder="es. Production API">
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="submit" class="btn btn-primary">Crea</button>
            <button type="button" class="btn btn-secondary"
                    onclick="this.closest('div').parentElement.remove()">Annulla</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async createKey(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await app.api('/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({ nome: fd.get('nome') })
      });
      app.toast(`Chiave creata: ${res.chiave.substring(0, 10)}...`);
      document.body.querySelector('[style*="position: fixed"]')?.remove();
      this.render();
    } catch (err) {
      app.toast('Errore nella creazione', 'error');
    }
  },

  copyKey(key) {
    navigator.clipboard.writeText(key);
    app.toast('Chiave copiata');
  },

  async deleteKey(id) {
    if (confirm('Eliminare questa chiave?')) {
      try {
        await app.api(`/api/api-keys/${id}`, { method: 'DELETE' });
        app.toast('Chiave eliminata');
        this.render();
      } catch (err) {
        app.toast('Errore nell\'eliminazione', 'error');
      }
    }
  }
};
