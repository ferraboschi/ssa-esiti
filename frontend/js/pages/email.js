// Email Management Page
const emailPage = {
  exams: [],
  esiti: [],
  selectedExamId: null,

  async render() {
    try {
      this.exams = await app.api('/esami');

      const html = `
        <div class="page-header" style="margin-bottom: 20px;">
          <h2 style="margin: 0;">Email Esiti</h2>
          <p style="color: var(--color-neutral-text-secondary); margin-top: 4px;">Invia email di feedback con risultati esame</p>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Seleziona Esame</label>
          <select style="padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); min-width: 300px;" onchange="emailPage.selectExam(this.value)">
            <option value="">-- Scegli un esame --</option>
            ${this.exams.map(e => `<option value="${e.id}">${e.nome} (${e.tipo})</option>`).join('')}
          </select>
        </div>

        <div id="esiti-list"></div>
      `;
      app.layout('Email Esiti', html);
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
      this.esiti = await app.api(`/esiti/per-esame/${examId}`);
      this.renderEsitiList();
    } catch (err) {
      app.toast('Errore nel caricamento esiti', 'error');
    }
  },

  renderEsitiList() {
    const html = `
      <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--color-neutral-border-light); overflow: hidden;">
        <div style="padding: 16px; font-weight: 600; border-bottom: 1px solid var(--color-neutral-border-light); display: flex; justify-content: space-between; align-items: center;">
          <span>Risultati (${this.esiti.length})</span>
          ${this.esiti.length ? `<button onclick="emailPage.inviaPerTutti()" style="padding: 8px 16px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 13px;">Invia Tutti</button>` : ''}
        </div>
        ${this.esiti.length === 0 ? `
          <div style="padding: 24px; text-align: center; color: var(--color-neutral-text-tertiary);">
            Nessun esito per questo esame
          </div>
        ` : this.esiti.map(e => `
          <div style="padding: 16px; border-bottom: 1px solid var(--color-neutral-border-light); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 500;">${e.nome || ''} ${e.cognome || ''}</div>
              <div style="font-size: 12px; color: var(--color-neutral-text-secondary);">
                ${e.email} • ${e.punteggio_percentuale?.toFixed(1) || 0}% • ${e.tipo_esito || ''}
              </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-size: 12px; padding: 3px 8px; border-radius: var(--radius-full); background: ${e.email_inviata ? 'var(--color-success-light)' : 'var(--color-warning-light)'}; color: ${e.email_inviata ? '#1B8A3B' : '#B36D00'};">
                ${e.email_inviata ? '✓ Inviata' : 'In sospeso'}
              </span>
              ${!e.email_inviata ? `<button onclick="emailPage.inviaEsito('${e.id}')" style="padding: 6px 12px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; font-size: 12px;">Invia</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    document.getElementById('esiti-list').innerHTML = html;
  },

  async inviaEsito(esitoId) {
    try {
      const res = await app.api(`/email/invia/${esitoId}`, { method: 'POST' });
      app.toast(`Email inviata a ${res.sent_to}`);
      this.selectExam(this.selectedExamId);
    } catch (err) {
      app.toast("Errore nell'invio", 'error');
    }
  },

  async inviaPerTutti() {
    if (!confirm('Inviare email a tutti gli studenti?')) return;
    try {
      const res = await app.api(`/email/invia-tutti/${this.selectedExamId}`, { method: 'POST' });
      app.toast(`Inviate ${res.sent}/${res.total} email`);
      this.selectExam(this.selectedExamId);
    } catch (err) {
      app.toast("Errore nell'invio batch", 'error');
    }
  }
};
