const esameDetailPage = {
  esame: null,
  domande: [],
  activeTab: 'domande',

  async render(id) {
    try {
      this.esame = await fetch(app.api(`/api/esami/${id}`)).then(r => r.json());
      this.domande = await fetch(app.api(`/api/domande?esame_id=${id}`)).then(r => r.json());

      const html = `
        <div class="page-header">
          <h1>${this.esame.nome}</h1>
          <button onclick="window.location.hash='#/esami'" style="padding: 8px 16px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">← Indietro</button>
        </div>

        <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #eee;">
          <button onclick="esameDetailPage.switchTab('domande')" style="padding: 10px 20px; border: none; border-bottom: 3px solid ${this.activeTab === 'domande' ? '#667eea' : 'transparent'}; background: none; cursor: pointer; font-weight: ${this.activeTab === 'domande' ? 'bold' : 'normal'};">
            Domande (${this.domande.length})
          </button>
          <button onclick="esameDetailPage.switchTab('risultati')" style="padding: 10px 20px; border: none; border-bottom: 3px solid ${this.activeTab === 'risultati' ? '#667eea' : 'transparent'}; background: none; cursor: pointer; font-weight: ${this.activeTab === 'risultati' ? 'bold' : 'normal'};">
            Risultati
          </button>
          <button onclick="esameDetailPage.switchTab('upload')" style="padding: 10px 20px; border: none; border-bottom: 3px solid ${this.activeTab === 'upload' ? '#667eea' : 'transparent'}; background: none; cursor: pointer; font-weight: ${this.activeTab === 'upload' ? 'bold' : 'normal'};">
            Upload
          </button>
        </div>

        <div id="tabContent">
          ${this.renderTabContent()}
        </div>
      `;

      app.layout(this.esame.nome, html);
    } catch (err) {
      app.layout('Errore', '<p>Errore nel caricamento dell\'esame</p>');
    }
  },

  renderTabContent() {
    if (this.activeTab === 'domande') {
      return `
        <div>
          ${this.domande.length === 0 ? '<p>Nessuna domanda</p>' : `
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #e0e0e0;">
                  <th style="padding: 12px; text-align: left;">N.</th>
                  <th style="padding: 12px; text-align: left;">Domanda</th>
                  <th style="padding: 12px; text-align: left;">Categoria</th>
                  <th style="padding: 12px; text-align: left;">Tipo</th>
                </tr>
              </thead>
              <tbody>
                ${this.domande.map(d => `
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px;">${d.numero}</td>
                    <td style="padding: 12px;">${(d.testo_it || '').substring(0, 60)}...</td>
                    <td style="padding: 12px;">${d.categoria}</td>
                    <td style="padding: 12px;">${d.tipo}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      `;
    }

    if (this.activeTab === 'risultati') {
      return '<div><p>Sezione risultati in sviluppo</p></div>';
    }

    if (this.activeTab === 'upload') {
      return `
        <div style="max-width: 500px;">
          <h3 style="margin-bottom: 15px;">Carica Domande</h3>
          <div style="margin-bottom: 20px;">
            <input type="file" id="questionsFile" accept=".xlsx,.xls,.csv" style="display: block; margin-bottom: 10px;">
            <button onclick="esameDetailPage.uploadQuestions()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Carica Domande</button>
          </div>

          <h3 style="margin-bottom: 15px;">Carica Risultati</h3>
          <div style="margin-bottom: 20px;">
            <input type="file" id="resultsFile" accept=".xlsx,.xls,.csv" style="display: block; margin-bottom: 10px;">
            <button onclick="esameDetailPage.uploadResults()" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Carica Risultati</button>
          </div>

          <button onclick="esameDetailPage.triggerCorrection()" style="padding: 10px 20px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
            Avvia Correzione
          </button>
        </div>
      `;
    }
  },

  switchTab(tab) {
    this.activeTab = tab;
    const content = document.getElementById('tabContent');
    if (content) content.innerHTML = this.renderTabContent();
  },

  uploadQuestions() {
    alert('Upload domande - in sviluppo');
  },

  uploadResults() {
    alert('Upload risultati - in sviluppo');
  },

  async triggerCorrection() {
    try {
      await fetch(app.api(`/api/upload/correggi/${this.esame.id}`), { method: 'POST' });
      alert('Correzione avviata');
    } catch (err) {
      alert('Errore nella correzione');
    }
  }
};
