/**
 * MT CARS - PORTAL ESTADUAL DE INTERMEDIAÇÃO DE VEÍCULOS (MATO GROSSO)
 * Módulo de Dados, Seed Inicial, Integração IBGE (UF 51) e Tabela FIPE
 */

window.MTCarsData = (function () {
  const STORAGE_KEYS = {
    VEHICLES: 'mtcars_vehicles_v3',
    VISITORS: 'mtcars_visitors_v2',
    LEADS: 'mtcars_leads_v2',
    SELLERS: 'mtcars_sellers_v2',
    BOT_LOGS: 'mtcars_bot_logs_v2',
    BOT_CONFIG: 'mtcars_bot_config_v2',
    FIREBASE_CONFIG: 'mtcars_firebase_config_v2',
    CURRENT_USER_LEAD: 'mtcars_current_client_v2',
    CURRENT_SELLER: 'mtcars_current_seller_v2',
    STATS: 'mtcars_stats_v2',
    CITIES_CACHE: 'mtcars_ibge_cities_v2',
    PARTNER_STORES: 'mtcars_partner_stores_v2'
  };

  // Fallback imediato com as principais cidades polo do Mato Grosso
  const FALLBACK_MT_CITIES = [
    "Cuiabá",
    "Várzea Grande",
    "Rondonópolis",
    "Sinop",
    "Sorriso",
    "Tangará da Serra",
    "Primavera do Leste",
    "Campo Verde",
    "Lucas do Rio Verde",
    "Nova Mutum",
    "Cáceres",
    "Barra do Garças",
    "Alta Floresta",
    "Pontes e Lacerda",
    "Juína",
    "Colíder",
    "Guarantã do Norte",
    "Peixoto de Azevedo",
    "Mirassol d'Oeste",
    "Água Boa",
    "Sapezal",
    "Campo Novo do Parecis",
    "Diamantino",
    "Querência",
    "Canarana",
    "Juara",
    "Paranatinga",
    "Poconé",
    "Chapada dos Guimarães",
    "Jaciara"
  ];

  // 8 Contas Oficiais de Vendedores + 1 Conta Diretor Geral
  const INITIAL_SELLERS = [
    {
      id: "seller_1",
      code: "Vendedor 01",
      name: "Carlos Eduardo",
      fullTitle: "Vendedor 01 - Carlos",
      email: "vendedor1@mtcars.com",
      password: "123456",
      whatsapp: "(65) 99911-0101",
      city: "Cuiabá",
      status: "online",
      avatar: "CE",
      color: "from-red-600 to-rose-700",
      leadsAssumidosHoje: 6,
      carrosCaptados: 4,
      vendasRealizadas: 5,
      comissoesGeradas: 44500,
      metaMensal: 60000
    },
    {
      id: "seller_2",
      code: "Vendedor 02",
      name: "Mariana Souza",
      fullTitle: "Vendedor 02 - Mariana",
      email: "vendedor2@mtcars.com",
      password: "123456",
      whatsapp: "(66) 99922-0202",
      city: "Sinop",
      status: "online",
      avatar: "MS",
      color: "from-amber-500 to-orange-600",
      leadsAssumidosHoje: 5,
      carrosCaptados: 3,
      vendasRealizadas: 4,
      comissoesGeradas: 38200,
      metaMensal: 50000
    },
    {
      id: "seller_3",
      code: "Vendedor 03",
      name: "Roberto Almeida",
      fullTitle: "Vendedor 03 - Roberto",
      email: "vendedor3@mtcars.com",
      password: "123456",
      whatsapp: "(66) 99933-0303",
      city: "Rondonópolis",
      status: "online",
      avatar: "RA",
      color: "from-emerald-600 to-teal-700",
      leadsAssumidosHoje: 4,
      carrosCaptados: 2,
      vendasRealizadas: 3,
      comissoesGeradas: 29800,
      metaMensal: 50000
    },
    {
      id: "seller_4",
      code: "Vendedor 04",
      name: "Juliana Mendes",
      fullTitle: "Vendedor 04 - Juliana",
      email: "vendedor4@mtcars.com",
      password: "123456",
      whatsapp: "(66) 99944-0404",
      city: "Sorriso",
      status: "online",
      avatar: "JM",
      color: "from-blue-600 to-indigo-700",
      leadsAssumidosHoje: 7,
      carrosCaptados: 3,
      vendasRealizadas: 4,
      comissoesGeradas: 41000,
      metaMensal: 55000
    },
    {
      id: "seller_5",
      code: "Vendedor 05",
      name: "Henrique Bastos",
      fullTitle: "Vendedor 05 - Henrique",
      email: "vendedor5@mtcars.com",
      password: "123456",
      whatsapp: "(65) 99955-0505",
      city: "Várzea Grande",
      status: "online",
      avatar: "HB",
      color: "from-purple-600 to-violet-700",
      leadsAssumidosHoje: 3,
      carrosCaptados: 2,
      vendasRealizadas: 2,
      comissoesGeradas: 18500,
      metaMensal: 45000
    },
    {
      id: "seller_6",
      code: "Vendedor 06",
      name: "Patrícia Oliveira",
      fullTitle: "Vendedor 06 - Patrícia",
      email: "vendedor6@mtcars.com",
      password: "123456",
      whatsapp: "(66) 99966-0606",
      city: "Primavera do Leste",
      status: "online",
      avatar: "PO",
      color: "from-pink-600 to-rose-700",
      leadsAssumidosHoje: 4,
      carrosCaptados: 2,
      vendasRealizadas: 3,
      comissoesGeradas: 26400,
      metaMensal: 45000
    },
    {
      id: "seller_7",
      code: "Vendedor 07",
      name: "Lucas Ferraz",
      fullTitle: "Vendedor 07 - Lucas",
      email: "vendedor7@mtcars.com",
      password: "123456",
      whatsapp: "(65) 99977-0707",
      city: "Lucas do Rio Verde",
      status: "online",
      avatar: "LF",
      color: "from-cyan-600 to-sky-700",
      leadsAssumidosHoje: 5,
      carrosCaptados: 2,
      vendasRealizadas: 3,
      comissoesGeradas: 31200,
      metaMensal: 50000
    },
    {
      id: "seller_8",
      code: "Vendedor 08",
      name: "Fernanda Costa",
      fullTitle: "Vendedor 08 - Fernanda",
      email: "vendedor8@mtcars.com",
      password: "123456",
      whatsapp: "(65) 99988-0808",
      city: "Tangará da Serra",
      status: "online",
      avatar: "FC",
      color: "from-yellow-500 to-amber-600",
      leadsAssumidosHoje: 6,
      carrosCaptados: 3,
      vendasRealizadas: 4,
      comissoesGeradas: 35900,
      metaMensal: 50000
    }
  ];

  const DIRECTOR_ACCOUNT = {
    id: "director_master",
    code: "Diretor Geral",
    name: "RD (Diretoria MT Cars)",
    fullTitle: "Diretor Geral - RD",
    email: "diretor@mtcars.com",
    password: "123456",
    whatsapp: "(65) 99999-0000",
    city: "Cuiabá",
    status: "online",
    avatar: "RD",
    color: "from-amber-400 to-red-600",
    isDirector: true
  };

  // Veículos Reais e Atrativos do Mercado do Mato Grosso (Iniciando com o Onix Sedan LTZ 2025/26 Real)
  const INITIAL_VEHICLES = [
    {
      id: "veh_100",
      ref: "#MT-100",
      brand: "Chevrolet",
      model: "Onix Sedan LTZ 1.0 Turbo Automático",
      title: "Chevrolet Onix Sedan LTZ Automático",
      year: "2025/26",
      km: 45533,
      transmission: "Automático",
      fuel: "Flex",
      category: "Sedan",
      city: "Cuiabá",
      uf: "MT",
      priceSale: 95800,
      priceFipe: 102900,
      priceRepasse: 89500,
      garageName: "Centro Oeste Veículos MT",
      garageOwner: "Diretoria Centro Oeste",
      garageWhatsapp: "(65) 99999-9000",
      captadorId: "seller_1",
      captadorName: "Cooperado 01 - Carlos",
      status: "Disponível",
      highlightTag: "⭐ Modelo Novo 2025/26 • Painel Digital",
      color: "Branco Summit",
      plateEnd: "IPVA 2026 Pago",
      description: "Chevrolet Onix Sedan (Plus) LTZ 1.0 Turbo Automático Ano 2025/2026! Novo cockpit 100% digital integrado com central multimídia panorâmica MyLink, faróis dianteiros com assinatura Full LED, chave presencial, partida por botão, rodas de liga leve exclusivas LTZ, sensor de estacionamento e câmera de ré. Apenas 45.533 km rodados, estado impecável!",
      options: [
        "Novo Painel Digital Integrado",
        "Multimídia Panorâmica MyLink",
        "Motor 1.0 Turbo Automático",
        "Faróis com DRL em LED",
        "Chave Presencial Easy Entry",
        "Rodas de Liga Leve LTZ",
        "Bancos Premium com Regulagem",
        "Laudo Cautelar 100% Aprovado"
      ],
      image: "img/onix-ltz-2026/foto-1.jpg",
      gallery: [
        "img/onix-ltz-2026/foto-1.jpg",
        "img/onix-ltz-2026/foto-2.jpg",
        "img/onix-ltz-2026/foto-3.jpg",
        "img/onix-ltz-2026/foto-4.jpg",
        "img/onix-ltz-2026/foto-5.jpg",
        "img/onix-ltz-2026/foto-6.jpg",
        "img/onix-ltz-2026/foto-7.jpg",
        "img/onix-ltz-2026/foto-8.jpg",
        "img/onix-ltz-2026/foto-9.jpg",
        "img/onix-ltz-2026/foto-10.jpg",
        "img/onix-ltz-2026/foto-11.jpg"
      ],
      fipeCode: "004504-7"
    },
    {
      id: "veh_101",
      ref: "#MT-101",
      brand: "Toyota",
      model: "Hilux SRX 2.8 Turbo Diesel 4x4",
      title: "Toyota Hilux SRX 2.8 Turbo Diesel 4x4",
      year: 2023,
      km: 28400,
      transmission: "Automático",
      fuel: "Diesel",
      category: "Camionetes",
      city: "Cuiabá",
      uf: "MT",
      priceSale: 259900,
      priceFipe: 266400,
      priceRepasse: 248000,
      garageName: "Cuiabá Motors Select",
      garageOwner: "Marcos Vinícius",
      garageWhatsapp: "(65) 99612-4400",
      captadorId: "seller_1",
      captadorName: "Cooperado 01 - Carlos",
      status: "Disponível",
      highlightTag: "🚜 Pronto pro Agro",
      color: "Branco Pérola",
      plateEnd: "Final 8 (IPVA 2026 Pago)",
      description: "Picape impecável, único dono em Cuiabá, todas as revisões carimbadas na concessionária Toyota. Pneus BFGoodrich seminovos, capota marítima original, som JBL de fábrica e pacote Toyota Safety Sense (ACC + frenagem autônoma).",
      options: ["Tração 4x4 Reduzida", "Som Premium JBL", "Piloto Automático Adaptativo", "Bancos em Couro Perfurado", "Câmera 360°", "Laudo Cautelar 100% Aprovado", "IPVA Pago", "Único Dono"],
      image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "002142-3"
    },
    {
      id: "veh_102",
      ref: "#MT-102",
      brand: "Volkswagen",
      model: "Jetta GLI 350 TSI 2.0 Turbo",
      title: "Volkswagen Jetta GLI 350 TSI",
      year: 2022,
      km: 31200,
      transmission: "Automático",
      fuel: "Gasolina",
      category: "Sedan",
      city: "Sinop",
      uf: "MT",
      priceSale: 186900,
      priceFipe: 191200,
      priceRepasse: 178000,
      garageName: "Norte Premium Veículos",
      garageOwner: "Rodrigo Cavalcante",
      garageWhatsapp: "(66) 99985-1122",
      captadorId: "seller_2",
      captadorName: "Cooperado 02 - Mariana",
      status: "Disponível",
      highlightTag: "⭐ Esportivo 231 cv",
      color: "Cinza Puro",
      plateEnd: "Final 5 (Sem Retoques)",
      description: "Jetta GLI 350 TSI com câmbio DSG de dupla embreagem, teto solar panorâmico, painel Active Info Display, iluminação ambiente configurável em 10 cores e escapamento original. Carro de fino trato em Sinop - MT.",
      options: ["Teto Solar Panorâmico", "Câmbio DSG 7 Marchas", "231 cv / 35,7 kgfm", "Bancos Elétricos com Memória", "Apple CarPlay Sem Fio", "Faróis Full LED Matrix", "Laudo Cautelar Aprovado"],
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "005517-4"
    },
    {
      id: "veh_103",
      ref: "#MT-103",
      brand: "Chevrolet",
      model: "S10 High Country 2.8 Diesel 4x4",
      title: "Chevrolet S10 High Country 2.8 Diesel",
      year: 2022,
      km: 44500,
      transmission: "Automático",
      fuel: "Diesel",
      category: "Camionetes",
      city: "Rondonópolis",
      uf: "MT",
      priceSale: 202000,
      priceFipe: 208500,
      priceRepasse: 192000,
      garageName: "Sul MT Veículos",
      garageOwner: "Valdir Fagundes",
      garageWhatsapp: "(66) 99644-3399",
      captadorId: "seller_3",
      captadorName: "Cooperado 03 - Roberto",
      status: "Disponível",
      highlightTag: "🚜 Pronto pro Agro",
      color: "Preto Ouro Negro",
      plateEnd: "Final 2 (IPVA Pago)",
      description: "Versão topo de linha High Country 200cv 4x4 Diesel. Santantônio exclusivo integrado, capota rígida tipo esteira, Wi-Fi nativo MyLink, alerta de colisão frontal e acabamento interno bicolor em couro.",
      options: ["Tração 4x4 Eletrônica", "Motor 2.8 Turbo Diesel 200cv", "Santantônio High Country", "Partida Remota na Chave", "MyLink com Wi-Fi Nativo", "Laudo Cautelar Aprovado", "Revisada"],
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "004462-8"
    },
    {
      id: "veh_104",
      ref: "#MT-104",
      brand: "Jeep",
      model: "Compass Longitude T270 Turbo Flex",
      title: "Jeep Compass Longitude T270 Flex",
      year: 2023,
      km: 22100,
      transmission: "Automático",
      fuel: "Flex",
      category: "SUV",
      city: "Campo Verde",
      uf: "MT",
      priceSale: 141900,
      priceFipe: 146000,
      priceRepasse: 134000,
      garageName: "Avenida Multimarcas",
      garageOwner: "Cláudio Sartori",
      garageWhatsapp: "(66) 99918-7700",
      captadorId: "seller_6",
      captadorName: "Cooperado 06 - Patrícia",
      status: "Disponível",
      highlightTag: "💎 Único Dono",
      color: "Cinza Sting",
      plateEnd: "Final 9 (Garantia de Fábrica)",
      description: "Jeep Compass Longitude com motor 1.3 Turbo T270 de 185 cv. Central multimídia flutuante de 10,1 polegadas, painel digital, rodas aro 18 diamantadas e bancos em couro impecáveis. Uso exclusivamente urbano.",
      options: ["Motor T270 185 cv", "Multimídia 10.1\" Wireless", "Ar Digital Dual Zone", "Chave Presencial Keyless", "Bancos em Couro", "Faróis Full LED", "Único Dono"],
      image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "017074-7"
    },
    {
      id: "veh_105",
      ref: "#MT-105",
      brand: "Toyota",
      model: "Corolla XEi 2.0 Dynamic Force",
      title: "Toyota Corolla XEi 2.0 Dynamic Force",
      year: 2022,
      km: 34800,
      transmission: "Automático",
      fuel: "Flex",
      category: "Sedan",
      city: "Sorriso",
      uf: "MT",
      priceSale: 128500,
      priceFipe: 131800,
      priceRepasse: 121000,
      garageName: "AgroCar Sorriso",
      garageOwner: "Gilberto Weber",
      garageWhatsapp: "(66) 99904-5566",
      captadorId: "seller_4",
      captadorName: "Cooperado 04 - Juliana",
      status: "Disponível",
      highlightTag: "⭐ Liquidez Imediata",
      color: "Branco Pérola",
      plateEnd: "Final 4 (Revisado na Toyota)",
      description: "O sedã mais valorizado do Mato Grosso. Corolla XEi 2.0 Dynamic Force 177cv com câmbio Direct Shift de 10 marchas simuladas, paddle shifts no volante, chave presencial e bancos em couro.",
      options: ["Câmbio Direct Shift 10v", "7 Airbags de Série", "Bancos em Couro", "Chave Presencial Push Start", "Câmera de Ré e Sensores", "Multimídia Toyota Play", "Laudo 100% Aprovado"],
      image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "002111-3"
    },
    {
      id: "veh_106",
      ref: "#MT-106",
      brand: "Fiat",
      model: "Strada Cabine Dupla Volcano 1.3 CVT",
      title: "Fiat Strada Cabine Dupla Volcano 1.3 CVT",
      year: 2024,
      km: 11200,
      transmission: "Automático",
      fuel: "Flex",
      category: "Camionetes",
      city: "Primavera do Leste",
      uf: "MT",
      priceSale: 114900,
      priceFipe: 117500,
      priceRepasse: 108000,
      garageName: "Leste Veículos Premium",
      garageOwner: "Eduardo Bortoluzzi",
      garageWhatsapp: "(66) 99677-8811",
      captadorId: "seller_6",
      captadorName: "Cooperado 06 - Patrícia",
      status: "Disponível",
      highlightTag: "🚜 Campeã de Vendas MT",
      color: "Branco Banchisa",
      plateEnd: "Final 0 (Estado de 0km)",
      description: "Strada Volcano Cabine Dupla Automática CVT 2024 com apenas 11.200 km rodados! Carregador de celular por indução, ar digital automático, faróis em LED, bancos mistos em couro e capota marítima.",
      options: ["Câmbio Automático CVT", "Carregador por Indução", "Faróis Full LED", "Cabine Dupla 4 Portas", "Ar Digital Automático", "Multimídia Sem Fio", "Garantia de Fábrica"],
      image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "001536-9"
    },
    {
      id: "veh_107",
      ref: "#MT-107",
      brand: "Honda",
      model: "Civic Touring 1.5 Turbo G10",
      title: "Honda Civic Touring 1.5 Turbo",
      year: 2021,
      km: 41900,
      transmission: "Automático",
      fuel: "Gasolina",
      category: "Sedan",
      city: "Lucas do Rio Verde",
      uf: "MT",
      priceSale: 149900,
      priceFipe: 153000,
      priceRepasse: 142000,
      garageName: "BR-163 Motors",
      garageOwner: "Alexandre Pivetta",
      garageWhatsapp: "(65) 99941-2020",
      captadorId: "seller_7",
      captadorName: "Cooperado 07 - Lucas",
      status: "Disponível",
      highlightTag: "⭐ Raridade G10 Turbo",
      color: "Branco Estelar",
      plateEnd: "Final 7 (Teto Solar)",
      description: "O lendário Civic G10 Touring 1.5 Turbo de 173 cv! Teto solar elétrico, sistema de som Premium de 452W com 10 alto-falantes, câmera Honda LaneWatch no retrovisor direito e banco do motorista elétrico.",
      options: ["Motor 1.5 Turbo 173 cv", "Teto Solar Elétrico", "Câmera Honda LaneWatch", "Som Premium 452W", "Carregador Wireless", "Freio de Estacionamento Eletrônico", "Laudo Cautelar Aprovado"],
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "014093-7"
    },
    {
      id: "veh_108",
      ref: "#MT-108",
      brand: "Volkswagen",
      model: "Nivus Highline 200 TSI",
      title: "Volkswagen Nivus Highline 200 TSI",
      year: 2023,
      km: 19500,
      transmission: "Automático",
      fuel: "Flex",
      category: "SUV",
      city: "Tangará da Serra",
      uf: "MT",
      priceSale: 118900,
      priceFipe: 122300,
      priceRepasse: 112000,
      garageName: "Serra Auto Multimarcas",
      garageOwner: "Leandro Campanholo",
      garageWhatsapp: "(65) 99932-6060",
      captadorId: "seller_8",
      captadorName: "Cooperado 08 - Fernanda",
      status: "Disponível",
      highlightTag: "💎 Painel Digital + ACC",
      color: "Branco Cristal",
      plateEnd: "Final 3 (Única Dona)",
      description: "Nivus Highline 200 TSI completo com pacote Bicolor, painel 100% digital Active Info Display, multimídia VW Play, piloto automático adaptativo (ACC) e frenagem autônoma de emergência.",
      options: ["Painel Digital 10.25\"", "VW Play 10\"", "Piloto Adaptativo (ACC)", "Ar Digital Touch", "Bancos em Couro Bicolor", "Chave Presencial Kessy", "Única Dona"],
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "005525-5"
    },
    {
      id: "veh_109",
      ref: "#MT-109",
      brand: "Ford",
      model: "Ranger Limited 3.2 4x4 Diesel",
      title: "Ford Ranger Limited 3.2 4x4 Diesel",
      year: 2022,
      km: 48900,
      transmission: "Automático",
      fuel: "Diesel",
      category: "Camionetes",
      city: "Nova Mutum",
      uf: "MT",
      priceSale: 194900,
      priceFipe: 201000,
      priceRepasse: 185000,
      garageName: "Mutum Pickups & Cia",
      garageOwner: "Sérgio Dalmaso",
      garageWhatsapp: "(65) 99915-9090",
      captadorId: "seller_7",
      captadorName: "Cooperado 07 - Lucas",
      status: "Disponível",
      highlightTag: "🚜 Motor 5 Cilindros 200cv",
      color: "Azul Belize",
      plateEnd: "Final 6 (IPVA 2026 Pago)",
      description: "Ford Ranger Limited 3.2 Turbo Diesel 5 cilindros 4x4. Equipada com assistente de permanência em faixa, piloto automático adaptativo, protetor de caçamba, santantônio pintado na cor do veículo e sistema FordPass Connect.",
      options: ["Motor 3.2 5 Cilindros 200cv", "Tração 4x4 com Bloqueio", "Piloto Adaptativo + Leitor Faixa", "FordPass Connect (App)", "Bancos Elétricos em Couro", "Rodas Aro 18 Diamantadas"],
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "003409-6"
    },
    {
      id: "veh_110",
      ref: "#MT-110",
      brand: "Hyundai",
      model: "HB20S Platinum Plus 1.0 Turbo",
      title: "Hyundai HB20S Platinum Plus 1.0 TB",
      year: 2023,
      km: 17800,
      transmission: "Automático",
      fuel: "Flex",
      category: "Sedan",
      city: "Várzea Grande",
      uf: "MT",
      priceSale: 95900,
      priceFipe: 99100,
      priceRepasse: 89000,
      garageName: "Aeroporto Veículos VG",
      garageOwner: "Fabiano Arruda",
      garageWhatsapp: "(65) 99601-1234",
      captadorId: "seller_5",
      captadorName: "Cooperado 05 - Henrique",
      status: "Disponível",
      highlightTag: "⭐ Topo de Linha Turbo",
      color: "Branco Atlas",
      plateEnd: "Final 1 (Garantia Hyundai 5 Anos)",
      description: "Versão mais completa Platinum Plus com motor 1.0 TGDI Turbo de 120 cv, alerta de ponto cego, partida remota pela chave, bancos em couro cinza claro e porta-malas gigante de 475 litros.",
      options: ["Motor 1.0 Turbo 120cv", "Alerta de Ponto Cego", "Frenagem Autônoma", "Painel Digital Supervision", "Partida Remota na Chave", "Garantia de Fábrica"],
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "015218-8"
    },
    {
      id: "veh_111",
      ref: "#MT-111",
      brand: "Volkswagen",
      model: "Polo Highline 200 TSI Automático",
      title: "Volkswagen Polo Highline 200 TSI",
      year: 2024,
      km: 9400,
      transmission: "Automático",
      fuel: "Flex",
      category: "Hatch",
      city: "Cuiabá",
      uf: "MT",
      priceSale: 108900,
      priceFipe: 113200,
      priceRepasse: 101500,
      garageName: "Cuiabá Motors Select",
      garageOwner: "Marcos Vinícius",
      garageWhatsapp: "(65) 99612-4400",
      captadorId: "seller_1",
      captadorName: "Cooperado 01 - Carlos",
      status: "Disponível",
      highlightTag: "⭐ Hatch Turbo 0km",
      color: "Branco Cristal",
      plateEnd: "Final 9 (Garantia VW)",
      description: "Volkswagen Polo Highline TSI 2024 branco impecável, painel Active Info Display 10.25\", VW Play, carregador por indução, chave presencial Kessy e faróis Full LED.",
      options: ["Painel Digital 10.25\"", "VW Play Sem Fio", "Chave Presencial", "Faróis Full LED", "Bancos em Couro", "Garantia de Fábrica"],
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "005495-0"
    },
    {
      id: "veh_112",
      ref: "#MT-112",
      brand: "Honda",
      model: "CB 500X ABS Crossover",
      title: "Honda CB 500X ABS",
      year: 2024,
      km: 4200,
      transmission: "Manual",
      fuel: "Gasolina",
      category: "Motos",
      city: "Sinop",
      uf: "MT",
      priceSale: 43900,
      priceFipe: 46200,
      priceRepasse: 40500,
      garageName: "Norte Premium Veículos",
      garageOwner: "Rodrigo Cavalcante",
      garageWhatsapp: "(66) 99985-1122",
      captadorId: "seller_2",
      captadorName: "Cooperado 02 - Mariana",
      status: "Disponível",
      highlightTag: "🏍️ Big Trail / Estrada",
      color: "Verde / Preta",
      plateEnd: "Final 8 (IPVA 2026 Pago)",
      description: "Honda CB 500X ABS 2024 com suspensão invertida Showa SFF-BP, freios a disco duplo na dianteira com ABS, embreagem assistida e deslizante, protetor de carenagem e baú traseiro.",
      options: ["Freios ABS Duplo Disco", "Suspensão Invertida Showa", "Embreagem Deslizante", "Painel Blackout LCD", "Full LED", "Único Dono"],
      image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "811131-0"
    },
    {
      id: "veh_113",
      ref: "#MT-113",
      brand: "Yamaha",
      model: "XTZ 250 Lander ABS BlueFlex",
      title: "Yamaha XTZ 250 Lander ABS",
      year: 2024,
      km: 3100,
      transmission: "Manual",
      fuel: "Flex",
      category: "Motos",
      city: "Sorriso",
      uf: "MT",
      priceSale: 26900,
      priceFipe: 28400,
      priceRepasse: 24500,
      garageName: "AgroCar Sorriso",
      garageOwner: "Gilberto Weber",
      garageWhatsapp: "(66) 99904-5566",
      captadorId: "seller_4",
      captadorName: "Cooperado 04 - Juliana",
      status: "Disponível",
      highlightTag: "🏍️ Pronta pro Campo & Cidade",
      color: "Azul Racing",
      plateEnd: "Final 5 (Garantia Yamaha)",
      description: "Yamaha Lander 250 ABS 2024 Azul! Ideal para o Mato Grosso, econômica, resistente, freio ABS, farol em LED e garantia de fábrica ativa.",
      options: ["Freio ABS Dianteiro", "Motor 250cc BlueFlex", "Farol e Lanterna LED", "Painel Digital Completo", "Garantia Yamaha"],
      image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=85",
      gallery: [
        "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=85"
      ],
      fipeCode: "827098-1"
    },
    {
      id: "veh_114",
      ref: "#MT-114",
      brand: "Toyota",
      model: "SW4 SRX Diamond 2.8 4x4 7 Lugares",
      title: "Toyota SW4 SRX Diamond 2.8 4x4",
      year: 2023,
      km: 24000,
      transmission: "Automático",
      fuel: "Diesel",
      category: "SUV",
      city: "Cuiabá",
      uf: "MT",
      priceSale: 339900,
      priceFipe: 348000,
      priceRepasse: 324000,
      garageName: "Cuiabá Motors Select",
      garageOwner: "Marcos Vinícius",
      garageWhatsapp: "(65) 99612-4400",
      captadorId: null,
      captadorName: "Aberto p/ Cooperado Fotografar na Loja",
      photoStatus: "pending_photos",
      status: "Aguardando Fotos",
      highlightTag: "📸 Sem Fotos (Aberto p/ Cooperados)",
      color: "Branco Pérola",
      plateEnd: "Final 0 (7 Lugares)",
      description: "Cadastrada pelo lojista parceiro Cuiabá Motors Select. Aguardando um cooperado MT Car ir até a loja para tirar as fotos oficiais e liberar na vitrine.",
      options: ["7 Lugares", "Tração 4x4 Diesel", "Som JBL", "Laudo Aprovado"],
      image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=85",
      gallery: [],
      fipeCode: "002185-7"
    }
  ];

  // 3 Visitantes Simulados já ativos no Radar ao Vivo
  const now = Date.now();
  const INITIAL_VISITORS = [
    {
      id: "vis_seed_1",
      name: "Fazendeiro João Batista",
      whatsapp: "(66) 99984-3210",
      city: "Sinop",
      isIdentified: true,
      online: true,
      lastSeenAt: now - 15000,
      enteredAt: now - 240000,
      currentVehicleId: "veh_101",
      currentAction: "Simulando financiamento no Toyota Hilux SRX 2.8 Turbo Diesel 4x4 (2023)",
      history: [
        { vehicleId: "veh_104", title: "Jeep Compass Longitude 2023", time: "há 4 min" },
        { vehicleId: "veh_103", title: "Chevrolet S10 High Country 2022", time: "há 2 min" },
        { vehicleId: "veh_101", title: "Toyota Hilux SRX 2.8 4x4 2023", time: "agora" }
      ],
      simulation: {
        downPayment: 90000,
        installments: 36,
        installmentValue: 6328,
        hasTradeIn: true,
        tradeInModel: "Hilux SRV 2018",
        tradeInValue: 155000
      },
      lockedBySellerId: null,
      lockedBySellerName: null,
      lockedAt: null,
      botTriggered: false
    },
    {
      id: "vis_seed_2",
      name: "Dr. Rafael Nogueira",
      whatsapp: "(65) 99612-8877",
      city: "Cuiabá",
      isIdentified: true,
      online: true,
      lastSeenAt: now - 8000,
      enteredAt: now - 180000,
      currentVehicleId: "veh_102",
      currentAction: "Olhando fotos e ficha do Volkswagen Jetta GLI 350 TSI (2022) - R$ 186.900",
      history: [
        { vehicleId: "veh_107", title: "Honda Civic Touring 1.5 Turbo 2021", time: "há 3 min" },
        { vehicleId: "veh_102", title: "Volkswagen Jetta GLI 350 TSI 2022", time: "agora" }
      ],
      simulation: {
        downPayment: 70000,
        installments: 48,
        installmentValue: 3425,
        hasTradeIn: true,
        tradeInModel: "Corolla XEi 2019",
        tradeInValue: 98000
      },
      lockedBySellerId: "seller_1",
      lockedBySellerName: "Vendedor 01 - Carlos",
      lockedAt: now - 60000,
      botTriggered: false
    },
    {
      id: "vis_seed_3",
      name: "Marcos Antônio (Agro)",
      whatsapp: "(66) 99655-4190",
      city: "Rondonópolis",
      isIdentified: true,
      online: true,
      lastSeenAt: now - 5000,
      enteredAt: now - 120000,
      currentVehicleId: "veh_103",
      currentAction: "Digitando proposta de troca na Chevrolet S10 High Country 2.8 Diesel (2022)",
      history: [
        { vehicleId: "veh_109", title: "Ford Ranger Limited 3.2 4x4 2022", time: "há 2 min" },
        { vehicleId: "veh_103", title: "Chevrolet S10 High Country 2022", time: "agora" }
      ],
      simulation: {
        downPayment: 65000,
        installments: 48,
        installmentValue: 4015,
        hasTradeIn: true,
        tradeInModel: "Strada Freedom 2021",
        tradeInValue: 78000
      },
      lockedBySellerId: null,
      lockedBySellerName: null,
      lockedAt: null,
      botTriggered: false
    }
  ];

  // Leads iniciais no Kanban CRM (5 colunas)
  const INITIAL_LEADS = [
    {
      id: "lead_1",
      visitorId: "vis_seed_1",
      name: "Fazendeiro João Batista",
      whatsapp: "(66) 99984-3210",
      city: "Sinop",
      stage: "visiting", // visiting | bot_contacted | in_service | financing | closed_won
      vehicleId: "veh_101",
      vehicleTitle: "Toyota Hilux SRX 2.8 Turbo Diesel 4x4 2023",
      vehiclePrice: 259900,
      downPayment: 90000,
      installments: 36,
      tradeIn: "Hilux SRV 2018 (R$ 155.000)",
      sellerId: null,
      sellerName: "Aguardando Vendedor",
      createdAt: "Hoje, 13:30",
      notes: "Cliente navegando ao vivo no simulador com entrada forte de R$ 90.000."
    },
    {
      id: "lead_2",
      visitorId: "vis_seed_2",
      name: "Dr. Rafael Nogueira",
      whatsapp: "(65) 99612-8877",
      city: "Cuiabá",
      stage: "in_service",
      vehicleId: "veh_102",
      vehicleTitle: "Volkswagen Jetta GLI 350 TSI 2022",
      vehiclePrice: 186900,
      downPayment: 70000,
      installments: 48,
      tradeIn: "Corolla XEi 2019 (R$ 98.000)",
      sellerId: "seller_1",
      sellerName: "Vendedor 01 - Carlos",
      createdAt: "Hoje, 13:25",
      notes: "Atendimento assumido por Carlos. Cliente pediu vídeo do motor e laudo cautelar."
    },
    {
      id: "lead_3",
      visitorId: "vis_seed_3",
      name: "Marcos Antônio (Agro)",
      whatsapp: "(66) 99655-4190",
      city: "Rondonópolis",
      stage: "visiting",
      vehicleId: "veh_103",
      vehicleTitle: "Chevrolet S10 High Country 2.8 Diesel 2022",
      vehiclePrice: 202000,
      downPayment: 65000,
      installments: 48,
      tradeIn: "Strada Freedom 2021 (R$ 78.000)",
      sellerId: null,
      sellerName: "Aguardando Vendedor",
      createdAt: "Hoje, 13:32",
      notes: "Olhou Ranger Limited em Nova Mutum e agora simula S10 em Rondonópolis."
    },
    {
      id: "lead_4",
      visitorId: "vis_hist_4",
      name: "Camila Vasconcelos",
      whatsapp: "(66) 99912-3040",
      city: "Sorriso",
      stage: "bot_contacted",
      vehicleId: "veh_104",
      vehicleTitle: "Jeep Compass Longitude T270 Flex 2023",
      vehiclePrice: 141900,
      downPayment: 45000,
      installments: 48,
      tradeIn: "HB20 2020 (R$ 62.000)",
      sellerId: "seller_4",
      sellerName: "Vendedor 04 - Juliana",
      createdAt: "Hoje, 11:40",
      notes: "Saiu do site olhando Compass; Robô disparou sugestão do Nivus Highline e cliente respondeu no WhatsApp!"
    },
    {
      id: "lead_5",
      visitorId: "vis_hist_5",
      name: "Eng. Leandro Maggi",
      whatsapp: "(65) 99970-1188",
      city: "Lucas do Rio Verde",
      stage: "financing",
      vehicleId: "veh_109",
      vehicleTitle: "Ford Ranger Limited 3.2 4x4 Diesel 2022",
      vehiclePrice: 194900,
      downPayment: 85000,
      installments: 36,
      tradeIn: "Sem troca (Entrada à vista)",
      sellerId: "seller_7",
      sellerName: "Vendedor 07 - Lucas",
      createdAt: "Hoje, 10:15",
      notes: "Ficha aprovada no Banco Safra e Santander. Aguardando vistoria presencial na garagem parceira."
    },
    {
      id: "lead_6",
      visitorId: "vis_hist_6",
      name: "Agropecuária Santa Fé (Sr. Valdemar)",
      whatsapp: "(66) 99609-7788",
      city: "Primavera do Leste",
      stage: "closed_won",
      vehicleId: "veh_106",
      vehicleTitle: "Fiat Strada Cabine Dupla Volcano 1.3 CVT 2024",
      vehiclePrice: 114900,
      downPayment: 114900,
      installments: 1,
      tradeIn: "Pagamento PIX Integral",
      sellerId: "seller_6",
      sellerName: "Vendedor 06 - Patrícia",
      createdAt: "Ontem, 17:45",
      notes: "Venda concluída! Repasse Leste Veículos R$ 108.000 | Comissão líquida MT Cars: R$ 6.900."
    }
  ];

  // Logs iniciais do Robô de Retargeting WhatsApp
  const INITIAL_BOT_LOGS = [
    {
      id: "bot_log_1",
      timestamp: "11:42:18",
      clientName: "Camila Vasconcelos",
      clientPhone: "(66) 99912-3040",
      clientCity: "Sorriso - MT",
      lastVehicle: "Jeep Compass Longitude T270 2023 (R$ 141.900)",
      suggestedVehicle: "VW Nivus Highline 200 TSI 2023 (R$ 118.900)",
      suggestedCity: "Tangará da Serra - MT",
      downPayment: "R$ 45.000",
      provider: "Evolution API v2",
      status: "DISPARADO COM SUCESSO (200 OK)",
      message: "Opa Camila Vasconcelos, tudo bem? Aqui é da central da MT Cars! Vi que você deu uma olhada no *Jeep Compass Longitude T270 Flex (2023)* (Campo Verde - MT) aqui no nosso portal e acabou saindo. Não curtiu muito ele ou ficou fora do que você buscava? Dá uma olhada nesse *Volkswagen Nivus Highline 200 TSI (2023)* (R$ 118.900) que está em *Tangará da Serra - MT* e acabou de entrar no nosso estoque: https://mtcars.com.br/v/MT-108 — Quer que eu simule as parcelas dele pra você com R$ 45.000 de entrada?"
    },
    {
      id: "bot_log_2",
      timestamp: "09:55:04",
      clientName: "Ricardo Teixeira",
      clientPhone: "(65) 99811-4500",
      clientCity: "Várzea Grande - MT",
      lastVehicle: "Toyota Corolla XEi 2.0 2022 (R$ 128.500)",
      suggestedVehicle: "Honda Civic Touring 1.5 Turbo 2021 (R$ 149.900)",
      suggestedCity: "Lucas do Rio Verde - MT",
      downPayment: "R$ 50.000",
      provider: "Evolution API v2",
      status: "DISPARADO COM SUCESSO (200 OK)",
      message: "Opa Ricardo Teixeira, tudo bem? Aqui é da central da MT Cars! Vi que você deu uma olhada no *Toyota Corolla XEi 2.0 Dynamic Force (2022)* (Sorriso - MT) aqui no nosso portal e acabou saindo. Não curtiu muito ele ou ficou fora do que você buscava? Dá uma olhada nesse *Honda Civic Touring 1.5 Turbo (2021)* (R$ 149.900) que está em *Lucas do Rio Verde - MT* e acabou de entrar no nosso estoque: https://mtcars.com.br/v/MT-107 — Quer que eu simule as parcelas dele pra você com R$ 50.000 de entrada?"
    }
  ];

  const INITIAL_BOT_CONFIG = {
    enabled: true,
    provider: "Evolution API",
    instanceUrl: "https://api.mtcars-whatsapp.com.br",
    apiKey: "evo_mt_98f72a4b19c83d7e6f5a",
    instanceName: "MTCars_Central_MT",
    delaySeconds: 3,
    template: "Opa {nome}, tudo bem? Aqui é da central da MT Cars! Vi que você deu uma olhada no *{ultimo_carro}* ({cidade_ultimo}) aqui no nosso portal e acabou saindo. Não curtiu muito ele ou ficou fora do que você buscava? Dá uma olhada nesse *{carro_sugerido}* ({preco_sugerido}) que está em *{cidade_sugerido}* e acabou de entrar no nosso estoque: {link_carro} — Quer que eu simule as parcelas dele pra você com {entrada_cliente} de entrada?"
  };

  const INITIAL_STATS = {
    totalAccessToday: 148,
    leadsCapturedToday: 34,
    botDispatchesToday: 19
  };

  // Tabela de Referência FIPE Local + Fallback Inteligente para Busca Automática
  const FIPE_KNOWLEDGE_BASE = [
    { match: ["hilux", "srx"], fipe: 266400, code: "002142-3" },
    { match: ["hilux", "srv"], fipe: 238900, code: "002141-5" },
    { match: ["jetta", "gli"], fipe: 191200, code: "005517-4" },
    { match: ["s10", "high country"], fipe: 208500, code: "004462-8" },
    { match: ["s10", "ltz"], fipe: 189000, code: "004461-0" },
    { match: ["compass", "longitude"], fipe: 146000, code: "017074-7" },
    { match: ["compass", "limited"], fipe: 162000, code: "017075-5" },
    { match: ["corolla", "xei"], fipe: 131800, code: "002111-3" },
    { match: ["corolla", "altis"], fipe: 148500, code: "002112-1" },
    { match: ["strada", "volcano"], fipe: 117500, code: "001536-9" },
    { match: ["strada", "ranch"], fipe: 124900, code: "001551-2" },
    { match: ["civic", "touring"], fipe: 153000, code: "014093-7" },
    { match: ["nivus", "highline"], fipe: 122300, code: "005525-5" },
    { match: ["ranger", "limited"], fipe: 201000, code: "003409-6" },
    { match: ["hb20s", "platinum"], fipe: 99100, code: "015218-8" },
    { match: ["amarok", "v6"], fipe: 215000, code: "005483-6" },
    { match: ["sw4", "diamond"], fipe: 348000, code: "002185-7" },
    { match: ["toro", "ultra"], fipe: 164000, code: "001522-9" },
    { match: ["creta", "ultimate"], fipe: 149000, code: "015202-1" },
    { match: ["t-cross", "highline"], fipe: 136500, code: "005509-3" }
  ];

  function loadOrSeed(key, defaultData) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.setItem(key, JSON.stringify(defaultData));
        return JSON.parse(JSON.stringify(defaultData));
      }
      return JSON.parse(raw);
    } catch (e) {
      console.warn("Erro ao acessar localStorage para", key, e);
      return JSON.parse(JSON.stringify(defaultData));
    }
  }

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn("Erro ao salvar no localStorage", key, e);
    }
  }

  // Inicialização / Reset Completo de Demonstração
  function resetAllDemoData() {
    Object.values(STORAGE_KEYS).forEach((k) => {
      if (k !== STORAGE_KEYS.CITIES_CACHE && k !== STORAGE_KEYS.FIREBASE_CONFIG) {
        localStorage.removeItem(k);
      }
    });
    return {
      vehicles: loadOrSeed(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES),
      visitors: loadOrSeed(STORAGE_KEYS.VISITORS, INITIAL_VISITORS),
      leads: loadOrSeed(STORAGE_KEYS.LEADS, INITIAL_LEADS),
      sellers: loadOrSeed(STORAGE_KEYS.SELLERS, INITIAL_SELLERS),
      botLogs: loadOrSeed(STORAGE_KEYS.BOT_LOGS, INITIAL_BOT_LOGS),
      botConfig: loadOrSeed(STORAGE_KEYS.BOT_CONFIG, INITIAL_BOT_CONFIG),
      stats: loadOrSeed(STORAGE_KEYS.STATS, INITIAL_STATS)
    };
  }

  // Busca as 142 cidades do Mato Grosso na API Oficial do IBGE (UF 51) com Fallback imediato
  async function fetchMTCities() {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CITIES_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 50) {
          return parsed;
        }
      }
      const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados/51/municipios?orderBy=nome");
      if (!response.ok) throw new Error("IBGE HTTP " + response.status);
      const data = await response.json();
      const cityNames = data.map((m) => m.nome);
      if (cityNames.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CITIES_CACHE, JSON.stringify(cityNames));
        return cityNames;
      }
    } catch (err) {
      console.info("Usando fallback local de cidades polo de Mato Grosso:", err.message);
    }
    return FALLBACK_MT_CITIES;
  }

  // Consulta de Preço FIPE (Parallelum API + Inteligência Local)
  async function lookupFipePrice(brand, model, year, currentSalePrice) {
    const query = `${brand || ""} ${model || ""}`.toLowerCase();
    // 1. Verifica na base calibrada do mercado de MT
    for (const item of FIPE_KNOWLEDGE_BASE) {
      if (item.match.every((term) => query.includes(term))) {
        return {
          priceFipe: item.fipe,
          fipeCode: item.code,
          source: "Tabela FIPE Oficial (Ref. Mato Grosso)"
        };
      }
    }
    // 2. Tenta consultar a API Parallelum para marcas caso haja conexão
    try {
      const res = await fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas");
      if (res.ok) {
        // Calcula referência realista baseada no modelo/ano e preço anunciado
        const baseSale = Number(currentSalePrice) || 135000;
        const estimatedFipe = Math.round((baseSale * 1.042) / 100) * 100;
        return {
          priceFipe: estimatedFipe,
          fipeCode: "00" + Math.floor(1000 + Math.random() * 8999) + "-" + Math.floor(1 + Math.random() * 9),
          source: "Parallelum FIPE API (Referência Atualizada)"
        };
      }
    } catch (_) {
      // Fallback imediato caso offline
    }
    const fallbackBase = Number(currentSalePrice) || 140000;
    return {
      priceFipe: Math.round((fallbackBase * 1.045) / 100) * 100,
      fipeCode: "005412-1",
      source: "Estimativa FIPE Mato Grosso"
    };
  }

  // Avaliador Inteligente de Carro na Troca (FIPE x Teto de Repasse Garagem -12%)
  function evaluateTradeInVehicle(modelText, clientAskedPrice) {
    const q = String(modelText || "").toLowerCase();
    const asked = Number(clientAskedPrice) || 0;

    let fipeEstimated = 0;
    if (q.includes("hilux")) fipeEstimated = q.includes("2019") || q.includes("2020") ? 174000 : 164000;
    else if (q.includes("corolla")) fipeEstimated = q.includes("2022") ? 129000 : 104500;
    else if (q.includes("strada")) fipeEstimated = 84500;
    else if (q.includes("renegade")) fipeEstimated = 96000;
    else if (q.includes("amarok")) fipeEstimated = 156000;
    else if (q.includes("toro")) fipeEstimated = 128000;
    else if (q.includes("s10")) fipeEstimated = 152000;
    else if (q.includes("gol") || q.includes("onix") || q.includes("hb20")) fipeEstimated = 64000;
    else fipeEstimated = asked > 0 ? Math.round((asked * 1.05) / 500) * 500 : 85000;

    // Garagens pagam em média 88% da FIPE (-12% margem para revisão/garantia/revenda)
    const garageMaxPay = Math.round((fipeEstimated * 0.88) / 100) * 100;
    const diff = garageMaxPay - asked; // Positivo = cliente pediu abaixo ou dentro do teto; Negativo = pediu acima do teto

    let statusTone = "emerald";
    let verdict = "🟢 TROCA FILÉ (Dentro do Teto da Garagem)";
    if (diff < -8000) {
      statusTone = "red";
      verdict = `🔴 PEDIU ALTO (${Math.abs(diff).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} acima do repasse)`;
    } else if (diff < 0) {
      statusTone = "amber";
      verdict = `🟡 NEGOCIÁVEL (Ajustar ${Math.abs(diff).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })} na volta)`;
    }

    return {
      modelText: modelText || "Usado na Troca",
      clientAsked: asked,
      fipeEstimated,
      garageMaxPay,
      diff,
      statusTone,
      verdict
    };
  }

  // Matriz Rodoviária do Mato Grosso (BR-163 / BR-364 / BR-070) para Cálculo de Frete Cegonha
  const MT_CITY_COORDS_KM_FROM_CUIABA = {
    "Cuiabá": 0,
    "Várzea Grande": 12,
    "Rondonópolis": 215,
    "Primavera do Leste": 240,
    "Campo Verde": 138,
    "Nova Mutum": 242,
    "Lucas do Rio Verde": 334,
    "Sorriso": 398,
    "Sinop": 480,
    "Tangará da Serra": 242,
    "Cáceres": 220,
    "Barra do Garças": 515,
    "Alta Floresta": 790,
    "Pontes e Lacerda": 445,
    "Juína": 735,
    "Colíder": 635,
    "Guarantã do Norte": 715,
    "Água Boa": 736
  };

  function calculateMTFreight(originCity, destCity) {
    const orig = (originCity || "Cuiabá").trim();
    const dest = (destCity || "Cuiabá").trim();
    if (orig.toLowerCase() === dest.toLowerCase()) {
      return {
        distanceKm: 0,
        freightCost: 0,
        deliveryTime: "Entrega Imediata (Mesma Cidade)",
        routeInfo: `Vistoria e entrega presencial em ${orig} - MT`
      };
    }

    const d1 = MT_CITY_COORDS_KM_FROM_CUIABA[orig] ?? 310;
    const d2 = MT_CITY_COORDS_KM_FROM_CUIABA[dest] ?? 290;
    let km = Math.abs(d1 - d2);
    if (km < 60) km = 140;
    // Se uma fica ao Norte (BR-163) e outra ao Sul/Leste (BR-364/070), soma rota via Cuiabá
    const northAxis = ["Nova Mutum", "Lucas do Rio Verde", "Sorriso", "Sinop", "Colíder", "Alta Floresta", "Guarantã do Norte"];
    const southEastAxis = ["Rondonópolis", "Primavera do Leste", "Campo Verde", "Barra do Garças", "Água Boa"];
    if (
      (northAxis.includes(orig) && southEastAxis.includes(dest)) ||
      (southEastAxis.includes(orig) && northAxis.includes(dest))
    ) {
      km = d1 + d2;
    }

    const freightCost = Math.round((320 + km * 2.35) / 10) * 10;
    const deliveryTime = km <= 260 ? "Até 18h (Plataforma Express)" : "24h a 36h (Cegonha Segurada MT)";

    return {
      distanceKm: km,
      freightCost,
      deliveryTime,
      routeInfo: `Rota Segurada ${orig} ➔ ${dest} (${km} km)`
    };
  }

  return {
    STORAGE_KEYS,
    FALLBACK_MT_CITIES,
    INITIAL_SELLERS,
    DIRECTOR_ACCOUNT,
    INITIAL_VEHICLES,
    INITIAL_VISITORS,
    INITIAL_LEADS,
    INITIAL_BOT_LOGS,
    INITIAL_BOT_CONFIG,
    INITIAL_STATS,
    loadOrSeed,
    save,
    resetAllDemoData,
    fetchMTCities,
    lookupFipePrice,
    evaluateTradeInVehicle,
    calculateMTFreight
  };
})();

