/**
 * Lógica Principal de la Aplicación (ScanActivos POS)
 * Control de vistas, renderizado por producto, búsqueda, modales y etiquetas.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar estado de la aplicación
  const state = {
    currentTab: 'paneles', // 'paneles', 'todos', 'registro', 'ajustes'
    subViewMode: 'locations', // 'locations' (predeterminado) o 'categories'
    selectedLocation: null, // Si está viendo una ubicación específica (ej: "Caja 1")
    selectedCategory: null, // Si está viendo un producto específico (ej: "Teclado")
    selectedSubCategory: null, // Si está viendo un sub-producto específico (ej: "Standard USB")
    selectedLocationCategoryFilter: 'todos',
    scannerInstance: null,
    editingAssetId: null,
    searchQuery: '',
    statusFilter: 'todos',
    locationFilter: 'todos'
  };

  // Elementos DOM principales
  const dom = {
    // Stats
    statTotal: document.getElementById('stat-total'),
    statOperativos: document.getElementById('stat-operativos'),
    statMantenimiento: document.getElementById('stat-mantenimiento'),
    statDeBaja: document.getElementById('stat-debaja'),

    // Navegación
    navButtons: document.querySelectorAll('.nav-tab-btn'),
    tabPanels: document.querySelectorAll('.tab-content-panel'),

    // Selectores de modo de vista
    btnModeLocations: document.getElementById('btn-mode-locations'),
    btnModeCategories: document.getElementById('btn-mode-categories'),

    // Vista Cuadros por Ubicación
    locationsGridWrapper: document.getElementById('locations-grid-wrapper'),
    locationsGrid: document.getElementById('locations-grid'),
    btnOpenManageLocations: document.getElementById('btn-open-manage-locations'),
    locationDetailView: document.getElementById('location-detail-view'),
    locationDetailTitle: document.getElementById('location-detail-title'),
    locationDetailCount: document.getElementById('location-detail-count'),
    btnEditCurrentLocation: document.getElementById('btn-edit-current-location'),
    locationCategoryChips: document.getElementById('location-category-chips'),
    locationDetailList: document.getElementById('location-detail-list'),
    btnBackLocations: document.getElementById('btn-back-locations'),

    // Vista Productos y Edición de Campos
    categoriesGridWrapper: document.getElementById('categories-grid-wrapper'),
    categoriesGrid: document.getElementById('categories-grid'),
    btnOpenManageProducts: document.getElementById('btn-open-manage-products'),
    productDetailView: document.getElementById('product-detail-view'),
    productDetailTitle: document.getElementById('product-detail-title'),
    productDetailCount: document.getElementById('product-detail-count'),
    btnEditCurrentProduct: document.getElementById('btn-edit-current-product'),
    productDetailList: document.getElementById('product-detail-list'),
    btnBackToCategories: document.getElementById('btn-back-categories'),

    // Sub-productos (Cuadros de opciones al presionar un producto)
    subproductsGridWrapper: document.getElementById('subproducts-grid-wrapper'),
    subproductsGrid: document.getElementById('subproducts-grid'),
    btnAddSubproductDirect: document.getElementById('btn-add-subproduct-direct'),
    subproductDetailView: document.getElementById('subproduct-detail-view'),
    btnBackToSubproducts: document.getElementById('btn-back-to-subproducts'),
    subproductDetailTitle: document.getElementById('subproduct-detail-title'),
    subproductDetailCount: document.getElementById('subproduct-detail-count'),
    btnQuickAddSubproductAsset: document.getElementById('btn-quick-add-subproduct-asset'),

    // Modal Gestión de Productos
    modalManageProducts: document.getElementById('modal-manage-products'),
    btnCloseManageProducts: document.getElementById('btn-close-manage-products'),
    btnDoneManageProducts: document.getElementById('btn-done-manage-products'),
    formAddProduct: document.getElementById('form-add-product'),
    inputNewProductName: document.getElementById('input-new-product-name'),
    inputNewSubproductName: document.getElementById('input-new-subproduct-name'),
    productsManageList: document.getElementById('products-manage-list'),

    // Modal Editar Campos del Producto
    modalEditProductFields: document.getElementById('modal-edit-product-fields'),
    formEditProductFields: document.getElementById('form-edit-product-fields'),
    editProductModalTitle: document.getElementById('edit-product-modal-title'),
    editProductOriginalType: document.getElementById('edit-product-original-type'),
    inputEditProductType: document.getElementById('input-edit-product-type'),
    inputEditProductMarca: document.getElementById('input-edit-product-marca'),
    inputEditProductModelo: document.getElementById('input-edit-product-modelo'),
    selectEditProductEstado: document.getElementById('select-edit-product-estado'),
    selectEditProductUbicacion: document.getElementById('select-edit-product-ubicacion'),
    inputEditProductNotas: document.getElementById('input-edit-product-notas'),
    editProductSubproductsList: document.getElementById('edit-product-subproducts-list'),
    inputEditProductNewSubproduct: document.getElementById('input-edit-product-new-subproduct'),
    btnAddSubproductInEdit: document.getElementById('btn-add-subproduct-in-edit'),
    btnCloseEditProductFields: document.getElementById('btn-close-edit-product-fields'),
    btnCancelEditProductFields: document.getElementById('btn-cancel-edit-product-fields'),

    // Vista Todos los Activos
    searchInput: document.getElementById('search-input'),
    filterStatus: document.getElementById('filter-status'),
    filterLocation: document.getElementById('filter-location'),
    assetsList: document.getElementById('assets-list'),
    desktopAssetsTableBody: document.getElementById('desktop-assets-table-body'),
    assetsCountText: document.getElementById('assets-count-text'),

    // Formulario de Registro
    assetForm: document.getElementById('asset-form'),
    formTitle: document.getElementById('form-title'),
    formId: document.getElementById('input-id'),
    formBarcode: document.getElementById('input-barcode'),
    formTipo: document.getElementById('input-tipo'),
    formSubtipo: document.getElementById('input-subtipo'),
    formMarca: document.getElementById('input-marca'),
    formModelo: document.getElementById('input-modelo'),
    formSerie: document.getElementById('input-serie'),
    formEstado: document.getElementById('input-estado'),
    formUbicacion: document.getElementById('input-ubicacion'),
    formNotas: document.getElementById('input-notas'),
    btnAutoId: document.getElementById('btn-auto-id'),
    btnScanBarcodeField: document.getElementById('btn-scan-barcode-field'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    datalistTipos: document.getElementById('datalist-tipos'),
    datalistSubtipos: document.getElementById('datalist-subtipos'),
    datalistUbicaciones: document.getElementById('datalist-ubicaciones'),

    // Modal Escáner
    scannerModal: document.getElementById('scanner-modal'),
    scannerVideo: document.getElementById('scanner-video'),
    scannerError: document.getElementById('scanner-error-msg'),
    scannerNotice: document.getElementById('scanner-insecure-notice'),
    btnSnapPhotoTrigger: document.getElementById('btn-snap-photo-trigger'),
    manualQuickCode: document.getElementById('manual-quick-code'),
    btnManualQuickGo: document.getElementById('btn-manual-quick-go'),
    btnCloseScanner: document.getElementById('btn-close-scanner'),
    btnTriggerScan: document.getElementById('btn-trigger-scan'),
    btnScanFAB: document.getElementById('btn-scan-fab'),
    btnTorch: document.getElementById('btn-scanner-torch'),
    fileScanInput: document.getElementById('file-scan-input'),
    btnUploadPhoto: document.getElementById('btn-upload-photo'),

    // Modal Ficha Activo Detectado
    assetDetailModal: document.getElementById('asset-detail-modal'),
    modalAssetBarcodeSvg: document.getElementById('modal-asset-barcode-svg'),
    modalAssetQrSvg: document.getElementById('modal-asset-qr-svg'),
    modalAssetId: document.getElementById('modal-asset-id'),
    modalAssetTipo: document.getElementById('modal-asset-tipo'),
    modalAssetSubtipo: document.getElementById('modal-asset-subtipo'),
    modalAssetSubtipoVal: document.getElementById('modal-asset-subtipo-val'),
    modalAssetUbicacion: document.getElementById('modal-asset-ubicacion'),
    modalAssetMarcaModelo: document.getElementById('modal-asset-marcamodelo'),
    modalAssetSerie: document.getElementById('modal-asset-serie'),
    modalAssetEstadoBadge: document.getElementById('modal-asset-estado-badge'),
    modalAssetNotas: document.getElementById('modal-asset-notas'),
    modalBtnEdit: document.getElementById('modal-btn-edit'),
    modalBtnMove: document.getElementById('modal-btn-move'),
    modalBtnPrint: document.getElementById('modal-btn-print'),
    modalBtnClose: document.getElementById('modal-btn-close'),

    // Modal Imprimir Etiqueta
    labelModal: document.getElementById('label-modal'),
    labelPreviewContainer: document.getElementById('label-preview-container'),
    btnPrintLabels: document.getElementById('btn-print-labels'),
    btnCloseLabelModal: document.getElementById('btn-close-label-modal'),

    // Modal Gestión de Cuadros de Ubicación
    modalManageLocations: document.getElementById('modal-manage-locations'),
    btnCloseManageLocations: document.getElementById('btn-close-manage-locations'),
    btnDoneManageLocations: document.getElementById('btn-done-manage-locations'),
    formAddLocation: document.getElementById('form-add-location'),
    inputNewLocationName: document.getElementById('input-new-location-name'),
    locationsManageList: document.getElementById('locations-manage-list'),

    // Botones Ajustes
    btnExportCsv: document.getElementById('btn-export-csv'),
    btnExportJson: document.getElementById('btn-export-json'),
    btnImportJson: document.getElementById('btn-import-json'),
    fileImportJson: document.getElementById('file-import-json'),
    btnResetData: document.getElementById('btn-reset-data'),
    btnPrintAllLabels: document.getElementById('btn-print-all-labels'),

    // Supabase Cloud Controls
    inputSupabaseUrl: document.getElementById('input-supabase-url'),
    inputSupabaseKey: document.getElementById('input-supabase-key'),
    btnSaveSupabase: document.getElementById('btn-save-supabase'),
    btnPushSupabaseNow: document.getElementById('btn-push-supabase-now'),
    supabaseStatusPill: document.getElementById('supabase-status-pill')
  };

  // Iconos SVG limpios y profesionales (sin emojis)
  const SVG_TAG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`;
  const SVG_EDIT = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
  const SVG_EYE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const SVG_TRASH = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

  function getProductIcon(tipo) {
    return '';
  }

  // ==========================================
  // ACTUALIZACIÓN DE ESTADÍSTICAS Y LISTAS
  // ==========================================
  function updateStats() {
    const stats = Storage.getEstadisticas();
    if (dom.statTotal) dom.statTotal.textContent = stats.total;
    if (dom.statOperativos) dom.statOperativos.textContent = stats.operativos;
    if (dom.statMantenimiento) dom.statMantenimiento.textContent = stats.mantenimiento;
    if (dom.statDeBaja) dom.statDeBaja.textContent = stats.deBaja;

    // Estadísticas para cabecera de PC / Laptop
    const dTotal = document.getElementById('desktop-stat-total');
    const dOperativos = document.getElementById('desktop-stat-operativos');
    const dMant = document.getElementById('desktop-stat-mantenimiento');
    const dDeBaja = document.getElementById('desktop-stat-debaja');
    if (dTotal) dTotal.textContent = stats.total;
    if (dOperativos) dOperativos.textContent = stats.operativos;
    if (dMant) dMant.textContent = stats.mantenimiento;
    if (dDeBaja) dDeBaja.textContent = stats.deBaja;
  }

  function updateDatalists() {
    // Autocompletado de tipos y ubicaciones
    const tipos = Storage.getTipos();
    const locs = Storage.getUbicaciones();

    dom.datalistTipos.innerHTML = tipos.map(t => `<option value="${t}">`).join('');
    dom.datalistUbicaciones.innerHTML = locs.map(l => `<option value="${l}">`).join('');

    updateSubtiposDatalist();

    // Actualizar select de filtro por ubicación
    const currentLoc = dom.filterLocation.value;
    dom.filterLocation.innerHTML = `<option value="todos">Todas las ubicaciones</option>` +
      locs.map(l => `<option value="${l}" ${l === currentLoc ? 'selected' : ''}>${l}</option>`).join('');
  }

  function updateSubtiposDatalist() {
    if (!dom.datalistSubtipos) return;
    const currentTipo = (dom.formTipo && dom.formTipo.value ? dom.formTipo.value.trim() : '');
    let subs = [];
    if (currentTipo) {
      subs = Storage.getSubProducts(currentTipo);
    } else {
      const catalog = Storage.getProductCatalog ? Storage.getProductCatalog() : {};
      const allSubs = new Set();
      Object.values(catalog).forEach(arr => {
        if (Array.isArray(arr)) arr.forEach(s => allSubs.add(s));
      });
      subs = Array.from(allSubs);
    }
    dom.datalistSubtipos.innerHTML = subs.map(s => `<option value="${s}">`).join('');
  }

  // ==========================================
  // UBICACIONES: GESTIÓN Y VISTA DE CUADROS
  // ==========================================
  function getLocationGroup(ubicacion) {
    if (!ubicacion) return 'Sin Ubicación Asignada';
    const u = ubicacion.trim();
    
    // 1. Chequeo contra la lista de cuadros gestionados
    const managed = Storage.getCuadrosUbicacion ? Storage.getCuadrosUbicacion() : [];
    for (const loc of managed) {
      if (u.toLowerCase() === loc.toLowerCase()) return loc;
      if (u.toLowerCase().startsWith(loc.toLowerCase() + ' -') || u.toLowerCase().startsWith(loc.toLowerCase() + '-')) {
        return loc;
      }
    }

    const clean = u.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/^caja\s*1\b/.test(clean)) return 'Caja 1';
    if (/^caja\s*2\b/.test(clean)) return 'Caja 2';
    if (/^caja\s*3\b/.test(clean)) return 'Caja 3';
    if (/^caja\s*4\b/.test(clean)) return 'Caja 4';
    if (/caja\s*rapida/.test(clean)) return 'Caja Rápida';
    if (/mostrador/.test(clean)) return 'Mostrador / Pedidos';
    if (/oficina|servidor/.test(clean)) return 'Oficina / Servidor';
    if (/tesoreria|caja\s*fuerte/.test(clean)) return 'Tesorería / Caja Fuerte';
    if (/almacen/.test(clean)) return 'Almacén / Respaldo';
    if (/mesa\s*tecnica/.test(clean)) return 'Mesa Técnica';
    if (/sala\s*de\s*espera/.test(clean)) return 'Sala de Espera';
    return u.split('-')[0].trim();
  }

  function getLocationIcon(locName) {
    return '';
  }

  // ==========================================
  // VISTA: CUADROS POR UBICACIÓN (PREDETERMINADA)
  // ==========================================
  function renderLocationsGrid() {
    const activos = Storage.getActivos();
    const managed = Storage.getCuadrosUbicacion ? Storage.getCuadrosUbicacion() : [];

    // Agrupar activos por Cuadro de Ubicación
    const groups = {};
    managed.forEach(loc => {
      groups[loc] = [];
    });

    activos.forEach(a => {
      const g = getLocationGroup(a.ubicacion);
      if (!groups[g]) groups[g] = [];
      groups[g].push(a);
    });

    const locationNames = Object.keys(groups);

    if (locationNames.length === 0) {
      dom.locationsGrid.innerHTML = `
        <div class="empty-state">
          <p>No hay ubicaciones registradas.</p>
          <button class="btn btn-primary" id="btn-empty-add-location">Crear Primera Ubicación</button>
        </div>
      `;
      document.getElementById('btn-empty-add-location')?.addEventListener('click', openManageLocationsModal);
      return;
    }

    let html = '';
    locationNames.forEach(locName => {
      const items = groups[locName];
      const operativos = items.filter(i => (i.estado || '').toLowerCase() === 'operativo').length;

      // Resumen de tipos de productos dentro de esta ubicación
      const productTypes = {};
      items.forEach(i => {
        const t = i.tipo || 'Activo';
        productTypes[t] = (productTypes[t] || 0) + 1;
      });

      const summaryTags = Object.entries(productTypes).map(([tipo, count]) => {
        return `<span class="location-summary-tag">${count} ${tipo}</span>`;
      }).join('');

      html += `
        <div class="location-card" data-location="${locName}">
          <div class="location-card-header">
            <span class="location-count-badge">${items.length} ${items.length === 1 ? 'activo' : 'activos'}</span>
          </div>
          <h3 class="location-title">${locName}</h3>
          <div class="location-assets-summary">
            ${summaryTags || '<span style="font-size:11px; color:var(--text-muted);">Sin activos asignados</span>'}
          </div>
          <div class="category-status-indicator" style="margin-bottom:8px;">
            <span class="status-dot green"></span> ${operativos} operativos
            ${items.length - operativos > 0 ? `<span class="status-dot orange" style="margin-left:8px;"></span> ${items.length - operativos} en revisión` : ''}
          </div>
          <div class="location-card-footer">
            <span>Ver activos y códigos de barras →</span>
          </div>
        </div>
      `;
    });

    dom.locationsGrid.innerHTML = html;

    // Vincular clics en ubicaciones
    dom.locationsGrid.querySelectorAll('.location-card').forEach(card => {
      card.addEventListener('click', () => {
        const loc = card.getAttribute('data-location');
        openLocationDetail(loc);
      });
    });
  }

  // Abre el panel detallado de una ubicación específica (ej. "PUNTO DE VENTA")
  function openLocationDetail(locationName) {
    state.selectedLocation = locationName;

    dom.locationsGridWrapper.style.display = 'none';
    dom.locationDetailView.style.display = 'block';

    const allInLoc = Storage.getActivos().filter(a => getLocationGroup(a.ubicacion) === locationName);

    dom.locationDetailTitle.textContent = locationName;
    dom.locationDetailCount.innerHTML = `
      <span><strong>${allInLoc.length}</strong> activos asignados a este punto</span>
      <button class="btn btn-sm btn-primary" style="margin-left:12px; padding:4px 10px; font-size:11px;" onclick="window.quickAddAssetForLocation('${locationName}')">
        Agregar Activo a ${locationName}
      </button>
    `;

    renderLocationCategoryChips(allInLoc);
    renderLocationDetailAssets();
  }

  // Renderiza chips de productos dentro de la ubicación seleccionada
  function renderLocationCategoryChips(allInLoc) {
    const counts = {};
    allInLoc.forEach(a => {
      const t = a.tipo || 'General';
      counts[t] = (counts[t] || 0) + 1;
    });

    let chipsHtml = `
      <button type="button" class="location-chip ${state.selectedLocationCategoryFilter === 'todos' ? 'active' : ''}" data-cat="todos">
        Todos (${allInLoc.length})
      </button>
    `;

    Object.entries(counts).forEach(([tipo, count]) => {
      const isActive = state.selectedLocationCategoryFilter === tipo;
      chipsHtml += `
        <button type="button" class="location-chip ${isActive ? 'active' : ''}" data-cat="${tipo}">
          ${tipo} (${count})
        </button>
      `;
    });

    dom.locationCategoryChips.innerHTML = chipsHtml;

    dom.locationCategoryChips.querySelectorAll('.location-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedLocationCategoryFilter = btn.getAttribute('data-cat');
        dom.locationCategoryChips.querySelectorAll('.location-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderLocationDetailAssets();
      });
    });
  }

  // Renderiza los activos dentro de la ubicación seleccionada
  function renderLocationDetailAssets() {
    if (!state.selectedLocation) return;
    let items = Storage.getActivos().filter(a => getLocationGroup(a.ubicacion) === state.selectedLocation);

    if (state.selectedLocationCategoryFilter && state.selectedLocationCategoryFilter !== 'todos') {
      items = items.filter(a => a.tipo === state.selectedLocationCategoryFilter);
    }

    if (items.length === 0) {
      dom.locationDetailList.innerHTML = `<div class="empty-state">No hay activos de esta categoría en ${state.selectedLocation}.</div>`;
      return;
    }

    let html = '';
    items.forEach(asset => {
      const barcodeValue = asset.barcode || asset.id;
      const barcodeSvg = Code128.renderSVG(barcodeValue, { height: 42, width: 1.6, fontSize: 12 });
      const isOperativo = (asset.estado || '').toLowerCase() === 'operativo';
      const isMantenimiento = (asset.estado || '').toLowerCase().includes('mantenimiento');
      const badgeClass = isOperativo ? 'badge-green' : (isMantenimiento ? 'badge-orange' : 'badge-red');

      html += `
        <div class="asset-card" data-id="${asset.id}">
          <div class="asset-card-top">
            <div class="asset-id-wrap">
              <span class="asset-badge-id">ID: ${asset.id}</span>
              <span class="badge ${badgeClass}">${asset.estado || 'Operativo'}</span>
              <span style="font-size:11px; font-weight:700; color:#475569; background:#f1f5f9; padding:2px 8px; border-radius:6px;">
                ${asset.tipo}
              </span>
            </div>
            <div class="asset-quick-actions">
              <button class="btn-icon" title="Ver / Imprimir Etiqueta" onclick="window.showLabelModal('${asset.id}')">
                ${SVG_TAG}
              </button>
              <button class="btn-icon" title="Editar" onclick="window.editAsset('${asset.id}')">
                ${SVG_EDIT}
              </button>
            </div>
          </div>

          <!-- Código de barras visible -->
          <div class="asset-barcode-box" onclick="window.showAssetModal('${asset.id}')">
            ${barcodeSvg}
          </div>

          <!-- Ubicación destacada -->
          <div class="asset-location-highlight">
            <span class="loc-label">Ubicación:</span>
            <span class="loc-value">${asset.ubicacion || 'Sin ubicación específica'}</span>
            <button class="btn-text-action" onclick="window.promptChangeLocation('${asset.id}')">Cambiar</button>
          </div>

          <!-- Detalles técnicos -->
          <div class="asset-details-grid">
            <div class="detail-item">
              <span class="detail-title">Marca:</span>
              <span class="detail-desc">${asset.marca || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-title">Modelo:</span>
              <span class="detail-desc">${asset.modelo || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-title">N° Serie:</span>
              <span class="detail-desc">${asset.serie || '-'}</span>
            </div>
            ${asset.notas ? `
            <div class="detail-item" style="grid-column: span 3;">
              <span class="detail-title">Notas:</span>
              <span class="detail-desc">${asset.notas}</span>
            </div>` : ''}
          </div>

          <div class="asset-card-bottom-actions">
            <button class="btn btn-sm btn-outline" onclick="window.showAssetModal('${asset.id}')">
              Ver Ficha Completa
            </button>
            <button class="btn btn-sm btn-primary" onclick="window.showLabelModal('${asset.id}')">
              Imprimir Etiqueta QR
            </button>
          </div>
        </div>
      `;
    });

    dom.locationDetailList.innerHTML = html;
  }

  // Regresar de Detalle de Ubicación a Cuadros de Ubicación
  dom.btnBackLocations.addEventListener('click', () => {
    state.selectedLocation = null;
    dom.locationDetailView.style.display = 'none';
    dom.locationsGridWrapper.style.display = 'block';
    renderLocationsGrid();
  });

  // Selector de modo de vista: Por Ubicaciones vs Por Productos
  dom.btnModeLocations.addEventListener('click', () => {
    state.subViewMode = 'locations';
    dom.btnModeLocations.classList.add('active');
    dom.btnModeCategories.classList.remove('active');

    dom.categoriesGridWrapper.style.display = 'none';
    dom.productDetailView.style.display = 'none';

    if (state.selectedLocation) {
      dom.locationsGridWrapper.style.display = 'none';
      dom.locationDetailView.style.display = 'block';
      openLocationDetail(state.selectedLocation);
    } else {
      dom.locationDetailView.style.display = 'none';
      dom.locationsGridWrapper.style.display = 'block';
      renderLocationsGrid();
    }
  });

  dom.btnModeCategories.addEventListener('click', () => {
    state.subViewMode = 'categories';
    dom.btnModeCategories.classList.add('active');
    dom.btnModeLocations.classList.remove('active');

    dom.locationsGridWrapper.style.display = 'none';
    dom.locationDetailView.style.display = 'none';

    if (state.selectedCategory) {
      dom.categoriesGridWrapper.style.display = 'none';
      dom.productDetailView.style.display = 'block';
      openProductDetail(state.selectedCategory);
    } else {
      dom.productDetailView.style.display = 'none';
      dom.categoriesGridWrapper.style.display = 'block';
      renderCategoriesGrid();
    }
  });

  // Función rápida para agregar activo con ubicación preseleccionada
  window.quickAddAssetForLocation = (locationName) => {
    dom.assetForm.reset();
    state.editingAssetId = null;
    dom.formTitle.textContent = `Registrar Activo en: ${locationName}`;
    dom.formUbicacion.value = locationName;
    dom.formId.value = Storage.generateNextId();
    dom.formBarcode.value = dom.formId.value;
    dom.btnCancelEdit.style.display = 'inline-block';
    navigateToTab('registro');
    dom.formTipo.focus();
  };

  // ==========================================
  // VISTA: PRODUCTOS Y SUB-PRODUCTOS (CUADROS)
  // ==========================================
  function renderCategoriesGrid() {
    const activos = Storage.getActivos();
    const allTypes = Storage.getProductTypes ? Storage.getProductTypes() : Storage.getTipos();

    // Agrupar activos por Producto
    const groups = {};
    allTypes.forEach(t => { groups[t] = []; });
    activos.forEach(a => {
      const tipo = a.tipo || 'Sin Categoría';
      if (!groups[tipo]) groups[tipo] = [];
      groups[tipo].push(a);
    });

    const categoryNames = Object.keys(groups).sort();

    if (categoryNames.length === 0) {
      dom.categoriesGrid.innerHTML = `
        <div class="empty-state">
          <p>No hay productos registrados en el sistema.</p>
          <button class="btn btn-primary" onclick="window.openManageProductsModal()">Crear Producto</button>
        </div>
      `;
      return;
    }

    let html = '';
    categoryNames.forEach(name => {
      const items = groups[name] || [];
      const operativos = items.filter(i => (i.estado || '').toLowerCase() === 'operativo').length;
      const subCount = (Storage.getSubProducts(name) || []).length;

      html += `
        <div class="category-card" data-category="${name}">
          <div class="category-card-header">
            <span class="category-count">${items.length} ${items.length === 1 ? 'activo' : 'activos'}</span>
          </div>
          <h3 class="category-title">${name}</h3>
          <div style="font-size:11px; color:#4f46e5; font-weight:700; margin-top:3px;">
            ${subCount > 0 ? `${subCount} ${subCount === 1 ? 'sub-producto' : 'sub-productos'}` : 'Sin sub-productos'}
          </div>
          <div class="category-status-indicator" style="margin-top:6px;">
            <span class="status-dot green"></span> ${operativos} operativos
            ${items.length - operativos > 0 ? `<span class="status-dot orange" style="margin-left:8px;"></span> ${items.length - operativos} en revisión` : ''}
          </div>
          <div class="category-card-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Ver opciones / cuadros →</span>
            <span style="font-size:11px; text-decoration:underline; font-weight:700;" onclick="event.stopPropagation(); window.openEditProductFieldsModal('${name}')">Editar campos</span>
          </div>
        </div>
      `;
    });

    dom.categoriesGrid.innerHTML = html;

    // Vincular clics en tarjetas de producto
    dom.categoriesGrid.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.getAttribute('data-category');
        openProductDetail(cat);
      });
    });
  }

  // Abre el detalle de un producto mostrando sus SUB-PRODUCTOS (OTROS CUADROS)
  function openProductDetail(categoryName) {
    state.selectedCategory = categoryName;
    state.selectedSubCategory = null;

    dom.categoriesGridWrapper.style.display = 'none';
    dom.productDetailView.style.display = 'block';
    if (dom.subproductsGridWrapper) dom.subproductsGridWrapper.style.display = 'block';
    if (dom.subproductDetailView) dom.subproductDetailView.style.display = 'none';

    renderSubproductsGrid(categoryName);
  }

  // Renderiza los cuadros de sub-productos para un producto
  function renderSubproductsGrid(categoryName) {
    if (dom.productDetailTitle) dom.productDetailTitle.textContent = categoryName;
    const activos = Storage.getActivos().filter(a => (a.tipo || '').toLowerCase() === categoryName.toLowerCase());
    const subs = Storage.getSubProducts(categoryName);

    // Agrupar activos por sub-producto
    const subGroups = {};
    subs.forEach(s => { subGroups[s] = []; });
    activos.forEach(a => {
      const s = a.subtipo || (a.modelo && a.modelo !== '-' ? a.modelo : 'General');
      if (!subGroups[s]) subGroups[s] = [];
      subGroups[s].push(a);
    });

    const allSubKeys = Object.keys(subGroups);
    if (dom.productDetailCount) {
      dom.productDetailCount.textContent = `${activos.length} activos en ${allSubKeys.length} sub-productos. Toca un cuadro para ver sus activos:`;
    }

    let html = '';

    // Cuadros de cada sub-producto
    allSubKeys.forEach(subName => {
      const items = subGroups[subName] || [];
      const operativos = items.filter(i => (i.estado || '').toLowerCase() === 'operativo').length;

      html += `
        <div class="category-card" data-sub="${subName}">
          <div class="category-card-header">
            <span class="category-count">${items.length} ${items.length === 1 ? 'unidad' : 'unidades'}</span>
          </div>
          <h3 class="category-title" style="color:#1e3a8a;">${subName}</h3>
          <div class="category-status-indicator" style="margin-top:6px;">
            <span class="status-dot green"></span> ${operativos} operativos
            ${items.length - operativos > 0 ? `<span class="status-dot orange" style="margin-left:8px;"></span> ${items.length - operativos} en revisión` : ''}
          </div>
          <div class="category-card-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <span>Ver activos →</span>
            <span style="font-size:11px; color:#ef4444; font-weight:700;" onclick="event.stopPropagation(); window.promptDeleteSubProduct('${categoryName}', '${subName}')">Eliminar</span>
          </div>
        </div>
      `;
    });

    // Cuadro "Ver Todos los activos"
    html += `
      <div class="category-card" data-sub="todos" style="border-color:#cbd5e1; background:#f8fafc;">
        <div class="category-card-header">
          <span class="category-count">${activos.length} activos</span>
        </div>
        <h3 class="category-title" style="color:#0f172a;">Ver Todos</h3>
        <p style="font-size:11px; color:var(--text-muted); margin-top:4px;">Ver todos los activos de ${categoryName} sin filtrar</p>
        <div class="category-card-footer">
          <span>Ver todos los activos →</span>
        </div>
      </div>
    `;

    // Cuadro "+ Agregar Sub-producto"
    html += `
      <div class="category-card card-add-action" id="card-add-subproduct-box">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span style="font-weight:700; font-size:14px;">+ Agregar Sub-producto</span>
        <span style="font-size:11px; color:var(--text-muted); margin-top:2px;">Crea una nueva opción para ${categoryName}</span>
      </div>
    `;

    if (dom.subproductsGrid) dom.subproductsGrid.innerHTML = html;

    // Vincular clics en tarjetas de sub-producto
    if (dom.subproductsGrid) {
      dom.subproductsGrid.querySelectorAll('.category-card[data-sub]').forEach(card => {
        card.addEventListener('click', () => {
          const sub = card.getAttribute('data-sub');
          openSubproductDetail(categoryName, sub);
        });
      });
    }

    const addBox = document.getElementById('card-add-subproduct-box');
    if (addBox) {
      addBox.addEventListener('click', () => {
        promptAddSubProduct(categoryName);
      });
    }
  }

  // Abre el detalle de activos de un sub-producto
  function openSubproductDetail(categoryName, subName) {
    state.selectedSubCategory = subName;

    if (dom.subproductsGridWrapper) dom.subproductsGridWrapper.style.display = 'none';
    if (dom.subproductDetailView) dom.subproductDetailView.style.display = 'block';

    const isTodos = subName === 'todos';
    if (dom.subproductDetailTitle) {
      dom.subproductDetailTitle.textContent = isTodos ? `${categoryName} (Todos)` : `${categoryName} - ${subName}`;
    }

    let items = Storage.getActivos().filter(a => (a.tipo || '').toLowerCase() === categoryName.toLowerCase());
    if (!isTodos) {
      items = items.filter(a => {
        const s = a.subtipo || (a.modelo && a.modelo !== '-' ? a.modelo : 'General');
        return s.toLowerCase() === subName.toLowerCase();
      });
    }

    if (dom.subproductDetailCount) {
      dom.subproductDetailCount.textContent = `${items.length} unidades encontradas`;
    }

    if (items.length === 0) {
      dom.productDetailList.innerHTML = `
        <div class="empty-state">
          <p>No se encontraron activos para este sub-producto.</p>
          <button class="btn btn-primary" onclick="window.quickAddAssetForSubCategory('${categoryName}', '${isTodos ? '' : subName}')">
            Registrar Activo Aquí
          </button>
        </div>
      `;
      return;
    }

    let html = '';
    items.forEach(asset => {
      const barcodeValue = asset.barcode || asset.id;
      const barcodeSvg = Code128.renderSVG(barcodeValue, { height: 42, width: 1.6, fontSize: 12 });
      const isOperativo = (asset.estado || '').toLowerCase() === 'operativo';
      const isMantenimiento = (asset.estado || '').toLowerCase().includes('mantenimiento');
      const badgeClass = isOperativo ? 'badge-green' : (isMantenimiento ? 'badge-orange' : 'badge-red');

      html += `
        <div class="asset-card" data-id="${asset.id}">
          <div class="asset-card-top">
            <div class="asset-id-wrap">
              <span class="asset-badge-id">ID: ${asset.id}</span>
              <span class="badge ${badgeClass}">${asset.estado || 'Operativo'}</span>
              ${asset.subtipo ? `<span class="subproduct-badge">${asset.subtipo}</span>` : ''}
            </div>
            <div class="asset-quick-actions">
              <button class="btn-icon" title="Ver / Imprimir Etiqueta" onclick="window.showLabelModal('${asset.id}')">
                ${SVG_TAG}
              </button>
              <button class="btn-icon" title="Editar" onclick="window.editAsset('${asset.id}')">
                ${SVG_EDIT}
              </button>
            </div>
          </div>

          <!-- Código de barras visible -->
          <div class="asset-barcode-box" onclick="window.showAssetModal('${asset.id}')">
            ${barcodeSvg}
          </div>

          <!-- Ubicación destacada -->
          <div class="asset-location-highlight">
            <span class="loc-label">Ubicación:</span>
            <span class="loc-value">${asset.ubicacion || 'Sin ubicación asignada'}</span>
            <button class="btn-text-action" onclick="window.promptChangeLocation('${asset.id}')">Cambiar</button>
          </div>

          <!-- Detalles técnicos -->
          <div class="asset-details-grid">
            <div class="detail-item">
              <span class="detail-title">Marca:</span>
              <span class="detail-desc">${asset.marca || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-title">Modelo:</span>
              <span class="detail-desc">${asset.modelo || '-'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-title">N° Serie:</span>
              <span class="detail-desc">${asset.serie || '-'}</span>
            </div>
            ${asset.notas ? `
            <div class="detail-item" style="grid-column: span 3;">
              <span class="detail-title">Notas:</span>
              <span class="detail-desc">${asset.notas}</span>
            </div>` : ''}
          </div>

          <div class="asset-card-bottom-actions">
            <button class="btn btn-sm btn-outline" onclick="window.showAssetModal('${asset.id}')">
              Ver Ficha Completa
            </button>
            <button class="btn btn-sm btn-primary" onclick="window.showLabelModal('${asset.id}')">
              Imprimir Etiqueta QR
            </button>
          </div>
        </div>
      `;
    });

    dom.productDetailList.innerHTML = html;
  }

  function promptAddSubProduct(categoryName) {
    const subName = prompt(`Ingresa el nombre del nuevo sub-producto para "${categoryName}":\n(Ej: Inalámbrico, 24 Pulgadas, Táctil, etc.)`);
    if (subName && subName.trim()) {
      Storage.addSubProduct(categoryName, subName.trim());
      renderSubproductsGrid(categoryName);
      updateDatalists();
      refreshUI();
    }
  }
  window.promptAddSubProduct = promptAddSubProduct;

  window.promptDeleteSubProduct = (categoryName, subName) => {
    if (confirm(`¿Eliminar el sub-producto "${subName}" de "${categoryName}"?`)) {
      Storage.deleteSubProduct(categoryName, subName);
      renderSubproductsGrid(categoryName);
      updateDatalists();
      refreshUI();
    }
  };

  window.quickAddAssetForSubCategory = (categoryName, subCategoryName) => {
    dom.assetForm.reset();
    state.editingAssetId = null;
    dom.formTitle.textContent = `Registrar Nuevo: ${categoryName}`;
    dom.formTipo.value = categoryName;
    if (dom.formSubtipo) dom.formSubtipo.value = subCategoryName || '';
    dom.formId.value = Storage.generateNextId();
    dom.formBarcode.value = dom.formId.value;
    dom.btnCancelEdit.style.display = 'inline-block';
    navigateToTab('registro');
    dom.formUbicacion.focus();
  };

  // Regresar a la vista de cuadrícula de categorías
  if (dom.btnBackToCategories) {
    dom.btnBackToCategories.addEventListener('click', () => {
      state.selectedCategory = null;
      state.selectedSubCategory = null;
      dom.productDetailView.style.display = 'none';
      dom.categoriesGridWrapper.style.display = 'block';
      renderCategoriesGrid();
    });
  }

  // Regresar a la vista de sub-productos del producto actual
  if (dom.btnBackToSubproducts) {
    dom.btnBackToSubproducts.addEventListener('click', () => {
      if (state.selectedCategory) {
        openProductDetail(state.selectedCategory);
      }
    });
  }

  // Botón directo para nuevo sub-producto en cabecera
  if (dom.btnAddSubproductDirect) {
    dom.btnAddSubproductDirect.addEventListener('click', () => {
      if (state.selectedCategory) {
        promptAddSubProduct(state.selectedCategory);
      }
    });
  }

  // Botón directo para agregar activo al sub-producto
  if (dom.btnQuickAddSubproductAsset) {
    dom.btnQuickAddSubproductAsset.addEventListener('click', () => {
      if (state.selectedCategory) {
        const sub = state.selectedSubCategory === 'todos' ? '' : (state.selectedSubCategory || '');
        quickAddAssetForSubCategory(state.selectedCategory, sub);
      }
    });
  }

  // ==========================================
  // VISTA: TODOS LOS ACTIVOS (LISTA GENERAL)
  // ==========================================
  function renderAllAssets() {
    const query = dom.searchInput.value.trim().toLowerCase();
    const status = dom.filterStatus.value.toLowerCase();
    const location = dom.filterLocation.value;

    let activos = Storage.getActivos();

    // Filtros
    if (query) {
      activos = activos.filter(a =>
        (a.id && a.id.toLowerCase().includes(query)) ||
        (a.barcode && a.barcode.toLowerCase().includes(query)) ||
        (a.tipo && a.tipo.toLowerCase().includes(query)) ||
        (a.marca && a.marca.toLowerCase().includes(query)) ||
        (a.modelo && a.modelo.toLowerCase().includes(query)) ||
        (a.serie && a.serie.toLowerCase().includes(query)) ||
        (a.ubicacion && a.ubicacion.toLowerCase().includes(query)) ||
        (a.notas && a.notas.toLowerCase().includes(query))
      );
    }

    if (status !== 'todos') {
      if (status === 'operativo') {
        activos = activos.filter(a => (a.estado || '').toLowerCase() === 'operativo');
      } else if (status === 'mantenimiento') {
        activos = activos.filter(a => (a.estado || '').toLowerCase().includes('mantenimiento'));
      } else if (status === 'debaja') {
        activos = activos.filter(a => {
          const e = (a.estado || '').toLowerCase();
          return e.includes('baja') || e.includes('dañado');
        });
      }
    }

    if (location !== 'todos') {
      activos = activos.filter(a => a.ubicacion === location);
    }

    dom.assetsCountText.textContent = `${activos.length} activos encontrados`;

    if (activos.length === 0) {
      dom.assetsList.innerHTML = `
        <div class="empty-state">
          <p>No se encontraron activos con los filtros aplicados.</p>
        </div>
      `;
      if (dom.desktopAssetsTableBody) {
        dom.desktopAssetsTableBody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 36px 16px; color: var(--text-muted); font-size: 13px;">
              No se encontraron activos con los filtros aplicados.
            </td>
          </tr>
        `;
      }
      return;
    }

    let html = '';
    let tableHtml = '';
    activos.forEach(asset => {
      const barcodeValue = asset.barcode || asset.id;
      const barcodeSvg = Code128.renderSVG(barcodeValue, { height: 38, width: 1.5, fontSize: 11 });
      const isOperativo = (asset.estado || '').toLowerCase() === 'operativo';
      const isMantenimiento = (asset.estado || '').toLowerCase().includes('mantenimiento');
      const badgeClass = isOperativo ? 'badge-green' : (isMantenimiento ? 'badge-orange' : 'badge-red');
      const icon = getProductIcon(asset.tipo);

      // Ficha móvil
      html += `
        <div class="asset-card" data-id="${asset.id}">
          <div class="asset-card-top">
            <div class="asset-id-wrap">
              <span class="product-type-badge">${asset.tipo}</span>
              ${asset.subtipo ? `<span class="subproduct-badge">${asset.subtipo}</span>` : ''}
              <span class="asset-badge-id">ID: ${asset.id}</span>
              <span class="badge ${badgeClass}">${asset.estado || 'Operativo'}</span>
            </div>
            <div class="asset-quick-actions">
              <button class="btn-icon" title="Ver / Imprimir Etiqueta" onclick="window.showLabelModal('${asset.id}')">${SVG_TAG}</button>
              <button class="btn-icon" title="Editar" onclick="window.editAsset('${asset.id}')">${SVG_EDIT}</button>
            </div>
          </div>

          <div class="asset-barcode-box" onclick="window.showAssetModal('${asset.id}')">
            ${barcodeSvg}
          </div>

          <div class="asset-location-highlight">
            <span class="loc-label">Ubicación:</span>
            <span class="loc-value">${asset.ubicacion || 'Sin especificar'}</span>
            <button class="btn-text-action" onclick="window.promptChangeLocation('${asset.id}')">Mover</button>
          </div>

          <div class="asset-details-grid">
            <div class="detail-item">
              <span class="detail-title">Marca / Modelo:</span>
              <span class="detail-desc">${asset.marca || '-'} ${asset.modelo ? `(${asset.modelo})` : ''}</span>
            </div>
            <div class="detail-item">
              <span class="detail-title">Serie:</span>
              <span class="detail-desc">${asset.serie || '-'}</span>
            </div>
          </div>
        </div>
      `;

      // Fila de tabla para PC / Laptop
      tableHtml += `
        <tr>
          <td><span class="table-id-badge">${asset.id}</span></td>
          <td><span class="table-barcode-preview">${barcodeValue}</span></td>
          <td>
            <strong style="color: #0f172a;">${asset.tipo || '-'}</strong>
            ${asset.subtipo ? `<div style="margin-top: 2px;"><span class="subproduct-badge">${asset.subtipo}</span></div>` : ''}
          </td>
          <td>
            <div style="font-weight: 600;">${asset.marca || '-'}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${asset.modelo || ''}</div>
          </td>
          <td><span style="font-family: monospace; font-size: 12px; color: #475569;">${asset.serie || '-'}</span></td>
          <td>
            <span style="background: #eff6ff; color: #1e40af; font-weight: 600; padding: 4px 10px; border-radius: 6px; font-size: 12px;">
              ${asset.ubicacion || 'Sin Ubicación'}
            </span>
          </td>
          <td><span class="badge ${badgeClass}">${asset.estado || 'Operativo'}</span></td>
          <td>
            <div class="table-actions-cell">
              <button class="btn-icon" title="Ver Detalle" onclick="window.showAssetModal('${asset.id}')">${SVG_EYE}</button>
              <button class="btn-icon" title="Ver / Imprimir Etiqueta" onclick="window.showLabelModal('${asset.id}')">${SVG_TAG}</button>
              <button class="btn-icon" title="Editar" onclick="window.editAsset('${asset.id}')">${SVG_EDIT}</button>
              <button class="btn-icon" title="Eliminar" onclick="window.deleteAsset('${asset.id}')" style="color: #ef4444;">${SVG_TRASH}</button>
            </div>
          </td>
        </tr>
      `;
    });

    dom.assetsList.innerHTML = html;
    if (dom.desktopAssetsTableBody) {
      dom.desktopAssetsTableBody.innerHTML = tableHtml;
    }
  }

  // Escuchar inputs de búsqueda y filtros
  dom.searchInput.addEventListener('input', renderAllAssets);
  dom.filterStatus.addEventListener('change', renderAllAssets);
  dom.filterLocation.addEventListener('change', renderAllAssets);

  // ==========================================
  // REGISTRO Y EDICIÓN DE ACTIVOS
  // ==========================================
  dom.btnAutoId.addEventListener('click', () => {
    dom.formId.value = Storage.generateNextId();
    if (!dom.formBarcode.value) {
      dom.formBarcode.value = dom.formId.value;
    }
  });

  // Botón para escanear código de barras directamente al formulario
  dom.btnScanBarcodeField.addEventListener('click', () => {
    openScanner((scannedCode) => {
      dom.formBarcode.value = scannedCode;
      if (!dom.formId.value) {
        dom.formId.value = scannedCode;
      }
      closeScanner();
    });
  });

  // Guardar activo (Nuevo o Editado)
  dom.assetForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = dom.formId.value.trim();
    if (!id) {
      alert("Por favor ingresa o genera un ID de activo.");
      return;
    }

    const item = {
      id: id,
      barcode: dom.formBarcode.value.trim() || id,
      tipo: dom.formTipo.value.trim() || 'General',
      subtipo: dom.formSubtipo ? dom.formSubtipo.value.trim() : '',
      marca: dom.formMarca.value.trim() || '-',
      modelo: dom.formModelo.value.trim() || '-',
      serie: dom.formSerie.value.trim() || '-',
      estado: dom.formEstado.value,
      ubicacion: dom.formUbicacion.value.trim() || 'Punto de Venta',
      notas: dom.formNotas.value.trim(),
      fecha: new Date().toISOString().slice(0, 10)
    };

    Storage.saveActivo(item);

    // Limpiar formulario y resetear estado
    dom.assetForm.reset();
    if (dom.formSubtipo) dom.formSubtipo.value = '';
    state.editingAssetId = null;
    dom.formTitle.textContent = "Registrar Nuevo Activo";
    dom.btnCancelEdit.style.display = 'none';

    refreshUI();

    // Mensaje de éxito y preguntar si desea imprimir etiqueta
    if (confirm(`Activo ${item.id} guardado con éxito.\n¿Deseas imprimir o ver su etiqueta de código de barras y QR ahora?`)) {
      window.showLabelModal(item.id);
    } else {
      navigateToTab('paneles');
      openProductDetail(item.tipo);
    }
  });

  // Cancelar edición
  dom.btnCancelEdit.addEventListener('click', () => {
    dom.assetForm.reset();
    if (dom.formSubtipo) dom.formSubtipo.value = '';
    state.editingAssetId = null;
    dom.formTitle.textContent = "Registrar Nuevo Activo";
    dom.btnCancelEdit.style.display = 'none';
    navigateToTab('paneles');
  });

  // Escuchar cambio en el tipo de producto para sugerir sub-productos
  if (dom.formTipo) {
    dom.formTipo.addEventListener('input', () => {
      updateSubtiposDatalist();
    });
    dom.formTipo.addEventListener('change', () => {
      updateSubtiposDatalist();
    });
  }

  // Función global para editar activo
  window.editAsset = (id) => {
    const asset = Storage.getById(id);
    if (!asset) return;

    state.editingAssetId = asset.id;
    dom.formTitle.textContent = `Editar Activo: ${asset.id}`;
    dom.formId.value = asset.id;
    dom.formBarcode.value = asset.barcode || asset.id;
    dom.formTipo.value = asset.tipo || '';
    if (dom.formSubtipo) {
      dom.formSubtipo.value = asset.subtipo || (asset.modelo && asset.modelo !== '-' ? asset.modelo : '');
    }
    updateSubtiposDatalist();
    dom.formMarca.value = asset.marca || '';
    dom.formModelo.value = asset.modelo || '';
    dom.formSerie.value = asset.serie || '';
    dom.formEstado.value = asset.estado || 'Operativo';
    dom.formUbicacion.value = asset.ubicacion || '';
    dom.formNotas.value = asset.notas || '';

    dom.btnCancelEdit.style.display = 'inline-block';
    navigateToTab('registro');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función rápida para cambiar ubicación
  window.promptChangeLocation = (id) => {
    const asset = Storage.getById(id);
    if (!asset) return;
    const nuevaUbicacion = prompt(`Cambiar ubicación para ${asset.tipo} (${asset.id}):\nUbicación actual: ${asset.ubicacion || 'Ninguna'}`, asset.ubicacion || '');
    if (nuevaUbicacion !== null && nuevaUbicacion.trim() !== '') {
      asset.ubicacion = nuevaUbicacion.trim();
      Storage.saveActivo(asset);
      refreshUI();
      if (state.selectedCategory) {
        openProductDetail(state.selectedCategory);
      }
    }
  };

  // Función global para eliminar activo
  window.deleteAsset = (id) => {
    const asset = Storage.getById(id);
    if (!asset) return;
    if (confirm(`¿Eliminar el activo ${asset.id} (${asset.tipo || ''})?`)) {
      Storage.deleteActivo(id);
      refreshUI();
      renderAllAssets();
    }
  };

  // Función rápida para agregar activo con categoría preseleccionada
  window.quickAddAssetForCategory = (tipoName) => {
    dom.assetForm.reset();
    state.editingAssetId = null;
    dom.formTitle.textContent = `Registrar Nuevo: ${tipoName}`;
    dom.formTipo.value = tipoName;
    dom.formId.value = Storage.generateNextId();
    dom.formBarcode.value = dom.formId.value;
    dom.btnCancelEdit.style.display = 'inline-block';
    navigateToTab('registro');
    dom.formUbicacion.focus();
  };

  // ==========================================
  // NAVEGACIÓN ENTRE PESTAÑAS (TABS)
  // ==========================================
  function navigateToTab(tabId) {
    state.currentTab = tabId;

    dom.navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Sincronizar menú superior de PC / Laptop
    const desktopNavLinks = document.querySelectorAll('.desktop-nav-link');
    desktopNavLinks.forEach(link => {
      const linkTab = link.getAttribute('data-tab');
      const linkMode = link.getAttribute('data-mode');
      if (linkMode) {
        link.classList.toggle('active', linkTab === tabId && state.subViewMode === linkMode);
      } else {
        link.classList.toggle('active', linkTab === tabId);
      }
    });

    dom.tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    if (tabId === 'paneles') {
      if (state.subViewMode === 'locations') {
        if (state.selectedLocation) {
          openLocationDetail(state.selectedLocation);
        } else {
          dom.locationsGridWrapper.style.display = 'block';
          dom.locationDetailView.style.display = 'none';
          dom.categoriesGridWrapper.style.display = 'none';
          dom.productDetailView.style.display = 'none';
          renderLocationsGrid();
        }
      } else {
        if (state.selectedCategory) {
          if (state.selectedSubCategory) {
            openSubproductDetail(state.selectedCategory, state.selectedSubCategory);
          } else {
            openProductDetail(state.selectedCategory);
          }
        } else {
          dom.locationsGridWrapper.style.display = 'none';
          dom.locationDetailView.style.display = 'none';
          dom.categoriesGridWrapper.style.display = 'block';
          dom.productDetailView.style.display = 'none';
          renderCategoriesGrid();
        }
      }
    } else if (tabId === 'todos') {
      renderAllAssets();
    } else if (tabId === 'registro') {
      if (!state.editingAssetId && !dom.formId.value) {
        dom.formId.value = Storage.generateNextId();
        dom.formBarcode.value = dom.formId.value;
      }
    }
  }

  window.navigateToTab = navigateToTab;

  dom.navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      navigateToTab(tab);
    });
  });

  // Navegación y acciones directas desde la cabecera Desktop (PC / Laptop)
  document.querySelectorAll('.desktop-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const tab = link.getAttribute('data-tab');
      const mode = link.getAttribute('data-mode');
      if (mode) {
        state.subViewMode = mode;
        if (mode === 'locations') {
          state.selectedLocation = null;
          if (dom.btnModeLocations) dom.btnModeLocations.classList.add('active');
          if (dom.btnModeCategories) dom.btnModeCategories.classList.remove('active');
        } else {
          state.selectedCategory = null;
          if (dom.btnModeLocations) dom.btnModeLocations.classList.remove('active');
          if (dom.btnModeCategories) dom.btnModeCategories.classList.add('active');
        }
      }
      navigateToTab(tab);
    });
  });

  const btnDesktopQuickScan = document.getElementById('btn-desktop-quick-scan');
  if (btnDesktopQuickScan) {
    btnDesktopQuickScan.addEventListener('click', () => {
      openScanner();
    });
  }

  const btnDesktopQuickAdd = document.getElementById('btn-desktop-quick-add');
  if (btnDesktopQuickAdd) {
    btnDesktopQuickAdd.addEventListener('click', () => {
      dom.assetForm.reset();
      state.editingAssetId = null;
      dom.formTitle.textContent = "Registrar Nuevo Activo";
      dom.btnCancelEdit.style.display = 'none';
      dom.formId.value = Storage.generateNextId();
      dom.formBarcode.value = dom.formId.value;
      navigateToTab('registro');
    });
  }

  // ==========================================
  // ESCÁNER DE CÁMARA (QR & CÓDIGO DE BARRAS)
  // ==========================================
  let customScanCallback = null;

  function openScanner(callback = null) {
    customScanCallback = callback;

    if (!state.scannerInstance) {
      state.scannerInstance = new MobileAssetScanner({
        onResult: (code, format) => {
          handleScannedResult(code, format);
        }
      });
    }

    dom.scannerModal.style.display = 'flex';
    dom.scannerError.classList.add('hidden');
    if (dom.scannerNotice) dom.scannerNotice.classList.add('hidden');

    state.scannerInstance.start(dom.scannerVideo, dom.scannerError, dom.scannerNotice);
  }

  function closeScanner() {
    if (state.scannerInstance) {
      state.scannerInstance.stop();
    }
    dom.scannerModal.style.display = 'none';
    customScanCallback = null;
  }

  dom.btnTriggerScan.addEventListener('click', () => openScanner());
  dom.btnScanFAB.addEventListener('click', () => openScanner());
  dom.btnCloseScanner.addEventListener('click', () => closeScanner());

  // Botón directo para tomar foto desde la tarjeta de asistencia
  if (dom.btnSnapPhotoTrigger) {
    dom.btnSnapPhotoTrigger.addEventListener('click', () => {
      dom.fileScanInput.click();
    });
  }

  // Búsqueda manual rápida dentro del escáner
  if (dom.btnManualQuickGo && dom.manualQuickCode) {
    const submitManual = () => {
      const code = dom.manualQuickCode.value.trim();
      if (code) {
        handleScannedResult(code, 'MANUAL');
        dom.manualQuickCode.value = '';
      }
    };
    dom.btnManualQuickGo.addEventListener('click', submitManual);
    dom.manualQuickCode.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitManual();
      }
    });
  }

  // Linterna / Flash
  dom.btnTorch.addEventListener('click', () => {
    if (state.scannerInstance) {
      state.scannerInstance.toggleTorch();
    }
  });

  // Tomar o subir foto de código de barras
  dom.btnUploadPhoto.addEventListener('click', () => {
    dom.fileScanInput.click();
  });

  dom.fileScanInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && state.scannerInstance) {
      state.scannerInstance.scanFromFile(file);
    }
    e.target.value = '';
  });

  // Procesar código detectado por la cámara
  function handleScannedResult(code, format) {
    if (customScanCallback) {
      customScanCallback(code);
      return;
    }

    closeScanner();

    // 1. Buscar si el código ya existe en el inventario
    const asset = Storage.getByBarcode(code);

    if (asset) {
      // Activo encontrado -> Mostrar ficha inmediata
      window.showAssetModal(asset.id);
    } else {
      // Activo NO encontrado -> Preguntar para registrarlo
      const answer = confirm(
        `Código detectado: "${code}"\n\nEste código aún no está registrado en el inventario.\n¿Deseas registrar un nuevo activo con este código de barras?`
      );

      if (answer) {
        dom.assetForm.reset();
        state.editingAssetId = null;
        dom.formTitle.textContent = "Registrar Nuevo Activo";
        dom.formBarcode.value = code;
        dom.formId.value = Storage.generateNextId();
        dom.btnCancelEdit.style.display = 'none';
        navigateToTab('registro');
        dom.formTipo.focus();
      }
    }
  }

  // ==========================================
  // MODAL FICHA DETALLADA DEL ACTIVO
  // ==========================================
  window.showAssetModal = (id) => {
    const asset = Storage.getById(id);
    if (!asset) return;

    const barcodeValue = asset.barcode || asset.id;
    const sub = asset.subtipo || (asset.modelo && asset.modelo !== '-' ? asset.modelo : '');

    dom.modalAssetId.textContent = asset.id;
    dom.modalAssetTipo.textContent = asset.tipo;
    if (dom.modalAssetSubtipo) {
      if (sub) {
        dom.modalAssetSubtipo.textContent = sub;
        dom.modalAssetSubtipo.style.display = 'inline-block';
      } else {
        dom.modalAssetSubtipo.style.display = 'none';
      }
    }
    if (dom.modalAssetSubtipoVal) {
      dom.modalAssetSubtipoVal.textContent = sub || '-';
    }
    dom.modalAssetUbicacion.textContent = asset.ubicacion || 'Sin ubicación asignada';
    dom.modalAssetMarcaModelo.textContent = `${asset.marca || '-'} / ${asset.modelo || '-'}`;
    dom.modalAssetSerie.textContent = asset.serie || '-';
    dom.modalAssetNotas.textContent = asset.notas || 'Ninguna nota';

    // Estado badge
    const isOperativo = (asset.estado || '').toLowerCase() === 'operativo';
    const isMantenimiento = (asset.estado || '').toLowerCase().includes('mantenimiento');
    dom.modalAssetEstadoBadge.className = `badge ${isOperativo ? 'badge-green' : (isMantenimiento ? 'badge-orange' : 'badge-red')}`;
    dom.modalAssetEstadoBadge.textContent = asset.estado || 'Operativo';

    // Renderizar código de barras y QR
    dom.modalAssetBarcodeSvg.innerHTML = Code128.renderSVG(barcodeValue, { height: 50, width: 2, fontSize: 13 });
    dom.modalAssetQrSvg.innerHTML = CompactQR.renderSVG(barcodeValue, 130);

    // Botones del modal
    dom.modalBtnEdit.onclick = () => {
      dom.assetDetailModal.style.display = 'none';
      window.editAsset(asset.id);
    };

    dom.modalBtnMove.onclick = () => {
      window.promptChangeLocation(asset.id);
      window.showAssetModal(asset.id);
    };

    dom.modalBtnPrint.onclick = () => {
      dom.assetDetailModal.style.display = 'none';
      window.showLabelModal(asset.id);
    };

    dom.assetDetailModal.style.display = 'flex';
  };

  dom.modalBtnClose.addEventListener('click', () => {
    dom.assetDetailModal.style.display = 'none';
  });

  // ==========================================
  // MODAL IMPRESIÓN DE ETIQUETAS ADHESIVAS
  // ==========================================
  window.showLabelModal = (id) => {
    const asset = Storage.getById(id);
    if (!asset) return;

    const barcodeValue = asset.barcode || asset.id;
    const sub = asset.subtipo || (asset.modelo && asset.modelo !== '-' ? asset.modelo : '');
    const barcodeSvg = Code128.renderSVG(barcodeValue, { height: 42, width: 1.6, fontSize: 11 });
    const qrSvg = CompactQR.renderSVG(barcodeValue, 85);

    dom.labelPreviewContainer.innerHTML = `
      <div class="printable-tag">
        <div class="tag-header">
          <span class="tag-company">PUNTO DE VENTA - CONTROL DE ACTIVOS</span>
          <span class="tag-id">${asset.id}</span>
        </div>
        <div class="tag-body">
          <div class="tag-left">
            <div class="tag-product">${asset.tipo} ${sub ? `<span style="font-size:10px; font-weight:normal;">(${sub})</span>` : ''}</div>
            <div class="tag-info">${asset.marca} ${asset.modelo}</div>
            <div class="tag-location">${asset.ubicacion || 'Punto de Venta'}</div>
            <div class="tag-barcode-wrap">${barcodeSvg}</div>
          </div>
          <div class="tag-qr-wrap">
            ${qrSvg}
          </div>
        </div>
      </div>
    `;

    dom.labelModal.style.display = 'flex';
  };

  dom.btnCloseLabelModal.addEventListener('click', () => {
    dom.labelModal.style.display = 'none';
  });

  dom.btnPrintLabels.addEventListener('click', () => {
    window.print();
  });

  // Imprimir todas las etiquetas en lote
  dom.btnPrintAllLabels.addEventListener('click', () => {
    const list = Storage.getActivos();
    let tagsHtml = '';

    list.forEach(asset => {
      const barcodeValue = asset.barcode || asset.id;
      const barcodeSvg = Code128.renderSVG(barcodeValue, { height: 40, width: 1.5, fontSize: 10 });
      const qrSvg = CompactQR.renderSVG(barcodeValue, 80);

      tagsHtml += `
        <div class="printable-tag" style="margin-bottom:12px; page-break-inside:avoid;">
          <div class="tag-header">
            <span class="tag-company">CONTROL DE ACTIVOS POS</span>
            <span class="tag-id">${asset.id}</span>
          </div>
          <div class="tag-body">
            <div class="tag-left">
              <div class="tag-product">${asset.tipo}</div>
              <div class="tag-info">${asset.marca} ${asset.modelo}</div>
              <div class="tag-location">${asset.ubicacion || 'Punto de Venta'}</div>
              <div class="tag-barcode-wrap">${barcodeSvg}</div>
            </div>
            <div class="tag-qr-wrap">
              ${qrSvg}
            </div>
          </div>
        </div>
      `;
    });

    dom.labelPreviewContainer.innerHTML = tagsHtml;
    dom.labelModal.style.display = 'flex';
  });

  // ==========================================
  // AJUSTES, EXPORTACIÓN Y RESPALDO
  // ==========================================
  dom.btnExportCsv.addEventListener('click', () => {
    Storage.exportToCSV();
  });

  dom.btnExportJson.addEventListener('click', () => {
    Storage.exportToJSON();
  });

  dom.btnImportJson.addEventListener('click', () => {
    dom.fileImportJson.click();
  });

  dom.fileImportJson.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = Storage.importFromJSON(event.target.result);
      if (res.success) {
        alert(`Se importaron con éxito ${res.count} activos.`);
        refreshUI();
      } else {
        alert(`Error al importar: ${res.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  dom.btnResetData.addEventListener('click', () => {
    if (confirm("¿Estás seguro de que deseas restablecer los datos al inventario original de la tabla Excel?")) {
      Storage.resetToDefault();
      refreshUI();
      alert("Datos restablecidos al estado inicial.");
    }
  });

  // ==========================================
  // CONFIGURACIÓN SUPABASE EN LA NUBE
  // ==========================================
  function updateSupabaseStatusUI() {
    if (!dom.supabaseStatusPill) return;
    const isConfigured = window.SupabaseClient && SupabaseClient.isConfigured();
    if (isConfigured) {
      dom.supabaseStatusPill.className = 'badge badge-green';
      dom.supabaseStatusPill.style.background = '#dcfce7';
      dom.supabaseStatusPill.style.color = '#15803d';
      dom.supabaseStatusPill.textContent = 'Conectado a la Nube';
    } else {
      dom.supabaseStatusPill.className = 'badge badge-orange';
      dom.supabaseStatusPill.style.background = '#fef3c7';
      dom.supabaseStatusPill.style.color = '#b45309';
      dom.supabaseStatusPill.textContent = 'No Configurado (Modo Local)';
    }
  }

  // Pre-cargar valores guardados de Supabase en los inputs
  if (dom.inputSupabaseUrl && dom.inputSupabaseKey) {
    const urlFromConfig = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) ? window.SUPABASE_CONFIG.url : '';
    const keyFromConfig = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey) ? window.SUPABASE_CONFIG.anonKey : '';
    dom.inputSupabaseUrl.value = localStorage.getItem('supabase_url') || urlFromConfig;
    dom.inputSupabaseKey.value = localStorage.getItem('supabase_anon_key') || keyFromConfig;
    updateSupabaseStatusUI();
  }

  // Guardar credenciales de Supabase
  if (dom.btnSaveSupabase) {
    dom.btnSaveSupabase.addEventListener('click', async () => {
      const url = (dom.inputSupabaseUrl.value || '').trim();
      const key = (dom.inputSupabaseKey.value || '').trim();

      if (!url || !key) {
        alert('Por favor ingresa la Project URL y la Anon Key de tu proyecto Supabase.');
        return;
      }

      dom.btnSaveSupabase.disabled = true;
      dom.btnSaveSupabase.textContent = 'Conectando...';

      const ok = SupabaseClient.saveCredentials(url, key);
      if (ok) {
        updateSupabaseStatusUI();
        await Storage.syncWithSupabase();
        Storage.setupRealtime();
        refreshUI();
        alert('Conectado con éxito a Supabase. La sincronización en tiempo real está activa.');
      } else {
        alert('No se pudo inicializar la conexión con Supabase. Verifica la URL y la Anon Key.');
      }

      dom.btnSaveSupabase.disabled = false;
      dom.btnSaveSupabase.textContent = 'Guardar y Conectar';
    });
  }

  // Subir datos locales a Supabase
  if (dom.btnPushSupabaseNow) {
    dom.btnPushSupabaseNow.addEventListener('click', async () => {
      if (!window.SupabaseClient || !SupabaseClient.isConfigured()) {
        alert('Primero debes guardar tu URL y Anon Key de Supabase.');
        return;
      }

      dom.btnPushSupabaseNow.disabled = true;
      dom.btnPushSupabaseNow.textContent = 'Subiendo...';

      const res = await Storage.syncAllToSupabase();
      if (res.success) {
        alert(`Datos sincronizados en Supabase: ${res.countActivos} activos y ${res.countLocs} cuadros de ubicación.`);
      } else {
        alert(`Error al subir a Supabase: ${res.error}`);
      }

      dom.btnPushSupabaseNow.disabled = false;
      dom.btnPushSupabaseNow.textContent = 'Subir Datos a Supabase';
    });
  }

  // ==========================================
  // CONEXIÓN RÁPIDA DESDE PC CON CÓDIGO QR
  // ==========================================
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const btnConnectPhone = document.getElementById('btn-connect-phone');
  const modalConnect = document.getElementById('connect-phone-modal');
  const connectQrContainer = document.getElementById('connect-qr-container');
  const connectUrlText = document.getElementById('connect-url-text');
  const btnCloseConnect = document.getElementById('btn-close-connect-modal');

  if (isLocalhost && btnConnectPhone) {
    btnConnectPhone.style.display = 'inline-flex';

    const updateLanInfo = () => {
      fetch('/api/lan-info')
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            window.lanUrl = data.url;
          }
        })
        .catch(() => {});
    };

    updateLanInfo();

    function showConnectModal() {
      const currentProtocol = window.location.protocol;
      const currentPort = window.location.port ? `:${window.location.port}` : '';
      const fallbackUrl = `${currentProtocol}//${window.location.hostname}${currentPort}`;
      const url = window.lanUrl || fallbackUrl;
      if (connectUrlText) connectUrlText.textContent = url;
      if (connectQrContainer) connectQrContainer.innerHTML = CompactQR.renderSVG(url, 180);
      if (modalConnect) modalConnect.style.display = 'flex';
    }

    btnConnectPhone.addEventListener('click', () => {
      fetch('/api/lan-info')
        .then(res => res.json())
        .then(data => {
          if (data.url) window.lanUrl = data.url;
          showConnectModal();
        })
        .catch(() => {
          showConnectModal();
        });
    });

    if (btnCloseConnect && modalConnect) {
      btnCloseConnect.addEventListener('click', () => {
        modalConnect.style.display = 'none';
      });
    }
  }

  // ==========================================
  // GESTIÓN Y EDICIÓN DE UBICACIONES
  // ==========================================
  function openManageLocationsModal() {
    renderManageLocationsList();
    if (dom.modalManageLocations) dom.modalManageLocations.style.display = 'flex';
  }

  function closeManageLocationsModal() {
    if (dom.modalManageLocations) dom.modalManageLocations.style.display = 'none';
  }

  function renderManageLocationsList() {
    if (!dom.locationsManageList) return;
    const list = Storage.getCuadrosUbicacion ? Storage.getCuadrosUbicacion() : [];
    const activos = Storage.getActivos();

    if (list.length === 0) {
      dom.locationsManageList.innerHTML = '<p style="font-size:12px; color:var(--text-muted); text-align:center; padding:12px;">No hay ubicaciones registradas.</p>';
      return;
    }

    let html = '';
    list.forEach(name => {
      const count = activos.filter(a => getLocationGroup(a.ubicacion) === name).length;
      html += `
        <div class="location-manage-item">
          <div class="location-manage-info">
            <span class="location-manage-name">${name}</span>
            <span class="location-manage-count">${count} ${count === 1 ? 'activo' : 'activos'}</span>
          </div>
          <div class="location-manage-actions">
            <button type="button" class="btn btn-xs btn-outline btn-rename-loc" data-name="${name}">
              Renombrar
            </button>
            <button type="button" class="btn btn-xs btn-danger btn-delete-loc" data-name="${name}">
              Eliminar
            </button>
          </div>
        </div>
      `;
    });
    dom.locationsManageList.innerHTML = html;

    // Vincular botones de renombrar
    dom.locationsManageList.querySelectorAll('.btn-rename-loc').forEach(btn => {
      btn.addEventListener('click', () => {
        const oldName = btn.getAttribute('data-name');
        const newName = prompt(`Renombrar ubicación "${oldName}":`, oldName);
        if (newName && newName.trim() && newName.trim() !== oldName) {
          const updatedCount = Storage.renameCuadroUbicacion(oldName, newName.trim());
          if (state.selectedLocation === oldName) {
            state.selectedLocation = newName.trim();
          }
          renderManageLocationsList();
          refreshUI();
          alert(`Ubicación renombrada a "${newName.trim()}". ${updatedCount} activos actualizados en tiempo real.`);
        }
      });
    });

    // Vincular botones de eliminar
    dom.locationsManageList.querySelectorAll('.btn-delete-loc').forEach(btn => {
      btn.addEventListener('click', () => {
        const locName = btn.getAttribute('data-name');
        const count = activos.filter(a => getLocationGroup(a.ubicacion) === locName).length;
        const confirmMsg = count > 0
          ? `¿Eliminar la ubicación "${locName}"? Sus ${count} activos pasarán a "Sin Ubicación Asignada".`
          : `¿Eliminar la ubicación "${locName}"?`;
        if (confirm(confirmMsg)) {
          Storage.deleteCuadroUbicacion(locName);
          if (state.selectedLocation === locName) {
            state.selectedLocation = null;
          }
          renderManageLocationsList();
          refreshUI();
        }
      });
    });
  }

  // Vincular eventos del modal de ubicaciones
  if (dom.btnOpenManageLocations) {
    dom.btnOpenManageLocations.addEventListener('click', openManageLocationsModal);
  }
  if (dom.btnCloseManageLocations) {
    dom.btnCloseManageLocations.addEventListener('click', closeManageLocationsModal);
  }
  if (dom.btnDoneManageLocations) {
    dom.btnDoneManageLocations.addEventListener('click', closeManageLocationsModal);
  }
  if (dom.formAddLocation) {
    dom.formAddLocation.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = dom.inputNewLocationName.value.trim();
      if (!name) return;
      const added = Storage.addCuadroUbicacion(name);
      if (added) {
        dom.inputNewLocationName.value = '';
        renderManageLocationsList();
        refreshUI();
      } else {
        alert(`La ubicación "${name}" ya existe.`);
      }
    });
  }

  // Botón para renombrar ubicación desde la vista de detalle
  if (dom.btnEditCurrentLocation) {
    dom.btnEditCurrentLocation.addEventListener('click', () => {
      if (!state.selectedLocation) return;
      const oldName = state.selectedLocation;
      const newName = prompt(`Renombrar la ubicación "${oldName}":`, oldName);
      if (newName && newName.trim() && newName.trim() !== oldName) {
        const updatedCount = Storage.renameCuadroUbicacion(oldName, newName.trim());
        state.selectedLocation = newName.trim();
        openLocationDetail(newName.trim());
        refreshUI();
        alert(`Ubicación renombrada a "${newName.trim()}". ${updatedCount} activos actualizados en tiempo real.`);
      }
    });
  }

  // ==========================================
  // GESTIÓN Y EDICIÓN DE PRODUCTOS Y CAMPOS
  // ==========================================
  function openManageProductsModal() {
    renderManageProductsList();
    if (dom.modalManageProducts) dom.modalManageProducts.style.display = 'flex';
  }
  window.openManageProductsModal = openManageProductsModal;

  function closeManageProductsModal() {
    if (dom.modalManageProducts) dom.modalManageProducts.style.display = 'none';
  }

  function renderManageProductsList() {
    if (!dom.productsManageList) return;
    const tipos = Storage.getProductTypes ? Storage.getProductTypes() : Storage.getTipos();
    const activos = Storage.getActivos();

    if (tipos.length === 0) {
      dom.productsManageList.innerHTML = '<p style="font-size:12px; color:var(--text-muted); text-align:center; padding:12px;">No hay productos registrados.</p>';
      return;
    }

    let html = '';
    tipos.forEach(tipoName => {
      const count = activos.filter(a => (a.tipo || '').toLowerCase() === tipoName.toLowerCase()).length;
      const subs = Storage.getSubProducts ? Storage.getSubProducts(tipoName) : [];

      let subsChipsHtml = '';
      if (subs.length > 0) {
        subsChipsHtml = `
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:6px;">
            ${subs.map(s => `
              <span class="subproduct-chip">
                ${s}
                <button type="button" class="subproduct-chip-remove" onclick="event.stopPropagation(); window.deleteSubProductFromModal('${tipoName}', '${s}')" title="Eliminar sub-producto">×</button>
              </span>
            `).join('')}
          </div>
        `;
      } else {
        subsChipsHtml = `<div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Sin sub-productos registrados</div>`;
      }

      html += `
        <div class="location-manage-item" style="flex-direction:column; align-items:stretch; gap:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="location-manage-info">
              <span class="location-manage-name">${tipoName}</span>
              <span class="location-manage-count">${count} ${count === 1 ? 'unidad' : 'unidades'}</span>
            </div>
            <div class="location-manage-actions">
              <button type="button" class="btn btn-xs btn-outline btn-add-sub-prod" data-type="${tipoName}" style="font-weight:700;">
                + Sub-producto
              </button>
              <button type="button" class="btn btn-xs btn-primary btn-edit-fields-prod" data-type="${tipoName}">
                Editar Campos
              </button>
              <button type="button" class="btn btn-xs btn-outline btn-rename-prod" data-type="${tipoName}">
                Renombrar
              </button>
              <button type="button" class="btn btn-xs btn-danger btn-delete-prod" data-type="${tipoName}">
                Eliminar
              </button>
            </div>
          </div>
          ${subsChipsHtml}
        </div>
      `;
    });
    dom.productsManageList.innerHTML = html;

    // Vincular botón + Sub-producto en modal
    dom.productsManageList.querySelectorAll('.btn-add-sub-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const typeName = btn.getAttribute('data-type');
        const subName = prompt(`Agregar nuevo sub-producto para "${typeName}":\n(Ej: Inalámbrico, 24 Pulgadas, Táctil, etc.)`);
        if (subName && subName.trim()) {
          Storage.addSubProduct(typeName, subName.trim());
          renderManageProductsList();
          updateDatalists();
          refreshUI();
        }
      });
    });

    // Vincular botón Editar Campos
    dom.productsManageList.querySelectorAll('.btn-edit-fields-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const typeName = btn.getAttribute('data-type');
        closeManageProductsModal();
        openEditProductFieldsModal(typeName);
      });
    });

    // Vincular botón Renombrar
    dom.productsManageList.querySelectorAll('.btn-rename-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const oldType = btn.getAttribute('data-type');
        const newType = prompt(`Renombrar producto "${oldType}":`, oldType);
        if (newType && newType.trim() && newType.trim() !== oldType) {
          const count = Storage.renameProductType(oldType, newType.trim());
          if (state.selectedCategory === oldType) {
            state.selectedCategory = newType.trim();
          }
          renderManageProductsList();
          refreshUI();
          alert(`Producto renombrado a "${newType.trim()}". ${count} activos actualizados en tiempo real.`);
        }
      });
    });

    // Vincular botón Eliminar
    dom.productsManageList.querySelectorAll('.btn-delete-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const typeName = btn.getAttribute('data-type');
        const count = activos.filter(a => (a.tipo || '').toLowerCase() === typeName.toLowerCase()).length;
        const confirmMsg = count > 0
          ? `¿Eliminar la categoría "${typeName}"? Sus ${count} activos pasarán a "General".`
          : `¿Eliminar el producto "${typeName}"?`;
        if (confirm(confirmMsg)) {
          Storage.deleteProductType(typeName);
          if (state.selectedCategory === typeName) {
            state.selectedCategory = null;
          }
          renderManageProductsList();
          refreshUI();
        }
      });
    });
  }

  window.deleteSubProductFromModal = (prodName, subName) => {
    if (confirm(`¿Eliminar el sub-producto "${subName}" de "${prodName}"?`)) {
      Storage.deleteSubProduct(prodName, subName);
      renderManageProductsList();
      updateDatalists();
      refreshUI();
    }
  };

  // Vincular eventos del modal de productos
  if (dom.btnOpenManageProducts) {
    dom.btnOpenManageProducts.addEventListener('click', openManageProductsModal);
  }
  if (dom.btnCloseManageProducts) {
    dom.btnCloseManageProducts.addEventListener('click', closeManageProductsModal);
  }
  if (dom.btnDoneManageProducts) {
    dom.btnDoneManageProducts.addEventListener('click', closeManageProductsModal);
  }
  if (dom.formAddProduct) {
    dom.formAddProduct.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = dom.inputNewProductName.value.trim();
      const subName = dom.inputNewSubproductName ? dom.inputNewSubproductName.value.trim() : '';
      if (!name) return;
      const added = Storage.addProductType(name, subName);
      if (added) {
        dom.inputNewProductName.value = '';
        if (dom.inputNewSubproductName) dom.inputNewSubproductName.value = '';
        renderManageProductsList();
        updateDatalists();
        refreshUI();
      } else {
        alert(`El producto "${name}" ya existe.`);
      }
    });
  }

  // ==========================================
  // PANEL / MODAL PARA EDITAR CAMPOS DEL PRODUCTO
  // ==========================================
  function renderEditProductSubproducts(productType) {
    if (!dom.editProductSubproductsList) return;
    const subs = Storage.getSubProducts ? Storage.getSubProducts(productType) : [];
    if (subs.length === 0) {
      dom.editProductSubproductsList.innerHTML = '<span style="font-size:11px; color:var(--text-muted);">Sin sub-productos registrados</span>';
      return;
    }
    let html = '';
    subs.forEach(s => {
      html += `
        <span class="subproduct-chip">
          ${s}
          <button type="button" class="subproduct-chip-remove" onclick="window.removeSubProductFromEdit('${productType}', '${s}')">×</button>
        </span>
      `;
    });
    dom.editProductSubproductsList.innerHTML = html;
  }

  window.removeSubProductFromEdit = (prodType, subName) => {
    Storage.deleteSubProduct(prodType, subName);
    renderEditProductSubproducts(prodType);
    updateDatalists();
    refreshUI();
  };

  if (dom.btnAddSubproductInEdit && dom.inputEditProductNewSubproduct) {
    dom.btnAddSubproductInEdit.addEventListener('click', () => {
      const prodType = dom.editProductOriginalType.value;
      const newSub = dom.inputEditProductNewSubproduct.value.trim();
      if (!newSub) return;
      Storage.addSubProduct(prodType, newSub);
      dom.inputEditProductNewSubproduct.value = '';
      renderEditProductSubproducts(prodType);
      updateDatalists();
      refreshUI();
    });
  }

  function openEditProductFieldsModal(productType) {
    if (!productType) return;
    const activos = Storage.getActivos().filter(a => (a.tipo || '').toLowerCase() === productType.toLowerCase());

    dom.editProductOriginalType.value = productType;
    dom.editProductModalTitle.textContent = productType;
    dom.inputEditProductType.value = productType;

    // Precargar con los valores comunes si existen
    const sample = activos[0] || {};
    dom.inputEditProductMarca.value = sample.marca || '';
    dom.inputEditProductModelo.value = sample.modelo || '';
    dom.selectEditProductEstado.value = sample.estado || '';
    dom.inputEditProductNotas.value = sample.notas || '';

    // Llenar selector de ubicaciones disponibles
    const ubicaciones = Storage.getCuadrosUbicacion ? Storage.getCuadrosUbicacion() : [];
    let locOptions = '<option value="">(Sin cambiar)</option>';
    ubicaciones.forEach(loc => {
      const selected = (sample.ubicacion && sample.ubicacion.startsWith(loc)) ? 'selected' : '';
      locOptions += `<option value="${loc}" ${selected}>${loc}</option>`;
    });
    dom.selectEditProductUbicacion.innerHTML = locOptions;

    // Renderizar sub-productos en el modal de edición
    renderEditProductSubproducts(productType);

    if (dom.modalEditProductFields) dom.modalEditProductFields.style.display = 'flex';
  }
  window.openEditProductFieldsModal = openEditProductFieldsModal;

  function closeEditProductFieldsModal() {
    if (dom.modalEditProductFields) dom.modalEditProductFields.style.display = 'none';
  }

  if (dom.btnCloseEditProductFields) {
    dom.btnCloseEditProductFields.addEventListener('click', closeEditProductFieldsModal);
  }
  if (dom.btnCancelEditProductFields) {
    dom.btnCancelEditProductFields.addEventListener('click', closeEditProductFieldsModal);
  }

  // Botón desde la vista de detalle del producto
  if (dom.btnEditCurrentProduct) {
    dom.btnEditCurrentProduct.addEventListener('click', () => {
      if (state.selectedCategory) {
        openEditProductFieldsModal(state.selectedCategory);
      }
    });
  }

  // Guardar campos del producto
  if (dom.formEditProductFields) {
    dom.formEditProductFields.addEventListener('submit', (e) => {
      e.preventDefault();
      const originalType = dom.editProductOriginalType.value;
      const newTipo = dom.inputEditProductType.value.trim();
      const marca = dom.inputEditProductMarca.value.trim();
      const modelo = dom.inputEditProductModelo.value.trim();
      const estado = dom.selectEditProductEstado.value;
      const ubicacion = dom.selectEditProductUbicacion.value;
      const notas = dom.inputEditProductNotas.value.trim();

      if (!newTipo) {
        alert('El nombre del producto no puede estar vacío.');
        return;
      }

      const updatedCount = Storage.updateProductFields(originalType, {
        newTipo,
        marca,
        modelo,
        estado,
        ubicacion,
        notas
      });

      if (state.selectedCategory === originalType) {
        state.selectedCategory = newTipo;
      }

      closeEditProductFieldsModal();
      refreshUI();
      alert(`Campos de "${newTipo}" actualizados con éxito. ${updatedCount} activos sincronizados en tiempo real.`);
    });
  }

  // ==========================================
  // REFRESCO GLOBAL DE LA INTERFAZ
  // ==========================================
  function refreshUI() {
    updateStats();
    updateDatalists();
    if (state.currentTab === 'paneles') {
      if (state.subViewMode === 'locations') {
        if (state.selectedLocation) {
          openLocationDetail(state.selectedLocation);
        } else {
          dom.locationsGridWrapper.style.display = 'block';
          dom.locationDetailView.style.display = 'none';
          dom.categoriesGridWrapper.style.display = 'none';
          dom.productDetailView.style.display = 'none';
          renderLocationsGrid();
        }
      } else {
        if (state.selectedCategory) {
          if (state.selectedSubCategory) {
            openSubproductDetail(state.selectedCategory, state.selectedSubCategory);
          } else {
            openProductDetail(state.selectedCategory);
          }
        } else {
          dom.locationsGridWrapper.style.display = 'none';
          dom.locationDetailView.style.display = 'none';
          dom.categoriesGridWrapper.style.display = 'block';
          dom.productDetailView.style.display = 'none';
          renderCategoriesGrid();
        }
      }
    } else if (state.currentTab === 'todos') {
      renderAllAssets();
    }
  }

  // Sincronización reactiva en tiempo real (móvil y PC sincronizados)
  window.addEventListener('activos-synced', () => {
    if (!state.editingAssetId) {
      refreshUI();
    }
  });

  window.addEventListener('ubicaciones-synced', () => {
    refreshUI();
    if (dom.modalManageLocations && dom.modalManageLocations.style.display !== 'none') {
      renderManageLocationsList();
    }
  });

  // Cerrar modales con tecla ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeScanner();
      dom.assetDetailModal.style.display = 'none';
      dom.labelModal.style.display = 'none';
      if (modalConnect) modalConnect.style.display = 'none';
      if (dom.modalManageLocations) dom.modalManageLocations.style.display = 'none';
      if (dom.modalManageProducts) dom.modalManageProducts.style.display = 'none';
      if (dom.modalEditProductFields) dom.modalEditProductFields.style.display = 'none';
    }
  });

  // Iniciar pantalla inicial
  refreshUI();
  navigateToTab('paneles');
});
