// Email Management Page
const emailPage = {
  exams: [],
  esiti: [],
  selectedExamId: null,

  async render() {
    try {
      this.exams = await app.api('/api/esami');

      const html = `
        <div class="page-header">
          <h1>Email</h1>
          <p style="color: #6B7280;">Invia email di feedback</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <div>
            <div class="form-group">
              <label class="form-label">Seleziona Esame</label>
              <select class="form-select" onchange="emailPage.selectExam(this.value)">
                <option value="">-- Scegli un esame --</option>
                ${this.exams.map(e => `<option value="${e.id}">${e.nome}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>

        <div id="esiti-list" style="margin-top: 24px;"></div>
      `;
      app.layout('Email', html);
    } catch (err) {
      app.toast('Errore nel caricamento', 'error');
    }
  },

  async selectExam(examId) {
    this.selectedExamId = examId;
    if (!examId) {
      document.getElementById('esiti-list').innerHTML = '';
      return;
    }

    try {
      const res = await app.api('/api/esiti/miei');
      this.esiti = res.filter(e => e.esame_id === examId);
      this.renderEsitiList();
    } catch (err) {
      app.toast('Errore nel caricamento esiti', 'error');
    }
  },

  renderEsitiList() {
    const html = `
      <div class="card">
        <div style="padding: 16px; font-weight: 600; border-bottom: 1px solid #E5E7EB;">
          Risultati (${this.esiti.length})
        </div>
        ${this.esiti.length === 0 ? `
          <div style="padding: 24px; text-align: center; color: #9CA3AF;">
            Nessun esito per questo esame
          </div>
        ` : `
          ${this.esiti.map(e => `
            <div style="padding: 16px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 600;">Studente ${e.id}</div>
                <div style="font-size: 0.875rem; color: #6B7280;">
                  ${e.punteggio_percentuale}% • ${new Date(e.created_at).toLocaleDateString('it-IT')}
                </div>
              </div>
              <div style="display: flex; gap: 8px;">
                <span class="badge ${e.email_inviata ? 'badge-success' : 'badge-warning'}">
                  ${e.email_inviata ? '✓ Inviata' : 'In sospeso'}
                </span>
                <button class="btn btn-sm btn-primary" onclick="emailPage.inviaEsito('${e.id}')">
                  Invia
                </button>
              </div>
            </div>
          `).join('')}
          <div style="padding: 16px;">
            <button class="btn btn-primary" onclick="emailPage.inviaPerTutti()">
              ✉️ Invia Tutti
            </button>
          </div>
        `}
      </div>
    `;
    document.getElementById('esiti-list').innerHTML = html;
  },

  async inviaEsito(esitoId) {
    try {
      const res = await app.api(`/api/email/invia/${esitoId}`, {
        method: 'POST'
      });
      app.toast(`Email inviata a ${res.sent_to}`);
      this.selectExam(this.selectedExamId);
    } catch (err) {
      app.toast('Errore nell\'invio', 'error');
    }
  },

  async inviaPerTutti() {
    try {
      const res = await app.api(
        `/api/email/invia-tutti/${this.selectedExamId}`,
        { method: 'POST' }
      );
      app.toast(`Inviate ${res.sent}/${res.total} email`);
      this.selectExam(this.selectedExamId);
    } catch (err) {
      app.toast('Errore nell\'invio', 'error');
    }
  }
};
