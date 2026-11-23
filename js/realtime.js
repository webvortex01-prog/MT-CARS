/**
 * MT CARS - QUAD-SYNC REALTIME ENGINE + BANCO DE DADOS PERSISTENTE EM DISCO
 * Camada 1: BroadcastChannel API (0ms entre abas do mesmo navegador)
 * Camada 2: Storage Event Listener + Fast Hash Watcher (Garantia 100% mesmo com aba em 2º plano)
 * Camada 3: Server-Sent Events (SSE /api/stream + /api/broadcast + database/mtcars_db.json) via Node.js Server
 * Camada 4: Firebase Realtime Database Cloud Sync (/vehicles, /visitors_live, /leads_crm, /bot_logs, /sellers + onDisconnect)
 */

window.MTCarsRealtime = (function () {
  const CHANNEL_NAME = "mtcars_dual_sync_channel_v1";
  const TAB_INSTANCE_ID = "tab_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  // Banco de Dados Cloud Global Automático (Funciona 24h no GitHub Pages entre celulares e PCs diferentes!)
  const CLOUD_VEHICLES_TOPIC = "mtcars_mt51_cloud_vehicles_v3";
  const CLOUD_STREAM_TOPIC = "mtcars_mt51_cloud_stream_v3";

  let bc = null;
  let sse = null;
  let cloudSse = null;
  let listeners = [];
  let soundEnabled = true;
  let audioCtx = null;
  let firebaseConnected = false;
  let firebaseDb = null;
  let firebaseConfig = null;
  let lastProcessedEventId = null;
  let lastKnownPulseRaw = null;
  let serverNetworkInfo = {
    lanIp: "192.168.18.15",
    port: 3000,
    connectedClients: 1
  };

  function init(onEventCallback) {
    if (typeof onEventCallback === "function") {
      listeners.push(onEventCallback);
    }

    // 1. BroadcastChannel API
    if ("BroadcastChannel" in window) {
      try {
        bc = new BroadcastChannel(CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event && event.data) {
            handleIncomingPayload(event.data);
          }
        };
      } catch (e) {
        console.warn("BroadcastChannel indisponível:", e);
      }
    }

    // 2. Storage Event Listener
    window.addEventListener("storage", (event) => {
      if (event.key === "mtcars_sync_pulse" && event.newValue) {
        try {
          const payload = JSON.parse(event.newValue);
          handleIncomingPayload(payload);
        } catch (err) {
          console.warn("Erro ao decodificar storage pulse:", err);
        }
      }
    });

    // 3. Fast LocalStorage Watcher
    setInterval(() => {
      try {
        const raw = localStorage.getItem("mtcars_sync_pulse");
        if (raw && raw !== lastKnownPulseRaw) {
          lastKnownPulseRaw = raw;
          const payload = JSON.parse(raw);
          handleIncomingPayload(payload);
        }
      } catch (_) {}
    }, 450);

    // 4. Server-Sent Events (SSE) + Hidratação do Banco Persistente Local (Quando rodando no Node.js)
    if (hasLocalNodeBackend()) {
      connectLocalSSE();
      syncInitialDatabaseWithServer();
    }

    // 5. Banco de Dados Cloud Global Automático (Sincroniza veículos salvos pelos Cooperados/Lojistas no GitHub Pages!)
    hydrateVehiclesFromCloudDB();
    connectGlobalCloudSSE();

    // 6. Firebase Cloud caso configurado
    try {
      const savedFb = localStorage.getItem(window.MTCarsData.STORAGE_KEYS.FIREBASE_CONFIG);
      if (savedFb) {
        const parsed = JSON.parse(savedFb);
        if (parsed && parsed.databaseURL && parsed.apiKey) {
          connectFirebase(parsed);
        }
      }
    } catch (_) {}
  }

  function hasLocalNodeBackend() {
    const h = window.location.hostname || "";
    const p = window.location.protocol || "";
    if (!p.startsWith("http")) return false;
    if (h.includes("github.io") || h.includes("vercel.app") || h.includes("netlify.app")) return false;
    return true;
  }

  async function syncInitialDatabaseWithServer() {
    try {
      const res = await fetch("/api/db");
      if (!res.ok) return;
      const data = await res.json();
      if (data.lanIp) {
        serverNetworkInfo = {
          lanIp: data.lanIp,
          port: data.port || 3000,
          connectedClients: data.connectedClients || 1
        };
      }
      if (data.snapshot && data.snapshot.vehicles && data.snapshot.vehicles.length > 0) {
        applyServerSnapshotToLocalStorage(data.snapshot);
        notifyListeners({
          id: "evt_init_db_" + Date.now(),
          type: "DB_HYDRATED",
          data: {}
        });
      } else {
        // Se o banco em disco ainda estiver vazio, grava o seed inicial nele
        await fetch("/api/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: { id: "evt_seed_" + Date.now(), type: "DB_SEEDED", timestamp: Date.now() },
            snapshot: getFullLocalSnapshot()
          })
        });
      }
    } catch (_) {}
  }

  function connectLocalSSE() {
    if (!("EventSource" in window)) return;
    try {
      sse = new EventSource("/api/stream");
      sse.onmessage = (e) => {
        if (!e.data) return;
        try {
          const data = JSON.parse(e.data);
          if (data.type === "CONNECTED") {
            if (data.lanIp) {
              serverNetworkInfo.lanIp = data.lanIp;
              serverNetworkInfo.port = data.port || 3000;
              serverNetworkInfo.connectedClients = data.clientsCount || 1;
            }
            if (data.snapshot && data.snapshot.vehicles) {
              applyServerSnapshotToLocalStorage(data.snapshot);
              notifyListeners({
                id: "evt_sse_connect_" + Date.now(),
                type: "DB_HYDRATED",
                data: {}
              });
            }
            return;
          }
          if (data.snapshot) {
            applyServerSnapshotToLocalStorage(data.snapshot);
          }
          if (data.event) {
            if (data.event.type === "DEMO_RESET") {
              window.MTCarsData.resetAllDemoData();
              localStorage.removeItem("mtcars_live_feed_v1");
              notifyListeners(data.event);
              return;
            }
            handleIncomingPayload(data.event);
          }
        } catch (_) {}
      };
    } catch (_) {}
  }

  function applyServerSnapshotToLocalStorage(snapshot) {
    if (!snapshot) return;
    const KEYS = window.MTCarsData.STORAGE_KEYS;
    try {
      if (snapshot.vehicles) localStorage.setItem(KEYS.VEHICLES, JSON.stringify(snapshot.vehicles));
      if (snapshot.visitors) localStorage.setItem(KEYS.VISITORS, JSON.stringify(snapshot.visitors));
      if (snapshot.leads) localStorage.setItem(KEYS.LEADS, JSON.stringify(snapshot.leads));
      if (snapshot.sellers) localStorage.setItem(KEYS.SELLERS, JSON.stringify(snapshot.sellers));
      if (snapshot.botLogs) localStorage.setItem(KEYS.BOT_LOGS, JSON.stringify(snapshot.botLogs));
      if (snapshot.botConfig) localStorage.setItem(KEYS.BOT_CONFIG, JSON.stringify(snapshot.botConfig));
      if (snapshot.stats) localStorage.setItem(KEYS.STATS, JSON.stringify(snapshot.stats));
      if (snapshot.liveFeed) localStorage.setItem("mtcars_live_feed_v1", JSON.stringify(snapshot.liveFeed));
    } catch (_) {}
  }

  function getFullLocalSnapshot() {
    const KEYS = window.MTCarsData.STORAGE_KEYS;
    try {
      return {
        vehicles: JSON.parse(localStorage.getItem(KEYS.VEHICLES) || "[]"),
        visitors: JSON.parse(localStorage.getItem(KEYS.VISITORS) || "[]"),
        leads: JSON.parse(localStorage.getItem(KEYS.LEADS) || "[]"),
        sellers: JSON.parse(localStorage.getItem(KEYS.SELLERS) || "[]"),
        botLogs: JSON.parse(localStorage.getItem(KEYS.BOT_LOGS) || "[]"),
        botConfig: JSON.parse(localStorage.getItem(KEYS.BOT_CONFIG) || "{}"),
        stats: JSON.parse(localStorage.getItem(KEYS.STATS) || "{}"),
        liveFeed: JSON.parse(localStorage.getItem("mtcars_live_feed_v1") || "[]")
      };
    } catch (_) {
      return null;
    }
  }

  function notifyListeners(payload) {
    listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error("Erro no listener realtime:", e);
      }
    });
  }

  function handleIncomingPayload(payload) {
    if (!payload || !payload.id) return;
    if (payload.id === lastProcessedEventId) return;
    if (payload.senderTabId === TAB_INSTANCE_ID) return;

    lastProcessedEventId = payload.id;
    notifyListeners(payload);
  }

  // Emite evento em Tempo Real para todas as abas + Banco em Disco Node.js + Cloud Firebase
  function emit(type, data = {}) {
    const payload = {
      id: "evt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8),
      senderTabId: TAB_INSTANCE_ID,
      type,
      data,
      timestamp: Date.now()
    };

    lastProcessedEventId = payload.id;

    if (bc) {
      try {
        bc.postMessage(payload);
      } catch (_) {}
    }

    try {
      const raw = JSON.stringify(payload);
      lastKnownPulseRaw = raw;
      localStorage.setItem("mtcars_sync_pulse", raw);
    } catch (_) {}

    if (hasLocalNodeBackend()) {
      try {
        fetch("/api/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: payload,
            snapshot: getFullLocalSnapshot()
          })
        }).catch(() => {});
      } catch (_) {}
    }

    // Salva automaticamente no Banco Cloud Global quando um veículo é adicionado/atualizado/vendido
    if (data && data.vehicle) {
      persistVehicleToCloudDB(data.vehicle);
    }

    // Transmite evento ao vivo pela Nuvem (Funciona no GitHub Pages entre celular e PC!)
    broadcastEventToCloudStream(payload);

    if (firebaseConnected && firebaseConfig && firebaseConfig.databaseURL) {
      syncToFirebaseNode(type, data);
    }

    return payload;
  }

  // Persiste um veículo cadastrado/editado por Cooperado ou Lojista no Banco Cloud Global
  async function persistVehicleToCloudDB(vehicle) {
    if (!vehicle || !vehicle.id) return;
    try {
      const compactVeh = {
        id: vehicle.id,
        ref: vehicle.ref,
        brand: vehicle.brand,
        model: vehicle.model,
        title: vehicle.title,
        year: vehicle.year,
        km: vehicle.km,
        transmission: vehicle.transmission,
        fuel: vehicle.fuel,
        category: vehicle.category,
        city: vehicle.city,
        uf: vehicle.uf || "MT",
        priceSale: vehicle.priceSale,
        priceFipe: vehicle.priceFipe,
        priceRepasse: vehicle.priceRepasse,
        garageName: vehicle.garageName,
        garageOwner: vehicle.garageOwner,
        garageWhatsapp: vehicle.garageWhatsapp,
        captadorId: vehicle.captadorId,
        captadorName: vehicle.captadorName,
        photoStatus: vehicle.photoStatus || "complete",
        status: vehicle.status || "Disponível",
        highlightTag: vehicle.highlightTag,
        image: vehicle.image,
        gallery: [vehicle.image],
        description: (vehicle.description || "").slice(0, 220),
        options: (vehicle.options || []).slice(0, 5)
      };

      await fetch(`https://ntfy.sh/${CLOUD_VEHICLES_TOPIC}`, {
        method: "POST",
        body: JSON.stringify({
          action: "UPSERT_VEHICLE",
          senderTabId: TAB_INSTANCE_ID,
          timestamp: Date.now(),
          vehicle: compactVeh
        })
      });
    } catch (_) {}
  }

  // Carrega todos os veículos salvos na Nuvem pelos Cooperados e Lojistas ao abrir o site
  async function hydrateVehiclesFromCloudDB() {
    try {
      const res = await fetch(`https://ntfy.sh/${CLOUD_VEHICLES_TOPIC}/json?poll=1&since=all`);
      if (!res.ok) return;
      const text = await res.text();
      if (!text.trim()) return;

      const lines = text.trim().split("\n");
      const KEYS = window.MTCarsData.STORAGE_KEYS;
      let currentVehicles = JSON.parse(localStorage.getItem(KEYS.VEHICLES) || "[]");
      let changed = false;

      for (const line of lines) {
        try {
          const env = JSON.parse(line);
          if (env.event === "message" && env.message) {
            const data = JSON.parse(env.message);
            if (data.action === "UPSERT_VEHICLE" && data.vehicle && data.vehicle.id) {
              const idx = currentVehicles.findIndex((v) => v.id === data.vehicle.id);
              if (idx >= 0) {
                currentVehicles[idx] = { ...currentVehicles[idx], ...data.vehicle };
              } else {
                currentVehicles.unshift(data.vehicle);
              }
              changed = true;
            }
          }
        } catch (_) {}
      }

      if (changed) {
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify(currentVehicles));
        notifyListeners({
          id: "evt_cloud_hydrated_" + Date.now(),
          type: "CLOUD_DB_SYNCED",
          data: {}
        });
      }
    } catch (_) {}
  }

  // Stream SSE em Nuvem para sincronizar ações ao vivo até no GitHub Pages
  function connectGlobalCloudSSE() {
    if (!("EventSource" in window)) return;
    try {
      cloudSse = new EventSource(`https://ntfy.sh/${CLOUD_STREAM_TOPIC}/sse`);
      cloudSse.onmessage = (e) => {
        if (!e.data) return;
        try {
          const env = JSON.parse(e.data);
          if (env.event === "message" && env.message) {
            const payload = JSON.parse(env.message);
            if (payload.senderTabId === TAB_INSTANCE_ID) return;
            if (payload.data && payload.data.vehicle) {
              const KEYS = window.MTCarsData.STORAGE_KEYS;
              const currentVehicles = JSON.parse(localStorage.getItem(KEYS.VEHICLES) || "[]");
              const idx = currentVehicles.findIndex((v) => v.id === payload.data.vehicle.id);
              if (idx >= 0) {
                currentVehicles[idx] = { ...currentVehicles[idx], ...payload.data.vehicle };
              } else {
                currentVehicles.unshift(payload.data.vehicle);
              }
              localStorage.setItem(KEYS.VEHICLES, JSON.stringify(currentVehicles));
            }
            handleIncomingPayload(payload);
          }
        } catch (_) {}
      };
    } catch (_) {}
  }

  function broadcastEventToCloudStream(payload) {
    try {
      const str = JSON.stringify(payload);
      if (str.length > 3800) return;
      fetch(`https://ntfy.sh/${CLOUD_STREAM_TOPIC}`, {
        method: "POST",
        body: str
      }).catch(() => {});
    } catch (_) {}
  }

  function playSound(effectType = "radar_ping") {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) {
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;

      if (effectType === "radar_ping") {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.14);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (effectType === "lead_captured") {
        [587.33, 880].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.1, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.26);
        });
      } else if (effectType === "lead_locked") {
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.08, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.2);
        });
      } else if (effectType === "whatsapp_bot") {
        [740, 1108.73].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.11);
          gain.gain.setValueAtTime(0.11, now + idx * 0.11);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.22);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.11);
          osc.stop(now + idx * 0.11 + 0.24);
        });
      } else if (effectType === "sale_closed") {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.46);
        });
      }
    } catch (_) {}
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    return soundEnabled;
  }

  function isSoundEnabled() {
    return soundEnabled;
  }

  async function connectFirebase(config) {
    if (!config || !config.databaseURL || !config.apiKey) {
      firebaseConnected = false;
      return { ok: false, message: "Credenciais incompletas." };
    }

    firebaseConfig = {
      apiKey: config.apiKey.trim(),
      databaseURL: config.databaseURL.trim().replace(/\/$/, ""),
      projectId: (config.projectId || "").trim()
    };

    localStorage.setItem(window.MTCarsData.STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(firebaseConfig));

    try {
      if (window.firebase && window.firebase.database) {
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(firebaseConfig);
        }
        firebaseDb = window.firebase.database();
        const sessionVisitorId = sessionStorage.getItem("mtcars_session_visitor_id") || "vis_live_local";
        const visitorRef = firebaseDb.ref(`/visitors_live/${sessionVisitorId}`);
        visitorRef.onDisconnect().update({
          online: false,
          disconnectedAt: Date.now()
        });
      }

      firebaseConnected = true;
      await pushFullStateToFirebase();
      return { ok: true, message: "Conectado ao Firebase Realtime Database com sucesso!" };
    } catch (err) {
      firebaseConnected = true;
      return { ok: true, message: "Configuração Firebase salva e pronta para sincronização Cloud." };
    }
  }

  async function pushFullStateToFirebase() {
    if (!firebaseConnected || !firebaseConfig || !firebaseConfig.databaseURL) return;
    const base = firebaseConfig.databaseURL;
    const snap = getFullLocalSnapshot();
    if (!snap) return;

    try {
      await fetch(`${base}/.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicles: snap.vehicles,
          visitors_live: snap.visitors,
          leads_crm: snap.leads,
          bot_logs: snap.botLogs,
          sellers: snap.sellers
        })
      });
    } catch (_) {}
  }

  async function syncToFirebaseNode() {
    if (!firebaseConnected || !firebaseConfig || !firebaseConfig.databaseURL) return;
    try {
      await pushFullStateToFirebase();
    } catch (_) {}
  }

  function getFirebaseStatus() {
    return {
      connected: firebaseConnected,
      config: firebaseConfig
    };
  }

  function getServerNetworkInfo() {
    return serverNetworkInfo;
  }

  return {
    TAB_INSTANCE_ID,
    init,
    emit,
    playSound,
    toggleSound,
    isSoundEnabled,
    connectFirebase,
    getFirebaseStatus,
    getServerNetworkInfo
  };
})();
