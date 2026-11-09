/**
 * Módulo de Almacenamiento Local (LocalStorage + IndexedDB Fallback)
 * Gestiona el inventario de activos, exportación a Excel/CSV y copias de seguridad.
 */

const STORAGE_KEY = 'activos_punto_de_venta_v1';
const STORAGE_LOCATIONS_KEY = 'activos_pos_ubicaciones_v1';

const UBICACIONES_PREDETERMINADAS = [
  "Caja 1",
  "Caja 2",
  "Caja 3",
  "Caja Rápida",
  "Mostrador / Pedidos",
  "Oficina / Servidor",
  "Tesorería / Caja Fuerte",
  "Almacén / Respaldo",
  "Mesa Técnica",
  "Sala de Espera"
];

// Datos iniciales completos correspondientes a la hoja de Excel del Punto de Venta (30 unidades individuales)
const DATOS_INICIALES = [
  // --- TECLADOS (5 unidades) ---
  {
    id: "ACT-001-01",
    barcode: "ACT-001-01",
    tipo: "Teclado",
    marca: "Dell, Ibue",
    modelo: "Standard USB",
    serie: "SN-KB-001",
    estado: "Operativo",
    ubicacion: "Caja 1 - Mostrador Principal",
    notas: "Teclado de ventas en Caja 1",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-001-02",
    barcode: "ACT-001-02",
    tipo: "Teclado",
    marca: "Dell",
    modelo: "KB216 USB",
    serie: "SN-KB-002",
    estado: "Operativo",
    ubicacion: "Caja 2 - Mostrador",
    notas: "Teclado de ventas en Caja 2",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-001-03",
    barcode: "ACT-001-03",
    tipo: "Teclado",
    marca: "Dell, Ibue",
    modelo: "Standard USB",
    serie: "SN-KB-003",
    estado: "Operativo",
    ubicacion: "Caja 3 - Mostrador",
    notas: "Teclado de ventas en Caja 3",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-001-04",
    barcode: "ACT-001-04",
    tipo: "Teclado",
    marca: "Dell",
    modelo: "KB216 USB",
    serie: "SN-KB-004",
    estado: "Operativo",
    ubicacion: "Mostrador Central / Pedidos",
    notas: "Teclado para atención de pedidos",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-001-05",
    barcode: "ACT-001-05",
    tipo: "Teclado",
    marca: "Ibue",
    modelo: "Standard USB",
    serie: "SN-KB-005",
    estado: "Operativo",
    ubicacion: "Almacén - Respaldo Técnico",
    notas: "Unidad de repuesto disponible",
    fecha: "2026-11-01"
  },

  // --- TICKETERAS (5 unidades) ---
  {
    id: "ACT-002-01",
    barcode: "ACT-002-01",
    tipo: "Ticketera",
    marca: "Dell",
    modelo: "3nStar RPT008",
    serie: "3N-RPT-8891",
    estado: "Operativo",
    ubicacion: "Caja 1 - Ventas",
    notas: "Impresora térmica de recibos Caja 1",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-002-02",
    barcode: "ACT-002-02",
    tipo: "Ticketera",
    marca: "Dell",
    modelo: "3nStar RPT008",
    serie: "3N-RPT-8892",
    estado: "Operativo",
    ubicacion: "Caja 2 - Ventas",
    notas: "Impresora térmica de recibos Caja 2",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-002-03",
    barcode: "ACT-002-03",
    tipo: "Ticketera",
    marca: "Dell",
    modelo: "3nStar RPT008",
    serie: "3N-RPT-8893",
    estado: "Operativo",
    ubicacion: "Caja 3 - Ventas",
    notas: "Impresora térmica de recibos Caja 3",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-002-04",
    barcode: "ACT-002-04",
    tipo: "Ticketera",
    marca: "Dell",
    modelo: "3nStar RPT008",
    serie: "3N-RPT-8894",
    estado: "Operativo",
    ubicacion: "Mostrador de Pedidos",
    notas: "Impresora de comandas y facturas",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-002-05",
    barcode: "ACT-002-05",
    tipo: "Ticketera",
    marca: "Dell",
    modelo: "3nStar RPT008",
    serie: "3N-RPT-8895",
    estado: "Operativo",
    ubicacion: "Almacén - Respaldo",
    notas: "Ticketera de reemplazo en caja original",
    fecha: "2026-11-01"
  },

  // --- DESKTOPS (2 unidades) ---
  {
    id: "ACT-003-01",
    barcode: "ACT-003-01",
    tipo: "Desktop",
    marca: "DELL",
    modelo: "OptiPlex i7 9ena gen",
    serie: "DL-OPT-9701",
    estado: "Operativo",
    ubicacion: "Servidor / Oficina Principal",
    notas: "Servidor principal con base de datos local",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-003-02",
    barcode: "ACT-003-02",
    tipo: "Desktop",
    marca: "DELL",
    modelo: "OptiPlex i7 9ena gen",
    serie: "DL-OPT-9702",
    estado: "Operativo",
    ubicacion: "Oficina de Administración",
    notas: "Equipo de gerencia y facturación",
    fecha: "2026-11-01"
  },

  // --- TV (1 unidad) ---
  {
    id: "ACT-004",
    barcode: "ACT-004",
    tipo: "TV",
    marca: "Samsung",
    modelo: "Smart 43 UHD",
    serie: "SAM-TV-430",
    estado: "Operativo",
    ubicacion: "Sala de Espera / Clientes",
    notas: "Pantalla publicitaria y turno de atención",
    fecha: "2026-11-01"
  },

  // --- PANTALLAS DE VENTAS (3 HP + 1 Bematech) ---
  {
    id: "ACT-005-01",
    barcode: "ACT-005-01",
    tipo: "Pantalla de ventas",
    marca: "HP",
    modelo: "HP RP7, modelo 7800",
    serie: "HP-RP7-7801",
    estado: "Operativo",
    ubicacion: "Caja 1 - Frontal",
    notas: "Terminal táctil principal All-in-One",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-005-02",
    barcode: "ACT-005-02",
    tipo: "Pantalla de ventas",
    marca: "HP",
    modelo: "HP RP7, modelo 7800",
    serie: "HP-RP7-7802",
    estado: "Operativo",
    ubicacion: "Caja 2 - Frontal",
    notas: "Terminal táctil All-in-One Caja 2",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-005-03",
    barcode: "ACT-005-03",
    tipo: "Pantalla de ventas",
    marca: "HP",
    modelo: "HP RP7, modelo 7800",
    serie: "HP-RP7-7803",
    estado: "Operativo",
    ubicacion: "Caja 3 - Frontal",
    notas: "Terminal táctil All-in-One Caja 3",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-006",
    barcode: "ACT-006",
    tipo: "Pantalla de ventas",
    marca: "Bematech",
    modelo: "Bematech SB9015",
    serie: "BEM-SB-9015",
    estado: "Operativo",
    ubicacion: "Caja Rápida / Mostrador",
    notas: "Terminal táctil secundario",
    fecha: "2026-11-01"
  },

  // --- MONITOR (1 unidad) ---
  {
    id: "ACT-007",
    barcode: "ACT-007",
    tipo: "Monitor",
    marca: "LG",
    modelo: "24MK430H",
    serie: "LG-MON-240",
    estado: "Operativo",
    ubicacion: "Oficina de Administración",
    notas: "Monitor de supervisión y control",
    fecha: "2026-11-01"
  },

  // --- CONTROLES DE CAJA / GAVETAS (4 unidades) ---
  {
    id: "ACT-008-01",
    barcode: "ACT-008-01",
    tipo: "Control de caja",
    marca: "Logic Controls",
    modelo: "000-028",
    serie: "LC-CTL-028-1",
    estado: "Operativo",
    ubicacion: "Caja 1 - Gaveta de Dinero",
    notas: "Gaveta conectada a ticketera con apertura auto",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-008-02",
    barcode: "ACT-008-02",
    tipo: "Control de caja",
    marca: "Logic Controls",
    modelo: "000-028",
    serie: "LC-CTL-028-2",
    estado: "Operativo",
    ubicacion: "Caja 2 - Gaveta de Dinero",
    notas: "Gaveta de dinero Caja 2",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-008-03",
    barcode: "ACT-008-03",
    tipo: "Control de caja",
    marca: "Logic Controls",
    modelo: "000-028",
    serie: "LC-CTL-028-3",
    estado: "Operativo",
    ubicacion: "Caja 3 - Gaveta de Dinero",
    notas: "Gaveta de dinero Caja 3",
    fecha: "2026-11-01"
  },
  {
    id: "ACT-008-04",
    barcode: "ACT-008-04",
    tipo: "Control de caja",
    marca: "Logic Controls",
    modelo: "000-028",
    serie: "LC-CTL-028-4",
    estado: "Operativo",
    ubicacion: "Caja Rápida / Mostrador",
    notas: "Gaveta de dinero de soporte",
    fecha: "2026-11-01"
  },

  // --- CONTADORES DE DINERO (2 unidades) ---
  {
    id: "ACT-009",
    barcode: "ACT.009",
    tipo: "ContadorMonedas",
    marca: "Generico",
    modelo: "CS-500",
    serie: "CS-500-11",
    estado: "Operativo",
    ubicacion: "Tesorería / Caja Fuerte",
    notas: "Contadora clasificadora de monedas",
    fecha: "2026-11-01"
  },
  {
    id: "ATC-010",
    barcode: "ATC-010",
    tipo: "ContadorBilletes",
    marca: "Generico",
    modelo: "Bill Counter V30",
    serie: "BC-V30-99",
    estado: "Operativo",
    ubicacion: "Tesorería / Caja Fuerte",
    notas: "Detector de billetes falsos UV/MG",
    fecha: "2026-11-01"
  },

  // --- CAJAS DE CARGADORES (6 unidades) ---
  {
    id: "ATC-011-01",
    barcode: "ATC-011-01",
    tipo: "CajadeCargadores",
    marca: "motorola",
    modelo: "Multi-dock 6x",
    serie: "MOT-CHG-6-1",
    estado: "Operativo",
    ubicacion: "Mesa Técnica 1",
    notas: "Estación de carga para radios y terminales",
    fecha: "2026-11-01"
  },
  {
    id: "ATC-011-02",
    barcode: "ATC-011-02",
    tipo: "CajadeCargadores",
    marca: "motorola",
    modelo: "Multi-dock 6x",
    serie: "MOT-CHG-6-2",
    estado: "Operativo",
    ubicacion: "Mesa Técnica 2",
    notas: "Estación de carga secundaria",
    fecha: "2026-11-01"
  },
  {
    id: "ATC-011-03",
    barcode: "ATC-011-03",
    tipo: "CajadeCargadores",
    marca: "motorola",
    modelo: "Dock Estándar",
    serie: "MOT-CHG-6-3",
    estado: "Operativo",
    ubicacion: "Caja 1",
    notas: "Cargador individual de terminal punto de venta",
    fecha: "2026-11-01"
  },
  {
    id: "ATC-011-04",
    barcode: "ATC-011-04",
    tipo: "CajadeCargadores",
    marca: "motorola",
    modelo: "Dock Estándar",
    serie: "MOT-CHG-6-4",
    estado: "Operativo",
    ubicacion: "Caja 2",
    notas: "Cargador individual de terminal punto de venta",
    fecha: "2026-11-01"
  },
  {
    id: "ATC-011-05",
    barcode: "ATC-011-05",
    tipo: "CajadeCargadores",
    marca: "motorola",
    modelo: "Dock Estándar",
    serie: "MOT-CHG-6-5",
    estado: "Operativo",
    ubicacion: "Almacén Central A",
    notas: "Cargador en reserva",
    fecha: "2026-11-01"
  },
  {
    id: "ATC-011-06",
    barcode: "ATC-011-06",
    tipo: "CajadeCargadores",
    marca: "motorola",
    modelo: "Dock Estándar",
    serie: "MOT-CHG-6-6",
    estado: "Operativo",
    ubicacion: "Almacén Central B",
    notas: "Cargador en reserva",
    fecha: "2026-11-01"
  }
];

const Storage = {
  // Caché en memoria
  _activos: null,
  _isSaving: false,
  _savePending: false,
  _lastSyncTime: null,
  _realtimeActive: false,

  // Inicializa los datos y la sincronización con Supabase / Local
  async init() {
    // 1. Cargar inmediatamente desde localStorage para renderizado ultra rápido sin demoras
    try {
      const local = localStorage.getItem(STORAGE_KEY);
      this._activos = local ? JSON.parse(local) : DATOS_INICIALES;
    } catch (e) {
      this._activos = DATOS_INICIALES;
    }

    if (!localStorage.getItem(STORAGE_KEY)) {
      this.setActivos(DATOS_INICIALES, false);
    }

    // 2. Verificar e inicializar cliente Supabase
    if (window.SupabaseClient && SupabaseClient.init()) {
      this.updateSyncBadge('online', 'Supabase Nube (Tiempo Real)');
      await this.syncWithSupabase();
      this.setupRealtime();
    } else {
      this.updateSyncBadge('offline', 'Modo Local (Offline)');
    }
  },

  // Activa la suscripción en tiempo real vía WebSockets de Supabase
  setupRealtime() {
    if (!window.SupabaseClient || !SupabaseClient.isConfigured() || this._realtimeActive) return;
    this._realtimeActive = true;
    SupabaseClient.subscribeToRealtime(
      (payload) => this.handleRealtimeActivos(payload),
      (payload) => this.handleRealtimeUbicaciones(payload)
    );
  },

  // Manejo de eventos Realtime de Activos (INSERT, UPDATE, DELETE)
  handleRealtimeActivos(payload) {
    if (!payload || !payload.eventType) return;
    const { eventType, new: newRecord, old: oldRecord } = payload;
    let list = [...this.getActivos()];

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      if (!newRecord || !newRecord.id) return;
      const idx = list.findIndex(a => (a.id || '').trim().toLowerCase() === (newRecord.id || '').trim().toLowerCase());
      if (idx >= 0) {
        list[idx] = newRecord;
      } else {
        list.unshift(newRecord);
      }
    } else if (eventType === 'DELETE') {
      const deleteId = oldRecord && oldRecord.id ? oldRecord.id : null;
      if (deleteId) {
        list = list.filter(a => (a.id || '').trim().toLowerCase() !== deleteId.trim().toLowerCase());
      }
    }

    this._activos = list;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}

    this._lastSyncTime = new Date();
    const timeStr = this._lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.updateSyncBadge('online', `Supabase Nube (${timeStr})`);

    window.dispatchEvent(new CustomEvent('activos-synced', { detail: list }));
  },

  // Manejo de eventos Realtime de Cuadros de Ubicación
  async handleRealtimeUbicaciones(payload) {
    if (window.SupabaseClient && SupabaseClient.isConfigured()) {
      const cloudLocs = await SupabaseClient.getUbicaciones();
      if (Array.isArray(cloudLocs) && cloudLocs.length > 0) {
        localStorage.setItem(STORAGE_LOCATIONS_KEY, JSON.stringify(cloudLocs));
        window.dispatchEvent(new CustomEvent('ubicaciones-synced', { detail: cloudLocs }));
      }
    }
  },

  // Actualiza la insignia visual en la cabecera
  updateSyncBadge(status, text) {
    const badge = document.getElementById('sync-status-badge');
    const label = document.getElementById('sync-status-text');
    if (!badge || !label) return;

    badge.className = `sync-badge ${status}`;
    label.textContent = text;
  },

  // Sincronización bidireccional completa con Supabase
  async syncWithSupabase() {
    if (!window.SupabaseClient || !SupabaseClient.isConfigured()) return false;
    this.updateSyncBadge('saving', 'Sincronizando con Supabase...');
    try {
      // 1. Sincronizar Activos desde la nube
      const cloudActivos = await SupabaseClient.getActivos();
      if (Array.isArray(cloudActivos)) {
        if (cloudActivos.length > 0) {
          this._activos = cloudActivos;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudActivos));
          window.dispatchEvent(new CustomEvent('activos-synced', { detail: cloudActivos }));
        } else {
          // Supabase está vacío: subir los activos locales
          const currentList = this.getActivos();
          await SupabaseClient.saveAllActivos(currentList);
        }
      }

      // 2. Sincronizar Cuadros de Ubicación desde la nube
      const cloudLocs = await SupabaseClient.getUbicaciones();
      if (Array.isArray(cloudLocs)) {
        if (cloudLocs.length > 0) {
          localStorage.setItem(STORAGE_LOCATIONS_KEY, JSON.stringify(cloudLocs));
          window.dispatchEvent(new CustomEvent('ubicaciones-synced', { detail: cloudLocs }));
        } else {
          // Supabase está vacío en ubicaciones: subir los cuadros actuales
          const currentLocs = this.getCuadrosUbicacion();
          await SupabaseClient.saveAllUbicaciones(currentLocs);
        }
      }

      this._lastSyncTime = new Date();
      const timeStr = this._lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.updateSyncBadge('online', `Supabase Nube (${timeStr})`);
      return true;
    } catch (err) {
      console.warn("Supabase: Error en sincronización:", err);
      this.updateSyncBadge('offline', 'Modo Local (Offline)');
      return false;
    }
  },

  // Subir manualmente todos los datos locales hacia Supabase
  async syncAllToSupabase() {
    if (!window.SupabaseClient || !SupabaseClient.isConfigured()) {
      return { success: false, error: 'Supabase no está configurado. Ingresa la URL y Anon Key primero.' };
    }
    this.updateSyncBadge('saving', 'Subiendo datos a Supabase...');
    try {
      const currentActivos = this.getActivos();
      const currentLocs = this.getCuadrosUbicacion();

      const okActivos = await SupabaseClient.saveAllActivos(currentActivos);
      const okLocs = await SupabaseClient.saveAllUbicaciones(currentLocs);

      if (okActivos && okLocs) {
        this.updateSyncBadge('online', 'Supabase Sincronizado');
        return { success: true, countActivos: currentActivos.length, countLocs: currentLocs.length };
      } else {
        throw new Error('No se pudo completar la subida de datos.');
      }
    } catch (err) {
      console.error("Error al subir datos a Supabase:", err);
      this.updateSyncBadge('error', 'Error al sincronizar');
      return { success: false, error: err.message || 'Error al conectar con Supabase.' };
    }
  },

  // Obtiene todos los activos
  getActivos() {
    if (this._activos) return this._activos;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      this._activos = data ? JSON.parse(data) : DATOS_INICIALES;
      return this._activos;
    } catch (e) {
      console.error("Error leyendo localStorage", e);
      return DATOS_INICIALES;
    }
  },

  // Guarda la lista completa (en localStorage y en Supabase en tiempo real)
  setActivos(activos, syncRemote = true) {
    this._activos = activos;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activos));
    } catch (e) {
      console.error("Error guardando en localStorage", e);
    }

    if (syncRemote && window.SupabaseClient && SupabaseClient.isConfigured()) {
      SupabaseClient.saveAllActivos(activos).catch(e => console.warn("Supabase saveAllActivos error:", e));
    }
  },

  // Busca por ID exacto
  getById(id) {
    const list = this.getActivos();
    return list.find(a => (a.id || '').trim().toLowerCase() === id.trim().toLowerCase());
  },

  // Busca por código de barras o QR (búsqueda ultra rápida para escáner)
  getByBarcode(barcode) {
    if (!barcode) return null;
    const cleanCode = barcode.trim().toLowerCase();
    const list = this.getActivos();
    return list.find(a =>
      (a.barcode && a.barcode.trim().toLowerCase() === cleanCode) ||
      (a.id && a.id.trim().toLowerCase() === cleanCode) ||
      (a.serie && a.serie.trim().toLowerCase() === cleanCode)
    );
  },

  // Guarda o actualiza un activo (en tiempo real en Supabase y local)
  saveActivo(item) {
    const list = [...this.getActivos()];
    const index = list.findIndex(a => a.id.trim().toLowerCase() === item.id.trim().toLowerCase());

    if (index >= 0) {
      list[index] = { ...list[index], ...item };
    } else {
      list.unshift(item);
    }
    this._activos = list;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Error guardando en localStorage", e);
    }

    if (window.SupabaseClient && SupabaseClient.isConfigured()) {
      SupabaseClient.saveActivo(item).catch(err => console.warn("Supabase saveActivo error:", err));
    }

    return item;
  },

  // Elimina un activo por ID (en tiempo real en Supabase y local)
  deleteActivo(id) {
    let list = this.getActivos();
    list = list.filter(a => a.id.trim().toLowerCase() !== id.trim().toLowerCase());
    this._activos = list;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Error guardando en localStorage", e);
    }

    if (window.SupabaseClient && SupabaseClient.isConfigured()) {
      SupabaseClient.deleteActivo(id).catch(err => console.warn("Supabase deleteActivo error:", err));
    }
  },

  // Genera el siguiente ID correlativo recomendado (ej: ACT-012)
  generateNextId() {
    const list = this.getActivos();
    let maxNum = 0;
    list.forEach(item => {
      const match = (item.id || '').match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = (maxNum + 1).toString().padStart(3, '0');
    return `ACT-${nextNum}`;
  },

  // Obtiene los tipos / productos únicos
  getTipos() {
    const list = this.getActivos();
    const tipos = new Set(list.map(a => a.tipo).filter(Boolean));
    return Array.from(tipos).sort();
  },

  // Obtiene las ubicaciones únicas registradas
  getUbicaciones() {
    const list = this.getActivos();
    const locs = new Set(list.map(a => a.ubicacion).filter(Boolean));
    return Array.from(locs).sort();
  },

  // Obtiene la lista de cuadros de ubicación gestionados
  getCuadrosUbicacion() {
    try {
      const saved = localStorage.getItem(STORAGE_LOCATIONS_KEY);
      let list = saved ? JSON.parse(saved) : [...UBICACIONES_PREDETERMINADAS];
      // Incluir también cualquier ubicación que ya tengan los activos cargados
      const activos = this.getActivos();
      activos.forEach(a => {
        let g = a.ubicacion || '';
        if (g.includes('-')) g = g.split('-')[0].trim();
        if (g && !list.includes(g) && g !== 'Sin Ubicación Asignada') {
          list.push(g);
        }
      });
      return list;
    } catch (e) {
      return [...UBICACIONES_PREDETERMINADAS];
    }
  },

  // Guarda la lista de cuadros de ubicación (en localStorage y en Supabase)
  setCuadrosUbicacion(list, syncRemote = true) {
    try {
      localStorage.setItem(STORAGE_LOCATIONS_KEY, JSON.stringify(list));
    } catch (e) {}

    if (syncRemote && window.SupabaseClient && SupabaseClient.isConfigured()) {
      SupabaseClient.saveAllUbicaciones(list).catch(e => console.warn("Supabase saveAllUbicaciones error:", e));
    }
  },

  // Agrega un nuevo cuadro de ubicación
  addCuadroUbicacion(nombre) {
    if (!nombre || !nombre.trim()) return false;
    const clean = nombre.trim();
    const list = this.getCuadrosUbicacion();
    if (!list.includes(clean)) {
      list.push(clean);
      this.setCuadrosUbicacion(list, false);
      if (window.SupabaseClient && SupabaseClient.isConfigured()) {
        SupabaseClient.addUbicacion(clean).catch(e => console.warn("Supabase addUbicacion error:", e));
      }
      return true;
    }
    return false;
  },

  // Renombra un cuadro de ubicación y actualiza todos sus activos en tiempo real
  renameCuadroUbicacion(nombreActual, nuevoNombre) {
    if (!nombreActual || !nuevoNombre || !nuevoNombre.trim()) return 0;
    const cleanNew = nuevoNombre.trim();
    let list = this.getCuadrosUbicacion();
    const idx = list.indexOf(nombreActual);
    if (idx >= 0) {
      list[idx] = cleanNew;
    } else {
      list.push(cleanNew);
    }
    this.setCuadrosUbicacion(list, false);

    if (window.SupabaseClient && SupabaseClient.isConfigured()) {
      SupabaseClient.renameUbicacion(nombreActual, cleanNew).catch(e => console.warn("Supabase renameUbicacion error:", e));
    }

    // Actualizar todos los activos asignados a este cuadro
    const activos = [...this.getActivos()];
    let updatedCount = 0;
    activos.forEach(a => {
      const u = a.ubicacion || '';
      let g = u;
      if (u.includes('-')) g = u.split('-')[0].trim();
      
      if (g.toLowerCase() === nombreActual.toLowerCase() || u.toLowerCase() === nombreActual.toLowerCase()) {
        if (u.includes('-')) {
          const subSpot = u.split('-').slice(1).join('-').trim();
          a.ubicacion = `${cleanNew} - ${subSpot}`;
        } else {
          a.ubicacion = cleanNew;
        }
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      this.setActivos(activos, true);
    }
    return updatedCount;
  },

  // Elimina un cuadro de ubicación y desasigna sus activos
  deleteCuadroUbicacion(nombre) {
    if (!nombre) return 0;
    let list = this.getCuadrosUbicacion().filter(l => l.toLowerCase() !== nombre.toLowerCase());
    this.setCuadrosUbicacion(list, false);

    if (window.SupabaseClient && SupabaseClient.isConfigured()) {
      SupabaseClient.deleteUbicacion(nombre).catch(e => console.warn("Supabase deleteUbicacion error:", e));
    }

    const activos = [...this.getActivos()];
    let count = 0;
    activos.forEach(a => {
      const u = a.ubicacion || '';
      let g = u;
      if (u.includes('-')) g = u.split('-')[0].trim();
      if (g.toLowerCase() === nombre.toLowerCase() || u.toLowerCase() === nombre.toLowerCase()) {
        a.ubicacion = 'Sin Ubicación Asignada';
        count++;
      }
    });

    if (count > 0) {
      this.setActivos(activos, true);
    }
    return count;
  },

  // Obtiene resumen estadístico (Idéntico a la cabecera de la imagen del usuario)
  getEstadisticas() {
    const list = this.getActivos();
    const total = list.length;
    const operativos = list.filter(a => (a.estado || '').toLowerCase() === 'operativo').length;
    const mantenimiento = list.filter(a => (a.estado || '').toLowerCase().includes('mantenimiento')).length;
    const deBaja = total - (operativos + mantenimiento);

    return { total, operativos, mantenimiento, deBaja };
  },

  // Exportar a CSV compatible con Excel (con codificación UTF-8 BOM)
  exportToCSV() {
    const list = this.getActivos();
    const headers = [
      "Código",
      "Código de Barras",
      "Tipo de Activo",
      "Marca",
      "Modelo",
      "N° de Serie",
      "Estado",
      "Ubicación (Dónde se encuentra)",
      "Notas",
      "Fecha de Registro"
    ];

    const rows = list.map(a => [
      `"${(a.id || '').replace(/"/g, '""')}"`,
      `"${(a.barcode || a.id || '').replace(/"/g, '""')}"`,
      `"${(a.tipo || '').replace(/"/g, '""')}"`,
      `"${(a.marca || '').replace(/"/g, '""')}"`,
      `"${(a.modelo || '').replace(/"/g, '""')}"`,
      `"${(a.serie || '').replace(/"/g, '""')}"`,
      `"${(a.estado || 'Operativo').replace(/"/g, '""')}"`,
      `"${(a.ubicacion || '').replace(/"/g, '""')}"`,
      `"${(a.notas || '').replace(/"/g, '""')}"`,
      `"${(a.fecha || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Inventario_Activos_POS_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Exportar copia de seguridad JSON
  exportToJSON() {
    const list = this.getActivos();
    const jsonStr = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Backup_Activos_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Importar desde archivo JSON
  importFromJSON(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      if (Array.isArray(data)) {
        this.setActivos(data, true);
        return { success: true, count: data.length };
      }
      return { success: false, error: 'El archivo no contiene una lista de activos válida.' };
    } catch (e) {
      return { success: false, error: 'Formato JSON inválido.' };
    }
  },

  // Restaurar valores iniciales
  resetToDefault() {
    this.setActivos(DATOS_INICIALES, true);
  }
};

// Inicializar de inmediato
Storage.init();
window.Storage = Storage;
