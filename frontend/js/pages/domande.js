const domandePage = {
  domande: [],
  esameId: null,

  async render(esameId) {
    this.esameId = esameId;
    const html = `
      <div class="page-header">
        <h1>Domande</h1>
      </div>

      ${!esameId ? `
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 8px; font-weight: 500;">Seleziona Esame:</label>
          <select id="esameSelect" onchange="domandePage.changeEsame(this.value)" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
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
      const esami = await fetch(app.api('/api/esami')).then(r => r.json());
      const select = document.getElementById('esameSelect');
      select.innerHTML += esami.map(e => `<option value="${e.id}">${e.nome}</option>`).join('');
    } catch (err) {
      console.error('Error loading esami:', err);
    }
  },

  changeEsame(esameId) {
    if (esameId) window.location.hash = `#/domande/${esameId}`;
  },

  async loadDomande(esameId) {
    try {
      this.domande = await fetch(app.api(`/api/domande?esame_id=${esameId}`)).then(r => r.json());
      this.renderDomande();
    } catch (err) {
      console.error('Error loading domande:', err);
    }
  },

  renderDomande() {
    const html = this.domande.length === 0 ? '<p>Nessuna domanda</p>' : this.domande.map((d, i) => `
      <div style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <h3 style="margin: 0;">Domanda ${i + 1}</h3>
          <span style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px; font-size: 12px;">${d.tipo}</span>
        </div>
        <p style="margin: 10px 0; color: #333;">${d.testo_it}</p>
        <p style="margin: 10px 0; color: #666; font-size: 12px;">Categoria: ${d.categoria}</p>
        <p style="margin: 10px 0; color: #666; font-size: 12px;">Risposta corretta: <strong>${d.risposta_corretta_it}</strong></p>
        <button onclick="domandePage.editDomanda('${d.id}')" style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">Modifica</button>
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
        <div style="background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
          <h2 style="margin-top: 0;">Modifica Domanda</h2>
          <form onsubmit="domandePage.saveDomanda(event, '${id}')">
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Testo (Italiano)</label>
              <textarea name="testo_it" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 100px; box-sizing: border-box;">${domanda.testo_it}</textarea>
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Tipo</label>
              <select name="tipo" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="multipla" ${domanda.tipo === 'multipla' ? 'selected' : ''}>Scelta Multipla</option>
                <option value="aperta" ${domanda.tipo === 'aperta' ? 'selected' : ''}>Aperta</option>
                <option value="vero_falso" ${domanda.tipo === 'vero_falso' ? 'selected' : ''}>Vero/Falso</option>
              </select>
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Risposta Corretta</label>
              <input type="text" name="risposta_corretta_it" value="${domanda.risposta_corretta_it}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
            </div>
            <div style="margin-bottom: 15px;">
              <label style="display: block; margin-bottom: 5px; font-weight: 500;">Categoria</label>
              <input type="text" name="categoria" value="${domanda.categoria}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
            </div>
            <button type="submit" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">Salva</button>
            <button type="button" onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="padding: 10px 20px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">Annulla</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async saveDomanda(e, id) {
    e.preventDefault();
    const data = new FormData(e.target);
    try {
      await fetch(app.api(`/api/domande/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data))
      });
      document.querySelector('[style*="position: fixed"]')?.remove();
      await this.loadDomande(this.esameId);
    } catch (err) {
      console.error('Error saving domanda:', err);
    }
  }
};
