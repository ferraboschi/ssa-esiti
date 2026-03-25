const esamiPage = {
  esami: [],

  async render() {
    try {
      this.esami = await fetch(app.api('/api/esami')).then(r => r.json());

      const html = `
        <div class="page-header">
          <h1>Esami</h1>
          <button class="btn-primary" onclick="esamiPage.showCreateModal()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
            + Nuovo Esame
          </button>
        </div>

        <div id="examsList">
          ${this.renderExamsList()}
        </div>

        <div id="createModal" style="display: none;">
          <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 400px;">
              <h2>Nuovo Esame</h2>
              <form onsubmit="esamiPage.createExam(event)">
                <div class="form-group" style="margin-bottom: 15px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nome</label>
                  <input type="text" name="nome" required placeholder="Nome esame" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: 500;">Corso</label>
                  <select name="corso_id" required id="corsoSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"></select>
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: 500;">Tipo</label>
                  <select name="tipo" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                    <option value="feedback">Feedback</option>
                    <option value="test_esame">Test Esame</option>
                    <option value="esame">Esame</option>
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 15px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: 500;">Città</label>
                  <input type="text" name="citta" placeholder="Città" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                <button type="submit" class="btn-primary" style="width: 100%; padding: 10px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Crea</button>
              </form>
              <button onclick="esamiPage.closeModal()" style="margin-top: 10px; width: 100%; padding: 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">Annulla</button>
            </div>
          </div>
        </div>
      `;

      app.layout('Esami', html);
      await this.loadCorsiForSelect();
    } catch (err) {
      app.layout('Esami', '<p>Errore nel caricamento degli esami</p>');
    }
  },

  renderExamsList() {
    if (!this.esami.length) return '<p>Nessun esame</p>';
    return `
      <table style="width: 100%; border-collapse: collapse; background: white;">
        <thead>
          <tr style="border-bottom: 2px solid #e0e0e0;">
            <th style="padding: 15px; text-align: left;">Nome</th>
            <th style="padding: 15px; text-align: left;">Tipo</th>
            <th style="padding: 15px; text-align: left;">Corso</th>
            <th style="padding: 15px; text-align: left;">Data</th>
            <th style="padding: 15px; text-align: left;">Azioni</th>
          </tr>
        </thead>
        <tbody>
          ${this.esami.map(e => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px;">${e.nome}</td>
              <td style="padding: 12px;"><span style="background: #f0f0f0; padding: 4px 8px; border-radius: 3px; font-size: 12px;">${e.tipo}</span></td>
              <td style="padding: 12px;">${e.corso_nome || '-'}</td>
              <td style="padding: 12px;">${e.data_esame || '-'}</td>
              <td style="padding: 12px;">
                <button class="btn-small" onclick="window.location.hash='#/esame/${e.id}'" style="background: #667eea; color: white; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">Visualizza</button>
                <button class="btn-small" onclick="window.location.hash='#/esame/${e.id}'" style="background: #f0f0f0; padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">Correggi</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  async loadCorsiForSelect() {
    try {
      const corsi = await fetch(app.api('/api/corsi')).then(r => r.json());
      const select = document.getElementById('corsoSelect');
      select.innerHTML = corsi.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    } catch (err) {
      console.error('Error loading corsi:', err);
    }
  },

  showCreateModal() {
    document.getElementById('createModal').style.display = 'block';
  },

  closeModal() {
    document.getElementById('createModal').style.display = 'none';
  },

  async createExam(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    try {
      await fetch(app.api('/api/esami'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(data))
      });
      this.closeModal();
      this.render();
    } catch (err) {
      console.error('Error creating exam:', err);
    }
  }
};
