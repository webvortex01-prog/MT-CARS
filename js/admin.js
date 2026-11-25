/**
 * MT CARS - CENTRAL DE GUERRA DOS 8 VENDEDORES (SISTEMA ADMIN E CRM)
 * Aba 1: Radar ao Vivo + Sistema "Pega-Lead" (Trava entre os 8 Vendedores)
 * Aba 2: Estoque Estadual & Dados Secretos das Garagens + FIPE + Marcar Vendido
 * Aba 3: Robô de Abordagem Automática (Retargeting WhatsApp) + Firebase Cloud
 * Aba 4: CRM Kanban 5 Colunas & Fila de Leads
 * Aba 5: Gestão dos 8 Vendedores e Comissões
 */

window.MTCarsAdmin = (function () {
  const App = window.MTCarsApp;
  const Data = window.MTCarsData;

  // =========================================================================
  // LOGIN ADMINISTRATIVO & TROCA RÁPIDA ENTRE OS 8 VENDEDORES
  // =========================================================================
  function openLoginModal() {
    const modal = document.getElementById("admin-login-modal");
    if (!modal) return;
    renderQuickLoginButtons();
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeLoginModal() {
    const modal = document.getElementById("admin-login-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  function renderQuickLoginButtons() {
    const grid = document.getElementById("quick-seller-login-grid");
    if (!grid) return;
    App.loadStateFromStorage();

    const allAccounts = [...App.state.sellers, Data.DIRECTOR_ACCOUNT];
    grid.innerHTML = allAccounts.map((acc) => `
      <button
        type="button"
        onclick="MTCarsAdmin.quickLoginAs('${acc.id}')"
        class="p-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/60 text-left flex items-center gap-2.5 transition group"
      >
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br ${acc.color || "from-blue-700 to-blue-900"} flex items-center justify-center text-white font-black text-xs shrink-0">
          ${acc.avatar}
        </div>
        <div class="overflow-hidden">
          <div class="text-xs font-bold text-white group-hover:text-blue-400 truncate">${acc.fullTitle}</div>
          <div class="text-[10px] text-zinc-400 truncate">📍 ${acc.city} • ${acc.email}</div>
        </div>
      </button>
    `).join("");
  }

  function quickLoginAs(accountId) {
    App.loadStateFromStorage();
    let acc = App.state.sellers.find((s) => s.id === accountId);
    if (!acc && accountId === Data.DIRECTOR_ACCOUNT.id) {
      acc = Data.DIRECTOR_ACCOUNT;
    }
    if (!acc) acc = App.state.sellers[0];

    App.state.currentSeller = acc;
    localStorage.setItem(Data.STORAGE_KEYS.CURRENT_SELLER, JSON.stringify(acc));
    sessionStorage.setItem("mtcars_admin_authenticated", "true");

    closeLoginModal();
    App.switchViewMode("admin", true);
    App.showToast(`✅ Logado na Central de Guerra como: ${acc.fullTitle}`, "emerald");
  }

  function submitManualLogin(e) {
    if (e) e.preventDefault();
    const email = (document.getElementById("login-email-input")?.value || "").trim().toLowerCase();
    const pass = (document.getElementById("login-pass-input")?.value || "").trim();

    App.loadStateFromStorage();
    const allAccounts = [...App.state.sellers, Data.DIRECTOR_ACCOUNT];
    const matched = allAccounts.find((a) => a.email.toLowerCase() === email && (a.password === pass || pass === "123456"));

    if (!matched) {
      App.showToast("⚠️ Credenciais inválidas. Use vendedor1@mtcars.com até vendedor8@mtcars.com (Senha: 123456).", "red");
      return;
    }
    quickLoginAs(matched.id);
  }

  function switchActiveSeller(accountId) {
    App.loadStateFromStorage();
    let acc = App.state.sellers.find((s) => s.id === accountId);
    if (!acc && accountId === Data.DIRECTOR_ACCOUNT.id) {
      acc = Data.DIRECTOR_ACCOUNT;
    }
    if (!acc) return;

    App.state.currentSeller = acc;
    localStorage.setItem(Data.STORAGE_KEYS.CURRENT_SELLER, JSON.stringify(acc));
    renderSellerHeader();
    renderActiveTab();
    App.showToast(`🔄 Visão do painel alterada para: ${acc.fullTitle} (Teste a trava de leads!)`, "amber");
  }

  // Renderiza o cabeçalho do Vendedor Logado + Seletor Rápido dos 8 Vendedores
  function renderSellerHeader() {
    const sel = document.getElementById("admin-active-seller-select");
    const badge = document.getElementById("admin-active-seller-badge");
    const soundBtn = document.getElementById("admin-sound-toggle-btn");

    App.loadStateFromStorage();
    const current = App.state.currentSeller || App.state.sellers[0];
    const allAccounts = [...App.state.sellers, Data.DIRECTOR_ACCOUNT];

    if (sel) {
      sel.innerHTML = allAccounts
        .map(
          (acc) => `<option value="${acc.id}" ${acc.id === current.id ? "selected" : ""}>🔑 ${acc.fullTitle} (${acc.city}-MT)</option>`
        )
        .join("");
    }

    if (badge) {
      badge.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br ${current.color || "from-blue-700 to-blue-900"} flex items-center justify-center text-white font-black text-xs">
          ${current.avatar}
        </div>
        <div class="hidden sm:block text-left">
          <div class="text-xs font-extrabold text-white leading-none">${current.fullTitle}</div>
          <div class="text-[10px] text-emerald-400 font-semibold mt-0.5">🟢 Operando em ${current.city} - MT</div>
        </div>
      `;
    }

    if (soundBtn) {
      const on = window.MTCarsRealtime.isSoundEnabled();
      soundBtn.innerHTML = on
        ? `<i data-lucide="volume-2" class="w-4 h-4 text-emerald-400"></i> <span class="hidden md:inline">Som Ativo</span>`
        : `<i data-lucide="volume-x" class="w-4 h-4 text-zinc-500"></i> <span class="hidden md:inline">Mudo</span>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  function switchAdminTab(tabName) {
    App.state.adminTab = tabName;
    document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
      const t = btn.getAttribute("data-tab");
      if (t === tabName) {
        btn.className = "admin-tab-btn px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 bg-blue-700 text-white shadow-lg shadow-blue-700/25 transition shrink-0";
      } else {
        btn.className = "admin-tab-btn px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800 transition shrink-0";
      }
    });

    ["radar", "stock", "bot", "crm", "sellers", "stores"].forEach((t) => {
      const panel = document.getElementById(`admin-panel-${t}`);
      if (panel) {
        panel.classList.toggle("hidden", t !== tabName);
      }
    });

    renderActiveTab();
  }

  function renderActiveTab(highlightVisitorId = null) {
    App.loadStateFromStorage();
    updateAdminTabBadges();

    const tab = App.state.adminTab;
    if (tab === "radar") renderRadarTab(highlightVisitorId);
    else if (tab === "stock") renderStockTab();
    else if (tab === "bot") renderBotTab();
    else if (tab === "crm") renderCrmTab();
    else if (tab === "sellers") renderSellersTab();
    else if (tab === "stores") renderStoresTab();

    if (window.lucide) window.lucide.createIcons();
  }

  function updateAdminTabBadges() {
    const onlineCount = App.state.visitors.filter((v) => v.online).length;
    const stockCount = App.state.vehicles.filter((v) => v.status !== "Vendido").length;
    const pendingPhotosCount = App.state.vehicles.filter((v) => v.photoStatus === "pending_photos").length;
    const botCount = App.state.botLogs.length;
    const crmCount = App.state.leads.length;
    const storesCount = new Set(App.state.vehicles.map((v) => v.garageName)).size;

    const bRadar = document.getElementById("tab-badge-radar");
    const bStock = document.getElementById("tab-badge-stock");
    const bBot = document.getElementById("tab-badge-bot");
    const bCrm = document.getElementById("tab-badge-crm");
    const bStores = document.getElementById("tab-badge-stores");

    if (bRadar) bRadar.textContent = onlineCount;
    if (bStock) bStock.textContent = pendingPhotosCount > 0 ? `${stockCount} (${pendingPhotosCount} s/ foto)` : stockCount;
    if (bBot) bBot.textContent = botCount;
    if (bCrm) bCrm.textContent = crmCount;
    if (bStores) bStores.textContent = storesCount;
  }

  // =========================================================================
  // ABA 1: RADAR AO VIVO (LIVE VISITOR TRACKER) + TRAVA "PEGA-LEAD"
  // =========================================================================
  function renderRadarTab(highlightVisitorId = null) {
    const kpiOnline = document.getElementById("radar-kpi-online");
    const kpiAccess = document.getElementById("radar-kpi-access");
    const kpiLeads = document.getElementById("radar-kpi-leads");
    const kpiBot = document.getElementById("radar-kpi-bot");
    const grid = document.getElementById("radar-visitors-grid");

    const onlineVisitors = App.state.visitors.filter((v) => v.online);
    const identifiedVisitors = App.state.visitors.filter((v) => v.isIdentified);

    if (kpiOnline) kpiOnline.textContent = onlineVisitors.length;
    if (kpiAccess) kpiAccess.textContent = App.state.stats.totalAccessToday || 148;
    if (kpiLeads) kpiLeads.textContent = Math.max(identifiedVisitors.length, App.state.stats.leadsCapturedToday || 34);
    if (kpiBot) kpiBot.textContent = App.state.stats.botDispatchesToday || App.state.botLogs.length;

    // Renderiza o Feed de Telemetria ao Vivo entre Abas
    const feedBox = document.getElementById("radar-live-telemetry-feed");
    if (feedBox) {
      const feedItems = App.state.liveFeed || [];
      if (feedItems.length === 0) {
        feedBox.innerHTML = `<span class="text-zinc-400">📡 Aguardando ações na aba da Vitrine (passe o mouse em um carro, filtre uma cidade ou mexa no simulador na outra aba)...</span>`;
      } else {
        feedBox.innerHTML = feedItems.slice(0, 3).map((item, idx) => `
          <div class="flex items-center gap-2 ${idx === 0 ? "text-emerald-300 font-extrabold" : "text-zinc-400"}">
            <span class="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 font-mono text-[10px] text-amber-400">${item.time}</span>
            <span class="truncate">${item.visitorName}: <strong class="text-white">${item.text}</strong></span>
          </div>
        `).join("");
      }
    }

    if (!grid) return;

    const currentSeller = App.state.currentSeller || App.state.sellers[0];

    grid.innerHTML = App.state.visitors.map((vis) => {
      const veh = App.state.vehicles.find((v) => v.id === vis.currentVehicleId) || App.state.vehicles[0];
      const minsAgo = Math.max(1, Math.round((Date.now() - (vis.lastSeenAt || Date.now())) / 60000));
      const isLocked = Boolean(vis.lockedBySellerId);
      const isLockedByMe = vis.lockedBySellerId === currentSeller.id || currentSeller.isDirector;
      const isLiveClientTab = vis.id === App.LIVE_CLIENT_VISITOR_ID || vis.isLiveSessionTab;
      const shouldFlash = (highlightVisitorId && vis.id === highlightVisitorId) || isLiveClientTab;

      // Avaliador Inteligente de Carro na Troca + Logística Cegonha MT + Split de Comissão
      const sim = vis.simulation;
      const tradeEval =
        sim && sim.hasTradeIn && sim.tradeInModel
          ? Data.evaluateTradeInVehicle(sim.tradeInModel, sim.tradeInValue)
          : null;
      const freightInfo = Data.calculateMTFreight(veh.city, vis.city);
      const grossComm = Math.max(0, Number(veh.priceSale) - Number(veh.priceRepasse));
      const companyShare = Math.round(grossComm * 0.65);
      const sellerShare = grossComm - companyShare;

      const simHtml = sim
        ? `
          <div class="p-3.5 rounded-xl bg-zinc-950/95 border border-amber-500/40 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                🔥 Termômetro Financeiro & Raio-X da Troca
              </span>
              <button
                onclick="MTCarsAdmin.openProposalPdfModal('${vis.id}')"
                class="text-[11px] px-2.5 py-0.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white keep-white-text font-extrabold transition shadow"
              >
                📄 Gerar Proposta PDF
              </button>
            </div>

            <div class="text-sm font-extrabold text-white">
              💵 Entrada na mão: <span class="text-emerald-400">${App.formatBRL(sim.downPayment)}</span>
              <span class="text-zinc-400 font-normal">•</span>
              <span class="text-amber-300">${sim.installments}x de ${App.formatBRL(sim.installmentValue || App.calculateInstallment(veh.priceSale, sim.downPayment, sim.installments))}</span>
            </div>

            ${
              tradeEval
                ? `
                  <div class="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1 text-xs">
                    <div class="flex flex-wrap items-center justify-between gap-1">
                      <span class="text-zinc-300">🔄 Troca: <strong class="text-white">${tradeEval.modelText}</strong> (Pediu: ${App.formatBRL(tradeEval.clientAsked)})</span>
                      <span class="text-[11px] font-bold ${
                        tradeEval.statusTone === "emerald"
                          ? "text-emerald-400"
                          : tradeEval.statusTone === "amber"
                          ? "text-amber-400"
                          : "text-blue-400"
                      }">${tradeEval.verdict}</span>
                    </div>
                    <div class="flex flex-wrap items-center justify-between text-[11px] text-zinc-400">
                      <span>📊 FIPE do Usado: <strong class="text-zinc-200">${App.formatBRL(tradeEval.fipeEstimated)}</strong></span>
                      <span>🏦 Teto Garagem (-12%): <strong class="text-emerald-400">${App.formatBRL(tradeEval.garageMaxPay)}</strong></span>
                    </div>
                  </div>
                `
                : `
                  <div class="text-xs text-zinc-400">
                    🔄 Veículo na Troca: <span class="text-zinc-500">Sem troca informada (Compra à vista/financiada)</span>
                  </div>
                `
            }

            <!-- Logística Cegonha MT & Split de Comissão -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5 border-t border-zinc-800/80 text-[11px]">
              <div class="text-zinc-400">
                🚚 <strong>Logística MT:</strong> ${
                  freightInfo.distanceKm === 0
                    ? `<span class="text-emerald-400">Mesma Cidade (${veh.city}) • Frete R$ 0</span>`
                    : `<span class="text-zinc-200">${veh.city} ➔ ${vis.city} (${freightInfo.distanceKm} km • Cegonha: ${App.formatBRL(freightInfo.freightCost)})</span>`
                }
              </div>
              <div class="text-zinc-400 sm:text-right">
                💎 <strong>Sua Comissão (35%):</strong> <span class="text-emerald-400 font-extrabold">${App.formatBRL(sellerShare)}</span> <span class="text-zinc-500">(Total: ${App.formatBRL(grossComm)})</span>
              </div>
            </div>
          </div>
        `
        : `
          <div class="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400 flex items-center justify-between">
            <span>⏳ Visitante olhando fotos • Sua comissão neste carro: <strong class="text-emerald-400">${App.formatBRL(sellerShare)}</strong></span>
            <button
              onclick="MTCarsAdmin.openProposalPdfModal('${vis.id}')"
              class="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-blue-700 text-white font-bold transition"
            >
              📄 Gerar Proposta PDF
            </button>
          </div>
        `;

      // Playbook de Scripts Rápidos de Fechamento (1 Clique)
      const playbookHtml = `
        <div class="pt-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">💬 Playbook Rápido de Fechamento (Disparo WhatsApp 1 Clique):</span>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              onclick="MTCarsAdmin.sendPlaybookScript('${vis.id}', 'abordagem')"
              class="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-emerald-600/20 border border-zinc-800 hover:border-emerald-500/50 text-[11px] font-semibold text-zinc-200 hover:text-emerald-300 transition truncate"
            >
              1️⃣ Abordagem Ao Vivo
            </button>
            <button
              onclick="MTCarsAdmin.sendPlaybookScript('${vis.id}', 'ficha_cpf')"
              class="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-sky-600/20 border border-zinc-800 hover:border-sky-500/50 text-[11px] font-semibold text-zinc-200 hover:text-sky-300 transition truncate"
            >
              2️⃣ Pedir CPF / Ficha
            </button>
            <button
              onclick="MTCarsAdmin.sendPlaybookScript('${vis.id}', 'contraproposta_troca')"
              class="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-amber-600/20 border border-zinc-800 hover:border-amber-500/50 text-[11px] font-semibold text-zinc-200 hover:text-amber-300 transition truncate"
            >
              3️⃣ Negociar Troca
            </button>
            <button
              onclick="MTCarsAdmin.sendPlaybookScript('${vis.id}', 'agendar_video')"
              class="py-1.5 px-2 rounded-lg bg-zinc-900 hover:bg-purple-600/20 border border-zinc-800 hover:border-purple-500/50 text-[11px] font-semibold text-zinc-200 hover:text-purple-300 transition truncate"
            >
              4️⃣ Vídeo / Vistoria
            </button>
          </div>
        </div>
      `;

      // Histórico de Cliques na Sessão
      const histItems = Array.isArray(vis.history) && vis.history.length
        ? vis.history.map((h, i) => `<span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">${i + 1}º ${h.title}</span>`).join(` <span class="text-zinc-600">→</span> `)
        : `<span class="text-[11px] text-zinc-500">1º ${veh.title}</span>`;

      // Botão Sistema "Pega-Lead" (Trava entre os 8 Vendedores)
      let actionButtonHtml = "";
      if (!isLocked) {
        actionButtonHtml = `
          <button
            onclick="MTCarsAdmin.claimVisitorLead('${vis.id}')"
            class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition transform active:scale-[0.99]"
          >
            <span>⚡ ASSUMIR ATENDIMENTO E CHAMAR NO WHATS</span>
          </button>
        `;
      } else if (isLockedByMe) {
        actionButtonHtml = `
          <div class="space-y-2">
            <div class="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between">
              <span>🔒 Em atendimento por você (${vis.lockedBySellerName})</span>
              <button onclick="MTCarsAdmin.unlockVisitorLead('${vis.id}')" class="text-[11px] underline text-zinc-400 hover:text-white">Liberar</button>
            </div>
            <button
              onclick="MTCarsAdmin.openWhatsAppForVisitor('${vis.id}')"
              class="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>💬 Reabrir Conversa no WhatsApp (${vis.whatsapp})</span>
            </button>
          </div>
        `;
      } else {
        // Bloqueado para os outros 7 vendedores!
        actionButtonHtml = `
          <div class="w-full py-3.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-400 font-bold text-xs flex items-center justify-between cursor-not-allowed select-none">
            <span class="flex items-center gap-2">
              🔒 Bloqueado • Em atendimento por: <strong class="text-amber-400">${vis.lockedBySellerName}</strong>
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-500">TRAVADO</span>
          </div>
        `;
      }

      return `
        <div
          id="radar-card-${vis.id}"
          class="glass-panel rounded-2xl p-5 border-2 ${
            isLiveClientTab
              ? "flash-live-card border-emerald-500 shadow-xl shadow-emerald-500/10"
              : shouldFlash
              ? "flash-live-card border-emerald-500"
              : vis.online
              ? "border-zinc-800 hover:border-emerald-500/50"
              : "border-zinc-800/60 opacity-85"
          } transition-all flex flex-col justify-between space-y-4"
        >
          <div class="space-y-3.5">
            <!-- Topo do Card: Status Online/Offline + Cidade -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                ${
                  vis.online
                    ? `<span class="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold flex items-center gap-2">
                         <span class="relative flex h-2.5 w-2.5">
                           <span class="radar-dot-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                           <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                         </span>
                         🟢 ONLINE AGORA
                       </span>`
                    : `<span class="px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1.5">
                         🔴 SAIU DO SITE HÁ ${minsAgo} MIN
                       </span>`
                }
                ${
                  isLiveClientTab
                    ? `<span class="px-2.5 py-1 rounded-full bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider shadow">
                         📡 SUA ABA DE VITRINE AO VIVO
                       </span>`
                    : ""
                }
              </div>
              <span class="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-300">
                📍 ${vis.city} - MT
              </span>
            </div>

            <!-- Identificação do Cliente -->
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-extrabold text-white flex flex-wrap items-center gap-2">
                  <span>${vis.name}</span>
                  ${vis.isIdentified ? `<span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">WhatsApp Capturado</span>` : `<span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">No Site Agora</span>`}
                </h3>
                <p class="text-xs font-mono text-zinc-400 mt-0.5">📱 ${vis.whatsapp} ${vis.lastUpdateStr ? `<span class="text-emerald-400 ml-2">• Atualizado às ${vis.lastUpdateStr}</span>` : ""}</p>
              </div>
              <img src="${veh.image}" alt="${veh.title}" class="w-16 h-12 rounded-xl object-cover border border-zinc-700 shrink-0" />
            </div>

            <!-- O que está fazendo neste segundo (DINÂMICO EM TEMPO REAL!) -->
            <div class="p-3.5 rounded-xl bg-zinc-950 border ${isLiveClientTab ? "border-emerald-500/60" : "border-zinc-800/90"} space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-emerald-400 uppercase font-black tracking-wider">⚡ Fazendo Neste Exato Segundo:</span>
                <span class="text-[10px] font-mono text-zinc-500">${vis.lastUpdateStr || "ao vivo"}</span>
              </div>
              <div class="text-xs sm:text-sm font-extrabold text-white leading-snug">
                ${vis.currentAction || `👀 Olhando agora: ${veh.title}`}
              </div>
              <div class="text-xs font-bold text-blue-400 pt-0.5">
                🚘 Veículo em Foco: ${veh.title} (${veh.year}) — ${App.formatBRL(veh.priceSale)}
              </div>
              <div class="text-[11px] text-zinc-400">
                🏢 Garagem Parceira: <strong class="text-amber-400">${veh.garageName} (${veh.city}-MT)</strong> • Comissão MT Cars: <strong class="text-emerald-400">${App.formatBRL(veh.priceSale - veh.priceRepasse)}</strong>
              </div>
            </div>

            <!-- Termômetro Financeiro (Dados do Simulador) -->
            ${simHtml}

            <!-- Playbook de Scripts Rápidos de Fechamento -->
            ${playbookHtml}

            <!-- Histórico de Cliques na Sessão -->
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1.5">Rastro de Cliques na Sessão:</span>
              <div class="flex flex-wrap items-center gap-1.5">
                ${histItems}
              </div>
            </div>
          </div>

          <!-- Botão Pega-Lead ou Status de Trava -->
          <div class="pt-2 border-t border-zinc-800/80">
            ${actionButtonHtml}
          </div>
        </div>
      `;
    }).join("");
  }

  // Ação "Pega-Lead": Trava o cliente para o vendedor logado e abre o WhatsApp cirúrgico!
  function claimVisitorLead(visitorId) {
    App.loadStateFromStorage();
    const vis = App.state.visitors.find((v) => v.id === visitorId);
    if (!vis) return;

    const currentSeller = App.state.currentSeller || App.state.sellers[0];

    // Verifica se outro vendedor já travou milissegundos antes
    if (vis.lockedBySellerId && vis.lockedBySellerId !== currentSeller.id && !currentSeller.isDirector) {
      App.showToast(`🔒 Tarde demais! ${vis.lockedBySellerName} acabou de assumir este atendimento.`, "red");
      renderRadarTab();
      return;
    }

    vis.lockedBySellerId = currentSeller.id;
    vis.lockedBySellerName = currentSeller.fullTitle;
    vis.lockedAt = Date.now();

    // Incrementa contador de leads assumidos hoje pelo vendedor
    const sellerRecord = App.state.sellers.find((s) => s.id === currentSeller.id);
    if (sellerRecord) {
      sellerRecord.leadsAssumidosHoje = (Number(sellerRecord.leadsAssumidosHoje) || 0) + 1;
    }

    // Move ou cria o lead na Coluna 3 do CRM Kanban ("💬 Em Atendimento")
    const veh = App.state.vehicles.find((v) => v.id === vis.currentVehicleId) || App.state.vehicles[0];
    let crmLead = App.state.leads.find((l) => l.visitorId === vis.id || (vis.isIdentified && l.whatsapp === vis.whatsapp));
    if (crmLead) {
      crmLead.stage = "in_service";
      crmLead.sellerId = currentSeller.id;
      crmLead.sellerName = currentSeller.fullTitle;
      crmLead.notes = `Atendimento travado e assumido por ${currentSeller.fullTitle}.`;
    } else {
      App.state.leads.unshift({
        id: "lead_" + Date.now(),
        visitorId: vis.id,
        name: vis.name,
        whatsapp: vis.whatsapp,
        city: vis.city,
        stage: "in_service",
        vehicleId: veh.id,
        vehicleTitle: veh.title,
        vehiclePrice: veh.priceSale,
        downPayment: vis.simulation?.downPayment || Math.round(veh.priceSale * 0.3),
        installments: vis.simulation?.installments || 48,
        tradeIn: vis.simulation?.tradeInModel
          ? `${vis.simulation.tradeInModel} (${App.formatBRL(vis.simulation.tradeInValue)})`
          : "Não informado",
        sellerId: currentSeller.id,
        sellerName: currentSeller.fullTitle,
        createdAt: "Agora mesmo",
        notes: `Assumido no Radar ao Vivo por ${currentSeller.fullTitle}.`
      });
    }

    App.persistAll();
    window.MTCarsRealtime.playSound("lead_locked");
    window.MTCarsRealtime.emit("LEAD_LOCKED", {
      visitorId: vis.id,
      sellerId: currentSeller.id,
      sellerName: currentSeller.fullTitle
    });

    renderRadarTab(vis.id);
    openWhatsAppForVisitor(vis.id);
  }

  function unlockVisitorLead(visitorId) {
    App.loadStateFromStorage();
    const vis = App.state.visitors.find((v) => v.id === visitorId);
    if (!vis) return;
    vis.lockedBySellerId = null;
    vis.lockedBySellerName = null;
    vis.lockedAt = null;
    App.persistAll();
    window.MTCarsRealtime.emit("LEAD_UNLOCKED", { visitorId });
    renderRadarTab();
    App.showToast("🔓 Atendimento liberado novamente para a fila dos 8 vendedores.", "amber");
  }

  function openWhatsAppForVisitor(visitorId) {
    const vis = App.state.visitors.find((v) => v.id === visitorId);
    if (!vis) return;
    const veh = App.state.vehicles.find((v) => v.id === vis.currentVehicleId) || App.state.vehicles[0];
    const currentSeller = App.state.currentSeller || App.state.sellers[0];

    const simPart = vis.simulation
      ? `Vi aqui no nosso sistema que você simulou com *${App.formatBRL(vis.simulation.downPayment)} de entrada* em *${vis.simulation.installments}x de ${App.formatBRL(vis.simulation.installmentValue)}*${vis.simulation.hasTradeIn && vis.simulation.tradeInModel ? ` e colocou seu *${vis.simulation.tradeInModel}* na troca` : ""}.`
      : `Consigo montar uma condição especial nele com aprovação rápida aqui em ${vis.city} - MT.`;

    const msg = `Fala *${vis.name}*, tudo joia? Aqui é o *${currentSeller.name}* (${currentSeller.code}) da Central *MT Cars*! 🚘\n\nVi que você está olhando agora o *${veh.title} (${veh.year})* anunciado por *${App.formatBRL(veh.priceSale)}* (${App.formatBRL(Math.max(0, veh.priceFipe - veh.priceSale))} abaixo da FIPE!).\n\n${simPart}\n\nQuer que eu te mande um vídeo detalhado dele e já valide essa condição pra você?`;

    const phoneDigits = App.cleanPhoneDigits(vis.whatsapp.replace(/\D/g, "").length >= 10 ? vis.whatsapp : "65999110101");
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`, "_blank");
    App.showToast(`💬 Abrindo WhatsApp cirúrgico para ${vis.name} com os dados da simulação!`, "emerald");
  }

  // =========================================================================
  // ABA 2: ESTOQUE ESTADUAL & DADOS SECRETOS DAS GARAGENS PARCEIRAS
  // =========================================================================
  function renderStockTab() {
    const tbody = document.getElementById("admin-stock-list");
    const kpiTotalStock = document.getElementById("stock-kpi-total-value");
    const kpiTotalComm = document.getElementById("stock-kpi-total-commission");
    const kpiAvgMargin = document.getElementById("stock-kpi-avg-margin");
    const garageFilterEl = document.getElementById("admin-stock-garage-filter");

    // Popula seletor de garagens parceiras
    if (garageFilterEl && garageFilterEl.options.length <= 1) {
      const uniqueGarages = [...new Set(App.state.vehicles.map((v) => v.garageName))];
      garageFilterEl.innerHTML = `<option value="">Todas as Garagens Parceiras (${uniqueGarages.length})</option>` +
        uniqueGarages.map((g) => `<option value="${g}">${g}</option>`).join("");
    }

    const fCity = document.getElementById("admin-stock-city-filter")?.value || "";
    const fGarage = document.getElementById("admin-stock-garage-filter")?.value || "";
    const fStatus = document.getElementById("admin-stock-status-filter")?.value || "";
    const fSearch = (document.getElementById("admin-stock-search-input")?.value || "").trim().toLowerCase();

    const filtered = App.state.vehicles.filter((v) => {
      if (fCity && v.city !== fCity) return false;
      if (fGarage && v.garageName !== fGarage) return false;
      if (fStatus && v.status !== fStatus) return false;
      if (fSearch) {
        const hay = `${v.ref} ${v.title} ${v.city} ${v.garageName} ${v.garageOwner} ${v.captadorName}`.toLowerCase();
        if (!hay.includes(fSearch)) return false;
      }
      return true;
    });

    const totalSaleVal = filtered.reduce((acc, v) => acc + (Number(v.priceSale) || 0), 0);
    const totalCommission = filtered.reduce((acc, v) => acc + ((Number(v.priceSale) || 0) - (Number(v.priceRepasse) || 0)), 0);
    const avgPct = totalSaleVal > 0 ? ((totalCommission / totalSaleVal) * 100).toFixed(1) : "0.0";

    if (kpiTotalStock) kpiTotalStock.textContent = App.formatBRL(totalSaleVal);
    if (kpiTotalComm) kpiTotalComm.textContent = App.formatBRL(totalCommission);
    if (kpiAvgMargin) kpiAvgMargin.textContent = `${avgPct}% líquido`;

    if (!tbody) return;

    const currentSeller = App.state.currentSeller || App.state.sellers[0];
    const isDirector = Boolean(currentSeller.isDirector);
    const pendingPhotoVehicles = App.state.vehicles.filter((v) => v.photoStatus === "pending_photos");

    const pendingBannerHtml = pendingPhotoVehicles.length > 0
      ? `
        <div class="glass-panel rounded-2xl p-5 border-2 border-amber-500/70 space-y-3 mb-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[11px] font-black uppercase">
                📸 FILA ABERTA PARA TODOS OS COOPERADOS (${pendingPhotoVehicles.length})
              </span>
              <h4 class="text-base font-extrabold text-white mt-1">
                Lojistas cadastraram estes veículos sem fotos — Cooperado pode ir até a loja e adicionar as fotos!
              </h4>
            </div>
            <button
              onclick="MTCarsApp.openSellMyCarModal()"
              class="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs transition"
            >
              🏪 Simular Lojista Cadastrando s/ Foto
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${pendingPhotoVehicles.map((pv) => `
              <div class="p-3.5 rounded-xl bg-zinc-950 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">📸 AGUARDANDO FOTOS</span>
                    <span class="text-xs font-bold text-white">📍 ${pv.city} - MT</span>
                  </div>
                  <div class="text-sm font-extrabold text-white">${pv.title} (${pv.year}) — ${App.formatBRL(pv.priceSale)}</div>
                  <div class="text-xs text-zinc-300">
                    🏪 Ir na Loja: <strong class="text-amber-400">${pv.garageName}</strong> (Responsável: ${pv.garageOwner} • ${pv.garageWhatsapp})
                  </div>
                </div>
                <button
                  onclick="MTCarsAdmin.cooperadoAddPhotosToVehicle('${pv.id}')"
                  class="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs shrink-0 shadow transition"
                >
                  📷 Fui na Loja / Adicionar Fotos
                </button>
              </div>
            `).join("")}
          </div>
        </div>
      `
      : "";

    tbody.innerHTML = pendingBannerHtml + filtered.map((v) => {
      const commissionVal = Number(v.priceSale) - Number(v.priceRepasse);
      const commissionPct = v.priceSale > 0 ? ((commissionVal / v.priceSale) * 100).toFixed(1) : "0.0";
      const fipeDiff = Number(v.priceFipe) - Number(v.priceSale);
      const isPendingPhoto = v.photoStatus === "pending_photos";

      const statusBadge =
        isPendingPhoto
          ? `<span class="px-2.5 py-1 rounded-full bg-amber-500 text-zinc-950 text-xs font-black">📸 SEM FOTOS (ABERTO P/ COOPERADOS)</span>`
          : v.status === "Vendido"
          ? `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-extrabold">🏆 VENDIDO</span>`
          : v.status === "Reservado"
          ? `<span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-extrabold">⏳ RESERVADO</span>`
          : `<span class="px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-bold">🟢 DISPONÍVEL NA VITRINE</span>`;

      // Se for Diretor OU se o carro estiver sem fotos (aberto pros cooperados irem na loja), mostra o nome da loja; senão protege na Aba Exclusiva do Dono!
      const showStoreIdentity = isDirector || isPendingPhoto;

      return `
        <div class="glass-panel rounded-2xl p-5 border ${isPendingPhoto ? "border-amber-500/70" : "border-zinc-800 hover:border-zinc-700"} transition grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <!-- BLOCO PÚBLICO (5 cols) -->
          <div class="lg:col-span-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div class="relative w-full sm:w-36 h-28 rounded-xl overflow-hidden vehicle-photo-frame border border-zinc-800 shrink-0">
              <img src="${v.image}" alt="${v.title}" class="w-full h-full object-cover ${isPendingPhoto ? "opacity-40 grayscale" : ""}" />
              <span class="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-zinc-950/90 text-[10px] font-mono text-zinc-200 keep-white-text">${v.ref}</span>
              ${isPendingPhoto ? `<span class="absolute inset-0 flex items-center justify-center text-[11px] font-black text-amber-300 bg-black/60 text-center px-2">📸 FALTA FOTO DO COOPERADO</span>` : ""}
            </div>
            <div class="space-y-1.5 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                ${statusBadge}
                <span class="text-xs font-bold text-zinc-300">📍 ${v.city} - ${v.uf}</span>
                <span class="text-[11px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300">${v.category}</span>
              </div>
              <h4 class="text-base font-extrabold text-white">${v.title} (${v.year})</h4>
              <div class="flex flex-wrap items-baseline gap-3 text-xs">
                <span class="text-zinc-400">Venda Vitrine: <strong class="text-white text-sm">${App.formatBRL(v.priceSale)}</strong></span>
                <span class="text-zinc-500">FIPE: ${App.formatBRL(v.priceFipe)}</span>
                ${fipeDiff > 0 ? `<span class="text-amber-400 font-bold">(-${App.formatBRL(fipeDiff)} FIPE)</span>` : ""}
              </div>
              <div class="text-[11px] text-zinc-400">
                ${Number(v.km).toLocaleString("pt-BR")} km • ${v.transmission} • ${v.fuel}
              </div>
            </div>
          </div>

          <!-- BLOCO CONFIDENCIAL EQUIPE MT CAR (5 cols) -->
          <div class="lg:col-span-5 secret-garage-box rounded-xl p-4 border border-amber-500/30 space-y-2">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <span class="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                ${showStoreIdentity ? "🏪 DADOS DA LOJA PARCEIRA" : "🔒 LOJA PARCEIRA PROTEGIDA (EXCLUSIVO DIRETORIA)"}
              </span>
              <span class="text-[10px] text-zinc-400">👤 ${v.captadorName}</span>
            </div>

            ${
              showStoreIdentity
                ? `
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span class="text-zinc-400 block text-[11px]">🏢 Loja Cadastrada:</span>
                      <strong class="text-white">${v.garageName} (${v.city}-MT)</strong>
                    </div>
                    <div>
                      <span class="text-zinc-400 block text-[11px]">📞 Lojista Responsável:</span>
                      <div class="flex items-center gap-2">
                        <strong class="text-zinc-200">${v.garageOwner}</strong>
                        <a
                          href="https://wa.me/${App.cleanPhoneDigits(v.garageWhatsapp)}?text=${encodeURIComponent(`Olá ${v.garageOwner} (${v.garageName}), aqui é da MT Car sobre o veículo ${v.title} (${v.ref})!`)}"
                          target="_blank"
                          class="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold"
                        >
                          Whats Loja ↗
                        </a>
                      </div>
                    </div>
                  </div>
                `
                : `
                  <div class="p-2 rounded-lg bg-zinc-950/70 border border-zinc-800 text-xs flex items-center justify-between">
                    <span class="text-zinc-400">📍 Veículo localizado em <strong class="text-white">${v.city} - MT</strong> (Nome da loja visível apenas para Diretoria)</span>
                    <button onclick="MTCarsAdmin.switchAdminTab('stores')" class="text-[10px] font-bold text-amber-400 underline ml-2">Ver Aba Dono 👑</button>
                  </div>
                `
            }

            <div class="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80">
              <div>
                <span class="text-[10px] text-zinc-400 block">💰 Repasse Loja:</span>
                <span class="text-xs font-bold text-zinc-200">${App.formatBRL(v.priceRepasse)}</span>
              </div>
              <div>
                <span class="text-[10px] text-emerald-400 font-bold block">💎 Margem MT Car:</span>
                <span class="text-sm font-black text-emerald-400">${App.formatBRL(commissionVal)} (${commissionPct}%)</span>
              </div>
              <div>
                <span class="text-[10px] text-amber-400 font-bold block">👤 Cooperado (35%):</span>
                <span class="text-xs font-extrabold text-amber-300">${App.formatBRL(Math.round(commissionVal * 0.35))}</span>
              </div>
            </div>
          </div>

          <!-- AÇÕES DO VEÍCULO (2 cols) -->
          <div class="lg:col-span-2 flex flex-wrap lg:flex-col gap-2 justify-end">
            ${
              isPendingPhoto
                ? `<button
                     onclick="MTCarsAdmin.cooperadoAddPhotosToVehicle('${v.id}')"
                     class="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow transition"
                   >
                     <span>📷 Adicionar Fotos (Cooperado)</span>
                   </button>`
                : v.status !== "Vendido"
                ? `<button
                     onclick="MTCarsAdmin.markVehicleAsSold('${v.id}')"
                     class="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/15 transition"
                   >
                     <span>🏆 Marcar Vendido</span>
                   </button>`
                : `<div class="py-2 px-3 rounded-xl bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center">
                     ✔ Comissão Contabilizada
                   </div>`
            }
            <button
              onclick="MTCarsAdmin.openStockMatchModal('${v.id}')"
              class="py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-zinc-950 font-bold text-xs transition"
            >
              🎯 Match Clientes CRM
            </button>
            <button
              onclick="MTCarsAdmin.toggleReserveVehicle('${v.id}')"
              class="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs transition"
            >
              ${v.status === "Reservado" ? "Liberar Reserva" : "⏳ Reservar"}
            </button>
            <button
              onclick="MTCarsAdmin.openNewVehicleModal('${v.id}')"
              class="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold text-xs transition"
            >
              ✏️ Editar Dados
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  function toggleReserveVehicle(vehicleId) {
    App.loadStateFromStorage();
    const v = App.state.vehicles.find((item) => item.id === vehicleId);
    if (!v || v.status === "Vendido") return;
    v.status = v.status === "Reservado" ? "Disponível" : "Reservado";
    App.persistAll();
    window.MTCarsRealtime.emit("VEHICLE_UPDATED", { vehicleId, vehicle: v });
    renderStockTab();
    App.showToast(`📌 Status do ${v.title} alterado para: ${v.status}`, "amber");
  }

  function markVehicleAsSold(vehicleId) {
    App.loadStateFromStorage();
    const v = App.state.vehicles.find((item) => item.id === vehicleId);
    if (!v) return;
    if (v.status === "Vendido") {
      App.showToast("Este veículo já foi marcado como vendido!", "amber");
      return;
    }

    const seller = App.state.currentSeller && !App.state.currentSeller.isDirector
      ? App.state.currentSeller
      : App.state.sellers.find((s) => s.id === v.captadorId) || App.state.sellers[0];

    const commission = Math.max(0, Number(v.priceSale) - Number(v.priceRepasse));
    v.status = "Vendido";

    // Contabiliza venda e comissão para o vendedor responsável
    const sellerObj = App.state.sellers.find((s) => s.id === seller.id);
    if (sellerObj) {
      sellerObj.vendasRealizadas = (Number(sellerObj.vendasRealizadas) || 0) + 1;
      sellerObj.comissoesGeradas = (Number(sellerObj.comissoesGeradas) || 0) + commission;
    }

    // Adiciona ou atualiza no CRM Kanban na coluna 5 ("🏆 Venda Fechada")
    App.state.leads.unshift({
      id: "lead_sold_" + Date.now(),
      visitorId: "vis_sold",
      name: `Comprador ${v.city} (${v.ref})`,
      whatsapp: "(65) 99900-1000",
      city: v.city,
      stage: "closed_won",
      vehicleId: v.id,
      vehicleTitle: v.title,
      vehiclePrice: v.priceSale,
      downPayment: v.priceSale,
      installments: 1,
      tradeIn: `Repasse ${v.garageName}: ${App.formatBRL(v.priceRepasse)}`,
      sellerId: seller.id,
      sellerName: seller.fullTitle,
      createdAt: "Agora mesmo",
      notes: `Venda fechada por ${seller.fullTitle}! Comissão líquida MT Cars gerada: ${App.formatBRL(commission)}.`
    });

    App.persistAll();
    window.MTCarsRealtime.playSound("sale_closed");
    window.MTCarsRealtime.emit("VEHICLE_SOLD", { vehicleId: v.id, commission, sellerName: seller.fullTitle, vehicle: v });

    renderStockTab();
    App.showToast(`🏆 VENDA FECHADA! ${v.title} vendido! Comissão de ${App.formatBRL(commission)} creditada para ${seller.fullTitle}!`, "emerald");
  }

  // Modal de Cadastro / Edição de Veículo + Busca Automática FIPE
  function openNewVehicleModal(editVehicleId = null) {
    const modal = document.getElementById("new-vehicle-modal");
    if (!modal) return;

    App.populateCityDropdowns();
    const captadorSelect = document.getElementById("new-veh-captador");
    if (captadorSelect) {
      captadorSelect.innerHTML = App.state.sellers
        .map((s) => `<option value="${s.id}">${s.fullTitle} (${s.city})</option>`)
        .join("");
    }

    const form = document.getElementById("new-vehicle-form");
    if (form) form.reset();

    const idField = document.getElementById("new-veh-id");
    const titleHeader = document.getElementById("new-veh-modal-title");

    if (editVehicleId) {
      const v = App.state.vehicles.find((item) => item.id === editVehicleId);
      if (v) {
        if (titleHeader) titleHeader.textContent = `Editar Veículo ${v.ref} — ${v.title}`;
        if (idField) idField.value = v.id;
        document.getElementById("new-veh-brand").value = v.brand;
        document.getElementById("new-veh-model").value = v.model;
        document.getElementById("new-veh-year").value = v.year;
        document.getElementById("new-veh-km").value = v.km;
        document.getElementById("new-veh-category").value = v.category;
        document.getElementById("new-veh-transmission").value = v.transmission;
        document.getElementById("new-veh-fuel").value = v.fuel;
        document.getElementById("new-veh-city").value = v.city;
        document.getElementById("new-veh-price-sale").value = v.priceSale;
        document.getElementById("new-veh-price-fipe").value = v.priceFipe;
        document.getElementById("new-veh-price-repasse").value = v.priceRepasse;
        document.getElementById("new-veh-garage-name").value = v.garageName;
        document.getElementById("new-veh-garage-owner").value = v.garageOwner;
        document.getElementById("new-veh-garage-phone").value = v.garageWhatsapp;
        document.getElementById("new-veh-captador").value = v.captadorId || "seller_1";
        document.getElementById("new-veh-image").value = v.image;
        document.getElementById("new-veh-desc").value = v.description || "";
        updateLiveMarginPreview();
      }
    } else {
      if (titleHeader) titleHeader.textContent = "Cadastrar Novo Veículo de Garagem Parceira (Estoque MT)";
      if (idField) idField.value = "";
      updateLiveMarginPreview();
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeNewVehicleModal() {
    const modal = document.getElementById("new-vehicle-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  async function autoFetchFipeForModal() {
    const brand = document.getElementById("new-veh-brand")?.value || "";
    const model = document.getElementById("new-veh-model")?.value || "";
    const year = document.getElementById("new-veh-year")?.value || 2023;
    const salePrice = document.getElementById("new-veh-price-sale")?.value || 145000;

    const btn = document.getElementById("btn-fetch-fipe");
    if (btn) btn.textContent = "Consultando FIPE...";

    const result = await Data.lookupFipePrice(brand, model, year, salePrice);
    const fipeInput = document.getElementById("new-veh-price-fipe");
    if (fipeInput) fipeInput.value = result.priceFipe;
    if (btn) btn.textContent = "🔍 Buscar Preço Médio FIPE";

    updateLiveMarginPreview();
    App.showToast(`📊 ${result.source}: ${App.formatBRL(result.priceFipe)} (${result.fipeCode})`, "amber");
  }

  function updateLiveMarginPreview() {
    const sale = Number(document.getElementById("new-veh-price-sale")?.value) || 0;
    const repasse = Number(document.getElementById("new-veh-price-repasse")?.value) || 0;
    const fipe = Number(document.getElementById("new-veh-price-fipe")?.value) || 0;

    const comm = sale - repasse;
    const pct = sale > 0 ? ((comm / sale) * 100).toFixed(1) : "0.0";
    const fipeDiff = fipe - sale;

    const box = document.getElementById("new-veh-margin-preview");
    if (box) {
      box.innerHTML = `
        <span>💎 Comissão MT Cars: <strong class="text-emerald-400">${App.formatBRL(comm)} (${pct}%)</strong></span>
        <span>🔥 Desconto vs FIPE: <strong class="text-amber-400">${fipeDiff > 0 ? App.formatBRL(fipeDiff) + " Abaixo da FIPE" : "Preço de Mercado"}</strong></span>
      `;
    }
  }

  function submitNewVehicleForm(e) {
    if (e) e.preventDefault();
    App.loadStateFromStorage();

    const editId = document.getElementById("new-veh-id")?.value;
    const brand = document.getElementById("new-veh-brand")?.value.trim() || "Toyota";
    const model = document.getElementById("new-veh-model")?.value.trim() || "Hilux SRV 4x4";
    const year = Number(document.getElementById("new-veh-year")?.value) || 2023;
    const km = Number(document.getElementById("new-veh-km")?.value) || 25000;
    const category = document.getElementById("new-veh-category")?.value || "Picapes / Agro";
    const transmission = document.getElementById("new-veh-transmission")?.value || "Automático";
    const fuel = document.getElementById("new-veh-fuel")?.value || "Diesel";
    const city = document.getElementById("new-veh-city")?.value || "Cuiabá";
    const priceSale = Number(document.getElementById("new-veh-price-sale")?.value) || 185000;
    const priceFipe = Number(document.getElementById("new-veh-price-fipe")?.value) || Math.round(priceSale * 1.04);
    const priceRepasse = Number(document.getElementById("new-veh-price-repasse")?.value) || Math.round(priceSale * 0.94);
    const garageName = document.getElementById("new-veh-garage-name")?.value.trim() || "Garagem Parceira MT";
    const garageOwner = document.getElementById("new-veh-garage-owner")?.value.trim() || "Responsável Garagem";
    const garageWhatsapp = document.getElementById("new-veh-garage-phone")?.value.trim() || "(65) 99999-1111";
    const captadorId = document.getElementById("new-veh-captador")?.value || "seller_1";
    const sellerObj = App.state.sellers.find((s) => s.id === captadorId) || App.state.sellers[0];
    const uploadedGallery = Array.isArray(App.state.uploadedAdminPhotos) && App.state.uploadedAdminPhotos.length > 0
      ? [...App.state.uploadedAdminPhotos]
      : null;
    const rawImageInput = document.getElementById("new-veh-image")?.value.trim();
    const image = uploadedGallery
      ? uploadedGallery[0]
      : (rawImageInput || "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=85");
    const description = document.getElementById("new-veh-desc")?.value.trim() || `Veículo selecionado em ${city} - MT com intermediação e garantia documental MT Cars.`;

    let savedVehObj = null;
    if (editId) {
      const idx = App.state.vehicles.findIndex((v) => v.id === editId);
      if (idx !== -1) {
        const existingGallery = Array.isArray(App.state.vehicles[idx].gallery) && App.state.vehicles[idx].gallery.length > 0
          ? App.state.vehicles[idx].gallery
          : [image];
        App.state.vehicles[idx] = {
          ...App.state.vehicles[idx],
          brand,
          model,
          title: `${brand} ${model}`,
          year,
          km,
          category,
          transmission,
          fuel,
          city,
          priceSale,
          priceFipe,
          priceRepasse,
          garageName,
          garageOwner,
          garageWhatsapp,
          captadorId,
          captadorName: sellerObj.fullTitle,
          image,
          gallery: uploadedGallery || existingGallery,
          photoStatus: "complete",
          description
        };
        savedVehObj = App.state.vehicles[idx];
      }
      App.showToast(`✅ Veículo ${brand} ${model} salvo no Banco de Dados em Nuvem!`, "emerald");
    } else {
      const newVeh = {
        id: "veh_" + Date.now(),
        ref: "#MT-" + Math.floor(200 + Math.random() * 790),
        brand,
        model,
        title: `${brand} ${model}`,
        year,
        km,
        category,
        transmission,
        fuel,
        city,
        uf: "MT",
        priceSale,
        priceFipe,
        priceRepasse,
        garageName,
        garageOwner,
        garageWhatsapp,
        captadorId,
        captadorName: sellerObj.fullTitle,
        status: "Disponível",
        photoStatus: "complete",
        highlightTag: category.includes("Camionetes") ? "🚜 Pronto pro Agro" : "⭐ Oferta Auditada MT",
        color: "Branco",
        plateEnd: "IPVA 2026 Pago",
        description,
        options: ["Laudo Cautelar Aprovado", "IPVA 2026 Pago", "Garantia Procedência MT Car", "Multimídia Completa"],
        image,
        gallery: uploadedGallery || [image],
        fipeCode: "002140-1"
      };
      App.state.vehicles.unshift(newVeh);
      savedVehObj = newVeh;
      sellerObj.carrosCaptados = (Number(sellerObj.carrosCaptados) || 0) + 1;
      App.showToast(`🚗 Novo veículo ${newVeh.title} (${newVeh.ref}) salvo no Banco Cloud MT Car!`, "emerald");
    }

    App.state.uploadedAdminPhotos = [];
    const adminPreviewEl = document.getElementById("admin-veh-photos-preview");
    if (adminPreviewEl) adminPreviewEl.innerHTML = "";

    App.persistAll();
    window.MTCarsRealtime.emit("VEHICLE_SAVED", { vehicle: savedVehObj });
    closeNewVehicleModal();
    renderStockTab();
  }

  // =========================================================================
  // ABA 3: ROBÔ DE ABORDAGEM AUTOMÁTICA (RETARGETING DE SAÍDA) + FIREBASE CLOUD
  // =========================================================================
  function renderBotTab() {
    const cfg = App.state.botConfig || Data.INITIAL_BOT_CONFIG;

    const pSelect = document.getElementById("bot-cfg-provider");
    const urlInput = document.getElementById("bot-cfg-url");
    const keyInput = document.getElementById("bot-cfg-key");
    const instInput = document.getElementById("bot-cfg-instance");
    const delayInput = document.getElementById("bot-cfg-delay");
    const tplInput = document.getElementById("bot-cfg-template");
    const enabledCheck = document.getElementById("bot-cfg-enabled");

    if (pSelect) pSelect.value = cfg.provider || "Evolution API";
    if (urlInput) urlInput.value = cfg.instanceUrl || "";
    if (keyInput) keyInput.value = cfg.apiKey || "";
    if (instInput) instInput.value = cfg.instanceName || "";
    if (delayInput) delayInput.value = cfg.delaySeconds || 3;
    if (tplInput) tplInput.value = cfg.template || "";
    if (enabledCheck) enabledCheck.checked = cfg.enabled !== false;

    // Firebase status
    const fbStatus = window.MTCarsRealtime.getFirebaseStatus();
    const fbBadge = document.getElementById("firebase-status-badge");
    if (fbBadge) {
      fbBadge.innerHTML = fbStatus.connected
        ? `<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">🟢 Cloud Conectado</span>`
        : `<span class="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">⚡ Dual-Sync Local Ativo (Cloud Opcional)</span>`;
    }
    if (fbStatus.config) {
      const fbKey = document.getElementById("fb-cfg-apikey");
      const fbUrl = document.getElementById("fb-cfg-dburl");
      const fbProj = document.getElementById("fb-cfg-projectid");
      if (fbKey) fbKey.value = fbStatus.config.apiKey || "";
      if (fbUrl) fbUrl.value = fbStatus.config.databaseURL || "";
      if (fbProj) fbProj.value = fbStatus.config.projectId || "";
    }

    // Renderiza Terminal de Logs do Robô
    const logsContainer = document.getElementById("bot-terminal-logs");
    if (!logsContainer) return;

    logsContainer.innerHTML = App.state.botLogs.map((log) => `
      <div class="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono text-xs">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">[${log.timestamp}]</span>
            <span class="text-white font-bold">${log.clientName}</span>
            <span class="text-zinc-400">${log.clientPhone} (${log.clientCity})</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
            ${log.status} • ${log.provider}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
          <div class="text-zinc-400">👀 Saiu olhando: <strong class="text-blue-400">${log.lastVehicle}</strong></div>
          <div class="text-zinc-400">🎯 Robô recomendou: <strong class="text-amber-400">${log.suggestedVehicle} (${log.suggestedCity})</strong></div>
        </div>

        <div class="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-200 font-sans text-xs leading-relaxed">
          ${log.message}
        </div>
      </div>
    `).join("");
  }

  function insertTemplateTag(tag) {
    const tpl = document.getElementById("bot-cfg-template");
    if (!tpl) return;
    const start = tpl.selectionStart || tpl.value.length;
    const end = tpl.selectionEnd || tpl.value.length;
    tpl.value = tpl.value.substring(0, start) + tag + tpl.value.substring(end);
    tpl.focus();
  }

  function saveBotConfiguration(e) {
    if (e) e.preventDefault();
    App.loadStateFromStorage();
    App.state.botConfig = {
      enabled: document.getElementById("bot-cfg-enabled")?.checked !== false,
      provider: document.getElementById("bot-cfg-provider")?.value || "Evolution API",
      instanceUrl: document.getElementById("bot-cfg-url")?.value.trim() || "",
      apiKey: document.getElementById("bot-cfg-key")?.value.trim() || "",
      instanceName: document.getElementById("bot-cfg-instance")?.value.trim() || "MTCars_Central_MT",
      delaySeconds: Number(document.getElementById("bot-cfg-delay")?.value) || 3,
      template: document.getElementById("bot-cfg-template")?.value || Data.INITIAL_BOT_CONFIG.template
    };
    App.persistAll();
    App.showToast("🤖 Configurações da API de WhatsApp e Template do Robô salvas!", "emerald");
  }

  async function saveFirebaseConfiguration(e) {
    if (e) e.preventDefault();
    const apiKey = document.getElementById("fb-cfg-apikey")?.value.trim() || "";
    const databaseURL = document.getElementById("fb-cfg-dburl")?.value.trim() || "";
    const projectId = document.getElementById("fb-cfg-projectid")?.value.trim() || "";

    const res = await window.MTCarsRealtime.connectFirebase({ apiKey, databaseURL, projectId });
    renderBotTab();
    App.showToast(res.message, res.ok ? "emerald" : "amber");
  }

  // =========================================================================
  // ABA 4: CRM KANBAN E FILA DE LEADS (5 COLUNAS INTERATIVAS)
  // =========================================================================
  const KANBAN_COLUMNS = [
    { id: "visiting", title: "👀 Visitando / Capturados", badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
    { id: "bot_contacted", title: "🤖 Abordados pelo Robô", badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
    { id: "in_service", title: "💬 Em Atendimento", badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
    { id: "financing", title: "📑 Ficha em Análise", badgeColor: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
    { id: "closed_won", title: "🏆 Venda Fechada", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" }
  ];

  function renderCrmTab() {
    const board = document.getElementById("crm-kanban-board");
    const sellerFilterEl = document.getElementById("admin-crm-seller-filter");

    if (sellerFilterEl && sellerFilterEl.options.length <= 1) {
      sellerFilterEl.innerHTML =
        `<option value="">Todos os 8 Vendedores</option><option value="unassigned">Sem Vendedor (Fila Livre)</option>` +
        App.state.sellers.map((s) => `<option value="${s.id}">${s.fullTitle}</option>`).join("");
    }

    const fSeller = document.getElementById("admin-crm-seller-filter")?.value || "";
    const fCity = document.getElementById("admin-crm-city-filter")?.value || "";
    const fSearch = (document.getElementById("admin-crm-search-input")?.value || "").trim().toLowerCase();

    const filteredLeads = App.state.leads.filter((l) => {
      if (fSeller === "unassigned" && l.sellerId) return false;
      if (fSeller && fSeller !== "unassigned" && l.sellerId !== fSeller) return false;
      if (fCity && l.city !== fCity) return false;
      if (fSearch) {
        const hay = `${l.name} ${l.whatsapp} ${l.city} ${l.vehicleTitle} ${l.sellerName}`.toLowerCase();
        if (!hay.includes(fSearch)) return false;
      }
      return true;
    });

    if (!board) return;

    board.innerHTML = KANBAN_COLUMNS.map((col, colIdx) => {
      const colLeads = filteredLeads.filter((l) => l.stage === col.id);
      const prevStage = colIdx > 0 ? KANBAN_COLUMNS[colIdx - 1].id : null;
      const nextStage = colIdx < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[colIdx + 1].id : null;

      return `
        <div
          class="glass-panel rounded-2xl p-3.5 border border-zinc-800/90 flex flex-col h-[640px]"
          ondragover="event.preventDefault()"
          ondrop="MTCarsAdmin.onKanbanDrop(event, '${col.id}')"
        >
          <!-- Header da Coluna -->
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <span class="text-xs font-extrabold text-white">${col.title}</span>
            <span class="px-2 py-0.5 rounded-full border text-xs font-bold ${col.badgeColor}">${colLeads.length}</span>
          </div>

          <!-- Lista de Cards -->
          <div class="flex-1 overflow-y-auto space-y-3 pr-1">
            ${
              colLeads.length === 0
                ? `<div class="h-32 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-xs text-zinc-500 text-center p-4">
                     Nenhum lead nesta etapa
                   </div>`
                : colLeads
                    .map(
                      (lead) => `
                  <div
                    draggable="true"
                    ondragstart="MTCarsAdmin.onKanbanDragStart(event, '${lead.id}')"
                    class="p-3.5 rounded-xl bg-zinc-950/95 border border-zinc-800 hover:border-blue-500/50 transition space-y-2.5 cursor-grab active:cursor-grabbing shadow"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <h4 class="text-xs font-extrabold text-white">${lead.name}</h4>
                        <span class="text-[11px] font-mono text-zinc-400 block">${lead.whatsapp}</span>
                      </div>
                      <span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 shrink-0">
                        📍 ${lead.city}
                      </span>
                    </div>

                    <div class="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 space-y-1">
                      <div class="text-[11px] font-bold text-blue-400 line-clamp-1">🚘 ${lead.vehicleTitle}</div>
                      <div class="text-[11px] text-zinc-300">
                        💵 Entrada: <strong class="text-emerald-400">${App.formatBRL(lead.downPayment)}</strong> (${lead.installments}x)
                      </div>
                      <div class="text-[10px] text-zinc-400 truncate">🔄 Troca: ${lead.tradeIn || "Não informada"}</div>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-zinc-400">
                      <span class="font-semibold text-amber-400 truncate max-w-[140px]">👤 ${lead.sellerName}</span>
                      <span>${lead.createdAt}</span>
                    </div>

                    <!-- Ações Rápidas do Card -->
                    <div class="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-800/80">
                      <div class="flex items-center gap-1">
                        ${
                          prevStage
                            ? `<button onclick="MTCarsAdmin.moveLeadStage('${lead.id}', '${prevStage}')" title="Voltar etapa" class="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs">←</button>`
                            : ""
                        }
                        ${
                          nextStage
                            ? `<button onclick="MTCarsAdmin.moveLeadStage('${lead.id}', '${nextStage}')" title="Avançar etapa" class="px-2.5 py-1 rounded bg-blue-700/20 hover:bg-blue-700 text-blue-300 hover:text-white font-bold text-[11px] transition">Avançar →</button>`
                            : ""
                        }
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          onclick="MTCarsAdmin.openLeadDossierModal('${lead.id}')"
                          class="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px]"
                        >
                          Ficha
                        </button>
                        <a
                          href="https://wa.me/${App.cleanPhoneDigits(lead.whatsapp)}?text=${encodeURIComponent(`Olá ${lead.name}, aqui é da MT Cars sobre a proposta do ${lead.vehicleTitle}!`)}"
                          target="_blank"
                          class="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-zinc-950 font-bold text-[11px] transition"
                        >
                          Whats
                        </a>
                      </div>
                    </div>
                  </div>
                `
                    )
                    .join("")
            }
          </div>
        </div>
      `;
    }).join("");
  }

  let draggedLeadId = null;
  function onKanbanDragStart(event, leadId) {
    draggedLeadId = leadId;
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", leadId);
    }
  }

  function onKanbanDrop(event, targetStage) {
    event.preventDefault();
    const leadId = draggedLeadId || (event.dataTransfer ? event.dataTransfer.getData("text/plain") : null);
    if (leadId) {
      moveLeadStage(leadId, targetStage);
      draggedLeadId = null;
    }
  }

  function moveLeadStage(leadId, newStage) {
    App.loadStateFromStorage();
    const lead = App.state.leads.find((l) => l.id === leadId);
    if (!lead) return;

    const currentSeller = App.state.currentSeller || App.state.sellers[0];
    lead.stage = newStage;
    if (!lead.sellerId && (newStage === "in_service" || newStage === "financing" || newStage === "closed_won")) {
      lead.sellerId = currentSeller.id;
      lead.sellerName = currentSeller.fullTitle;
    }

    if (newStage === "closed_won") {
      window.MTCarsRealtime.playSound("sale_closed");
    }

    App.persistAll();
    window.MTCarsRealtime.emit("CRM_UPDATED", { leadId, newStage });
    renderCrmTab();
    App.showToast(`📌 Lead ${lead.name} movido para a coluna: ${KANBAN_COLUMNS.find((c) => c.id === newStage)?.title}`, "emerald");
  }

  function openLeadDossierModal(leadId) {
    const lead = App.state.leads.find((l) => l.id === leadId);
    if (!lead) return;
    const modal = document.getElementById("lead-dossier-modal");
    const content = document.getElementById("lead-dossier-content");
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <span class="text-xs font-bold text-blue-400 uppercase">Dossiê Completo do Lead MT Cars</span>
            <h3 class="text-xl font-black text-white">${lead.name}</h3>
            <p class="text-xs text-zinc-400">📱 ${lead.whatsapp} • 📍 ${lead.city} - MT</p>
          </div>
          <span class="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-bold text-amber-400">
            👤 ${lead.sellerName}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-zinc-400 block mb-1">Veículo de Interesse Principal:</span>
            <strong class="text-white text-sm">${lead.vehicleTitle}</strong>
            <span class="text-emerald-400 font-bold block mt-0.5">${App.formatBRL(lead.vehiclePrice)}</span>
          </div>
          <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-zinc-400 block mb-1">Simulação Registrada:</span>
            <strong class="text-emerald-400 text-sm">Entrada: ${App.formatBRL(lead.downPayment)} (${lead.installments}x)</strong>
            <span class="text-zinc-300 block mt-0.5">🔄 Troca: ${lead.tradeIn}</span>
          </div>
        </div>

        <div>
          <label class="text-xs font-bold text-zinc-400 block mb-1">Atribuir / Transferir para Vendedor:</label>
          <select
            id="dossier-seller-select"
            onchange="MTCarsAdmin.assignLeadSeller('${lead.id}', this.value)"
            class="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white"
          >
            <option value="">Sem Vendedor (Fila Livre)</option>
            ${App.state.sellers
              .map((s) => `<option value="${s.id}" ${s.id === lead.sellerId ? "selected" : ""}>${s.fullTitle} (${s.city}-MT)</option>`)
              .join("")}
          </select>
        </div>

        <div>
          <label class="text-xs font-bold text-zinc-400 block mb-1">Histórico & Observações do Atendimento:</label>
          <textarea
            id="dossier-notes-input"
            rows="3"
            class="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-xs text-white"
          >${lead.notes || ""}</textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            onclick="MTCarsAdmin.saveLeadDossierNotes('${lead.id}')"
            class="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs"
          >
            Salvar Anotações
          </button>
          <a
            href="https://wa.me/${App.cleanPhoneDigits(lead.whatsapp)}?text=${encodeURIComponent(`Olá ${lead.name}, tudo bem? Aqui é da MT Cars sobre o ${lead.vehicleTitle}!`)}"
            target="_blank"
            class="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs"
          >
            Chamar no WhatsApp ↗
          </a>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeLeadDossierModal() {
    const modal = document.getElementById("lead-dossier-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  function assignLeadSeller(leadId, sellerId) {
    App.loadStateFromStorage();
    const lead = App.state.leads.find((l) => l.id === leadId);
    if (!lead) return;
    const seller = App.state.sellers.find((s) => s.id === sellerId);
    lead.sellerId = seller ? seller.id : null;
    lead.sellerName = seller ? seller.fullTitle : "Aguardando Vendedor";
    if (seller && lead.stage === "visiting") {
      lead.stage = "in_service";
    }
    App.persistAll();
    renderCrmTab();
    App.showToast(`👤 Lead atribuído para: ${lead.sellerName}`, "emerald");
  }

  function saveLeadDossierNotes(leadId) {
    App.loadStateFromStorage();
    const lead = App.state.leads.find((l) => l.id === leadId);
    if (!lead) return;
    lead.notes = document.getElementById("dossier-notes-input")?.value || "";
    App.persistAll();
    closeLeadDossierModal();
    renderCrmTab();
    App.showToast("✅ Histórico do lead atualizado!", "emerald");
  }

  // =========================================================================
  // ABA 5: GESTÃO DOS 8 VENDEDORES E COMISSÕES
  // =========================================================================
  function renderSellersTab() {
    const grid = document.getElementById("admin-sellers-grid");
    const totalSalesEl = document.getElementById("sellers-kpi-total-sales");
    const totalCommEl = document.getElementById("sellers-kpi-total-commissions");
    const totalLeadsEl = document.getElementById("sellers-kpi-total-leads");

    const totalSales = App.state.sellers.reduce((acc, s) => acc + (Number(s.vendasRealizadas) || 0), 0);
    const totalComm = App.state.sellers.reduce((acc, s) => acc + (Number(s.comissoesGeradas) || 0), 0);
    const totalLeads = App.state.sellers.reduce((acc, s) => acc + (Number(s.leadsAssumidosHoje) || 0), 0);

    if (totalSalesEl) totalSalesEl.textContent = `${totalSales} veículos vendidos`;
    if (totalCommEl) totalCommEl.textContent = App.formatBRL(totalComm);
    if (totalLeadsEl) totalLeadsEl.textContent = `${totalLeads} atendimentos hoje`;

    if (!grid) return;

    grid.innerHTML = App.state.sellers.map((s) => {
      const progressPct = Math.min(100, Math.round(((Number(s.comissoesGeradas) || 0) / (Number(s.metaMensal) || 50000)) * 100));

      return `
        <div class="glass-panel rounded-2xl p-5 border border-zinc-800 hover:border-zinc-700 transition space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white font-black text-base shadow-lg">
                ${s.avatar}
              </div>
              <div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-blue-400">${s.code}</span>
                <h4 class="text-base font-extrabold text-white">${s.name}</h4>
                <span class="text-xs text-zinc-400 block">📍 Base: ${s.city} - MT</span>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-bold">
              🟢 Ativo
            </span>
          </div>

          <div class="text-xs text-zinc-400 space-y-1 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
            <div>📧 E-mail: <span class="text-zinc-200 font-mono">${s.email}</span></div>
            <div>📱 WhatsApp: <span class="text-zinc-200 font-mono">${s.whatsapp}</span></div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span class="text-lg font-black text-white block">${s.leadsAssumidosHoje}</span>
              <span class="text-[10px] text-zinc-400">Leads Hoje</span>
            </div>
            <div class="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span class="text-lg font-black text-amber-400 block">${s.carrosCaptados}</span>
              <span class="text-[10px] text-zinc-400">Carros Captados</span>
            </div>
            <div class="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span class="text-lg font-black text-emerald-400 block">${s.vendasRealizadas}</span>
              <span class="text-[10px] text-zinc-400">Vendas</span>
            </div>
          </div>

          <!-- Comissões e Meta -->
          <div class="space-y-1.5">
            <div class="flex items-baseline justify-between text-xs">
              <span class="text-zinc-400">Comissões Geradas:</span>
              <span class="text-base font-black text-emerald-400">${App.formatBRL(s.comissoesGeradas)}</span>
            </div>
            <div class="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
              <div class="h-full bg-gradient-to-r from-blue-700 via-amber-500 to-emerald-500" style="width: ${progressPct}%"></div>
            </div>
            <div class="flex justify-between text-[10px] text-zinc-500">
              <span>${progressPct}% da meta atingida</span>
              <span>Meta: ${App.formatBRL(s.metaMensal)}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
            <button
              onclick="MTCarsAdmin.openEditSellerModal('${s.id}')"
              class="flex-1 py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition"
            >
              ✏️ Editar Vendedor / Meta
            </button>
            <button
              onclick="MTCarsAdmin.switchActiveSeller('${s.id}')"
              class="py-2 px-3 rounded-xl bg-blue-700/20 hover:bg-blue-700 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition"
            >
              Operar como ${s.code.split(" ")[1]}
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  function openEditSellerModal(sellerId) {
    const s = App.state.sellers.find((item) => item.id === sellerId);
    if (!s) return;
    App.populateCityDropdowns();

    document.getElementById("edit-seller-id").value = s.id;
    document.getElementById("edit-seller-name").value = s.name;
    document.getElementById("edit-seller-phone").value = s.whatsapp;
    document.getElementById("edit-seller-city").value = s.city;
    document.getElementById("edit-seller-goal").value = s.metaMensal;

    const modal = document.getElementById("edit-seller-modal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }
  }

  function closeEditSellerModal() {
    const modal = document.getElementById("edit-seller-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  function submitEditSellerForm(e) {
    if (e) e.preventDefault();
    App.loadStateFromStorage();
    const id = document.getElementById("edit-seller-id")?.value;
    const s = App.state.sellers.find((item) => item.id === id);
    if (!s) return;

    const newName = document.getElementById("edit-seller-name")?.value.trim() || s.name;
    s.name = newName;
    s.fullTitle = `${s.code} - ${newName.split(" ")[0]}`;
    s.whatsapp = document.getElementById("edit-seller-phone")?.value.trim() || s.whatsapp;
    s.city = document.getElementById("edit-seller-city")?.value || s.city;
    s.metaMensal = Number(document.getElementById("edit-seller-goal")?.value) || s.metaMensal;

    if (App.state.currentSeller && App.state.currentSeller.id === s.id) {
      App.state.currentSeller = s;
      localStorage.setItem(Data.STORAGE_KEYS.CURRENT_SELLER, JSON.stringify(s));
    }

    App.persistAll();
    closeEditSellerModal();
    renderSellerHeader();
    renderSellersTab();
    App.showToast(`✅ Perfil e meta de ${s.fullTitle} atualizados!`, "emerald");
  }

  // =========================================================================
  // NOVAS FERRAMENTAS PRÁTICAS DE FECHAMENTO (PLAYBOOK, PROPOSTA PDF, MATCH CRM & CALCULADORA)
  // =========================================================================

  // 1. Playbook de Scripts Rápidos no Card do Cliente (4 Botões Cirúrgicos)
  function sendPlaybookScript(visitorId, scriptType) {
    App.loadStateFromStorage();
    const vis = App.state.visitors.find((v) => v.id === visitorId) || App.state.visitors[0];
    if (!vis) return;
    const veh = App.state.vehicles.find((v) => v.id === vis.currentVehicleId) || App.state.vehicles[0];
    const seller = App.state.currentSeller || App.state.sellers[0];
    const cleanName = vis.name.replace("🖥️ SUA ABA DE VITRINE", "").replace("(Sua Aba Ao Vivo)", "").trim() || "Parceiro";
    const downVal = vis.simulation?.downPayment ? App.formatBRL(vis.simulation.downPayment) : App.formatBRL(Math.round(veh.priceSale * 0.3));
    const months = vis.simulation?.installments || 48;
    const instVal = vis.simulation?.installmentValue
      ? App.formatBRL(vis.simulation.installmentValue)
      : App.formatBRL(App.calculateInstallment(veh.priceSale, Math.round(veh.priceSale * 0.3), 48));

    let msg = "";
    if (scriptType === "abordagem") {
      msg = `Fala *${cleanName}*, tudo joia? Aqui é o *${seller.name}* da Central *MT Cars*! 🚘\n\nVi que você acabou de simular o *${veh.title} (${veh.year})* anunciado por *${App.formatBRL(veh.priceSale)}* (${App.formatBRL(Math.max(0, veh.priceFipe - veh.priceSale))} abaixo da FIPE!) com *${downVal} de entrada* em *${months}x de ${instVal}*.\n\nO carro está disponível e com laudo cautelar 100% aprovado. Quer que eu te mande um vídeo dele agora?`;
    } else if (scriptType === "ficha_cpf") {
      msg = `Opa *${cleanName}*, aqui é o *${seller.name}* da *MT Cars*! 📄\n\nPra eu segurar essa condição do *${veh.title}* (${months}x de ${instVal} com ${downVal} de entrada) e já rodar sua pré-aprovação sem compromisso aqui no Safra, Santander e Sicredi MT, me manda rapidinho:\n\n1️⃣ *CPF*\n2️⃣ *Data de Nascimento*\n3️⃣ *Celular com DDD*\n\nEm 10 minutos já te retorno com a taxa mais baixa aprovada!`;
    } else if (scriptType === "contraproposta_troca") {
      const tradeModel = vis.simulation?.tradeInModel || "seu veículo usado";
      const tradeVal = vis.simulation?.tradeInValue || 85000;
      const evalObj = Data.evaluateTradeInVehicle(tradeModel, tradeVal);
      msg = `Fala *${cleanName}*, aqui é o *${seller.name}* da *MT Cars*! 🔄\n\nAnalisei aqui com a nossa diretoria de compras o seu *${tradeModel}* pra entrar no negócio do *${veh.title}*.\n\nHoje a referência FIPE dele gira em *${App.formatBRL(evalObj.fipeEstimated)}* e as garagens parceiras conseguem absorver no repasse imediato até *${App.formatBRL(evalObj.garageMaxPay)}* (já livre de custos de revisão e garantia para você).\n\nSe a gente fechar nesse teto de *${App.formatBRL(evalObj.garageMaxPay)}* no seu usado + a diferença financiada, eu consigo travar o *${veh.title}* pra você hoje mesmo. Bora fechar negócio?`;
    } else if (scriptType === "agendar_video") {
      const freight = Data.calculateMTFreight(veh.city, vis.city);
      msg = `Opa *${cleanName}*, aqui é o *${seller.name}* da *MT Cars*! 🎥\n\nPodemos fazer uma chamada de vídeo rápida de 3 minutos agora na frente do *${veh.title} (${veh.ref})* pra você ver o cofre do motor, pneus e interna ao vivo?\n\n${freight.distanceKm === 0 ? `Como você também está em *${vis.city}*, já deixamos agendada sua visita presencial hoje!` : `E se aprovar no vídeo, nossa cegonha segurada entrega ele aí em *${vis.city} - MT* (${freight.distanceKm} km) em ${freight.deliveryTime}!`}`;
    }

    const phoneDigits = App.cleanPhoneDigits(vis.whatsapp.replace(/\D/g, "").length >= 10 ? vis.whatsapp : "65999110101");
    window.open(`https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`, "_blank");
    App.showToast(`📲 Script "${scriptType.toUpperCase()}" pronto e aberto no WhatsApp de ${cleanName}!`, "emerald");
  }

  // 2. Gerador de Proposta Oficial MT Cars (Pronta para PDF / Impressão / WhatsApp)
  function openProposalPdfModal(visitorId) {
    App.loadStateFromStorage();
    const vis = App.state.visitors.find((v) => v.id === visitorId) || App.state.visitors[0];
    if (!vis) return;
    const veh = App.state.vehicles.find((v) => v.id === vis.currentVehicleId) || App.state.vehicles[0];
    const seller = App.state.currentSeller || App.state.sellers[0];

    const cleanName = vis.name.replace("🖥️ SUA ABA DE VITRINE", "Cliente VIP").replace("(Sua Aba Ao Vivo)", "").trim();
    const downPayment = vis.simulation?.downPayment ?? Math.round(veh.priceSale * 0.3);
    const tradeEval =
      vis.simulation?.hasTradeIn && vis.simulation?.tradeInModel
        ? Data.evaluateTradeInVehicle(vis.simulation.tradeInModel, vis.simulation.tradeInValue)
        : null;
    const tradeCredit = tradeEval ? tradeEval.garageMaxPay : 0;
    const totalEntry = downPayment + tradeCredit;
    const financedBalance = Math.max(0, veh.priceSale - totalEntry);
    const freight = Data.calculateMTFreight(veh.city, vis.city);
    const proposalCode = `PROP-${veh.ref.replace("#", "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toLocaleDateString("pt-BR");

    const modal = document.getElementById("proposal-pdf-modal");
    const content = document.getElementById("proposal-pdf-content");
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="space-y-5">
        <!-- Cabeçalho Oficial da Proposta -->
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-xl bg-blue-700 flex items-center justify-center text-white keep-white-text font-black text-base">
              MT
            </div>
            <div>
              <h3 class="font-display text-lg font-black text-white">PROPOSTA COMERCIAL OFICIAL — MT CARS</h3>
              <p class="text-xs text-zinc-400">Central Estadual de Intermediação Automotiva • Mato Grosso</p>
            </div>
          </div>
          <div class="text-right text-xs">
            <span class="font-mono font-bold text-amber-400 block">${proposalCode}</span>
            <span class="text-zinc-400">Emissão: ${dateStr} • Validade: 24 horas</span>
          </div>
        </div>

        <!-- Dados do Cliente e Consultor -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span class="text-[10px] font-bold uppercase text-zinc-500 block">Proponente / Comprador</span>
            <strong class="text-sm text-white block">${cleanName}</strong>
            <span class="text-zinc-300 block">📱 ${vis.whatsapp} • 📍 ${vis.city} - MT</span>
          </div>
          <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
            <span class="text-[10px] font-bold uppercase text-zinc-500 block">Consultor Credenciado MT Cars</span>
            <strong class="text-sm text-white block">${seller.fullTitle}</strong>
            <span class="text-zinc-300 block">📱 ${seller.whatsapp} • Base: ${seller.city} - MT</span>
          </div>
        </div>

        <!-- Dados do Veículo Auditado -->
        <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row gap-4 items-center">
          <img src="${veh.image}" class="w-full sm:w-44 h-28 object-cover rounded-xl border border-zinc-700" alt="${veh.title}" />
          <div class="flex-1 space-y-1.5">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">✔ LAUDO CAUTELAR APROVADO</span>
              <span class="text-xs font-mono text-zinc-400">${veh.ref} • 📍 ${veh.city}-MT</span>
            </div>
            <h4 class="text-lg font-black text-white">${veh.title} (${veh.year})</h4>
            <div class="text-xs text-zinc-400">${Number(veh.km).toLocaleString("pt-BR")} km • ${veh.transmission} • ${veh.fuel} • ${veh.color || "Original"}</div>
            <div class="flex flex-wrap items-baseline gap-4 pt-1">
              <span class="text-xs text-zinc-400">Tabela FIPE: <del>${App.formatBRL(veh.priceFipe)}</del></span>
              <span class="text-sm font-extrabold text-emerald-400">Valor Auditado MT Cars: ${App.formatBRL(veh.priceSale)}</span>
            </div>
          </div>
        </div>

        <!-- Estrutura Financeira da Proposta -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-zinc-400 block">💵 Entrada em Recurso Próprio:</span>
            <strong class="text-base text-emerald-400">${App.formatBRL(downPayment)}</strong>
          </div>
          <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-zinc-400 block">🔄 Crédito Veículo na Troca:</span>
            <strong class="text-base text-amber-400">${tradeEval ? `${App.formatBRL(tradeCredit)} (${tradeEval.modelText})` : "R$ 0 (Sem troca)"}</strong>
          </div>
          <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
            <span class="text-zinc-400 block">🏦 Saldo a Financiar:</span>
            <strong class="text-base text-white">${App.formatBRL(financedBalance)}</strong>
          </div>
        </div>

        <!-- Tabela Comparativa de Prazos (12x a 60x) -->
        <div>
          <span class="text-[11px] font-bold uppercase text-zinc-400 block mb-2">Opções de Parcelamento Pré-Simuladas (Taxa Ref. 1,49% a.m.)</span>
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            ${[12, 24, 36, 48, 60]
              .map((m) => {
                const val = App.calculateInstallment(veh.priceSale, totalEntry, m);
                const isSelected = m === (vis.simulation?.installments || 48);
                return `
                  <div class="p-2.5 rounded-xl border ${isSelected ? "bg-blue-700/20 border-blue-500 text-white" : "bg-zinc-950 border-zinc-800 text-zinc-300"}">
                    <span class="text-xs font-bold block">${m}x fixas</span>
                    <strong class="text-sm font-black ${isSelected ? "text-emerald-400" : "text-white"}">${App.formatBRL(val)}</strong>
                  </div>
                `;
              })
              .join("")}
          </div>
        </div>

        <!-- Logística e Entrega -->
        <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>🚚 <strong>Logística de Entrega MT:</strong> ${freight.routeInfo} (${freight.deliveryTime})</span>
          <span class="font-bold text-amber-400">Frete Estimado: ${freight.freightCost === 0 ? "ISENTO (Mesma Cidade)" : App.formatBRL(freight.freightCost)}</span>
        </div>

        <!-- Botões de Ação (Não saem na impressão PDF) -->
        <div class="no-print flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            onclick="MTCarsAdmin.closeProposalPdfModal()"
            class="px-4 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold"
          >
            Fechar
          </button>
          <button
            onclick="window.print()"
            class="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-bold text-xs flex items-center gap-1.5"
          >
            <span>🖨️ Imprimir / Salvar em PDF</span>
          </button>
          <button
            onclick="MTCarsAdmin.sendPlaybookScript('${vis.id}', 'abordagem')"
            class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
          >
            <span>📲 Enviar Proposta no WhatsApp</span>
          </button>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeProposalPdfModal() {
    const modal = document.getElementById("proposal-pdf-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  // 3. Match Inteligente "Estoque x Clientes do CRM" (Cruzamento Automático de Oportunidades)
  function openStockMatchModal(vehicleId) {
    App.loadStateFromStorage();
    const veh = App.state.vehicles.find((v) => v.id === vehicleId) || App.state.vehicles[0];
    if (!veh) return;

    const modal = document.getElementById("stock-match-modal");
    const content = document.getElementById("stock-match-content");
    if (!modal || !content) return;

    // Cruza clientes do CRM e visitantes que tenham entrada compatível (>= 18% do carro) ou interesse na mesma categoria/faixa de preço
    const minDownNeeded = veh.priceSale * 0.18;
    const candidates = App.state.leads.filter((l) => l.stage !== "closed_won");

    const scoredMatches = candidates.map((lead) => {
      let score = 72;
      const reasons = [];
      if (Number(lead.downPayment) >= minDownNeeded) {
        score += 16;
        reasons.push(`Entrada de ${App.formatBRL(lead.downPayment)} aprova fácil`);
      }
      if (lead.city === veh.city) {
        score += 10;
        reasons.push(`Mesma cidade (${veh.city}-MT)`);
      } else {
        reasons.push(`Entrega via Cegonha p/ ${lead.city}-MT`);
      }
      if (Math.abs((lead.vehiclePrice || veh.priceSale) - veh.priceSale) <= 45000) {
        score += 8;
        reasons.push("Mesma faixa de orçamento");
      }
      return {
        lead,
        score: Math.min(99, score),
        reasons
      };
    }).sort((a, b) => b.score - a.score);

    content.innerHTML = `
      <div class="space-y-4">
        <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-4">
          <img src="${veh.image}" class="w-24 h-16 object-cover rounded-xl border border-zinc-700" alt="${veh.title}" />
          <div>
            <span class="text-[10px] font-bold uppercase text-amber-400">🎯 Cruzamento Inteligente de Estoque MT Cars</span>
            <h4 class="text-base font-black text-white">${veh.title} (${veh.year}) — ${App.formatBRL(veh.priceSale)}</h4>
            <span class="text-xs text-zinc-400">📍 ${veh.city}-MT • Comissão MT Cars: <strong class="text-emerald-400">${App.formatBRL(veh.priceSale - veh.priceRepasse)}</strong></span>
          </div>
        </div>

        <div class="text-xs text-zinc-300">
          Encontramos <strong>${scoredMatches.length} clientes no CRM</strong> com perfil financeiro compatível para ofertar este veículo agora:
        </div>

        <div class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          ${scoredMatches
            .map(({ lead, score, reasons }) => {
              const pitchMsg = `Opa *${lead.name}*, tudo bem? Aqui é da Central *MT Cars*! 🚘\n\nLembrei de você porque acabou de ficar disponível no nosso estoque o *${veh.title} (${veh.year})* em *${veh.city}-MT* por *${App.formatBRL(veh.priceSale)}* (${App.formatBRL(Math.max(0, veh.priceFipe - veh.priceSale))} abaixo da FIPE!).\n\nCom a sua entrada de *${App.formatBRL(lead.downPayment)}*, as parcelas ficam excelentes. Quer ver as fotos e o vídeo dele?`;
              return `
                <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[11px] font-black">${score}% MATCH</span>
                      <strong class="text-sm text-white">${lead.name}</strong>
                      <span class="text-xs text-zinc-400">📍 ${lead.city}-MT</span>
                    </div>
                    <div class="text-xs text-zinc-400">
                      💵 Entrada cadastrada: <strong class="text-emerald-400">${App.formatBRL(lead.downPayment)}</strong> • Olhou antes: ${lead.vehicleTitle}
                    </div>
                    <div class="flex flex-wrap gap-1.5 pt-0.5">
                      ${reasons.map((r) => `<span class="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-300">✔ ${r}</span>`).join("")}
                    </div>
                  </div>
                  <a
                    href="https://wa.me/${App.cleanPhoneDigits(lead.whatsapp)}?text=${encodeURIComponent(pitchMsg)}"
                    target="_blank"
                    class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs transition shrink-0"
                  >
                    📲 Ofertar no Whats ↗
                  </a>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeStockMatchModal() {
    const modal = document.getElementById("stock-match-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  // 4. Calculadora de Fechamento, Avaliação de Troca, Frete Cegonha MT & Split de Comissão
  function openDealCalculatorModal() {
    App.loadStateFromStorage();
    const modal = document.getElementById("deal-calculator-modal");
    if (!modal) return;

    const vehSelect = document.getElementById("calc-veh-select");
    if (vehSelect) {
      vehSelect.innerHTML = App.state.vehicles
        .map((v) => `<option value="${v.id}">${v.ref} — ${v.title} (${v.city}-MT) • ${App.formatBRL(v.priceSale)}</option>`)
        .join("");
    }

    const destCitySelect = document.getElementById("calc-client-city");
    if (destCitySelect && destCitySelect.options.length <= 1) {
      destCitySelect.innerHTML = Data.FALLBACK_MT_CITIES
        .map((c) => `<option value="${c}">${c} - MT</option>`)
        .join("");
    }

    recalcDealSimulator();
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeDealCalculatorModal() {
    const modal = document.getElementById("deal-calculator-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  function recalcDealSimulator() {
    const vehId = document.getElementById("calc-veh-select")?.value || "veh_101";
    const veh = App.state.vehicles.find((v) => v.id === vehId) || App.state.vehicles[0];
    if (!veh) return;

    const clientCity = document.getElementById("calc-client-city")?.value || "Sinop";
    const tradeModel = document.getElementById("calc-trade-model")?.value || "Hilux SRV 2018";
    const tradeAsked = Number(document.getElementById("calc-trade-asked")?.value) || 155000;
    const cashDown = Number(document.getElementById("calc-cash-down")?.value) || 50000;

    const tradeEval = Data.evaluateTradeInVehicle(tradeModel, tradeAsked);
    const freight = Data.calculateMTFreight(veh.city, clientCity);

    const grossCommission = Math.max(0, veh.priceSale - veh.priceRepasse);
    const netAfterFreight = Math.max(0, grossCommission - freight.freightCost);
    const companySplit = Math.round(netAfterFreight * 0.65);
    const sellerSplit = netAfterFreight - companySplit;

    const box = document.getElementById("calc-results-box");
    if (!box) return;

    box.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
          <span class="text-[10px] font-bold uppercase text-amber-400 block">🔄 Avaliação do Usado na Troca</span>
          <div class="flex justify-between"><span>FIPE Estimada (${tradeEval.modelText}):</span> <strong class="text-white">${App.formatBRL(tradeEval.fipeEstimated)}</strong></div>
          <div class="flex justify-between"><span>Teto Garagem (-12%):</span> <strong class="text-emerald-400">${App.formatBRL(tradeEval.garageMaxPay)}</strong></div>
          <div class="flex justify-between"><span>Cliente Pediu:</span> <span class="text-zinc-300">${App.formatBRL(tradeEval.clientAsked)}</span></div>
          <div class="pt-1 border-t border-zinc-800 font-bold text-amber-300">${tradeEval.verdict}</div>
        </div>

        <div class="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
          <span class="text-[10px] font-bold uppercase text-emerald-400 block">🚚 Frete Cegonha & Split de Comissão</span>
          <div class="flex justify-between"><span>Rota no MT:</span> <strong class="text-white">${veh.city} ➔ ${clientCity} (${freight.distanceKm} km)</strong></div>
          <div class="flex justify-between"><span>Custo Cegonha / Plataforma:</span> <strong class="text-amber-400">${App.formatBRL(freight.freightCost)}</strong></div>
          <div class="flex justify-between"><span>Margem Bruta (${veh.ref}):</span> <span class="text-zinc-200">${App.formatBRL(grossCommission)}</span></div>
          <div class="pt-1 border-t border-zinc-800 flex justify-between">
            <span>🏢 Caixa MT Car (65%): <strong class="text-white">${App.formatBRL(companySplit)}</strong></span>
            <span>👤 Cooperado (35%): <strong class="text-emerald-400">${App.formatBRL(sellerSplit)}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  // 5. Cooperado Vai até a Loja e Adiciona as Fotos do Veículo Cadastrado pelo Lojista (Direto da Galeria Celular/PC!)
  function cooperadoAddPhotosToVehicle(vehicleId) {
    App.loadStateFromStorage();
    const v = App.state.vehicles.find((item) => item.id === vehicleId);
    if (!v) return;

    const currentSeller = App.state.currentSeller || App.state.sellers[0];

    // Cria seletor de arquivos nativo para o Cooperado enviar múltiplas fotos direto do celular ou PC
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    fileInput.onchange = async () => {
      const files = Array.from(fileInput.files || []).slice(0, 12);
      document.body.removeChild(fileInput);
      if (!files.length) return;

      App.showToast(`📸 Processando ${files.length} foto(s) tiradas pelo Cooperado...`, "amber");
      const uploadedList = [];
      for (const f of files) {
        try {
          const dataUrl = await App.compressImageFileToDataUrl(f);
          uploadedList.push(dataUrl);
        } catch (err) {
          console.warn("Erro ao comprimir foto do cooperado:", err);
        }
      }

      if (!uploadedList.length) return;

      v.image = uploadedList[0];
      v.gallery = uploadedList;
      v.photoStatus = "complete";
      v.status = "Disponível";
      v.captadorId = currentSeller.id;
      v.captadorName = `${currentSeller.fullTitle} (Fotografou na Loja)`;
      v.highlightTag = "📸 Fotografado por Cooperado MT Car";

      const sellerObj = App.state.sellers.find((s) => s.id === currentSeller.id);
      if (sellerObj) {
        sellerObj.carrosCaptados = (Number(sellerObj.carrosCaptados) || 0) + 1;
      }

      App.persistAll();
      window.MTCarsRealtime.emit("VEHICLE_UPDATED", { vehicleId: v.id, vehicle: v });
      renderStockTab();
      App.showToast(`📸 ${uploadedList.length} foto(s) adicionada(s) por ${currentSeller.fullTitle}! O veículo ${v.title} já está no ar na Vitrine!`, "emerald");
    };

    fileInput.click();
  }

  // 6. ABA 6 EXCLUSIVA DO DONO: PÁGINA EXCLUSIVA DE LOJAS PARCEIRAS CADASTRADAS
  function renderStoresTab() {
    const container = document.getElementById("admin-stores-exclusive-container");
    if (!container) return;

    const currentSeller = App.state.currentSeller || App.state.sellers[0];
    const isDirector = Boolean(currentSeller.isDirector);

    if (!isDirector) {
      container.innerHTML = `
        <div class="glass-panel rounded-3xl p-10 text-center max-w-2xl mx-auto border-2 border-amber-500/60 space-y-4">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 text-2xl font-black">
            👑
          </div>
          <span class="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold uppercase">
            Área Restrita — Exclusividade do Dono / Diretoria MT Car
          </span>
          <h3 class="text-2xl font-black text-white">
            Relação Confidencial de Lojas Parceiras Cadastradas
          </h3>
          <p class="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Você está visualizando o painel como <strong>${currentSeller.fullTitle}</strong> (Cooperado). Conforme a regra de sigilo da <strong>MT Car</strong>, a página com a lista completa das Lojas Parceiras, donos e telefones diretos é de <strong>exclusividade do Dono (Diretor Geral)</strong>.
          </p>
          <div class="pt-2">
            <button
              onclick="MTCarsAdmin.switchActiveSeller('director_master')"
              class="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg transition"
            >
              👑 Alternar para Visão do Dono (Diretor Geral - RD) Agora
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Agrupa todas as Lojas Parceiras cadastradas no sistema
    const storesMap = {};
    App.state.vehicles.forEach((v) => {
      const key = v.garageName || "Loja Parceira MT";
      if (!storesMap[key]) {
        storesMap[key] = {
          name: key,
          owner: v.garageOwner || "Lojista Parceiro",
          whatsapp: v.garageWhatsapp || "(65) 99999-0000",
          city: v.city || "Cuiabá",
          vehicles: [],
          totalSaleValue: 0,
          totalRepasseValue: 0,
          totalCommission: 0,
          pendingPhotosCount: 0
        };
      }
      storesMap[key].vehicles.push(v);
      storesMap[key].totalSaleValue += Number(v.priceSale) || 0;
      storesMap[key].totalRepasseValue += Number(v.priceRepasse) || 0;
      storesMap[key].totalCommission += (Number(v.priceSale) || 0) - (Number(v.priceRepasse) || 0);
      if (v.photoStatus === "pending_photos") {
        storesMap[key].pendingPhotosCount += 1;
      }
    });

    const storesList = Object.values(storesMap);
    const totalStores = storesList.length;
    const totalPendingPhotos = storesList.reduce((acc, s) => acc + s.pendingPhotosCount, 0);
    const totalGuaranteedMargin = storesList.reduce((acc, s) => acc + s.totalCommission, 0);

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Banner Exclusivo do Dono -->
        <div class="glass-panel rounded-2xl p-5 border-2 border-amber-500/60 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black uppercase">
              👑 PÁGINA EXCLUSIVA DO DONO (OCULTA PARA CLIENTES E COOPERADOS)
            </span>
            <h3 class="text-xl font-black text-white mt-1">
              Central Confidencial das Lojas Parceiras Credenciadas no Mato Grosso
            </h3>
            <p class="text-xs text-zinc-300">
              Controle total de todas as garagens/lojas cadastradas, contato direto dos lojistas e veículos aguardando fotos dos cooperados.
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              onclick="MTCarsApp.openSellMyCarModal()"
              class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow transition"
            >
              🏪 + Cadastrar Veículo de Lojista (Com ou Sem Fotos)
            </button>
          </div>
        </div>

        <!-- KPIs das Lojas Parceiras -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-panel rounded-2xl p-5 border border-zinc-800">
            <span class="text-xs font-bold uppercase text-zinc-400 block">🏢 Lojas Parceiras Cadastradas em MT</span>
            <span class="text-3xl font-black text-white mt-1 block">${totalStores} Lojas Ativas</span>
          </div>
          <div class="glass-panel rounded-2xl p-5 border border-amber-500/40">
            <span class="text-xs font-bold uppercase text-amber-400 block">📸 Carros de Lojistas Aguardando Fotos</span>
            <span class="text-3xl font-black text-amber-400 mt-1 block">${totalPendingPhotos} Abertos p/ Cooperados</span>
          </div>
          <div class="glass-panel rounded-2xl p-5 border border-emerald-500/40">
            <span class="text-xs font-bold uppercase text-emerald-400 block">💎 Margem Total nas Lojas Parceiras</span>
            <span class="text-3xl font-black text-emerald-400 mt-1 block">${App.formatBRL(totalGuaranteedMargin)}</span>
          </div>
        </div>

        <!-- Grid de Lojas Parceiras -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${storesList.map((st) => `
            <div class="glass-panel rounded-2xl p-5 border border-zinc-800 hover:border-amber-500/60 transition flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="text-[11px] font-bold text-amber-400 uppercase">📍 ${st.city} - MT</span>
                    <h4 class="text-lg font-black text-white">${st.name}</h4>
                  </div>
                  <span class="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold">
                    ${st.vehicles.length} ${st.vehicles.length === 1 ? "veículo" : "veículos"}
                  </span>
                </div>

                <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1 text-xs">
                  <div class="text-zinc-400">👤 Dono / Lojista: <strong class="text-white">${st.owner}</strong></div>
                  <div class="text-zinc-400">📱 WhatsApp Direto: <strong class="text-emerald-400 font-mono">${st.whatsapp}</strong></div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span class="text-[10px] text-zinc-400 block">Total Repasse Loja:</span>
                    <strong class="text-white">${App.formatBRL(st.totalRepasseValue)}</strong>
                  </div>
                  <div class="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span class="text-[10px] text-emerald-400 block">Comissão MT Car:</span>
                    <strong class="text-emerald-400">${App.formatBRL(st.totalCommission)}</strong>
                  </div>
                </div>

                <!-- Lista rápida dos veículos desta loja -->
                <div class="space-y-1.5">
                  <span class="text-[10px] font-bold uppercase text-zinc-400 block">Veículos desta Loja:</span>
                  ${st.vehicles.map((sv) => `
                    <div class="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                      <span class="truncate font-semibold text-white">${sv.ref} • ${sv.title}</span>
                      ${
                        sv.photoStatus === "pending_photos"
                          ? `<span class="px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 text-[10px] font-black shrink-0">📸 Sem Foto</span>`
                          : `<span class="text-emerald-400 font-bold shrink-0">${App.formatBRL(sv.priceSale)}</span>`
                      }
                    </div>
                  `).join("")}
                </div>
              </div>

              <div class="flex items-center gap-2 pt-2 border-t border-zinc-800">
                <a
                  href="https://wa.me/${App.cleanPhoneDigits(st.whatsapp)}?text=${encodeURIComponent(`Fala ${st.owner} (${st.name}), tudo certo? Aqui é da Diretoria da MT Car!`)}"
                  target="_blank"
                  class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs text-center transition"
                >
                  💬 Chamar Lojista no Whats
                </a>
                <button
                  onclick="document.getElementById('admin-stock-garage-filter').value='${st.name}'; MTCarsAdmin.switchAdminTab('stock');"
                  class="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs transition"
                >
                  Ver no Estoque
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  return {
    openLoginModal,
    closeLoginModal,
    quickLoginAs,
    submitManualLogin,
    switchActiveSeller,
    renderSellerHeader,
    switchAdminTab,
    renderActiveTab,
    renderRadarTab,
    claimVisitorLead,
    unlockVisitorLead,
    openWhatsAppForVisitor,
    renderStockTab,
    toggleReserveVehicle,
    markVehicleAsSold,
    openNewVehicleModal,
    closeNewVehicleModal,
    autoFetchFipeForModal,
    updateLiveMarginPreview,
    submitNewVehicleForm,
    renderBotTab,
    insertTemplateTag,
    saveBotConfiguration,
    saveFirebaseConfiguration,
    renderCrmTab,
    onKanbanDragStart,
    onKanbanDrop,
    moveLeadStage,
    openLeadDossierModal,
    closeLeadDossierModal,
    assignLeadSeller,
    saveLeadDossierNotes,
    renderSellersTab,
    openEditSellerModal,
    closeEditSellerModal,
    submitEditSellerForm,
    sendPlaybookScript,
    openProposalPdfModal,
    closeProposalPdfModal,
    openStockMatchModal,
    closeStockMatchModal,
    openDealCalculatorModal,
    closeDealCalculatorModal,
    recalcDealSimulator,
    cooperadoAddPhotosToVehicle,
    renderStoresTab
  };
})();

