const studentiPage = {
  studenti: [],

  async render() {
    try {
      const users = await app.api('/admin/users');
      this.studenti = users.filter(u => u.ruolo === 'studente');

      const html = `
        <div class="page-header">
          <h1>Studenti</h1>
          <button onclick="studentiPage.syncAirtable()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Sincronizza da Airtable
          </button>
        </div>

        <div style="margin-bottom: 20px;">
          <input type="text" id="searchInput" onkeyup="studentiPage.filterStudenti()" placeholder="Cerca per nome o email..." style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; width: 100%; max-width: 400px; box-sizing: border-box;">
        </div>

        <div id="studentiList">
          ${this.renderStudentiList(this.studenti)}
        </div>
      `;

      app.layout('Studenti', html);
    } catch (err) {
      app.layout('Studenti', '<p>Errore nel caricamento degli studenti</p>');
    }
  },

  renderStudentiList(studenti) {
    if (!studenti.length) return '<p>Nessuno studente</p>';
    return `
      <table style="width: 100%; border-collapse: collapse; background: white;">
        <thead>
          <tr style="border-bottom: 2px solid #e0e0e0;">
            <th style="padding: 15px; text-align: left;">Nome</th>
            <th style="padding: 15px; text-align: left;">Cognome</th>
            <th style="padding: 15px; text-align: left;">Email</th>
            <th style="padding: 15px; text-align: left;">Ruolo</th>
            <th style="padding: 15px; text-align: left;">Data Creazione</th>
          </tr>
        </thead>
        <tbody>
          ${studenti.map(s => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px;">${s.nome || '-'}</td>
              <td style="padding: 12px;">${s.cognome || '-'}</td>
              <td style="padding: 12px;">${s.email}</td>
              <td style="padding: 12px;"><span style="background: #e3f2fd; padding: 4px 8px; border-radius: 3px; font-size: 12px;">${s.ruolo}</span></td>
              <td style="padding: 12px;">${new Date(s.created_at).toLocaleDateString('it-IT')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  filterStudenti() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtered = this.studenti.filter(s =>
      (s.nome || '').toLowerCase().includes(search) ||
      (s.cognome || '').toLowerCase().includes(search) ||
      (s.email || '').toLowerCase().includes(search)
    );
    const container = document.getElementById('studentiList');
    if (container) container.innerHTML = this.renderStudentiList(filtered);
  },

  async syncAirtable() {
    try {
      const res = await app.api('/airtable/sync', { method: 'POST' });
      app.toast(`Sincronizzati ${res.synced} studenti da Airtable`);
      this.render();
    } catch (err) {
      app.toast('Errore nella sincronizzazione: ' + err.message, 'error');
    }
  }
};
