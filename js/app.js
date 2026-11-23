/**
 * MT CARS - MOTOR PRINCIPAL DA APLICAÇÃO (VITRINE PÚBLICA, SIMULADOR DEDO-DURO,
 * ISCA INTELIGENTE DE LEADS, ROBÔ WHATSAPP RETARGETING E CONTROLE DEMO)
 */

window.MTCarsApp = (function () {
  const { STORAGE_KEYS } = window.MTCarsData;
  const LIVE_CLIENT_VISITOR_ID = "vis_live_client_main";

  const state = {
    viewMode: "public", // 'public' | 'admin'
    adminTab: "radar", // 'radar' | 'stock' | 'bot' | 'crm' | 'sellers'
    cities: [],
    detectedCity: "",
    vehicles: [],
    visitors: [],
    leads: [],
    sellers: [],
    botLogs: [],
    botConfig: {},
    stats: {},
    liveFeed: [], // Feed de telemetria em tempo real entre abas
    currentSeller: null,
    currentClient: null,
    sessionVisitorId: LIVE_CLIENT_VISITOR_ID,
    activeVehicleModalId: null,
    pendingVehicleAfterGate: null,
    gateTimerTriggered: false,
    filters: {
      search: "",
      city: "",
      category: "",
      priceRange: "",
      minYear: "",
      transmission: "",
      sortBy: "featured"
    },
    adminFilters: {
      stockCity: "",
      stockGarage: "",
      stockStatus: "",
      stockSearch: "",
      crmSeller: "",
      crmCity: "",
      crmSearch: ""
    },
    simulator: {
      downPayment: 50000,
      installments: 48,
      hasTradeIn: false,
      tradeInModel: "",
      tradeInValue: ""
    }
  };

  function formatBRL(val) {
    const n = Number(val) || 0;
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

  function formatBRLWithCents(val) {
    const n = Number(val) || 0;
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function maskPhone(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
    if (!digits.length) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function cleanPhoneDigits(phone) {
    const d = String(phone || "").replace(/\D/g, "");
    return d.startsWith("55") ? d : "55" + d;
  }

  function calculateInstallment(vehiclePrice, downPayment, months) {
    const financed = Math.max(0, Number(vehiclePrice) - Number(downPayment));
    if (financed <= 0) return 0;
    const n = Number(months) || 48;
    if (n <= 1) return financed;
    const rate = 0.0149;
    const factor = (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    return Math.round(financed * factor);
  }

  function loadStateFromStorage() {
    state.vehicles = window.MTCarsData.loadOrSeed(STORAGE_KEYS.VEHICLES, window.MTCarsData.INITIAL_VEHICLES);
    state.visitors = window.MTCarsData.loadOrSeed(STORAGE_KEYS.VISITORS, window.MTCarsData.INITIAL_VISITORS);
    state.leads = window.MTCarsData.loadOrSeed(STORAGE_KEYS.LEADS, window.MTCarsData.INITIAL_LEADS);
    state.sellers = window.MTCarsData.loadOrSeed(STORAGE_KEYS.SELLERS, window.MTCarsData.INITIAL_SELLERS);
    state.botLogs = window.MTCarsData.loadOrSeed(STORAGE_KEYS.BOT_LOGS, window.MTCarsData.INITIAL_BOT_LOGS);
    state.botConfig = window.MTCarsData.loadOrSeed(STORAGE_KEYS.BOT_CONFIG, window.MTCarsData.INITIAL_BOT_CONFIG);
    state.stats = window.MTCarsData.loadOrSeed(STORAGE_KEYS.STATS, window.MTCarsData.INITIAL_STATS);

    try {
      const savedFeed = localStorage.getItem("mtcars_live_feed_v1");
      if (savedFeed) state.liveFeed = JSON.parse(savedFeed);
    } catch (_) {}

    const savedClient = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_LEAD);
    if (savedClient) {
      try {
        state.currentClient = JSON.parse(savedClient);
      } catch (_) {}
    } else {
      state.currentClient = null;
    }

    const savedSeller = localStorage.getItem(STORAGE_KEYS.CURRENT_SELLER);
    if (savedSeller) {
      try {
        state.currentSeller = JSON.parse(savedSeller);
      } catch (_) {}
    }
    if (!state.currentSeller) {
      state.currentSeller = state.sellers[0];
      localStorage.setItem(STORAGE_KEYS.CURRENT_SELLER, JSON.stringify(state.currentSeller));
    }
  }

  function persistAll() {
    window.MTCarsData.save(STORAGE_KEYS.VEHICLES, state.vehicles);
    window.MTCarsData.save(STORAGE_KEYS.VISITORS, state.visitors);
    window.MTCarsData.save(STORAGE_KEYS.LEADS, state.leads);
    window.MTCarsData.save(STORAGE_KEYS.SELLERS, state.sellers);
    window.MTCarsData.save(STORAGE_KEYS.BOT_LOGS, state.botLogs);
    window.MTCarsData.save(STORAGE_KEYS.BOT_CONFIG, state.botConfig);
    window.MTCarsData.save(STORAGE_KEYS.STATS, state.stats);
    try {
      localStorage.setItem("mtcars_live_feed_v1", JSON.stringify(state.liveFeed.slice(0, 12)));
    } catch (_) {}
  }

  // Garante que o Visitante Real da Sua Aba de Vitrine esteja SEMPRE em 1º lugar no Radar ao Vivo
  function ensureLiveSessionVisitor() {
    state.sessionVisitorId = LIVE_CLIENT_VISITOR_ID;

    // Remove duplicatas antigas de vis_live_ se existirem
    state.visitors = state.visitors.filter(
      (v) => v.id === LIVE_CLIENT_VISITOR_ID || !String(v.id).startsWith("vis_live_")
    );

    let existingIdx = state.visitors.findIndex((v) => v.id === LIVE_CLIENT_VISITOR_ID);
    if (existingIdx === -1) {
      const liveVisitor = {
        id: LIVE_CLIENT_VISITOR_ID,
        isLiveSessionTab: true,
        name: state.currentClient ? state.currentClient.name : "🖥️ SUA ABA DE VITRINE (Cliente ao Vivo #409)",
        whatsapp: state.currentClient ? state.currentClient.whatsapp : "Aguardando Isca Inteligente",
        city: state.currentClient ? state.currentClient.city : (state.detectedCity || "Cuiabá"),
        isIdentified: Boolean(state.currentClient),
        online: true,
        lastSeenAt: Date.now(),
        lastUpdateStr: new Date().toLocaleTimeString("pt-BR"),
        enteredAt: Date.now(),
        currentVehicleId: "veh_101",
        currentAction: "🟢 Navegando ao vivo na Vitrine Estadual MT Cars",
        history: [
          { vehicleId: "veh_101", title: "Toyota Hilux SRX 2.8 (2023)", time: "agora" }
        ],
        simulation: {
          downPayment: 75000,
          installments: 48,
          installmentValue: calculateInstallment(259900, 75000, 48),
          hasTradeIn: false,
          tradeInModel: "",
          tradeInValue: 0
        },
        lockedBySellerId: null,
        lockedBySellerName: null,
        lockedAt: null,
        botTriggered: false
      };
      state.visitors.unshift(liveVisitor);
      persistAll();
    } else {
      const vis = state.visitors[existingIdx];
      vis.isLiveSessionTab = true;
      vis.online = true;
      if (state.currentClient) {
        vis.name = `${state.currentClient.name} (Sua Aba Ao Vivo)`;
        vis.whatsapp = state.currentClient.whatsapp;
        vis.city = state.currentClient.city;
        vis.isIdentified = true;
      }
      // Garante que fique no topo (1º card do Radar)
      if (existingIdx > 0) {
        state.visitors.splice(existingIdx, 1);
        state.visitors.unshift(vis);
      }
      persistAll();
    }
  }

  // Registra e transmite CADA ação da Aba Vitrine em tempo real para a Aba dos Vendedores!
  function trackVisitorAction(actionText, vehicleObj = null, simulationObj = null) {
    loadStateFromStorage();
    ensureLiveSessionVisitor();

    const visIdx = state.visitors.findIndex((v) => v.id === LIVE_CLIENT_VISITOR_ID);
    if (visIdx === -1) return;
    const vis = state.visitors[visIdx];

    const timeStr = new Date().toLocaleTimeString("pt-BR");
    vis.online = true;
    vis.lastSeenAt = Date.now();
    vis.lastUpdateStr = timeStr;
    vis.currentAction = actionText;

    if (vehicleObj) {
      vis.currentVehicleId = vehicleObj.id;
      if (!Array.isArray(vis.history)) vis.history = [];
      const lastHist = vis.history[vis.history.length - 1];
      if (!lastHist || lastHist.vehicleId !== vehicleObj.id) {
        vis.history.push({
          vehicleId: vehicleObj.id,
          title: `${vehicleObj.brand} ${vehicleObj.model.split(" ").slice(0, 2).join(" ")} (${vehicleObj.year})`,
          time: timeStr
        });
        if (vis.history.length > 6) vis.history.shift();
      }
    }

    if (simulationObj) {
      vis.simulation = { ...simulationObj };
      const crmLead = state.leads.find((l) => l.visitorId === vis.id);
      if (crmLead) {
        crmLead.downPayment = simulationObj.downPayment;
        crmLead.installments = simulationObj.installments;
        if (vehicleObj) {
          crmLead.vehicleId = vehicleObj.id;
          crmLead.vehicleTitle = vehicleObj.title;
          crmLead.vehiclePrice = vehicleObj.priceSale;
        }
        crmLead.tradeIn = simulationObj.hasTradeIn && simulationObj.tradeInModel
          ? `${simulationObj.tradeInModel} (${formatBRL(simulationObj.tradeInValue || 0)})`
          : "Sem veículo na troca";
      }
    } else if (vehicleObj && vis.simulation) {
      // Recalcula parcela estimada se trocou de veículo
      vis.simulation.installmentValue = calculateInstallment(
        vehicleObj.priceSale,
        vis.simulation.downPayment || Math.round(vehicleObj.priceSale * 0.3),
        vis.simulation.installments || 48
      );
    }

    // Coloca o visitante no topo #1 do Radar ao Vivo
    if (visIdx > 0) {
      state.visitors.splice(visIdx, 1);
      state.visitors.unshift(vis);
    }

    // Adiciona ao Feed de Telemetria ao Vivo
    state.liveFeed.unshift({
      id: "feed_" + Date.now(),
      time: timeStr,
      visitorName: vis.name,
      text: actionText
    });
    state.liveFeed = state.liveFeed.slice(0, 10);

    persistAll();

    // Emite via Quad-Sync (BroadcastChannel + LocalStorage + Node SSE + Firebase)
    window.MTCarsRealtime.emit("VISITOR_UPDATED", {
      visitorId: vis.id,
      actionText,
      timeStr,
      vehicleId: vehicleObj ? vehicleObj.id : vis.currentVehicleId
    });

    updateDemoBarBadges();
    if (state.viewMode === "admin" && window.MTCarsAdmin) {
      window.MTCarsAdmin.renderActiveTab(vis.id);
    }
  }

  async function initCitiesAndSelectors() {
    state.cities = await window.MTCarsData.fetchMTCities();
    populateCityDropdowns();
  }

  function populateCityDropdowns() {
    const selectors = [
      { id: "header-city-select", emptyLabel: "📍 Todo o Mato Grosso (142 Cidades)" },
      { id: "filter-city-select", emptyLabel: "Todas as Cidades do MT (IBGE)" },
      { id: "gate-city-select", emptyLabel: "Selecione sua cidade em MT..." },
      { id: "sell-car-city", emptyLabel: "Selecione a cidade do veículo..." },
      { id: "admin-stock-city-filter", emptyLabel: "Todas as Cidades MT" },
      { id: "admin-crm-city-filter", emptyLabel: "Todas as Cidades MT" },
      { id: "new-veh-city", emptyLabel: "Selecione a cidade em MT..." },
      { id: "edit-seller-city", emptyLabel: "Cidade Base em MT..." }
    ];

    selectors.forEach(({ id, emptyLabel }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const currentVal = el.value;
      const optionsHtml = [
        `<option value="">${emptyLabel}</option>`,
        ...state.cities.map((c) => `<option value="${c}">${c} - MT</option>`)
      ].join("");
      el.innerHTML = optionsHtml;
      if (currentVal && state.cities.includes(currentVal)) {
        el.value = currentVal;
      }
    });
  }

  function detectUserLocation() {
    const hubCities = ["Cuiabá", "Sinop", "Rondonópolis", "Sorriso", "Primavera do Leste", "Campo Verde", "Lucas do Rio Verde", "Tangará da Serra", "Nova Mutum", "Várzea Grande"];
    const btn = document.getElementById("btn-detect-location");
    if (btn) {
      btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-amber-400"></i> <span>Localizando GPS em MT...</span>`;
      if (window.lucide) window.lucide.createIcons();
    }

    setTimeout(() => {
      const currentIdx = hubCities.indexOf(state.detectedCity);
      const pickedCity = state.currentClient?.city || hubCities[(currentIdx + 1) % hubCities.length];
      state.detectedCity = pickedCity;
      state.filters.sortBy = "regional_priority";

      const headerSelect = document.getElementById("header-city-select");
      if (headerSelect) headerSelect.value = pickedCity;

      if (btn) {
        btn.innerHTML = `<i data-lucide="locate-fixed" class="w-4 h-4 text-emerald-400"></i> <span>Priorizando: ${pickedCity} - MT</span>`;
      }

      showToast(`📍 Localização regional definida: ${pickedCity} - MT. Veículos da sua região aparecem primeiro!`, "emerald");
      trackVisitorAction(`📍 Ativou GPS regional em ${pickedCity} - MT`);
      renderPublicVitrine();
    }, 350);
  }

  function renderPublicVitrine() {
    const grid = document.getElementById("public-vehicles-grid");
    const countBadge = document.getElementById("public-results-count");
    const auditedHeaderCount = document.getElementById("header-audited-count");

    const availableVehicles = state.vehicles.filter((v) => v.status !== "Vendido" && v.photoStatus !== "pending_photos");
    if (auditedHeaderCount) {
      auditedHeaderCount.textContent = `${availableVehicles.length} Veículos & Motos em MT`;
    }

    if (!grid) return;

    let filtered = availableVehicles.filter((v) => {
      const q = state.filters.search.trim().toLowerCase();
      if (q) {
        const hay = `${v.brand} ${v.model} ${v.title} ${v.city} ${v.ref} ${v.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (state.filters.city && v.city !== state.filters.city) return false;
      if (state.filters.category && v.category !== state.filters.category) return false;
      if (state.filters.transmission && v.transmission !== state.filters.transmission) return false;
      if (state.filters.minYear && Number(v.year) < Number(state.filters.minYear)) return false;

      if (state.filters.priceRange) {
        const p = Number(v.priceSale);
        if (state.filters.priceRange === "up_to_50" && p > 50000) return false;
        if (state.filters.priceRange === "50_to_100" && (p < 50000 || p > 100000)) return false;
        if (state.filters.priceRange === "100_to_180" && (p < 100000 || p > 180000)) return false;
        if (state.filters.priceRange === "above_180" && p <= 180000) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (state.detectedCity) {
        const aMatch = a.city === state.detectedCity ? 1 : 0;
        const bMatch = b.city === state.detectedCity ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
      }
      if (state.filters.sortBy === "price_asc") return a.priceSale - b.priceSale;
      if (state.filters.sortBy === "price_desc") return b.priceSale - a.priceSale;
      if (state.filters.sortBy === "fipe_discount") {
        return (b.priceFipe - b.priceSale) - (a.priceFipe - a.priceSale);
      }
      if (state.filters.sortBy === "year_desc") return b.year - a.year;
      return 0;
    });

    if (countBadge) {
      countBadge.innerHTML = `<span class="text-white font-bold">${filtered.length}</span> ${filtered.length === 1 ? "oferta encontrada" : "ofertas encontradas"}${state.detectedCity ? ` • Priorizando região de <span class="text-amber-400 font-semibold">${state.detectedCity}-MT</span>` : ""}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full glass-panel rounded-2xl p-12 text-center border border-zinc-800">
          <div class="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto mb-4 text-amber-400">
            <i data-lucide="search-x" class="w-8 h-8"></i>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">Nenhum veículo encontrado com estes filtros</h3>
          <p class="text-zinc-400 text-sm max-w-md mx-auto mb-6">Nossa central possui dezenas de garagens parceiras em todo o Mato Grosso. Limpe os filtros para ver todo o estoque estadual.</p>
          <button onclick="MTCarsApp.clearPublicFilters()" class="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition">
            Limpar Filtros e Ver Todo o Estoque MT
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    grid.innerHTML = filtered.map((v, idx) => {
      const fipeDiff = Number(v.priceFipe) - Number(v.priceSale);
      const estDown = Math.round(v.priceSale * 0.3);
      const estInstallment = calculateInstallment(v.priceSale, estDown, 48);
      const isRegionalMatch = state.detectedCity && v.city === state.detectedCity;
      const isCompared = Array.isArray(state.compareList) && state.compareList.includes(v.id);

      return `
        <article
          onmouseenter="MTCarsApp.onCardHover('${v.id}')"
          style="animation-delay: ${Math.min(idx * 45, 280)}ms"
          class="group glass-panel vehicle-card-clean animate-fade-up rounded-2xl overflow-hidden border ${
            isRegionalMatch
              ? "border-emerald-500/60"
              : "border-zinc-800/90 hover:border-zinc-600"
          } flex flex-col justify-between"
        >
          <div>
            <!-- Foto Limpa e Direta com Moldura de Alto Contraste p/ Carros Brancos -->
            <div class="relative h-52 overflow-hidden vehicle-photo-frame">
              <img
                src="${v.image}"
                alt="${v.title}"
                loading="lazy"
                onclick="MTCarsApp.openVehicleDetail('${v.id}')"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25 pointer-events-none"></div>

              <!-- Topo Esquerdo: Cidade MT bem discreta e pequena para Cooperados saberem onde está -->
              <div class="absolute top-2.5 left-2.5 flex items-center gap-1">
                <span class="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-medium text-white keep-white-text flex items-center gap-1">
                  📍 ${v.city}-${v.uf}
                </span>
                ${isRegionalMatch ? `<span class="px-1.5 py-0.5 rounded bg-emerald-500 text-zinc-950 text-[9px] font-extrabold">Sua Região</span>` : ""}
              </div>

              <!-- Topo Direito: Botão Prático Comparar -->
              <button
                type="button"
                onclick="MTCarsApp.toggleCompareVehicle('${v.id}')"
                title="Adicionar ao Comparador"
                class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md transition ${
                  isCompared
                    ? "bg-amber-500 text-zinc-950 shadow"
                    : "bg-black/70 text-zinc-200 hover:bg-black/90 keep-white-text"
                }"
              >
                ${isCompared ? "✔ Comparando" : "⚖️ Comparar"}
              </button>

              <!-- Base da Foto: Único Selo de Economia FIPE -->
              <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                ${
                  fipeDiff > 0
                    ? `<span class="px-2.5 py-0.5 rounded-md bg-emerald-500 text-zinc-950 text-[11px] font-extrabold shadow">
                        -${formatBRL(fipeDiff)} da FIPE
                       </span>`
                    : `<span class="px-2.5 py-0.5 rounded-md bg-zinc-900/90 text-zinc-200 text-[11px] font-semibold keep-white-text">${v.highlightTag || "Vistoriado"}</span>`
                }
                <span class="text-[11px] font-mono text-zinc-200 bg-black/60 px-2 py-0.5 rounded keep-white-text">${v.ref}</span>
              </div>
            </div>

            <!-- Corpo Prático e Limpo -->
            <div class="p-4">
              <div class="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span class="font-semibold text-red-500 uppercase tracking-wide">${v.category}</span>
                <span class="text-emerald-400 font-medium">✔ Laudo Aprovado</span>
              </div>

              <h3
                onclick="MTCarsApp.openVehicleDetail('${v.id}')"
                class="text-base font-extrabold text-white group-hover:text-red-500 transition line-clamp-1 cursor-pointer mb-2"
              >
                ${v.title}
              </h3>

              <!-- Linha Única de Especificações (Prática e Sem Poluição) -->
              <div class="flex items-center gap-2 text-xs text-zinc-400 pb-3 mb-3 border-b border-zinc-800/80">
                <span class="font-semibold text-zinc-200">${v.year}</span>
                <span>•</span>
                <span>${Number(v.km).toLocaleString("pt-BR")} km</span>
                <span>•</span>
                <span>${v.transmission}</span>
                <span>•</span>
                <span>${v.fuel}</span>
              </div>

              <!-- Preço Claro + Parcela -->
              <div class="flex items-baseline justify-between">
                <div>
                  <span class="text-[10px] uppercase tracking-wider text-zinc-400 block">Valor à Vista</span>
                  <span class="text-xl font-black text-white">${formatBRL(v.priceSale)}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-zinc-400 block">FIPE: <del>${formatBRL(v.priceFipe)}</del></span>
                  <span class="text-xs font-bold text-emerald-400">48x ${formatBRL(estInstallment)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Botão Prático -->
          <div class="px-4 pb-4">
            <button
              onclick="MTCarsApp.openVehicleDetail('${v.id}')"
              class="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white keep-white-text font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <span>Simular Parcelas e Ver Ficha</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>
        </article>
      `;
    }).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  let lastHoveredVehicleId = null;
  function onCardHover(vehicleId) {
    if (lastHoveredVehicleId === vehicleId) return;
    lastHoveredVehicleId = vehicleId;
    const v = state.vehicles.find((item) => item.id === vehicleId);
    if (!v) return;
    trackVisitorAction(`🖱️ Passou o mouse no card: ${v.title} (${v.city}-MT) — ${formatBRL(v.priceSale)}`, v);
  }

  function openVehicleDetail(vehicleId) {
    const v = state.vehicles.find((item) => item.id === vehicleId);
    if (!v) return;

    if (!state.currentClient) {
      state.pendingVehicleAfterGate = vehicleId;
      trackVisitorAction(`🔒 Clicou para abrir ${v.title} (Preenchendo Isca Inteligente de WhatsApp)`, v);
      openLeadGateModal(`Desbloqueie as fotos, laudo e o Simulador Oficial do ${v.title}`);
      return;
    }

    showVehicleDetailModal(v);
  }

  function showVehicleDetailModal(v) {
    state.activeVehicleModalId = v.id;
    const defaultDown = Math.round((v.priceSale * 0.3) / 1000) * 1000;
    state.simulator = {
      downPayment: defaultDown,
      installments: 48,
      hasTradeIn: false,
      tradeInModel: "",
      tradeInValue: ""
    };

    const modal = document.getElementById("vehicle-detail-modal");
    if (!modal) return;

    const fipeDiff = Number(v.priceFipe) - Number(v.priceSale);
    const installmentVal = calculateInstallment(v.priceSale, state.simulator.downPayment, state.simulator.installments);

    trackVisitorAction(
      `🚘 Abriu Ficha & Simulador: ${v.title} (${v.year}) - ${formatBRL(v.priceSale)}`,
      v,
      {
        downPayment: state.simulator.downPayment,
        installments: state.simulator.installments,
        installmentValue: installmentVal,
        hasTradeIn: false,
        tradeInModel: "",
        tradeInValue: 0
      }
    );

    const content = document.getElementById("vehicle-detail-content");
    const galleryImgs = Array.isArray(v.gallery) && v.gallery.length ? v.gallery : [v.image];

    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 space-y-5">
          <div class="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 h-72 sm:h-96">
            <img id="detail-main-photo" src="${galleryImgs[0]}" alt="${v.title}" class="w-full h-full object-cover" />
            <div class="absolute top-3 left-3 flex flex-wrap gap-2">
              <span class="px-3 py-1.5 rounded-xl bg-zinc-950/90 border border-zinc-700 text-xs font-bold text-white">
                📍 ${v.city} - ${v.uf}
              </span>
              <span class="px-3 py-1.5 rounded-xl bg-emerald-500/90 text-zinc-950 text-xs font-extrabold">
                ✔ Veículo Verificado MT Cars • Ref: ${v.ref}
              </span>
            </div>
            ${
              fipeDiff > 0
                ? `<div class="absolute bottom-3 left-3">
                     <span class="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 text-xs font-extrabold shadow-lg">
                       🔥 Oportunidade: ${formatBRL(fipeDiff)} Abaixo da Tabela FIPE
                     </span>
                   </div>`
                : ""
            }
          </div>

          ${
            galleryImgs.length > 1
              ? `<div class="flex gap-3 overflow-x-auto pb-1">
                  ${galleryImgs
                    .map(
                      (imgUrl, idx) => `
                    <button onclick="document.getElementById('detail-main-photo').src='${imgUrl}'" class="w-24 h-16 rounded-xl overflow-hidden border-2 border-zinc-700 hover:border-red-500 shrink-0 transition">
                      <img src="${imgUrl}" class="w-full h-full object-cover" alt="Ângulo ${idx + 1}" />
                    </button>
                  `
                    )
                    .join("")}
                </div>`
              : ""
          }

          <div class="glass-panel rounded-2xl p-5 border border-zinc-800">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-red-500">${v.category} • INTERMEDIAÇÃO GARANTIDA MT CARS</span>
                <h2 class="text-2xl font-extrabold text-white">${v.title}</h2>
              </div>
              <div class="text-right">
                <span class="text-xs text-zinc-400 block">Valor à Vista</span>
                <span class="text-2xl font-black text-emerald-400">${formatBRL(v.priceSale)}</span>
              </div>
            </div>

            <p class="text-sm text-zinc-300 leading-relaxed mb-5">${v.description}</p>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span class="text-[11px] text-zinc-500 block">Ano / Modelo</span>
                <span class="text-sm font-bold text-white">${v.year}</span>
              </div>
              <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span class="text-[11px] text-zinc-500 block">Quilometragem</span>
                <span class="text-sm font-bold text-white">${Number(v.km).toLocaleString("pt-BR")} km</span>
              </div>
              <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span class="text-[11px] text-zinc-500 block">Câmbio / Combustível</span>
                <span class="text-sm font-bold text-white">${v.transmission} • ${v.fuel}</span>
              </div>
              <div class="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <span class="text-[11px] text-zinc-500 block">Cor / Situação</span>
                <span class="text-sm font-bold text-white">${v.color || "Original"}</span>
              </div>
            </div>

            <h4 class="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">Itens de Série, Opcionais & Laudo</h4>
            <div class="flex flex-wrap gap-2">
              ${(v.options || [])
                .map(
                  (opt) => `
                <span class="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span> ${opt}
                </span>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="glass-panel rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <i data-lucide="award" class="w-4 h-4"></i> Comparativo Oficial Tabela FIPE (${v.fipeCode || "Mato Grosso"})
              </span>
              <span class="text-xs font-semibold text-emerald-400">Economia imediata de ${formatBRL(Math.max(0, fipeDiff))}</span>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-3">
              <div class="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
                <span class="text-xs text-zinc-400 block">Preço Médio FIPE no MT</span>
                <span class="text-lg font-bold text-zinc-300">${formatBRL(v.priceFipe)}</span>
              </div>
              <div class="p-3 rounded-xl bg-zinc-950/80 border border-emerald-500/40">
                <span class="text-xs text-emerald-400 block">Preço Exclusivo MT Cars</span>
                <span class="text-lg font-extrabold text-white">${formatBRL(v.priceSale)}</span>
              </div>
            </div>
            <p class="text-[11px] text-zinc-400 mt-3">
              🔒 <strong>Blindagem de Negócio MT Cars:</strong> Veículo vistoriado presencialmente em <strong>${v.city} - MT</strong>. Pagamento seguro diretamente na transferência com intermediação jurídica completa.
            </p>
          </div>
        </div>

        <div class="lg:col-span-5">
          <div class="glass-panel rounded-2xl p-6 border-2 border-red-600/50 sticky top-4 space-y-5 shadow-2xl">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold inline-flex items-center gap-1 mb-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Conectado à Central MT Cars
                </span>
                <h3 class="text-xl font-extrabold text-white">Simulador Oficial de Financiamento</h3>
                <p class="text-xs text-zinc-400">Ajuste a entrada ou adicione seu usado na troca</p>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <label class="text-xs font-bold uppercase tracking-wider text-zinc-300">💰 Valor de Entrada Disponível (R$)</label>
                <span id="sim-down-badge" class="text-base font-extrabold text-amber-400">${formatBRL(state.simulator.downPayment)}</span>
              </div>
              <input
                id="sim-down-slider"
                type="range"
                min="0"
                max="${Math.round(v.priceSale * 0.9)}"
                step="1000"
                value="${state.simulator.downPayment}"
                oninput="MTCarsApp.onSimulatorChange('slider', this.value)"
                class="mtcars-slider"
              />
              <div class="flex items-center gap-2 pt-1">
                <span class="text-xs text-zinc-400">Digitar valor exato: R$</span>
                <input
                  id="sim-down-input"
                  type="number"
                  step="1000"
                  min="0"
                  max="${v.priceSale}"
                  value="${state.simulator.downPayment}"
                  oninput="MTCarsApp.onSimulatorChange('input', this.value)"
                  class="flex-1 bg-zinc-950 border border-zinc-700 focus:border-red-500 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-zinc-300 block">📅 Prazo de Pagamento</label>
              <div class="grid grid-cols-5 gap-2" id="sim-months-buttons">
                ${[12, 24, 36, 48, 60]
                  .map(
                    (m) => `
                  <button
                    type="button"
                    onclick="MTCarsApp.onSimulatorChange('months', ${m})"
                    data-months="${m}"
                    class="sim-month-btn py-2.5 rounded-xl font-bold text-xs border transition ${
                      m === state.simulator.installments
                        ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                    }"
                  >
                    ${m}x
                  </button>
                `
                  )
                  .join("")}
              </div>
            </div>

            <div class="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-3">
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <input
                  id="sim-tradein-check"
                  type="checkbox"
                  onchange="MTCarsApp.onSimulatorChange('tradeInToggle', this.checked)"
                  class="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
                <span class="text-sm font-bold text-white flex items-center gap-1.5">
                  🔄 Quero dar meu veículo usado na troca
                </span>
              </label>

              <div id="sim-tradein-fields" class="hidden space-y-3 pt-2 border-t border-zinc-800/80">
                <div>
                  <label class="text-[11px] text-zinc-400 block mb-1">Qual seu carro atual? (Marca / Modelo / Ano)</label>
                  <input
                    id="sim-tradein-model"
                    type="text"
                    placeholder="Ex: Gol G7 2019 ou Onix LTZ 2020"
                    oninput="MTCarsApp.onSimulatorChange('tradeInModel', this.value)"
                    class="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label class="text-[11px] text-zinc-400 block mb-1">Valor pretendido no seu usado (R$)</label>
                  <input
                    id="sim-tradein-value"
                    type="number"
                    step="1000"
                    placeholder="Ex: 55000"
                    oninput="MTCarsApp.onSimulatorChange('tradeInValue', this.value)"
                    class="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-emerald-500/40 space-y-2">
              <div class="flex items-center justify-between text-xs text-zinc-400">
                <span>Saldo a Financiar Estimado:</span>
                <span id="sim-financed-amount" class="font-bold text-zinc-200">${formatBRL(Math.max(0, v.priceSale - state.simulator.downPayment))}</span>
              </div>
              <div class="flex items-baseline justify-between pt-1">
                <span id="sim-result-months-label" class="text-sm font-bold text-zinc-300">${state.simulator.installments}x fixas de:</span>
                <span id="sim-result-installment" class="text-3xl font-black text-emerald-400">${formatBRL(installmentVal)}</span>
              </div>
              <p class="text-[11px] text-zinc-500">
                *Taxa referencial de 1,49% a.m. sujeita à aprovação de CPF/CNPJ (Safra, Santander, BV, Itaú, Sicredi MT).
              </p>
            </div>

            <div class="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
              <i data-lucide="radio" class="w-4 h-4 shrink-0 text-amber-400"></i>
              <span><strong>Radar Ativo:</strong> Sua simulação já está visível em tempo real na Central dos Consultores MT Cars.</span>
            </div>

            <button
              onclick="MTCarsApp.requestSpecialistFromSimulator('${v.id}')"
              class="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              <i data-lucide="message-circle" class="w-5 h-5"></i>
              <span>Aprovar Esta Simulação no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    if (window.lucide) window.lucide.createIcons();
  }

  function closeVehicleDetailModal() {
    const modal = document.getElementById("vehicle-detail-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
    state.activeVehicleModalId = null;
  }

  function onSimulatorChange(field, value) {
    const v = state.vehicles.find((item) => item.id === state.activeVehicleModalId);
    if (!v) return;

    if (field === "slider" || field === "input") {
      const numeric = Math.max(0, Math.min(v.priceSale, Number(value) || 0));
      state.simulator.downPayment = numeric;
      const slider = document.getElementById("sim-down-slider");
      const input = document.getElementById("sim-down-input");
      const badge = document.getElementById("sim-down-badge");
      if (field === "slider" && input) input.value = numeric;
      if (field === "input" && slider) slider.value = numeric;
      if (badge) badge.textContent = formatBRL(numeric);
    } else if (field === "months") {
      state.simulator.installments = Number(value);
      document.querySelectorAll(".sim-month-btn").forEach((btn) => {
        const m = Number(btn.getAttribute("data-months"));
        if (m === state.simulator.installments) {
          btn.className = "sim-month-btn py-2.5 rounded-xl font-bold text-xs border transition bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/30";
        } else {
          btn.className = "sim-month-btn py-2.5 rounded-xl font-bold text-xs border transition bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600";
        }
      });
    } else if (field === "tradeInToggle") {
      state.simulator.hasTradeIn = Boolean(value);
      const box = document.getElementById("sim-tradein-fields");
      if (box) {
        box.classList.toggle("hidden", !state.simulator.hasTradeIn);
      }
    } else if (field === "tradeInModel") {
      state.simulator.tradeInModel = value;
    } else if (field === "tradeInValue") {
      state.simulator.tradeInValue = Number(value) || 0;
    }

    const tradeCredit = state.simulator.hasTradeIn ? Number(state.simulator.tradeInValue) || 0 : 0;
    const totalEntry = Number(state.simulator.downPayment) + tradeCredit;
    const financed = Math.max(0, v.priceSale - totalEntry);
    const installmentVal = calculateInstallment(v.priceSale, totalEntry, state.simulator.installments);

    const finEl = document.getElementById("sim-financed-amount");
    const monthsLbl = document.getElementById("sim-result-months-label");
    const instEl = document.getElementById("sim-result-installment");

    if (finEl) finEl.textContent = formatBRL(financed);
    if (monthsLbl) monthsLbl.textContent = `${state.simulator.installments}x fixas de:`;
    if (instEl) instEl.textContent = formatBRL(installmentVal);

    const simPayload = {
      downPayment: state.simulator.downPayment,
      installments: state.simulator.installments,
      installmentValue: installmentVal,
      hasTradeIn: state.simulator.hasTradeIn,
      tradeInModel: state.simulator.tradeInModel,
      tradeInValue: state.simulator.tradeInValue
    };

    const tradeText = state.simulator.hasTradeIn && state.simulator.tradeInModel
      ? ` + Troca: ${state.simulator.tradeInModel} (${formatBRL(state.simulator.tradeInValue || 0)})`
      : "";

    trackVisitorAction(
      `💰 Mexendo no Simulador (${v.title}): Entrada ${formatBRL(state.simulator.downPayment)} • ${state.simulator.installments}x de ${formatBRL(installmentVal)}${tradeText}`,
      v,
      simPayload
    );
  }

  function requestSpecialistFromSimulator(vehicleId) {
    const v = state.vehicles.find((item) => item.id === vehicleId);
    if (!v) return;
    const clientName = state.currentClient ? state.currentClient.name : "Cliente MT Cars";
    const tradeInfo = state.simulator.hasTradeIn && state.simulator.tradeInModel
      ? ` e meu usado na troca (${state.simulator.tradeInModel} - ${formatBRL(state.simulator.tradeInValue)})`
      : "";
    const msg = `Olá Central MT Cars! Sou *${clientName}* (${state.currentClient?.city || "MT"}). Acabei de simular no site o veículo *${v.title} (${v.ref})* de ${formatBRL(v.priceSale)} com entrada de *${formatBRL(state.simulator.downPayment)}*${tradeInfo} em *${state.simulator.installments}x*. Quero avançar na negociação!`;
    showToast("✅ Simulação registrada! Nossos consultores já receberam seu cálculo ao vivo.", "emerald");
    window.open(`https://wa.me/5565999110101?text=${encodeURIComponent(msg)}`, "_blank");
  }

  // =========================================================================
  // "ISCA INTELIGENTE" (MODAL GATE DE CAPTURA DE LEAD - 12 SEGUNDOS OU CLIQUE)
  // =========================================================================
  function initSmartLeadGateTimer() {
    setTimeout(() => {
      if (!state.currentClient && state.viewMode === "public" && !state.gateTimerTriggered) {
        state.gateTimerTriggered = true;
        openLeadGateModal("Desbloqueie as Melhores Ofertas e o Simulador Oficial MT Cars");
      }
    }, 12000);
  }

  function openLeadGateModal(customTitle) {
    const modal = document.getElementById("lead-gate-modal");
    const titleEl = document.getElementById("lead-gate-title");
    if (titleEl && customTitle) titleEl.textContent = customTitle;
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }
  }

  function closeLeadGateModal() {
    const modal = document.getElementById("lead-gate-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  // Transmite ao vivo mesmo enquanto o cliente está digitando no Gate!
  function onGateLiveTyping() {
    const name = document.getElementById("gate-name-input")?.value || "";
    const phone = document.getElementById("gate-phone-input")?.value || "";
    const city = document.getElementById("gate-city-select")?.value || "Cuiabá";
    if (name.length > 1 || phone.length > 3) {
      trackVisitorAction(`⌨️ Digitando na Isca Inteligente: "${name}" • ${phone || "..."} (${city}-MT)`);
    }
  }

  function submitLeadGateForm(event) {
    if (event) event.preventDefault();
    const nameInput = document.getElementById("gate-name-input");
    const phoneInput = document.getElementById("gate-phone-input");
    const citySelect = document.getElementById("gate-city-select");

    const name = (nameInput?.value || "").trim();
    const whatsapp = (phoneInput?.value || "").trim();
    const city = (citySelect?.value || "").trim() || "Cuiabá";

    if (name.length < 2 || whatsapp.replace(/\D/g, "").length < 10) {
      showToast("⚠️ Informe seu Nome e seu WhatsApp com DDD (65 ou 66) para continuar.", "amber");
      return;
    }

    const clientData = {
      name,
      whatsapp,
      city,
      capturedAt: Date.now()
    };

    state.currentClient = clientData;
    state.detectedCity = city;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_LEAD, JSON.stringify(clientData));

    loadStateFromStorage();
    ensureLiveSessionVisitor();
    const vis = state.visitors.find((v) => v.id === LIVE_CLIENT_VISITOR_ID);
    const currentVeh = state.vehicles.find((v) => v.id === (state.pendingVehicleAfterGate || vis?.currentVehicleId || "veh_101")) || state.vehicles[0];

    if (vis) {
      vis.name = `${name} (Sua Aba Ao Vivo)`;
      vis.whatsapp = whatsapp;
      vis.city = city;
      vis.isIdentified = true;
      vis.online = true;
      vis.lastSeenAt = Date.now();
      vis.lastUpdateStr = new Date().toLocaleTimeString("pt-BR");
      vis.currentVehicleId = currentVeh.id;
      vis.currentAction = `🎯 Acabou de desbloquear a Isca Inteligente com WhatsApp (${city} - MT)`;
    }

    let crmLead = state.leads.find((l) => l.visitorId === LIVE_CLIENT_VISITOR_ID || l.whatsapp === whatsapp);
    if (!crmLead) {
      crmLead = {
        id: "lead_" + Date.now(),
        visitorId: LIVE_CLIENT_VISITOR_ID,
        name,
        whatsapp,
        city,
        stage: "visiting",
        vehicleId: currentVeh.id,
        vehicleTitle: currentVeh.title,
        vehiclePrice: currentVeh.priceSale,
        downPayment: Math.round(currentVeh.priceSale * 0.3),
        installments: 48,
        tradeIn: "Ainda não informado",
        sellerId: null,
        sellerName: "Aguardando Vendedor",
        createdAt: "Agora mesmo",
        notes: `Lead capturado na Isca Inteligente navegando de ${city} - MT.`
      };
      state.leads.unshift(crmLead);
      state.stats.leadsCapturedToday = (Number(state.stats.leadsCapturedToday) || 34) + 1;
    }

    state.liveFeed.unshift({
      id: "feed_" + Date.now(),
      time: new Date().toLocaleTimeString("pt-BR"),
      visitorName: name,
      text: `🎯 Liberou WhatsApp na Isca Inteligente: ${whatsapp} (${city}-MT)`
    });

    persistAll();
    window.MTCarsRealtime.playSound("lead_captured");
    window.MTCarsRealtime.emit("LEAD_CAPTURED", { visitorId: LIVE_CLIENT_VISITOR_ID, clientData });

    closeLeadGateModal();
    updateClientHeaderStatus();
    renderPublicVitrine();
    updateDemoBarBadges();

    showToast(`🎉 Bem-vindo(a), ${name}! Simulador Oficial e ofertas de ${city}-MT liberados.`, "emerald");

    if (state.pendingVehicleAfterGate) {
      const targetId = state.pendingVehicleAfterGate;
      state.pendingVehicleAfterGate = null;
      const targetVeh = state.vehicles.find((v) => v.id === targetId);
      if (targetVeh) showVehicleDetailModal(targetVeh);
    }
  }

  function updateClientHeaderStatus() {
    const badge = document.getElementById("header-client-badge");
    if (!badge) return;
    if (state.currentClient) {
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span class="truncate max-w-[140px]">${state.currentClient.name} (${state.currentClient.city})</span>
      `;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }

  // =========================================================================
  // MOTOR DO ROBÔ DE RETARGETING WHATSAPP (DISPARO AUTOMÁTICO NA SAÍDA DO SITE)
  // =========================================================================
  function findRecommendedAlternativeVehicle(lastVehicle, visitedHistoryIds = []) {
    const available = state.vehicles.filter((v) => v.status === "Disponível" && v.id !== lastVehicle.id);
    if (!available.length) return lastVehicle;

    const sameCategoryNotFocused = available.filter(
      (v) => v.category === lastVehicle.category && !visitedHistoryIds.includes(v.id)
    );
    if (sameCategoryNotFocused.length > 0) {
      sameCategoryNotFocused.sort((a, b) => Math.abs(a.priceSale - lastVehicle.priceSale) - Math.abs(b.priceSale - lastVehicle.priceSale));
      return sameCategoryNotFocused[0];
    }

    const sameCategory = available.filter((v) => v.category === lastVehicle.category);
    if (sameCategory.length > 0) {
      sameCategory.sort((a, b) => Math.abs(a.priceSale - lastVehicle.priceSale) - Math.abs(b.priceSale - lastVehicle.priceSale));
      return sameCategory[0];
    }

    available.sort((a, b) => Math.abs(a.priceSale - lastVehicle.priceSale) - Math.abs(b.priceSale - lastVehicle.priceSale));
    return available[0];
  }

  async function triggerExitRetargetingBot(targetVisitorId = null) {
    loadStateFromStorage();

    let visitor = null;
    if (targetVisitorId) {
      visitor = state.visitors.find((v) => v.id === targetVisitorId);
    }
    if (!visitor) {
      visitor = state.visitors.find(
        (v) => v.id === LIVE_CLIENT_VISITOR_ID && !v.lockedBySellerId
      );
    }
    if (!visitor) {
      visitor = state.visitors.find((v) => v.isIdentified && !v.lockedBySellerId);
    }
    if (!visitor) {
      visitor = state.visitors[0];
    }
    if (!visitor) return;

    if (visitor.lockedBySellerId) {
      showToast(`🔒 ${visitor.name} já foi assumido por ${visitor.lockedBySellerName}. O Robô não interfere em cliente já atendido!`, "amber");
      return;
    }

    const nowStr = new Date().toLocaleTimeString("pt-BR");
    visitor.online = false;
    visitor.lastSeenAt = Date.now() - 60000;
    visitor.lastUpdateStr = nowStr;
    visitor.botTriggered = true;

    const lastVeh = state.vehicles.find((v) => v.id === visitor.currentVehicleId) || state.vehicles[0];
    const visitedIds = (visitor.history || []).map((h) => h.vehicleId);
    const suggestedVeh = findRecommendedAlternativeVehicle(lastVeh, visitedIds);

    visitor.currentAction = `🔴 Saiu do site • 🤖 Robô enviou sugestão no WhatsApp: ${suggestedVeh.title}`;

    const downVal = visitor.simulation?.downPayment
      ? formatBRL(visitor.simulation.downPayment)
      : formatBRL(Math.round(lastVeh.priceSale * 0.3));

    const template = state.botConfig.template || window.MTCarsData.INITIAL_BOT_CONFIG.template;
    const linkCarro = `https://mtcars.com.br/oferta/${suggestedVeh.ref.replace("#", "")}`;
    const cleanName = visitor.name.replace("🖥️ SUA ABA DE VITRINE", "Visitante VIP").replace("(Sua Aba Ao Vivo)", "").trim();
    const cleanPhone = visitor.whatsapp.includes("Aguardando") ? "(65) 99988-7766" : visitor.whatsapp;

    const finalMessage = template
      .replace(/\{nome\}/g, cleanName)
      .replace(/\{ultimo_carro\}/g, `${lastVeh.title} (${lastVeh.year})`)
      .replace(/\{cidade_ultimo\}/g, `${lastVeh.city} - MT`)
      .replace(/\{carro_sugerido\}/g, `${suggestedVeh.title} (${suggestedVeh.year})`)
      .replace(/\{preco_sugerido\}/g, formatBRL(suggestedVeh.priceSale))
      .replace(/\{cidade_sugerido\}/g, `${suggestedVeh.city} - MT`)
      .replace(/\{link_carro\}/g, linkCarro)
      .replace(/\{entrada_cliente\}/g, downVal);

    let apiStatus = "SIMULADO EM TEMPO REAL (200 OK)";

    if (
      state.botConfig.enabled &&
      state.botConfig.instanceUrl &&
      !state.botConfig.instanceUrl.includes("mtcars-whatsapp.com.br")
    ) {
      try {
        const res = await fetch(state.botConfig.instanceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: state.botConfig.apiKey || ""
          },
          body: JSON.stringify({
            number: cleanPhoneDigits(cleanPhone),
            text: finalMessage,
            visitorName: cleanName,
            lastVehicle: lastVeh.title,
            suggestedVehicle: suggestedVeh.title
          })
        });
        apiStatus = res.ok ? `API REAL DISPARADA (${res.status} OK)` : `FALLBACK LOCAL (HTTP ${res.status})`;
      } catch (_) {
        apiStatus = "DISPARADO NO MOTOR DEMO (200 OK)";
      }
    }

    const newLog = {
      id: "bot_log_" + Date.now(),
      timestamp: nowStr,
      clientName: cleanName,
      clientPhone: cleanPhone,
      clientCity: `${visitor.city} - MT`,
      lastVehicle: `${lastVeh.title} (${formatBRL(lastVeh.priceSale)})`,
      suggestedVehicle: `${suggestedVeh.title} (${formatBRL(suggestedVeh.priceSale)})`,
      suggestedCity: `${suggestedVeh.city} - MT`,
      downPayment: downVal,
      provider: state.botConfig.provider || "Evolution API",
      status: apiStatus,
      message: finalMessage
    };

    state.botLogs.unshift(newLog);
    state.stats.botDispatchesToday = (Number(state.stats.botDispatchesToday) || 19) + 1;

    state.liveFeed.unshift({
      id: "feed_" + Date.now(),
      time: nowStr,
      visitorName: cleanName,
      text: `🤖 Saiu do site olhando ${lastVeh.title} -> Robô enviou ${suggestedVeh.title} no WhatsApp!`
    });

    let crmLead = state.leads.find((l) => l.visitorId === visitor.id || l.whatsapp === cleanPhone);
    if (crmLead) {
      crmLead.stage = "bot_contacted";
      crmLead.notes = `Saiu olhando ${lastVeh.title}. Robô ofertou ${suggestedVeh.title} (${suggestedVeh.city}-MT) às ${nowStr}.`;
    } else {
      state.leads.unshift({
        id: "lead_" + Date.now(),
        visitorId: visitor.id,
        name: cleanName,
        whatsapp: cleanPhone,
        city: visitor.city,
        stage: "bot_contacted",
        vehicleId: suggestedVeh.id,
        vehicleTitle: suggestedVeh.title,
        vehiclePrice: suggestedVeh.priceSale,
        downPayment: visitor.simulation?.downPayment || Math.round(suggestedVeh.priceSale * 0.3),
        installments: visitor.simulation?.installments || 48,
        tradeIn: visitor.simulation?.tradeInModel || "Não informado",
        sellerId: null,
        sellerName: "Robô MT Cars (Aguardando Vendedor)",
        createdAt: `Hoje, ${nowStr.slice(0, 5)}`,
        notes: `Abordado automaticamente pelo Robô de Retargeting após sair do site.`
      });
    }

    persistAll();
    window.MTCarsRealtime.playSound("whatsapp_bot");
    window.MTCarsRealtime.emit("BOT_DISPATCHED", { log: newLog, visitorId: visitor.id });

    showWhatsAppSmartphoneNotification(newLog);
    updateDemoBarBadges();

    if (state.viewMode === "admin" && window.MTCarsAdmin) {
      window.MTCarsAdmin.renderActiveTab(visitor.id);
    }
  }

  function showWhatsAppSmartphoneNotification(logObj) {
    const container = document.getElementById("whatsapp-bot-notification-container");
    if (!container) return;

    const card = document.createElement("div");
    card.className = "whatsapp-popup-enter w-full max-w-md rounded-2xl bg-[#111b21] border-2 border-emerald-500/80 shadow-2xl overflow-hidden text-white pointer-events-auto";
    card.innerHTML = `
      <div class="bg-[#202c33] px-4 py-3 flex items-center justify-between border-b border-zinc-800">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950 font-black text-xs shadow">
            MT
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-extrabold text-emerald-400">🤖 ROBÔ WHATSAPP MT CARS</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">${logObj.timestamp}</span>
            </div>
            <span class="text-[11px] text-zinc-300 block">Para: <strong>${logObj.clientName}</strong> (${logObj.clientPhone})</span>
          </div>
        </div>
        <button onclick="this.closest('.whatsapp-popup-enter').remove()" class="text-zinc-400 hover:text-white p-1">
          ✕
        </button>
      </div>
      <div class="p-4 space-y-2.5 bg-[#0b141a]">
        <div class="flex flex-wrap gap-1.5 text-[10px]">
          <span class="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Saiu de: ${logObj.lastVehicle}</span>
          <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">Sugeriu: ${logObj.suggestedVehicle}</span>
        </div>
        <div class="p-3 rounded-xl rounded-tl-none bg-[#005c4b] text-xs text-zinc-100 leading-relaxed shadow">
          ${logObj.message.replace(/\*([^*]+)\*/g, "<strong>$1</strong>")}
        </div>
        <div class="flex items-center justify-between pt-1">
          <span class="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            ✔✔ Entregue via ${logObj.provider}
          </span>
          <a
            href="https://wa.me/${cleanPhoneDigits(logObj.clientPhone)}?text=${encodeURIComponent(logObj.message)}"
            target="_blank"
            class="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-[11px] transition"
          >
            Abrir no WhatsApp Real ↗
          </a>
        </div>
      </div>
    `;

    container.prepend(card);
    setTimeout(() => {
      if (card && card.parentNode) {
        card.remove();
      }
    }, 14000);
  }

  // =========================================================================
  // SIMULADOR DE NOVO CLIENTE ENTRANDO NO SITE (1 CLIQUE NA BARRA DEMO)
  // =========================================================================
  const DEMO_BUYER_PROFILES = [
    { name: "Agropecuária Bom Futuro (Sr. Dirceu)", whatsapp: "(66) 99915-8822", city: "Sorriso", tradeInModel: "Hilux SRV 2019", tradeInValue: 162000 },
    { name: "Dra. Larissa Albuquerque", whatsapp: "(65) 99944-7010", city: "Cuiabá", tradeInModel: "Renegade Longitude 2021", tradeInValue: 92000 },
    { name: "Fazenda São Judas (Tiago)", whatsapp: "(66) 99608-5511", city: "Sinop", tradeInModel: "Amarok Highline 2020", tradeInValue: 148000 },
    { name: "Empresário Gustavo Scheffer", whatsapp: "(66) 99972-1900", city: "Primavera do Leste", tradeInModel: "Corolla Cross XRE 2022", tradeInValue: 132000 },
    { name: "Eng. Bruno Maggi", whatsapp: "(65) 99931-6644", city: "Lucas do Rio Verde", tradeInModel: "Toro Ranch Diesel 2021", tradeInValue: 124000 },
    { name: "Transportadora Rota 163 (Paulo)", whatsapp: "(66) 99690-3322", city: "Rondonópolis", tradeInModel: "Strada Endurance 2022", tradeInValue: 74000 },
    { name: "Produtor Rural Henrique Bortolini", whatsapp: "(65) 99982-4090", city: "Nova Mutum", tradeInModel: "S10 LTZ Diesel 2019", tradeInValue: 145000 }
  ];

  function simulateNewIncomingVisitor() {
    loadStateFromStorage();
    const availableVehicles = state.vehicles.filter((v) => v.status === "Disponível");
    const randomVeh = availableVehicles[Math.floor(Math.random() * availableVehicles.length)] || state.vehicles[0];
    const randomOtherVeh = availableVehicles.find((v) => v.id !== randomVeh.id) || randomVeh;
    const profile = DEMO_BUYER_PROFILES[Math.floor(Math.random() * DEMO_BUYER_PROFILES.length)];

    const downPayment = Math.round((randomVeh.priceSale * (0.25 + Math.random() * 0.25)) / 5000) * 5000;
    const monthsOptions = [24, 36, 48];
    const installments = monthsOptions[Math.floor(Math.random() * monthsOptions.length)];
    const installmentValue = calculateInstallment(randomVeh.priceSale, downPayment, installments);
    const timeStr = new Date().toLocaleTimeString("pt-BR");

    const newVisId = "vis_sim_" + Date.now();
    const newVisitor = {
      id: newVisId,
      name: profile.name,
      whatsapp: profile.whatsapp,
      city: profile.city,
      isIdentified: true,
      online: true,
      lastSeenAt: Date.now(),
      lastUpdateStr: timeStr,
      enteredAt: Date.now(),
      currentVehicleId: randomVeh.id,
      currentAction: `🔥 Acabou de entrar e simular: ${randomVeh.title} (${formatBRL(randomVeh.priceSale)})`,
      history: [
        { vehicleId: randomOtherVeh.id, title: `${randomOtherVeh.title} (${randomOtherVeh.year})`, time: "há 1 min" },
        { vehicleId: randomVeh.id, title: `${randomVeh.title} (${randomVeh.year})`, time: timeStr }
      ],
      simulation: {
        downPayment,
        installments,
        installmentValue,
        hasTradeIn: true,
        tradeInModel: profile.tradeInModel,
        tradeInValue: profile.tradeInValue
      },
      lockedBySellerId: null,
      lockedBySellerName: null,
      lockedAt: null,
      botTriggered: false
    };

    state.visitors.unshift(newVisitor);

    state.leads.unshift({
      id: "lead_" + Date.now(),
      visitorId: newVisId,
      name: profile.name,
      whatsapp: profile.whatsapp,
      city: profile.city,
      stage: "visiting",
      vehicleId: randomVeh.id,
      vehicleTitle: randomVeh.title,
      vehiclePrice: randomVeh.priceSale,
      downPayment,
      installments,
      tradeIn: `${profile.tradeInModel} (${formatBRL(profile.tradeInValue)})`,
      sellerId: null,
      sellerName: "Aguardando Vendedor",
      createdAt: "Agora mesmo",
      notes: `Entrou ao vivo de ${profile.city}-MT olhando ${randomVeh.title}.`
    });

    state.liveFeed.unshift({
      id: "feed_" + Date.now(),
      time: timeStr,
      visitorName: profile.name,
      text: `🔥 Entrou de ${profile.city}-MT simulando ${randomVeh.title} c/ ${formatBRL(downPayment)} de entrada!`
    });

    state.stats.totalAccessToday = (Number(state.stats.totalAccessToday) || 148) + 1;
    state.stats.leadsCapturedToday = (Number(state.stats.leadsCapturedToday) || 34) + 1;

    persistAll();
    window.MTCarsRealtime.playSound("radar_ping");
    window.MTCarsRealtime.emit("NEW_VISITOR_SIMULATED", { visitor: newVisitor, visitorId: newVisId });

    updateDemoBarBadges();
    if (state.viewMode === "admin" && window.MTCarsAdmin) {
      window.MTCarsAdmin.renderActiveTab(newVisId);
    }

    showToast(`🔥 Novo Cliente ao Vivo no Radar: ${profile.name} (${profile.city}-MT) olhando ${randomVeh.title}!`, "emerald");
  }

  // Abre uma 2ª Aba já direto no Radar ao Vivo dos 8 Vendedores!
  function openSecondTabAdminRadar() {
    const baseUrl = window.location.href.split("?")[0].split("#")[0];
    window.open(`${baseUrl}?view=admin`, "_blank");
    showToast("🖥️ Segunda aba aberta direto no Radar ao Vivo! Coloque as duas lado a lado e mexa na Vitrine!", "emerald");
  }

  function openSellMyCarModal() {
    const modal = document.getElementById("sell-my-car-modal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }
  }

  function closeSellMyCarModal() {
    const modal = document.getElementById("sell-my-car-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  function submitSellMyCarForm(e) {
    if (e) e.preventDefault();
    const storeName = document.getElementById("sell-car-store")?.value.trim() || "Loja Parceira MT";
    const owner = document.getElementById("sell-car-owner")?.value.trim();
    const phone = document.getElementById("sell-car-phone")?.value.trim();
    const city = document.getElementById("sell-car-city")?.value || "Cuiabá";
    const category = document.getElementById("sell-car-category")?.value || "Camionetes";
    const model = document.getElementById("sell-car-model")?.value.trim();
    const year = Number(document.getElementById("sell-car-year")?.value) || 2023;
    const priceRepasse = Number(document.getElementById("sell-car-price")?.value) || 120000;
    const photoUrl = document.getElementById("sell-car-photo")?.value.trim() || "";
    const waitCooperadoPhotos = document.getElementById("sell-car-wait-photos")?.checked || !photoUrl;

    if (!owner || !phone || !model) {
      showToast("⚠️ Preencha o nome do lojista/responsável, WhatsApp e o modelo do veículo.", "amber");
      return;
    }

    const priceSale = Math.round((priceRepasse * 1.06) / 100) * 100;
    const priceFipe = Math.round((priceSale * 1.035) / 100) * 100;
    const newRef = "#MT-" + Math.floor(200 + Math.random() * 799);

    const defaultImg = category === "Motos"
      ? "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=85"
      : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=85";

    const newVeh = {
      id: "veh_" + Date.now(),
      ref: newRef,
      brand: model.split(" ")[0] || "Veículo",
      model: model,
      title: `${model}`,
      year,
      km: 25000,
      transmission: category === "Motos" ? "Manual" : "Automático",
      fuel: "Flex",
      category,
      city,
      uf: "MT",
      priceSale,
      priceFipe,
      priceRepasse,
      garageName: storeName,
      garageOwner: owner,
      garageWhatsapp: phone,
      captadorId: waitCooperadoPhotos ? null : "seller_1",
      captadorName: waitCooperadoPhotos ? "📸 Aberto p/ Cooperado Fotografar na Loja" : "Lojista Parceiro (Com Fotos)",
      photoStatus: waitCooperadoPhotos ? "pending_photos" : "complete",
      status: waitCooperadoPhotos ? "Aguardando Fotos" : "Disponível",
      highlightTag: waitCooperadoPhotos ? "📸 Sem Fotos (Aberto p/ Cooperados)" : "⭐ Recém Cadastrado MT",
      color: "Branco",
      plateEnd: "Vistoriado MT Car",
      description: waitCooperadoPhotos
        ? `Cadastrado pelo lojista ${storeName} (${city}-MT) sem fotos. Aberto no painel para qualquer Cooperado ir até a loja fotografar e ativar na vitrine!`
        : `Veículo cadastrado pelo lojista parceiro ${storeName} em ${city} - MT. Disponível para intermediação imediata.`,
      options: ["Vistoria Cautelar MT Car", "Documentação 2026 OK", "Intermediação Garantida"],
      image: photoUrl || defaultImg,
      gallery: photoUrl ? [photoUrl] : [],
      fipeCode: "005400-1"
    };

    loadStateFromStorage();
    state.vehicles.unshift(newVeh);
    persistAll();
    closeSellMyCarModal();
    renderPublicVitrine();
    window.MTCarsRealtime.emit("VEHICLE_ADDED", { vehicle: newVeh });
    if (waitCooperadoPhotos) {
      showToast(`📸 Veículo ${model} (${newRef}) cadastrado sem fotos! Já está ABERTO para todos os Cooperados irem até a loja fotografar!`, "amber");
    } else {
      showToast(`🚗 Veículo ${model} (${newRef}) cadastrado pelo lojista e publicado na Vitrine!`, "emerald");
    }
  }

  function openTrackOrderModal() {
    const modal = document.getElementById("track-order-modal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      renderTrackOrderResult();
    }
  }

  function closeTrackOrderModal() {
    const modal = document.getElementById("track-order-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  function renderTrackOrderResult(queryPhone) {
    const box = document.getElementById("track-order-result-box");
    if (!box) return;
    const searchVal = (queryPhone || state.currentClient?.whatsapp || "").trim();
    const matchedLead = state.leads.find(
      (l) =>
        (searchVal && l.whatsapp.includes(searchVal)) ||
        (state.currentClient && l.name.toLowerCase() === state.currentClient.name.toLowerCase())
    ) || state.leads[0];

    const stageLabels = {
      visiting: "1. Simulação Recebida na Central MT Cars",
      bot_contacted: "2. Proposta Alternativa Enviada no WhatsApp",
      in_service: "3. Consultor Exclusivo Designado para seu Atendimento",
      financing: "4. Ficha em Análise Bancária & Laudo Cautelar",
      closed_won: "5. Venda Concluída & Veículo Liberado"
    };

    box.innerHTML = `
      <div class="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-400">PROTOCOLO DE INTERMEDIAÇÃO MT CARS</span>
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">Ativo</span>
        </div>
        <div class="text-sm text-white font-bold">${matchedLead.name} • ${matchedLead.city} - MT</div>
        <div class="text-xs text-zinc-300">Veículo de interesse: <strong class="text-white">${matchedLead.vehicleTitle}</strong> (${formatBRL(matchedLead.vehiclePrice)})</div>
        <div class="text-xs text-zinc-400">Condição registrada: Entrada de <strong class="text-emerald-400">${formatBRL(matchedLead.downPayment)}</strong> em ${matchedLead.installments}x • Troca: ${matchedLead.tradeIn}</div>
        <div class="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-amber-300 font-semibold">
          Status Atual: ${stageLabels[matchedLead.stage] || "Em Andamento"} (${matchedLead.sellerName})
        </div>
      </div>
    `;
  }

  function switchViewMode(targetMode, skipLoginModal = false) {
    if (targetMode === "admin" && !skipLoginModal && !sessionStorage.getItem("mtcars_admin_authenticated")) {
      window.MTCarsAdmin.openLoginModal();
      return;
    }

    state.viewMode = targetMode;
    const publicSection = document.getElementById("view-public-vitrine");
    const adminSection = document.getElementById("view-admin-warroom");
    const demoToggleBtnText = document.getElementById("demo-toggle-view-label");

    if (targetMode === "admin") {
      sessionStorage.setItem("mtcars_admin_authenticated", "true");
      if (publicSection) publicSection.classList.add("hidden");
      if (adminSection) adminSection.classList.remove("hidden");
      if (demoToggleBtnText) demoToggleBtnText.textContent = "Ir para Vitrine do Cliente";
      if (window.MTCarsAdmin) {
        window.MTCarsAdmin.renderSellerHeader();
        window.MTCarsAdmin.renderActiveTab();
      }
    } else {
      if (adminSection) adminSection.classList.add("hidden");
      if (publicSection) publicSection.classList.remove("hidden");
      if (demoToggleBtnText) demoToggleBtnText.textContent = "Ir para Painel dos 8 Vendedores";
      renderPublicVitrine();
    }

    updateDemoBarBadges();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleViewModeQuick() {
    if (state.viewMode === "public") {
      switchViewMode("admin", true);
      showToast("🛡️ Central de Guerra dos 8 Vendedores aberta!", "amber");
    } else {
      switchViewMode("public", true);
      showToast("🚘 Visão da Vitrine Pública do Cliente ativa!", "emerald");
    }
  }

  function updateDemoBarBadges() {
    const onlineCount = state.visitors.filter((v) => v.online).length;
    const badge = document.getElementById("demo-bar-online-count");
    if (badge) badge.textContent = `${onlineCount} online`;
  }

  // Filtros da Vitrine Pública (Também avisa o Radar ao Vivo!)
  function applyPublicFilters() {
    state.filters.search = document.getElementById("filter-search-input")?.value || "";
    state.filters.city = document.getElementById("filter-city-select")?.value || "";
    state.filters.category = document.getElementById("filter-category-select")?.value || "";
    state.filters.priceRange = document.getElementById("filter-price-select")?.value || "";
    state.filters.minYear = document.getElementById("filter-year-select")?.value || "";
    state.filters.transmission = document.getElementById("filter-transmission-select")?.value || "";
    state.filters.sortBy = document.getElementById("filter-sort-select")?.value || "featured";

    const parts = [];
    if (state.filters.search) parts.push(`busca "${state.filters.search}"`);
    if (state.filters.category) parts.push(state.filters.category);
    if (state.filters.city) parts.push(`em ${state.filters.city}-MT`);
    if (parts.length > 0) {
      trackVisitorAction(`🔍 Filtrando na Vitrine: ${parts.join(" • ")}`);
    }

    renderPublicVitrine();
  }

  function setQuickCategoryFilter(cat) {
    state.filters.category = state.filters.category === cat ? "" : cat;
    const catSelect = document.getElementById("filter-category-select");
    if (catSelect) catSelect.value = state.filters.category;
    document.querySelectorAll(".quick-cat-pill").forEach((btn) => {
      const btnCat = btn.getAttribute("data-cat") || "";
      if (btnCat === state.filters.category) {
        btn.className = "quick-cat-pill px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white border border-red-500 shadow-lg shadow-red-600/25 transition";
      } else {
        btn.className = "quick-cat-pill px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-zinc-600 transition";
      }
    });
    trackVisitorAction(state.filters.category ? `🚜 Filtrou categoria: ${state.filters.category}` : `🚘 Visualizando todas as categorias na Vitrine`);
    renderPublicVitrine();
  }

  function clearPublicFilters() {
    state.filters = {
      search: "",
      city: "",
      category: "",
      priceRange: "",
      minYear: "",
      transmission: "",
      sortBy: "featured"
    };
    state.detectedCity = "";
    ["filter-search-input", "filter-city-select", "filter-category-select", "filter-price-select", "filter-year-select", "filter-transmission-select", "header-city-select"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    setQuickCategoryFilter("");
    renderPublicVitrine();
  }

  function resetDemoEnvironment() {
    window.MTCarsData.resetAllDemoData();
    localStorage.removeItem("mtcars_live_feed_v1");
    state.currentClient = null;
    state.detectedCity = "";
    state.liveFeed = [];
    loadStateFromStorage();
    ensureLiveSessionVisitor();
    updateClientHeaderStatus();
    renderPublicVitrine();
    updateDemoBarBadges();
    if (window.location.protocol.startsWith("http")) {
      fetch("/api/reset", { method: "POST" }).catch(() => {});
    }
    window.MTCarsRealtime.emit("DEMO_RESET", { visitorId: LIVE_CLIENT_VISITOR_ID });
    if (state.viewMode === "admin" && window.MTCarsAdmin) {
      window.MTCarsAdmin.renderSellerHeader();
      window.MTCarsAdmin.renderActiveTab();
    }
    showToast("🔄 Banco de Dados e Demonstração restaurados para o Take 1!", "emerald");
  }

  function showToast(message, tone = "emerald") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const borderColors = {
      emerald: "border-emerald-500/70 bg-zinc-900/95 text-emerald-300",
      amber: "border-amber-500/70 bg-zinc-900/95 text-amber-300",
      red: "border-red-500/70 bg-zinc-900/95 text-red-300"
    };

    const toast = document.createElement("div");
    toast.className = `px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-bold flex items-center gap-2.5 transition-all duration-300 ${borderColors[tone] || borderColors.emerald}`;
    toast.innerHTML = `
      <span class="flex-1">${message}</span>
      <button onclick="this.parentElement.remove()" class="text-zinc-400 hover:text-white">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      if (toast && toast.parentNode) toast.remove();
    }, 5000);
  }

  // Alternador de Tema Prático (Fundo Branco Padrão x Modo Escuro Opcional)
  function toggleThemeMode() {
    const htmlEl = document.documentElement;
    const isLight = htmlEl.classList.toggle("theme-light");
    localStorage.setItem("mtcars_theme_mode_v3", isLight ? "light" : "dark");
    const labelEl = document.getElementById("theme-toggle-label");
    if (labelEl) {
      labelEl.textContent = isLight ? "🌙 Mudar Fundo (Escuro)" : "☀️ Fundo Branco Padrão";
    }
    showToast(isLight ? "☀️ Fundo Branco Padrão ativado!" : "🌙 Fundo Escuro ativado!", "emerald");
  }

  // Comparador Prático de Veículos (Até 3 carros lado a lado)
  function toggleCompareVehicle(vehicleId) {
    if (!Array.isArray(state.compareList)) state.compareList = [];
    const idx = state.compareList.indexOf(vehicleId);
    const v = state.vehicles.find((item) => item.id === vehicleId);

    if (idx >= 0) {
      state.compareList.splice(idx, 1);
      showToast(`Removido do comparador: ${v ? v.title : ""}`, "amber");
    } else {
      if (state.compareList.length >= 3) {
        showToast("⚠️ Você pode comparar até 3 veículos por vez.", "amber");
        return;
      }
      state.compareList.push(vehicleId);
      if (v) {
        trackVisitorAction(`⚖️ Adicionou ao Comparador: ${v.title} (${formatBRL(v.priceSale)})`, v);
      }
      showToast(`⚖️ ${v ? v.title : "Veículo"} adicionado ao comparador (${state.compareList.length}/3)!`, "emerald");
    }

    updateCompareFloatingBar();
    renderPublicVitrine();
  }

  function updateCompareFloatingBar() {
    const bar = document.getElementById("compare-floating-bar");
    const countEl = document.getElementById("compare-bar-count");
    if (!bar) return;
    const list = state.compareList || [];
    if (list.length > 0) {
      bar.classList.remove("hidden");
      bar.classList.add("flex");
      if (countEl) countEl.textContent = `${list.length} selecionado(s)`;
    } else {
      bar.classList.add("hidden");
      bar.classList.remove("flex");
    }
  }

  function openCompareModal() {
    const list = (state.compareList || []).map((id) => state.vehicles.find((v) => v.id === id)).filter(Boolean);
    if (!list.length) return;
    const modal = document.getElementById("compare-vehicles-modal");
    const content = document.getElementById("compare-vehicles-content");
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-${list.length} gap-4">
        ${list
          .map((v) => {
            const fipeDiff = Number(v.priceFipe) - Number(v.priceSale);
            const estInst = calculateInstallment(v.priceSale, Math.round(v.priceSale * 0.3), 48);
            return `
              <div class="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <img src="${v.image}" class="w-full h-40 object-cover rounded-xl" alt="${v.title}" />
                <div>
                  <span class="text-[10px] font-bold uppercase text-red-500">${v.category} • 📍 ${v.city}-MT</span>
                  <h4 class="text-base font-extrabold text-white">${v.title}</h4>
                </div>
                <div class="space-y-1.5 text-xs border-t border-zinc-800 pt-2.5">
                  <div class="flex justify-between"><span class="text-zinc-400">Preço MT Cars:</span> <strong class="text-white">${formatBRL(v.priceSale)}</strong></div>
                  <div class="flex justify-between"><span class="text-zinc-400">Tabela FIPE:</span> <span class="text-zinc-300">${formatBRL(v.priceFipe)}</span></div>
                  <div class="flex justify-between"><span class="text-zinc-400">Economia Real:</span> <strong class="text-emerald-400">${fipeDiff > 0 ? "-" + formatBRL(fipeDiff) : "Na FIPE"}</strong></div>
                  <div class="flex justify-between"><span class="text-zinc-400">Ano / KM:</span> <span class="text-white">${v.year} • ${Number(v.km).toLocaleString("pt-BR")} km</span></div>
                  <div class="flex justify-between"><span class="text-zinc-400">Câmbio / Comb.:</span> <span class="text-white">${v.transmission} / ${v.fuel}</span></div>
                  <div class="flex justify-between"><span class="text-zinc-400">Parcela 48x:</span> <strong class="text-amber-400">${formatBRL(estInst)}/mês</strong></div>
                </div>
                <button
                  onclick="MTCarsApp.closeCompareModal(); MTCarsApp.openVehicleDetail('${v.id}');"
                  class="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white keep-white-text font-bold text-xs transition"
                >
                  Simular Este Veículo
                </button>
              </div>
            `;
          })
          .join("")}
      </div>
    `;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeCompareModal() {
    const modal = document.getElementById("compare-vehicles-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }

  function init() {
    // Sempre inicia com FUNDO BRANCO POR PADRÃO (a menos que a pessoa clique no botão para mudar)
    const savedTheme = localStorage.getItem("mtcars_theme_mode_v3");
    if (savedTheme !== "dark") {
      document.documentElement.classList.add("theme-light");
      const labelEl = document.getElementById("theme-toggle-label");
      if (labelEl) labelEl.textContent = "🌙 Mudar Fundo (Escuro)";
    } else {
      document.documentElement.classList.remove("theme-light");
      const labelEl = document.getElementById("theme-toggle-label");
      if (labelEl) labelEl.textContent = "☀️ Fundo Branco Padrão";
    }
    loadStateFromStorage();
    ensureLiveSessionVisitor();
    initCitiesAndSelectors();
    updateClientHeaderStatus();
    renderPublicVitrine();
    updateDemoBarBadges();

    // Verifica se a aba foi aberta com ?view=admin (Ex: Segunda Aba lado a lado)
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "admin") {
      switchViewMode("admin", true);
    } else {
      initSmartLeadGateTimer();
    }

    // Inicializa Motor Quad-Sync Realtime
    window.MTCarsRealtime.init((eventPayload) => {
      loadStateFromStorage();
      updateDemoBarBadges();
      if (eventPayload.type === "BOT_DISPATCHED" && eventPayload.data?.log) {
        window.MTCarsRealtime.playSound("whatsapp_bot");
        showWhatsAppSmartphoneNotification(eventPayload.data.log);
      } else if (eventPayload.type === "VISITOR_UPDATED" || eventPayload.type === "NEW_VISITOR_SIMULATED") {
        window.MTCarsRealtime.playSound("radar_ping");
      } else if (eventPayload.type === "LEAD_LOCKED") {
        window.MTCarsRealtime.playSound("lead_locked");
      } else if (eventPayload.type === "VEHICLE_SOLD") {
        window.MTCarsRealtime.playSound("sale_closed");
      }

      if (state.viewMode === "admin" && window.MTCarsAdmin) {
        window.MTCarsAdmin.renderSellerHeader();
        window.MTCarsAdmin.renderActiveTab(eventPayload.data?.visitorId || LIVE_CLIENT_VISITOR_ID);
      } else {
        renderPublicVitrine();
      }
    });
  }

  return {
    LIVE_CLIENT_VISITOR_ID,
    state,
    init,
    loadStateFromStorage,
    persistAll,
    formatBRL,
    formatBRLWithCents,
    maskPhone,
    cleanPhoneDigits,
    calculateInstallment,
    detectUserLocation,
    renderPublicVitrine,
    onCardHover,
    openVehicleDetail,
    closeVehicleDetailModal,
    onSimulatorChange,
    requestSpecialistFromSimulator,
    openLeadGateModal,
    closeLeadGateModal,
    onGateLiveTyping,
    submitLeadGateForm,
    triggerExitRetargetingBot,
    simulateNewIncomingVisitor,
    openSecondTabAdminRadar,
    openSellMyCarModal,
    closeSellMyCarModal,
    submitSellMyCarForm,
    openTrackOrderModal,
    closeTrackOrderModal,
    renderTrackOrderResult,
    switchViewMode,
    toggleViewModeQuick,
    applyPublicFilters,
    setQuickCategoryFilter,
    clearPublicFilters,
    resetDemoEnvironment,
    populateCityDropdowns,
    showToast,
    toggleThemeMode,
    toggleCompareVehicle,
    openCompareModal,
    closeCompareModal
  };
})();
