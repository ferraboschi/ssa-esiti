const dashboardPage = {
  async render() {
    try {
      const [corsi, esami] = await Promise.all([
        fetch(app.api('/api/corsi')).then(r => r.json()),
        fetch(app.api('/api/esami')).then(r => r.json())
      ]);

      const recentEsiti = await fetch(app.api('/api/esiti/miei'))
        .then(r => r.json()).catch(() => []);

      const html = `
        <div class="page-header">
          <h1>Dashboard</h1>
          <p style="color: #666; margin-top: 8px;">Panoramica di corsi, esami e risultati</p>
        </div>

        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 12px; color: #666;">Corsi Totali</div>
            <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">${corsi?.length || 0}</div>
          </div>
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 12px; color: #666;">Esami Totali</div>
            <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">${esami?.length || 0}</div>
          </div>
          <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 12px; color: #666;">Esiti Recenti</div>
            <div style="font-size: 32px; font-weight: bold; margin: 10px 0;">${recentEsiti?.length || 0}</div>
          </div>
        </div>

        <h2 style="margin-bottom: 15px;">Quick Actions</h2>
        <div style="display: flex; gap: 10px; margin-bottom: 30px;">
          <button class="btn-primary" onclick="window.location.hash='#/esami'" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Crea Esame
          </button>
          <button class="btn-secondary" onclick="window.location.hash='#/domande'" style="padding: 10px 20px; background: #f0f0f0; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
            Carica Domande
          </button>
          <button class="btn-secondary" onclick="window.location.hash='#/esiti'" style="padding: 10px 20px; background: #f0f0f0; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
            Visualizza Risultati
          </button>
        </div>
      `;

      app.layout('Dashboard', html);
    } catch (err) {
      app.layout('Dashboard', '<p>Errore nel caricamento dei dati</p>');
    }
  }
};
