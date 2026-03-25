// Results Overview Page
const esitiPage = {
  results: [],
  exams: [],
  isStudent: false,

  async render(miei = false) {
    this.isStudent = miei;
    try {
      if (miei) {
        const data = await app.api('/api/esiti/miei');
        this.results = data;
      } else {
        this.exams = await app.api('/api/esami');
        const res = await app.api('/api/esiti');
        this.results = res;
      }

      const examDropdown = !this.isStudent ? `
        <select class="form-select" style="max-width: 200px;" onchange="esitiPage.filterByExam(this.value)">
          <option value="">Tutti gli esami</option>
          ${this.exams.map(e => `<option value="${e.id}">${e.nome}</option>`).join('')}
        </select>
      ` : '';

      const html = `
        <div class="page-header">
          <h1>${this.isStudent ? 'I miei Esiti' : 'Esiti'}</h1>
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
      return `<div style="text-align: center; padding: 40px; color: #9CA3AF;">
        Nessun esito disponibile
      </div>`;
    }

    return results.map(r => `
      <div class="card" style="margin-bottom: 16px; cursor: pointer;" onclick="location.hash = '/esiti/${r.id}'">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <h3>${r.esame_nome || 'Esame'}</h3>
            <p style="color: #6B7280; margin: 8px 0;">${r.tipo_esito}</p>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="badge ${r.punteggio_percentuale > 70 ? 'badge-success' :
                r.punteggio_percentuale >= 50 ? 'badge-warning' : 'badge-error'}">
                ${r.punteggio_percentuale}%
              </span>
              <span class="badge">${r.tipo_esito}</span>
            </div>
            <p style="font-size: 0.875rem; color: #9CA3AF; margin-top: 8px;">
              ${new Date(r.created_at).toLocaleDateString('it-IT')}
            </p>
          </div>
          <div style="text-align: right; min-width: 100px;">
            <div style="font-size: 2.5rem; font-weight: 700; color: #635BFF;">
              ${r.punteggio_percentuale}%
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  filterByExam(examId) {
    const filtered = examId ?
      this.results.filter(r => r.esame_id === examId) :
      this.results;
    document.getElementById('results-container').innerHTML =
      this.renderResultsList(filtered);
  }
};
