// Valutazione Domande - Pagina valutazione domande per Nihonshu e Shochu
const valutazionePage = {
  domande: [],
  filtroTipo: 'tutti',
  filtroCategoria: 'tutte',
  esami: [],
  selectedEsameId: null,

  async render() {
    try {
      this.esami = await app.api('/esami');

      const html = `
        <div class="page-header" style="margin-bottom: 24px;">
          <h2 style="margin: 0;">Valutazione Domande</h2>
          <p style="color: var(--color-neutral-text-secondary); margin-top: 4px;">Valuta e gestisci domande esame Nihonshu e Shochu per categoria</p>
        </div>

        <!-- Filtri -->
        <div style="background: white; padding: 20px; border-radius: var(--radius-lg); border: 1px solid var(--color-neutral-border-light); margin-bottom: 24px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Esame</label>
              <select id="valEsameSelect" onchange="valutazionePage.loadDomande(this.value)"
                style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);">
                <option value="">-- Seleziona Esame --</option>
                ${this.esami.map(e => `<option value="${e.id}">${e.nome} (${e.tipo})</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Tipo Corso</label>
              <select id="valTipoFilter" onchange="valutazionePage.filterByTipo(this.value)"
                style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);">
                <option value="tutti">Tutti</option>
                <option value="nihonshu">🍶 Nihonshu</option>
                <option value="shochu">🥃 Shochu</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px;">Categoria</label>
              <select id="valCategoriaFilter" onchange="valutazionePage.filterByCategoria(this.value)"
                style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);">
                <option value="tutte">Tutte le categorie</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Stats per categoria -->
        <div id="categorieStats" style="margin-bottom: 24px;"></div>

        <!-- Lista domande -->
        <div id="valutazioneDomandeList">
          <div style="text-align: center; padding: 40px; color: var(--color-neutral-text-tertiary);">
            Seleziona un esame per visualizzare le domande
          </div>
        </div>
      `;
      app.layout('Valutazione Domande', html);
    } catch (err) {
      app.layout('Valutazione Domande', '<p style="color: var(--color-danger);">Errore nel caricamento</p>');
    }
  },

  async filterByTipo(tipo) {
    this.filtroTipo = tipo;
    // Filter esami dropdown by tipo
    const filteredEsami = tipo === 'tutti' ? this.esami : this.esami.filter(e => {
      return e.corso_tipo === tipo || e.nome.toLowerCase().includes(tipo);
    });
    const select = document.getElementById('valEsameSelect');
    select.innerHTML = '<option value="">-- Seleziona Esame --</option>' +
      filteredEsami.map(e => `<option value="${e.id}">${e.nome} (${e.tipo})</option>`).join('');

    if (this.selectedEsameId) this.renderDomande();
  },

  filterByCategoria(cat) {
    this.filtroCategoria = cat;
    this.renderDomande();
  },

  async loadDomande(esameId) {
    if (!esameId) return;
    this.selectedEsameId = esameId;

    try {
      this.domande = await app.api(`/domande?esame_id=${esameId}`);

      // Populate category filter
      const categorie = [...new Set(this.domande.map(d => d.categoria).filter(Boolean))];
      const catSelect = document.getElementById('valCategoriaFilter');
      catSelect.innerHTML = '<option value="tutte">Tutte le categorie</option>' +
        categorie.map(c => `<option value="${c}">${c}</option>`).join('');

      this.renderCategorieStats(categorie);
      this.renderDomande();
    } catch (err) {
      app.toast('Errore nel caricamento domande', 'error');
    }
  },

  renderCategorieStats(categorie) {
    if (!categorie) categorie = [...new Set(this.domande.map(d => d.categoria).filter(Boolean))];

    const stats = categorie.map(cat => {
      const catDomande = this.domande.filter(d => d.categoria === cat);
      const multipla = catDomande.filter(d => d.tipo === 'scelta_multipla').length;
      const aperta = catDomande.filter(d => d.tipo === 'risposta_aperta').length;
      return { cat, total: catDomande.length, multipla, aperta };
    });

    document.getElementById('categorieStats').innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
        ${stats.map(s => `
          <div style="background: white; padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--color-neutral-border-light); cursor: pointer; transition: all 0.15s;"
            onclick="document.getElementById('valCategoriaFilter').value='${s.cat}'; valutazionePage.filterByCategoria('${s.cat}')"
            onmouseover="this.style.borderColor='var(--color-primary)'" onmouseout="this.style.borderColor='var(--color-neutral-border-light)'">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: var(--color-neutral-text);">${s.cat}</div>
            <div style="font-size: 24px; font-weight: 700; color: var(--color-primary);">${s.total}</div>
            <div style="font-size: 11px; color: var(--color-neutral-text-tertiary); margin-top: 4px;">
              ${s.multipla} multipla · ${s.aperta} aperta
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderDomande() {
    let filtered = this.domande;
    if (this.filtroCategoria !== 'tutte') {
      filtered = filtered.filter(d => d.categoria === this.filtroCategoria);
    }

    if (!filtered.length) {
      document.getElementById('valutazioneDomandeList').innerHTML =
        '<p style="text-align: center; padding: 40px; color: var(--color-neutral-text-tertiary);">Nessuna domanda trovata con i filtri selezionati</p>';
      return;
    }

    // Group by category
    const grouped = {};
    filtered.forEach(d => {
      const cat = d.categoria || 'Senza categoria';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(d);
    });

    let html = '';
    for (const [cat, domande] of Object.entries(grouped)) {
      html += `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 16px; color: var(--color-neutral-text);">${cat} <span style="color: var(--color-neutral-text-tertiary); font-weight: 400;">(${domande.length})</span></h3>
          </div>
          ${domande.map((d, i) => `
            <div style="background: white; padding: 16px; margin-bottom: 8px; border-radius: var(--radius-md); border: 1px solid var(--color-neutral-border-light);">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: 12px; font-weight: 600; color: var(--color-neutral-text-tertiary);">#${d.numero}</span>
                    <span style="font-size: 11px; padding: 2px 8px; border-radius: var(--radius-full); background: ${d.tipo === 'scelta_multipla' ? '#E8F0FE' : '#FEF3E2'}; color: ${d.tipo === 'scelta_multipla' ? '#1A73E8' : '#D4A574'};">${d.tipo === 'scelta_multipla' ? 'Multipla' : 'Aperta'}</span>
                  </div>
                  <p style="margin: 0 0 8px; color: var(--color-neutral-text); font-size: 14px; line-height: 1.5;">${d.testo_it || ''}</p>
                  <div style="font-size: 12px; color: var(--color-success); font-weight: 500;">✓ ${d.risposta_corretta_it || ''}</div>
                  ${d.opzioni_it ? `<div style="margin-top: 6px; font-size: 12px; color: var(--color-neutral-text-secondary);">Opzioni: ${(() => { try { const o = JSON.parse(d.opzioni_it); return Array.isArray(o) ? o.join(' | ') : d.opzioni_it; } catch(e) { return d.opzioni_it; }})()}</div>` : ''}
                </div>
                <div style="display: flex; gap: 6px; margin-left: 12px;">
                  <button onclick="valutazionePage.editDomanda('${d.id}')" style="padding: 6px 12px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; font-size: 12px;">Modifica</button>
                  <button onclick="valutazionePage.toggleTipo('${d.id}', '${d.tipo}')" style="padding: 6px 12px; background: var(--color-neutral-bg); border: 1px solid var(--color-neutral-border); border-radius: var(--radius-sm); cursor: pointer; font-size: 12px;" title="Cambia tipo">⇄</button>
                  <button onclick="valutazionePage.deleteDomanda('${d.id}')" style="padding: 6px 12px; background: none; border: 1px solid var(--color-danger); color: var(--color-danger); border-radius: var(--radius-sm); cursor: pointer; font-size: 12px;">✕</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    document.getElementById('valutazioneDomandeList').innerHTML = html;
  },

  async toggleTipo(id, currentTipo) {
    const newTipo = currentTipo === 'scelta_multipla' ? 'risposta_aperta' : 'scelta_multipla';
    try {
      await app.api(`/domande/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ tipo: newTipo })
      });
      app.toast(`Tipo cambiato in ${newTipo === 'scelta_multipla' ? 'Scelta Multipla' : 'Risposta Aperta'}`);
      this.loadDomande(this.selectedEsameId);
    } catch (err) {
      app.toast('Errore nel cambio tipo', 'error');
    }
  },

  editDomanda(id) {
    const d = this.domande.find(x => x.id === id);
    if (!d) return;

    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div style="background: white; padding: 30px; border-radius: var(--radius-lg); width: 90%; max-width: 700px; max-height: 85vh; overflow-y: auto;">
          <h2 style="margin: 0 0 20px;">Modifica Domanda #${d.numero}</h2>
          <form onsubmit="valutazionePage.saveDomanda(event, '${id}')">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="grid-column: span 2;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Testo IT</label>
                <textarea name="testo_it" rows="3" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">${d.testo_it || ''}</textarea>
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Testo EN</label>
                <textarea name="testo_en" rows="2" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">${d.testo_en || ''}</textarea>
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Testo JP</label>
                <textarea name="testo_jp" rows="2" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">${d.testo_jp || ''}</textarea>
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Tipo</label>
                <select name="tipo" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md);">
                  <option value="scelta_multipla" ${d.tipo === 'scelta_multipla' ? 'selected' : ''}>Scelta Multipla</option>
                  <option value="risposta_aperta" ${d.tipo === 'risposta_aperta' ? 'selected' : ''}>Risposta Aperta (AI)</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Categoria</label>
                <input type="text" name="categoria" value="${d.categoria || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Risposta Corretta IT</label>
                <input type="text" name="risposta_corretta_it" value="${d.risposta_corretta_it || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Risposta Corretta EN</label>
                <input type="text" name="risposta_corretta_en" value="${d.risposta_corretta_en || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500; font-size: 13px;">Punti</label>
                <input type="number" name="punti" value="${d.punti || 1}" step="0.5" min="0" style="width: 100%; padding: 10px; border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); box-sizing: border-box;">
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button type="submit" style="padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">Salva</button>
              <button type="button" onclick="this.closest('[style*=\\'position: fixed\\']').remove()" style="padding: 10px 20px; background: var(--color-neutral-bg); border: 1px solid var(--color-neutral-border); border-radius: var(--radius-md); cursor: pointer;">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async saveDomanda(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    // Convert punti to number
    if (data.punti) data.punti = parseFloat(data.punti);

    try {
      await app.api(`/domande/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      document.querySelector('[style*="position: fixed"]')?.remove();
      app.toast('Domanda aggiornata');
      this.loadDomande(this.selectedEsameId);
    } catch (err) {
      app.toast('Errore nel salvataggio', 'error');
    }
  },

  async deleteDomanda(id) {
    if (!confirm('Disattivare questa domanda?')) return;
    try {
      await app.api(`/domande/${id}`, { method: 'DELETE' });
      app.toast('Domanda disattivata');
      this.loadDomande(this.selectedEsameId);
    } catch (err) {
      app.toast('Errore nella disattivazione', 'error');
    }
  }
};
