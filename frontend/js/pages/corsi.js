// Corsi Page - Lista corsi con dettagli ed esami collegati
const corsiPage = {
  corsi: [],

  async render() {
    try {
      this.corsi = await app.api('/corsi');
      const html = `
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="margin: 0;">Corsi</h2>
            <p style="color: var(--color-neutral-text-secondary); margin-top: 4px;">Gestione corsi Nihonshu e Shochu</p>
          </div>
          <button class="btn btn-primary" onclick="corsiPage.showCreateModal()"
            style="padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">
            + Nuovo Corso
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="background: white; padding: 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 12px; color: var(--color-neutral-text-tertiary); text-transform: uppercase;">Totale Corsi</div>
            <div style="font-size: 32px; font-weight: 700; margin-top: 8px;">${this.corsi.length}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 12px; color: var(--color-neutral-text-tertiary); text-transform: uppercase;">Nihonshu</div>
            <div style="font-size: 32px; font-weight: 700; margin-top: 8px; color: #D4A574;">${this.corsi.filter(c => c.tipo === 'nihonshu').length}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 12px; color: var(--color-neutral-text-tertiary); text-transform: uppercase;">Shochu</div>
            <div style="font-size: 32px; font-weight: 700; margin-top: 8px; color: #7C9885;">${this.corsi.filter(c => c.tipo === 'shochu').length}</div>
          </div>
        </div>

        <div id="corsiList">${this.renderCorsiList()}</div>
      `;
      app.layout('Corsi', html);
    } catch (err) {
      app.layout('Corsi', '<p style="color: var(--color-danger);">Errore nel caricamento dei corsi</p>');
    }
  },

  renderCorsiList() {
    if (!this.corsi.length) return '<p style="color: var(--color-neutral-text-tertiary); padding: 40px; text-align: center;">Nessun corso disponibile</p>';

    return this.corsi.map(c => `
      <div style="background: white; padding: 20px; margin-bottom: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-neutral-border-light); cursor: pointer; transition: box-shadow 0.15s;"
        onmouseover="this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.boxShadow='none'"
        onclick="corsiPage.showDetail('${c.id}')">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">${c.tipo === 'nihonshu' ? '🍶' : '🥃'}</span>
              <h3 style="margin: 0; font-size: 16px;">${c.nome}</h3>
            </div>
            <p style="margin: 6px 0 0 30px; color: var(--color-neutral-text-secondary); font-size: 13px;">${c.descrizione || 'Nessuna descrizione'}</p>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="background: ${c.tipo === 'nihonshu' ? '#FEF3E2' : '#E8F5E9'}; color: ${c.tipo === 'nihonshu' ? '#D4A574' : '#7C9885'}; padding: 4px 12px; border-radius: var(--radius-full); font-size: 12px; font-weight: 500; text-transform: uppercase;">${c.tipo}</span>
            <span style="color: var(--color-neutral-text-tertiary);">→</span>
          </div>
        </div>
      </div>
    `).join('');
  },

  async showDetail(corsoId) {
    try {
      const corso = await app.api(`/corsi/${corsoId}`);
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
          <div style="background: white; padding: 30px; border-radius: var(--radius-lg); width: 90%; max-width: 650px; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <h2 style="margin: 0;">${corso.tipo === 'nihonshu' ? '🍶' : '🥃'} ${corso.nome}</h2>
              <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--color-neutral-text-tertiary);">×</button>
            </div>
            <p style="color: var(--color-neutral-text-secondary); margin-bottom: 20px;">${corso.descrizione || ''}</p>

            <h3 style="margin-bottom: 12px;">Esami collegati (${corso.esami?.length || 0})</h3>
            ${corso.esami?.length ? corso.esami.map(e => `
              <div style="padding: 12px; margin-bottom: 8px; border: 1px solid var(--color-neutral-border-light); border-radius: var(--radius-md); cursor: pointer;"
                onclick="this.closest('[style*=\\'position: fixed\\']').remove(); location.hash='#/esami/${e.id}'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 500;">${e.nome}</span>
                  <span style="font-size: 12px; color: var(--color-neutral-text-tertiary); background: var(--color-neutral-bg); padding: 2px 8px; border-radius: var(--radius-sm);">${e.tipo}</span>
                </div>
              </div>
            `).join('') : '<p style="color: var(--color-neutral-text-tertiary);">Nessun esame per questo corso</p>'}

            <div style="margin-top: 20px; display: flex; gap: 10px;">
              <button onclick="location.hash='#/esami'; this.closest('[style*=\\'position: fixed\\']').remove()"
                style="padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">Crea Esame per questo Corso</button>
              <button onclick="this.closest('[style*=\\'position: fixed\\']').remove()"
                style="padding: 10px 20px; background: var(--color-neutral-bg); border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); cursor: pointer;">Chiudi</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } catch (err) {
      app.toast('Errore nel caricamento dettaglio corso', 'error');
    }
  },

  showCreateModal() {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div style="background: white; padding: 30px; border-radius: var(--radius-lg); width: 90%; max-width: 500px;">
          <h2 style="margin: 0 0 20px;">Nuovo Corso</h2>
          <form onsubmit="corsiPage.createCorso(event)">
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nome Corso</label>
              <input type="text" name="nome" required placeholder="es. Nihonshu Advanced Level 2"
                style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Tipo</label>
              <select name="tipo" required style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);">
                <option value="nihonshu">🍶 Nihonshu</option>
                <option value="shochu">🥃 Shochu</option>
              </select>
            </div>
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Descrizione</label>
              <textarea name="descrizione" rows="3" placeholder="Descrizione del corso..."
                style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;"></textarea>
            </div>
            <div style="display: flex; gap: 10px;">
              <button type="submit" style="padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">Crea Corso</button>
              <button type="button" onclick="this.closest('[style*=\\'position: fixed\\']').remove()"
                style="padding: 10px 20px; background: var(--color-neutral-bg); border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); cursor: pointer;">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async createCorso(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await app.api('/corsi', { method: 'POST', body: JSON.stringify(data) });
      document.querySelector('[style*="position: fixed"]')?.remove();
      app.toast('Corso creato con successo');
      this.render();
    } catch (err) {
      app.toast('Errore nella creazione del corso', 'error');
    }
  }
};
