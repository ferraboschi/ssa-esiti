// Settings Page
const impostazioniPage = {
  async render() {
    try {
      const html = `
        <div class="page-header">
          <h1>Impostazioni</h1>
        </div>

        <div class="card" style="margin-bottom: 24px;">
          <div style="padding: 16px; border-bottom: 1px solid #E5E7EB;">
            <h3>Profilo</h3>
          </div>
          <div style="padding: 16px;">
            <div style="margin-bottom: 16px;">
              <label class="form-label">Email</label>
              <div style="padding: 8px; background: #F3F4F6; border-radius: 4px;">
                ${app.user?.email || 'Non disponibile'}
              </div>
            </div>
            <div style="margin-bottom: 16px;">
              <label class="form-label">Ruolo</label>
              <div style="padding: 8px; background: #F3F4F6; border-radius: 4px;">
                ${app.user?.ruolo === 'professore' ? 'Professore' : 'Studente'}
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 24px;">
          <div style="padding: 16px; border-bottom: 1px solid #E5E7EB;">
            <h3>Lingua e Localizzazione</h3>
          </div>
          <div style="padding: 16px;">
            <div class="form-group">
              <label class="form-label">Lingua Interfaccia</label>
              <select class="form-select" style="max-width: 200px;"
                      onchange="impostazioniPage.updateLanguage(this.value)">
                <option value="IT" selected>Italiano</option>
                <option value="EN">English</option>
                <option value="JP">日本語</option>
              </select>
            </div>
          </div>
        </div>

        ${app.user?.ruolo === 'professore' ? `
          <div class="card" style="margin-bottom: 24px;">
            <div style="padding: 16px; border-bottom: 1px solid #E5E7EB;">
              <h3>SMTP</h3>
            </div>
            <div style="padding: 16px; color: #6B7280;">
              <p style="margin-bottom: 8px;">Server SMTP configurato per l'invio email</p>
              <p style="font-size: 0.875rem;">Contatta l'amministratore per modificare.</p>
            </div>
          </div>
        ` : ''}

        <div class="card">
          <div style="padding: 16px; border-bottom: 1px solid #E5E7EB;">
            <h3>Piattaforma</h3>
          </div>
          <div style="padding: 16px;">
            <div style="font-size: 0.875rem; color: #6B7280;">
              <p><strong>SSA Esiti v1.0</strong></p>
              <p style="margin-top: 8px;">Sistema di gestione esiti per studi di sake</p>
            </div>
          </div>
        </div>
      `;
      app.layout('Impostazioni', html);
    } catch (err) {
      app.toast('Errore nel caricamento', 'error');
    }
  },

  updateLanguage(lang) {
    localStorage.setItem('ssa_language', lang);
    app.toast('Lingua aggiornata');
  }
};
