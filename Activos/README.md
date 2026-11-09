# Control de Activos Punto de Venta (POS)

Aplicación Web Progresiva (PWA) móvil diseñada para el registro, control e identificación rápida de activos de punto de venta mediante escáner de códigos de barras y códigos QR con la cámara del celular. Base de datos centralizada en tiempo real en archivo JSON.

---

## Como Iniciar la Aplicacion

El servidor ahora es **Dual y Simultaneo** (atiende tanto en HTTP como en HTTPS al mismo tiempo con la misma base de datos central):

1. Haz doble clic en **`iniciar.bat`** o **`iniciar_https.bat`**.
2. En tu computadora puedes abrir:
   - `http://localhost:8000` o `https://localhost:8443`
3. En tu celular (conectado a la misma red Wi-Fi), abre la direccion que aparece en la consola del servidor (tu IP actual de red):
   - **Opcion 1 (HTTP Normal)**: `http://192.168.9.192:8000`
   - **Opcion 2 (HTTPS Seguro)**: `https://192.168.9.192:8443`

*Cualquier cambio que realices en tu celular (registrar activos, escanear, o editar cuadros de ubicacion) se guarda y se muestra al instante en la pantalla de la PC y en el archivo `activos.json` y `ubicaciones.json`.*

---

## Caracteristicas Principales

### 1. Cuadros de Ubicacion (Navegacion Principal)
- La pantalla principal organiza los activos en sus **Cuadros de Ubicacion** (Caja 1, Caja 2, Caja 3, Caja Rapida, Mostrador, Oficina, Almacen, etc.).
- Cada cuadro muestra el total de activos asignados, resumen de tipos de productos y estado operativo.
- **Gestion y Edicion de Cuadros**:
  - Boton **[Editar Cuadros]** en la cabecera para crear nuevos cuadros, renombrarlos o eliminarlos.
  - Al renombrar un cuadro, **todos los activos asignados se actualizan automaticamente en tiempo real en activos.json**.
  - Boton **[Renombrar este Cuadro]** al ingresar al detalle de cualquier cuadro.

### 2. Base de Datos Central en Tiempo Real (`activos.json`)
- Cada escaneo, nuevo registro, edicion o cambio de ubicacion realizado desde tu celular o desde la PC se guarda al instante en `activos.json`.
- Sincronizacion bidireccional continua con indicador de estado en la cabecera.

### 3. Paneles por Producto (Modo Alternativo)
- Permite alternar la vista hacia paneles por tipo de equipo (Teclados, Ticketeras, Pantallas, Monitores, etc.).
- Cada tarjeta muestra su codigo de barras grafico, ID, ubicacion exacta, marca, modelo, serie y notas tecnicas (sin columna de cantidad redundante).

### 4. Escaner de Codigos de Barras y QR
- Utiliza la camara de tu celular con laser animado, sonido Beep POS de confirmacion y vibracion.
- Boton de linterna (flash) para zonas oscuras.
- Si el codigo existe, abre de inmediato su ficha detallada. Si es nuevo, ofrece registrarlo con un solo clic.

### 5. Generador e Impresor de Etiquetas Adhesivas
- Genera e imprime etiquetas con Codigo de Barras (Code 128) y Codigo QR para cada activo.
- Permite imprimir etiquetas individuales o el inventario completo en lote.

### 6. Exportacion a Excel y Respaldo
- En la pestana Ajustes puedes descargar un archivo CSV compatible con Microsoft Excel y Google Sheets con codificacion UTF-8 BOM.
- Copia de seguridad y restauracion en formato JSON.
