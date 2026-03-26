// Knowledge Base Page
const kbPage = {
  entries: [],
  categories: ['STORIA', 'PRODUZIONE', 'DEGUSTAZIONE', 'LEGISLAZIONE', 'ALTRO'],

  async render() {
    try {
      const res = await app.api('/knowledge-base');
      this.entries = res;

      const html = `
        <div class="page-header">
          <h1>Knowledge Base</h1>
          <button class="btn btn-primary" onclick="kbPage.showCreateModal()">
            ➕ Nuovo Articolo
          </button>
        </div>

        <div class="form-group">
          <label class="form-label">Filtra per Categoria</label>
          <select class="form-select" style="max-width: 200px;"
                  onchange="kbPage.filterByCategory(this.value)">
            <option value="">Tutte</option>
            ${this.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>

        <div id="kb-list">
          ${this.renderEntries(this.entries)}
        </div>
      `;
      app.layout('Knowledge Base', html);
    } catch (err) {
      app.toast('Errore nel caricamento', 'error');
    }
  },

  renderEntries(entries) {
    if (!entries.length) {
      return `<div style="text-align: center; padding: 40px; color: #9CA3AF;">
        Nessun articolo. Creane uno nuovo.
      </div>`;
    }

    return entries.map(e => `
      <div class="card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 8px;">${e.titolo}</h3>
        <p style="color: #6B7280; margin-bottom: 12px;">
          ${e.contenuto.substring(0, 150)}...
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 8px;">
            <span class="badge">${e.categoria}</span>
            <span class="badge badge-neutral">${e.lingua}</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-secondary" onclick="kbPage.editEntry('${e.id}')">
              ✏️ Modifica
            </button>
            <button class="btn btn-sm btn-error" onclick="kbPage.deleteEntry('${e.id}')">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  filterByCategory(categoria) {
    const filtered = categoria ?
      this.entries.filter(e => e.categoria === categoria) :
      this.entries;
    document.getElementById('kb-list').innerHTML = this.renderEntries(filtered);
  },

  showCreateModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 1000;
    `;
    modal.innerHTML = `
      <div class="card" style="max-width: 500px; width: 90%;">
        <h2 style="margin-bottom: 16px;">Nuovo Articolo</h2>
        <form onsubmit="kbPage.createEntry(event)">
          <div class="form-group">
            <label class="form-label">Titolo</label>
            <input type="text" name="titolo" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select name="categoria" class="form-select" required>
              <option value="">-- Scegli --</option>
              ${this.categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Contenuto</label>
            <textarea name="contenuto" class="form-textarea" required style="min-height: 150px;"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Lingua</label>
            <select name="lingua" class="form-select" required>
              <option value="IT">Italiano</option>
              <option value="EN">English</option>
              <option value="JP">日本語</option>
            </select>
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

  async createEntry(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await app.api('/knowledge-base', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(fd))
      });
      app.toast('Articolo creato');
      document.body.querySelector('[style*="position: fixed"]')?.remove();
      this.render();
    } catch (err) {
      app.toast('Errore nella creazione', 'error');
    }
  },

  editEntry(id) {
    app.toast('Funzione in sviluppo');
  },

  async deleteEntry(id) {
    if (confirm('Eliminare questo articolo?')) {
      try {
        await app.api(`/knowledge-base/${id}`, { method: 'DELETE' });
        app.toast('Articolo eliminato');
        this.render();
      } catch (err) {
        app.toast('Errore nell\'eliminazione', 'error');
      }
    }
  }
};
