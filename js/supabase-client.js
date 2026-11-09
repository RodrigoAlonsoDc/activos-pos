/**
 * Cliente de Integración Supabase para ScanActivos POS
 * Conexión en la nube con soporte Realtime por WebSockets (Postgres Changes)
 */

const SupabaseClient = {
  client: null,
  realtimeChannel: null,
  _isConfigured: false,

  // Inicializa el cliente usando supabase-config.js o localStorage
  init() {
    const urlFromConfig = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) ? window.SUPABASE_CONFIG.url.trim() : '';
    const keyFromConfig = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey) ? window.SUPABASE_CONFIG.anonKey.trim() : '';

    let url = (localStorage.getItem('supabase_url') || '').trim();
    let anonKey = (localStorage.getItem('supabase_anon_key') || '').trim();

    // Si existen credenciales preconfiguradas, asegurar que se sincronicen en localStorage
    if (urlFromConfig && (!url || url !== urlFromConfig)) {
      url = urlFromConfig;
      localStorage.setItem('supabase_url', url);
    }
    if (keyFromConfig && (!anonKey || anonKey !== keyFromConfig)) {
      anonKey = keyFromConfig;
      localStorage.setItem('supabase_anon_key', anonKey);
    }

    url = url || urlFromConfig;
    anonKey = anonKey || keyFromConfig;

    if (url && anonKey && window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        this.client = window.supabase.createClient(url, anonKey, {
          auth: { persistSession: false },
          realtime: { params: { eventsPerSecond: 10 } }
        });
        this._isConfigured = true;
        return true;
      } catch (err) {
        console.error("Error inicializando Supabase:", err);
        this._isConfigured = false;
        return false;
      }
    }
    this._isConfigured = false;
    return false;
  },

  isConfigured() {
    return this._isConfigured && this.client !== null;
  },

  // Guarda las credenciales desde la pantalla de Ajustes
  saveCredentials(url, key) {
    if (url) localStorage.setItem('supabase_url', url.trim());
    if (key) localStorage.setItem('supabase_anon_key', key.trim());
    return this.init();
  },

  // Limpia credenciales
  clearCredentials() {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    if (this.realtimeChannel) {
      try { this.realtimeChannel.unsubscribe(); } catch (e) {}
    }
    this.client = null;
    this._isConfigured = false;
  },

  // Obtiene todos los activos desde Supabase
  async getActivos() {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await this.client
        .from('activos')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Supabase: Error al obtener activos:", err);
      return null;
    }
  },

  // Guarda o actualiza un activo (Upsert)
  async saveActivo(activo) {
    if (!this.isConfigured()) return false;
    try {
      const payload = {
        id: activo.id,
        barcode: activo.barcode || activo.id,
        tipo: activo.tipo || 'General',
        marca: activo.marca || '-',
        modelo: activo.modelo || '-',
        serie: activo.serie || '-',
        estado: activo.estado || 'Operativo',
        ubicacion: activo.ubicacion || 'Sin Ubicación Asignada',
        notas: activo.notas || '',
        fecha: activo.fecha || new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString()
      };

      const { error } = await this.client
        .from('activos')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase: Error al guardar activo:", err);
      return false;
    }
  },

  // Guarda masivamente una lista de activos
  async saveAllActivos(activos) {
    if (!this.isConfigured()) return false;
    try {
      const cleanList = activos.map(a => ({
        id: a.id,
        barcode: a.barcode || a.id,
        tipo: a.tipo || 'General',
        marca: a.marca || '-',
        modelo: a.modelo || '-',
        serie: a.serie || '-',
        estado: a.estado || 'Operativo',
        ubicacion: a.ubicacion || 'Sin Ubicación Asignada',
        notas: a.notas || '',
        fecha: a.fecha || new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString()
      }));

      const { error } = await this.client
        .from('activos')
        .upsert(cleanList, { onConflict: 'id' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase: Error al guardar lista de activos:", err);
      return false;
    }
  },

  // Elimina un activo por ID
  async deleteActivo(id) {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await this.client
        .from('activos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase: Error al eliminar activo:", err);
      return false;
    }
  },

  // Obtiene la lista de cuadros de ubicación
  async getUbicaciones() {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await this.client
        .from('ubicaciones')
        .select('nombre')
        .order('id', { ascending: true });

      if (error) throw error;
      return data ? data.map(u => u.nombre) : [];
    } catch (err) {
      console.warn("Supabase: Error al obtener ubicaciones:", err);
      return null;
    }
  },

  // Agrega un nuevo cuadro de ubicación
  async addUbicacion(nombre) {
    if (!this.isConfigured() || !nombre) return false;
    try {
      const { error } = await this.client
        .from('ubicaciones')
        .insert([{ nombre: nombre.trim() }]);

      if (error && error.code !== '23505') throw error;
      return true;
    } catch (err) {
      console.error("Supabase: Error al agregar ubicación:", err);
      return false;
    }
  },

  // Guarda masivamente la lista de cuadros
  async saveAllUbicaciones(list) {
    if (!this.isConfigured()) return false;
    try {
      const payload = list.map(nombre => ({ nombre: nombre.trim() }));
      const { error } = await this.client
        .from('ubicaciones')
        .upsert(payload, { onConflict: 'nombre' });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase: Error al guardar ubicaciones:", err);
      return false;
    }
  },

  // Renombra un cuadro de ubicación y actualiza los activos en Supabase
  async renameUbicacion(oldName, newName) {
    if (!this.isConfigured() || !oldName || !newName) return false;
    try {
      // 1. Actualizar tabla ubicaciones
      await this.client
        .from('ubicaciones')
        .update({ nombre: newName.trim() })
        .eq('nombre', oldName);

      // 2. Actualizar activos que tengan esta ubicación exacta
      await this.client
        .from('activos')
        .update({ ubicacion: newName.trim() })
        .eq('ubicacion', oldName);

      return true;
    } catch (err) {
      console.error("Supabase: Error al renombrar ubicación:", err);
      return false;
    }
  },

  // Elimina un cuadro de ubicación
  async deleteUbicacion(nombre) {
    if (!this.isConfigured() || !nombre) return false;
    try {
      await this.client
        .from('ubicaciones')
        .delete()
        .eq('nombre', nombre);

      // Asignar los activos huérfanos a "Sin Ubicación Asignada"
      await this.client
        .from('activos')
        .update({ ubicacion: 'Sin Ubicación Asignada' })
        .eq('ubicacion', nombre);

      return true;
    } catch (err) {
      console.error("Supabase: Error al eliminar ubicación:", err);
      return false;
    }
  },

  // Renombra un tipo de producto en todos los activos de Supabase
  async renameProductType(oldType, newType) {
    if (!this.isConfigured() || !oldType || !newType) return false;
    try {
      const { error } = await this.client
        .from('activos')
        .update({ tipo: newType.trim(), updated_at: new Date().toISOString() })
        .eq('tipo', oldType);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase: Error al renombrar producto:", err);
      return false;
    }
  },

  // Actualiza los campos comunes de todos los activos de un producto
  async updateProductFields(productType, fields) {
    if (!this.isConfigured() || !productType) return false;
    try {
      const updateData = { updated_at: new Date().toISOString() };
      if (fields.newTipo) updateData.tipo = fields.newTipo.trim();
      if (fields.marca !== undefined && fields.marca !== '') updateData.marca = fields.marca.trim();
      if (fields.modelo !== undefined && fields.modelo !== '') updateData.modelo = fields.modelo.trim();
      if (fields.estado !== undefined && fields.estado !== '') updateData.estado = fields.estado.trim();
      if (fields.ubicacion !== undefined && fields.ubicacion !== '') updateData.ubicacion = fields.ubicacion.trim();
      if (fields.notas !== undefined && fields.notas !== '') updateData.notas = fields.notas.trim();

      const { error } = await this.client
        .from('activos')
        .update(updateData)
        .eq('tipo', productType);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase: Error al actualizar campos del producto:", err);
      return false;
    }
  },

  // Suscripción Realtime por WebSockets (Postgres Changes)
  subscribeToRealtime(onActivosChange, onUbicacionesChange) {
    if (!this.isConfigured()) return;

    if (this.realtimeChannel) {
      try { this.realtimeChannel.unsubscribe(); } catch (e) {}
    }

    try {
      this.realtimeChannel = this.client
        .channel('pos-realtime-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'activos' },
          (payload) => {
            if (typeof onActivosChange === 'function') {
              onActivosChange(payload);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ubicaciones' },
          (payload) => {
            if (typeof onUbicacionesChange === 'function') {
              onUbicacionesChange(payload);
            }
          }
        )
        .subscribe((status) => {
          const badge = document.getElementById('sync-status-badge');
          const text = document.getElementById('sync-status-text');
          const dBadge = document.getElementById('desktop-sync-status-badge');
          const dText = document.getElementById('desktop-sync-status-text');
          const updateEl = (b, t, cls, msg) => {
            if (b) b.className = cls;
            if (t) t.textContent = msg;
          };

          if (status === 'SUBSCRIBED') {
            updateEl(badge, text, 'sync-badge online', 'Supabase Nube (Tiempo Real)');
            updateEl(dBadge, dText, 'sync-badge online', 'Supabase Nube (Tiempo Real)');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            updateEl(badge, text, 'sync-badge offline', 'Reconectando Supabase...');
            updateEl(dBadge, dText, 'sync-badge offline', 'Reconectando Supabase...');
          }
        });
    } catch (err) {
      console.error("Supabase Realtime: Error al suscribir:", err);
    }
  }
};

window.SupabaseClient = SupabaseClient;
