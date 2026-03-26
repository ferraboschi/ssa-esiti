const domandePage = {
  domande: [],
  esameId: null,

  async render(esameId) {
    this.esameId = esameId;
    const html = `
      <div class="page-header" style="margin-bottom: 20px;">
        <h2 style="margin: 0;">Domande</h2>
      </div>

      ${!esameId ? `
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Seleziona Esame:</label>
          <select id="esameSelect" onchange="domandePage.changeEsame(this.value)" style="padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); min-width: 250px;">
            <option value="">-- Seleziona un esame --</option>
          </select>
        </div>
      ` : ''}

      <div id="domandeList"></div>
    `;

    app.layout('Domande', html);

    if (esameId) {
      await this.loadDomande(esameId);
    } else {
      await this.loadEsamiSelect();
    }
  },

  async loadEsamiSelect() {
    try {
      const esami = await app.api('/esami');
      const select = document.getElementById('esameSelect');
      if (select) {
        select.innerHTML = '<option value="">-- Seleziona un esame --</option>' +
          esami.map(e => `<option value="${e.id}">${e.nome} (${e.tipo})</option>`).join('');
      }
    } catch (err) {
      console.error('Error loading esami:', err);
    }
  },

  changeEsame(esameId) {
    if (esameId) window.location.hash = `#/domande/${esameId}`;
  },

  async loadDomande(esameId) {
    try {
      this.domande = await app.api(`/domande?esame_id=${esameId}`);
      this.renderDomande();
    } catch (err) {
      console.error('Error loading domande:', err);
    }
  },

  renderDomande() {
    const html = this.domande.length === 0 ? '<p style="color: var(--color-neutral-text-tertiary); padding: 20px;">Nessuna domanda</p>' : this.domande.map((d, i) => `
      <div style="background: white; padding: 20px; margin-bottom: 12px; border-radius: var(--radius-md); border: 1px solid var(--color-neutral-border-light);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <h3 style="margin: 0; font-size: 15px;">Domanda ${d.numero || (i + 1)}</h3>
          <span style="background: var(--color-neutral-bg); padding: 4px 8px; border-radius: var(--radius-sm); font-size: 12px;">${d.tipo}</span>
        </div>
        <p style="margin: 8px 0; color: var(--color-neutral-text);">${d.testo_it}</p>
        <p style="margin: 6px 0; color: var(--color-neutral-text-secondary); font-size: 12px;">Categoria: ${d.categoria || '-'}</p>
        <p style="margin: 6px 0; color: var(--color-success); font-size: 12px;">Risposta corretta: <strong>${d.risposta_corretta_it}</strong></p>
        <button onclick="domandePage.editDomanda('${d.id}')" style="padding: 6px 12px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; margin-top: 8px; font-size: 13px;">Modifica</button>
      </div>
    `).join('');

    const container = document.getElementById('domandeList');
    if (container) container.innerHTML = html;
  },

  editDomanda(id) {
    const domanda = this.domande.find(d => d.id === id);
    if (!domanda) return;

    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div style="background: white; padding: 30px; border-radius: var(--radius-lg); width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
          <h2 style="margin-top: 0;">Modifica Domanda</h2>
          <form onsubmit="domandePage.saveDomanda(event, '${id}')">
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Testo (Italiano)</label>
              <textarea name="testo_it" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); height: 100px; box-sizing: border-box;">${domanda.testo_it || ''}</textarea>
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Tipo</label>
              <select name="tipo" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);">
                <option value="scelta_multipla" ${domanda.tipo === 'scelta_multipla' ? 'selected' : ''}>Scelta Multipla</option>
                <option value="risposta_aperta" ${domanda.tipo === 'risposta_aperta' ? 'selected' : ''}>Risposta Aperta (AI)</option>
              </select>
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Risposta Corretta</label>
              <input type="text" name="risposta_corretta_it" value="${domanda.risposta_corretta_it || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Categoria</label>
              <input type="text" name="categoria" value="${domanda.categoria || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">
            </div>
            <div style="display: flex; gap: 10px;">
              <button type="submit" style="padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">Salva</button>
              <button type="button" onclick="this.closest('[style*=\\'position: fixed\\']').remove()" style="padding: 10px 20px; background: var(--color-neutral-bg); border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); cursor: pointer;">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async saveDomanda(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await app.api(`/domande/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      document.querySelector('[style*="position: fixed"]')?.remove();
      app.toast('Domanda aggiornata');
      await this.loadDomande(this.esameId);
    } catch (err) {
      app.toast('Errore nel salvataggio', 'error');
    }
  }
};
