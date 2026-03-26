const dashboardPage = {
  async render() {
    try {
      const [corsi, esami] = await Promise.all([
        app.api('/corsi'),
        app.api('/esami')
      ]);

      const recentEsiti = await app.api('/esiti/miei').catch(() => []);

      // Stats
      const totalStudents = recentEsiti.length;
      const passed = recentEsiti.filter(e => e.tipo_esito === 'positivo').length;
      const failed = recentEsiti.filter(e => e.tipo_esito === 'negativo').length;

      const html = `
        <div class="page-header" style="margin-bottom: 24px;">
          <h2 style="margin: 0;">Dashboard</h2>
          <p style="color: var(--color-neutral-text-secondary); margin-top: 4px;">Panoramica di corsi, esami e risultati</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 30px;">
          <div style="background: white; padding: 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 12px; color: var(--color-neutral-text-tertiary); text-transform: uppercase;">Corsi</div>
            <div style="font-size: 32px; font-weight: 700; margin-top: 8px;">${corsi?.length || 0}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 12px; color: var(--color-neutral-text-tertiary); text-transform: uppercase;">Esami</div>
            <div style="font-size: 32px; font-weight: 700; margin-top: 8px;">${esami?.length || 0}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 12px; color: var(--color-neutral-text-tertiary); text-transform: uppercase;">Esiti Totali</div>
            <div style="font-size: 32px; font-weight: 700; margin-top: 8px;">${totalStudents}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 12px; color: var(--color-neutral-text-tertiary); text-transform: uppercase;">Promossi</div>
            <div style="font-size: 32px; font-weight: 700; margin-top: 8px; color: var(--color-success);">${passed}</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <div style="font-size: 12px; color: var(--color-neutral-text-tertiary); text-transform: uppercase;">Non Promossi</div>
            <div style="font-size: 32px; font-weight: 700; margin-top: 8px; color: var(--color-danger);">${failed}</div>
          </div>
        </div>

        <h3 style="margin-bottom: 12px;">Azioni Rapide</h3>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 30px;">
          <button onclick="location.hash='#/corsi'" style="padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">🍶 Corsi</button>
          <button onclick="location.hash='#/esami'" style="padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">📝 Crea Esame</button>
          <button onclick="location.hash='#/valutazione'" style="padding: 10px 20px; background: var(--color-neutral-bg); color: var(--color-neutral-text); border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); cursor: pointer;">✅ Valutazione Domande</button>
          <button onclick="location.hash='#/esiti'" style="padding: 10px 20px; background: var(--color-neutral-bg); color: var(--color-neutral-text); border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); cursor: pointer;">📊 Risultati</button>
          <button onclick="location.hash='#/notifiche'" style="padding: 10px 20px; background: var(--color-neutral-bg); color: var(--color-neutral-text); border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); cursor: pointer;">🔔 Notifiche</button>
        </div>

        ${recentEsiti.length ? `
        <h3 style="margin-bottom: 12px;">Ultimi Esiti</h3>
        <div style="background: white; border-radius: var(--radius-md); border: 1px solid var(--color-neutral-border-light); overflow: hidden;">
          ${recentEsiti.slice(0, 10).map(e => `
            <div style="padding: 12px 16px; border-bottom: 1px solid var(--color-neutral-border-light); display: flex; justify-content: space-between; align-items: center; cursor: pointer;"
              onclick="location.hash='#/esiti/${e.id}'">
              <div>
                <span style="font-weight: 500;">${e.esame_nome || 'Esame'}</span>
                ${e.nome ? `<span style="color: var(--color-neutral-text-secondary); font-size: 13px;"> — ${e.nome} ${e.cognome || ''}</span>` : ''}
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <span style="font-size: 12px; padding: 2px 8px; border-radius: var(--radius-full); background: ${e.tipo_esito === 'positivo' ? 'var(--color-success-light)' : e.tipo_esito === 'negativo' ? 'var(--color-danger-light)' : 'var(--color-warning-light)'}; color: ${e.tipo_esito === 'positivo' ? '#1B8A3B' : e.tipo_esito === 'negativo' ? '#CC3730' : '#B36D00'};">${e.tipo_esito}</span>
                <span style="font-weight: 600; color: var(--color-primary);">${e.punteggio_percentuale?.toFixed(1) || 0}%</span>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
      `;

      app.layout('Dashboard', html);
    } catch (err) {
      app.layout('Dashboard', '<p style="color: var(--color-danger);">Errore nel caricamento dei dati</p>');
    }
  }
};
