// Result Detail Page
const esitoDetailPage = {
  esito: null,

  async render(id) {
    try {
      this.esito = await app.api(`/esiti/${id}`);
      const categorie = this.esito.analisi_per_categoria ?
        JSON.parse(this.esito.analisi_per_categoria) : {};

      const html = `
        <div class="page-header">
          <button class="btn btn-secondary" onclick="history.back()">← Indietro</button>
          <h1>Dettaglio Esito</h1>
        </div>

        <div class="card" style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="margin-bottom: 8px;">Esito Finale</h2>
              <p style="color: #6B7280;">Punteggio complessivo</p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 3rem; font-weight: 700; color: #635BFF;">
                ${this.esito.punteggio_percentuale}%
              </div>
              <span class="badge ${this.esito.superato ? 'badge-success' : 'badge-error'}">
                ${this.esito.superato ? '✓ Superato' : '✗ Non Superato'}
              </span>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 24px;">
          <h3 style="margin-bottom: 16px;">Per Categoria</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            ${Object.entries(categorie).map(([cat, pct]) => `
              <div style="padding: 12px; border: 1px solid #E5E7EB; border-radius: 6px;">
                <div style="font-weight: 600; margin-bottom: 8px;">${cat}</div>
                <div style="background: #E5E7EB; height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: #635BFF; height: 100%; width: ${pct}%;"></div>
                </div>
                <div style="font-size: 0.875rem; color: #6B7280; margin-top: 4px;">
                  ${pct}%
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        ${this.esito.livello_comprensione ? `
          <div class="card" style="margin-bottom: 24px;">
            <h3>Livello Comprensione</h3>
            <p style="color: #6B7280; margin-top: 8px;">
              ${this.esito.livello_comprensione}
            </p>
          </div>
        ` : ''}

        ${this.esito.note_ai ? `
          <div class="card" style="margin-bottom: 24px;">
            <h3>Note Analisi</h3>
            <p style="color: #6B7280; margin-top: 8px; white-space: pre-wrap;">
              ${this.esito.note_ai}
            </p>
          </div>
        ` : ''}

        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary" onclick="esitoDetailPage.inviaEmail()">
            ✉️ Invia Email
          </button>
        </div>
      `;
      app.layout('Esito', html);
    } catch (err) {
      app.toast('Errore nel caricamento', 'error');
    }
  },

  async inviaEmail() {
    if (!this.esito.email_inviata) {
      try {
        const res = await app.api(`/email/invia/${this.esito.id}`, {
          method: 'POST'
        });
        app.toast(`Email inviata a ${res.sent_to}`);
        this.render(this.esito.id);
      } catch (err) {
        app.toast('Errore nell\'invio', 'error');
      }
    } else {
      app.toast('Email già inviata');
    }
  }
};
