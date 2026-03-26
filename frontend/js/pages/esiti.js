// Results Overview Page
const esitiPage = {
  results: [],
  exams: [],
  isStudent: false,

  async render(miei = false) {
    this.isStudent = miei;
    try {
      this.results = await app.api('/esiti/miei');

      if (!miei) {
        this.exams = await app.api('/esami');
      }

      const examDropdown = !this.isStudent ? `
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
          <select class="form-select" style="max-width: 250px; padding: 8px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);" onchange="esitiPage.filterByExam(this.value)">
            <option value="">Tutti gli esami</option>
            ${this.exams.map(e => `<option value="${e.id}">${e.nome}</option>`).join('')}
          </select>
          <button onclick="esitiPage.exportExcel()" style="padding: 8px 16px; background: #30D158; color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 13px;">📥 Esporta XLS</button>
        </div>
      ` : '';

      const html = `
        <div class="page-header" style="margin-bottom: 16px;">
          <h2 style="margin: 0;">${this.isStudent ? 'I miei Esiti' : 'Esiti'}</h2>
        </div>
        ${examDropdown}
        <div id="results-container">
          ${this.renderResultsList(this.results)}
        </div>
      `;
      app.layout('Esiti', html);
    } catch (err) {
      app.toast('Errore nel caricamento', 'error');
    }
  },

  renderResultsList(results) {
    if (!results.length) {
      return '<div style="text-align: center; padding: 40px; color: var(--color-neutral-text-tertiary);">Nessun esito disponibile</div>';
    }

    return results.map(r => `
      <div style="background: white; margin-bottom: 12px; padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--color-neutral-border-light); cursor: pointer; transition: box-shadow 0.15s;"
        onmouseover="this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.boxShadow='none'"
        onclick="location.hash='/esiti/${r.id}'">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <h3 style="margin: 0 0 4px;">${r.esame_nome || 'Esame'}</h3>
            ${r.nome ? `<p style="font-size: 13px; color: var(--color-neutral-text-secondary); margin: 0 0 8px;">${r.nome} ${r.cognome || ''} — ${r.email || ''}</p>` : ''}
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="font-size: 12px; padding: 3px 10px; border-radius: var(--radius-full); background: ${r.tipo_esito === 'positivo' ? 'var(--color-success-light)' : r.tipo_esito === 'negativo' ? 'var(--color-danger-light)' : 'var(--color-warning-light)'}; color: ${r.tipo_esito === 'positivo' ? '#1B8A3B' : r.tipo_esito === 'negativo' ? '#CC3730' : '#B36D00'}; font-weight: 500;">${r.tipo_esito || ''}</span>
              ${r.email_inviata ? '<span style="font-size: 11px; color: var(--color-success);">📧 inviata</span>' : ''}
            </div>
            <p style="font-size: 12px; color: var(--color-neutral-text-tertiary); margin: 8px 0 0;">
              ${new Date(r.created_at).toLocaleDateString('it-IT')}
            </p>
          </div>
          <div style="text-align: right; min-width: 80px;">
            <div style="font-size: 28px; font-weight: 700; color: var(--color-primary);">
              ${r.punteggio_percentuale?.toFixed(1) || 0}%
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  filterByExam(examId) {
    const filtered = examId ? this.results.filter(r => r.esame_id === examId) : this.results;
    document.getElementById('results-container').innerHTML = this.renderResultsList(filtered);
  },

  exportExcel() {
    const select = document.querySelector('.form-select');
    const esameId = select?.value;
    if (!esameId) { app.toast('Seleziona un esame per esportare', 'error'); return; }
    // Direct download via browser
    const a = document.createElement('a');
    a.href = `/api/export/esiti/${esameId}`;
    a.download = 'esiti.xlsx';
    // Add auth header via fetch
    fetch(`/api/export/esiti/${esameId}`, {
      headers: { 'Authorization': `Bearer ${app.token}` }
    }).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'esiti_export.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      app.toast('File XLS scaricato');
    }).catch(() => app.toast('Errore nell\'export', 'error'));
  }
};
