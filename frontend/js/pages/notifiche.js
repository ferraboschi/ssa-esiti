// Notifiche Page - Invio notifiche email e WhatsApp
const notifichePage = {
  corsi: [],
  esami: [],
  studenti: [],

  async render() {
    try {
      this.corsi = await app.api('/corsi');
      this.esami = await app.api('/esami');

      const html = `
        <div class="page-header" style="margin-bottom: 24px;">
          <h2 style="margin: 0;">Notifiche</h2>
          <p style="color: var(--color-neutral-text-secondary); margin-top: 4px;">Invio email e messaggi WhatsApp agli studenti</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
          <!-- Email Esiti -->
          <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--color-neutral-border-light); overflow: hidden;">
            <div style="padding: 20px; border-bottom: 1px solid var(--color-neutral-border-light); background: var(--color-neutral-bg);">
              <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">📧 Email Esiti</h3>
              <p style="margin: 4px 0 0; font-size: 13px; color: var(--color-neutral-text-secondary);">Invia risultati esame via email</p>
            </div>
            <div style="padding: 20px;">
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Seleziona Esame</label>
                <select id="notifEsameSelect" onchange="notifichePage.loadEsitiForEmail(this.value)"
                  style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);">
                  <option value="">-- Scegli un esame --</option>
                  ${this.esami.map(e => `<option value="${e.id}">${e.nome} (${e.tipo})</option>`).join('')}
                </select>
              </div>
              <div id="emailEsitiList"></div>
            </div>
          </div>

          <!-- WhatsApp / Notifiche Generiche -->
          <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--color-neutral-border-light); overflow: hidden;">
            <div style="padding: 20px; border-bottom: 1px solid var(--color-neutral-border-light); background: var(--color-neutral-bg);">
              <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;">💬 Messaggi & WhatsApp</h3>
              <p style="margin: 4px 0 0; font-size: 13px; color: var(--color-neutral-text-secondary);">Invita studenti, invia promemoria</p>
            </div>
            <div style="padding: 20px;">
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Tipo Messaggio</label>
                <select id="msgTipoSelect" onchange="notifichePage.updateTemplate(this.value)"
                  style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);">
                  <option value="invito_corso">Invito Iscrizione Corso</option>
                  <option value="promemoria_esame">Promemoria Esame</option>
                  <option value="gruppo_certificati">Invito Gruppo Certificati</option>
                  <option value="custom">Messaggio Personalizzato</option>
                </select>
              </div>
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Corso</label>
                <select id="msgCorsoSelect" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);">
                  <option value="">-- Seleziona Corso --</option>
                  ${this.corsi.map(c => `<option value="${c.id}">${c.tipo === 'nihonshu' ? '🍶' : '🥃'} ${c.nome}</option>`).join('')}
                </select>
              </div>
              <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Messaggio</label>
                <textarea id="msgBody" rows="6" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box; font-family: inherit;"></textarea>
              </div>
              <div style="display: flex; gap: 10px;">
                <button onclick="notifichePage.sendEmailNotifica()"
                  style="flex: 1; padding: 10px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">
                  📧 Invia via Email
                </button>
                <button onclick="notifichePage.openWhatsApp()"
                  style="flex: 1; padding: 10px; background: #25D366; color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">
                  💬 Apri WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Storico Notifiche -->
        <div style="margin-top: 24px; background: white; border-radius: var(--radius-lg); border: 1px solid var(--color-neutral-border-light); overflow: hidden;">
          <div style="padding: 20px; border-bottom: 1px solid var(--color-neutral-border-light);">
            <h3 style="margin: 0;">Storico Invii Recenti</h3>
          </div>
          <div id="storicoNotifiche" style="padding: 20px;">
            <p style="color: var(--color-neutral-text-tertiary); text-align: center;">Lo storico verrà mostrato dopo il primo invio</p>
          </div>
        </div>
      `;
      app.layout('Notifiche', html);
      this.updateTemplate('invito_corso');
    } catch (err) {
      app.layout('Notifiche', '<p style="color: var(--color-danger);">Errore nel caricamento</p>');
    }
  },

  updateTemplate(tipo) {
    const templates = {
      invito_corso: `Ciao!\n\nTi invitiamo ad iscriverti al prossimo corso della Sake Sommelier Association.\n\nScopri il mondo del sake giapponese con i nostri esperti certificati.\n\nPer info e iscrizioni: corsi.sakesommelierassociation.it\n\nA presto!\nSSA Team`,
      promemoria_esame: `Ciao!\n\nTi ricordiamo che l'esame SSA si avvicina.\n\nAssicurati di ripassare tutti i materiali e di essere pronto/a per il giorno dell'esame.\n\nIn bocca al lupo!\nSSA Team`,
      gruppo_certificati: `Congratulazioni per aver superato l'esame!\n\nOra fai parte dei Sake Sommelier certificati SSA.\n\nUnisciti al nostro gruppo esclusivo per rimanere aggiornato su eventi, degustazioni e opportunità:\n👉 [Link Gruppo Certificati]\n\nBenvenuto/a nel club!\nSSA Team`,
      custom: ''
    };
    const textarea = document.getElementById('msgBody');
    if (textarea) textarea.value = templates[tipo] || '';
  },

  async loadEsitiForEmail(esameId) {
    const container = document.getElementById('emailEsitiList');
    if (!esameId) { container.innerHTML = ''; return; }

    try {
      const esiti = await app.api(`/esiti/per-esame/${esameId}`);
      if (!esiti.length) {
        container.innerHTML = '<p style="color: var(--color-neutral-text-tertiary); text-align: center; padding: 20px;">Nessun esito per questo esame</p>';
        return;
      }

      container.innerHTML = `
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; color: var(--color-neutral-text-secondary);">${esiti.length} risultati</span>
          <button onclick="notifichePage.inviaPerTutti('${esameId}')"
            style="padding: 8px 16px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 13px;">
            Invia Tutti
          </button>
        </div>
        ${esiti.map(e => `
          <div style="padding: 12px; border: 1px solid var(--color-neutral-border-light); border-radius: var(--radius-md); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 500; font-size: 14px;">${e.nome || ''} ${e.cognome || ''}</div>
              <div style="font-size: 12px; color: var(--color-neutral-text-secondary);">${e.email} • ${e.punteggio_percentuale?.toFixed(1)}%</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 11px; padding: 3px 8px; border-radius: var(--radius-full); background: ${e.tipo_esito === 'positivo' ? 'var(--color-success-light)' : e.tipo_esito === 'negativo' ? 'var(--color-danger-light)' : 'var(--color-warning-light)'}; color: ${e.tipo_esito === 'positivo' ? '#1B8A3B' : e.tipo_esito === 'negativo' ? '#CC3730' : '#B36D00'};">${e.tipo_esito}</span>
              ${e.email_inviata ? '<span style="font-size: 11px; color: var(--color-success);">✓ inviata</span>' : `
                <button onclick="notifichePage.inviaEsito('${e.id}')" style="padding: 4px 12px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; font-size: 12px;">Invia</button>
              `}
            </div>
          </div>
        `).join('')}
      `;
    } catch (err) {
      container.innerHTML = '<p style="color: var(--color-danger);">Errore nel caricamento esiti</p>';
    }
  },

  async inviaEsito(esitoId) {
    try {
      const res = await app.api(`/email/invia/${esitoId}`, { method: 'POST' });
      app.toast(`Email inviata a ${res.sent_to}`);
      const esameId = document.getElementById('notifEsameSelect').value;
      if (esameId) this.loadEsitiForEmail(esameId);
    } catch (err) {
      app.toast('Errore nell\'invio email', 'error');
    }
  },

  async inviaPerTutti(esameId) {
    if (!confirm('Inviare email a tutti gli studenti di questo esame?')) return;
    try {
      const res = await app.api(`/email/invia-tutti/${esameId}`, { method: 'POST' });
      app.toast(`Inviate ${res.sent}/${res.total} email`);
      this.loadEsitiForEmail(esameId);
    } catch (err) {
      app.toast('Errore nell\'invio batch', 'error');
    }
  },

  async sendEmailNotifica() {
    const body = document.getElementById('msgBody').value;
    if (!body.trim()) { app.toast('Scrivi un messaggio', 'error'); return; }

    try {
      const corsoId = document.getElementById('msgCorsoSelect').value;
      const tipo = document.getElementById('msgTipoSelect').value;
      await app.api('/notifiche/invia', {
        method: 'POST',
        body: JSON.stringify({ corso_id: corsoId, messaggio: body, tipo })
      });
      app.toast('Notifica email inviata con successo');
    } catch (err) {
      app.toast('Errore nell\'invio: ' + err.message, 'error');
    }
  },

  openWhatsApp() {
    const body = document.getElementById('msgBody').value;
    if (!body.trim()) { app.toast('Scrivi un messaggio prima', 'error'); return; }
    const encoded = encodeURIComponent(body);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
};
