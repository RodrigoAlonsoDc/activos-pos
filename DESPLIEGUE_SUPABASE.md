# Guia de Despliegue e Integracion con Supabase

ScanActivos POS esta 100% preparado para funcionar directamente con **Supabase**, lo que elimina por completo la necesidad de servidores locales en la computadora, problemas de direcciones IP cambiantes (10.10.x.x o 192.168.x.x) y certificados SSL locales.

Con esta integracion, cualquier cambio registrado en tu celular (escaneo, nuevo activo, cambio de estado, edicion de cuadro de ubicacion) se actualiza de inmediato en tu computadora y viceversa en **tiempo real** mediante WebSockets.

---

## Paso 1: Configurar la Base de Datos en Supabase (1 minuto)

1. Ingresa a tu panel de control en [https://supabase.com](https://supabase.com) e inicia sesion en tu proyecto.
2. En el menu lateral izquierdo, haz clic en **SQL Editor** (icono con forma de terminal/codigo).
3. Haz clic en **New query** (Nueva consulta).
4. Abre el archivo `supabase_schema.sql` ubicado en la carpeta de este proyecto, copia todo su contenido y pegalo en el editor SQL de Supabase.
5. Presiona el boton verde **Run** (Ejecutar).

### Que realiza este script SQL:
- Crea la tabla `public.activos` con todos los campos tecnicos (id, barcode, tipo, marca, modelo, serie, estado, ubicacion, notas, fecha).
- Crea la tabla `public.ubicaciones` para gestionar los cuadros de ubicacion (Caja 1, Caja 2, Almacen, etc.).
- Configura las politicas de seguridad (RLS) para permitir lectura, insercion, modificacion y eliminacion con la clave publica anonima.
- Habilita la publicacion en tiempo real (`supabase_realtime`) para que la base de datos notifique a todos los dispositivos conectados cuando ocurra un cambio.
- Carga automaticamente los **30 activos iniciales** y los **10 cuadros de ubicacion** predeterminados de la tienda.

---

## Paso 2: Obtener tu URL y Anon Key de Supabase

1. En tu proyecto de Supabase, haz clic en **Project Settings** (icono de engranaje abajo a la izquierda).
2. Haz clic en el apartado **API**.
3. Ahi encontraras los dos datos necesarios:
   - **Project URL**: Ejemplo `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
   - **Project API Keys** -> clave `anon` / `public`: Cadena larga que empieza con `eyJhbGciOi...`

---

## Paso 3: Conectar la Aplicacion con Supabase

Tienes dos formas faciles de conectar:

### Opcion A: Desde la propia pantalla de Ajustes de la App (Recomendada)
1. Abre `index.html` en tu navegador.
2. Ve a la pestaña inferior **Ajustes**.
3. En la tarjeta **Conexion Cloud Supabase**:
   - Pega tu **Project URL**.
   - Pega tu **Anon / Public Key**.
   - Haz clic en **Guardar y Conectar**.
4. La insignia en la cabecera cambiara de inmediato a verde con el texto **Supabase Nube (Tiempo Real)**.
5. Puedes pulsar el boton **Subir Datos a Supabase** para asegurar que todos los datos locales esten sincronizados en la nube.

### Opcion B: Dejarlo preconfigurado en el archivo `js/supabase-config.js`
Si deseas que cualquier dispositivo nuevo que abra la web ya tenga las credenciales cargadas sin tener que escribirlas en Ajustes, abre `js/supabase-config.js` y coloca tus datos:

```javascript
window.SUPABASE_CONFIG = {
  url: 'https://tu-proyecto.supabase.co',
  anonKey: 'tu-clave-anon-de-supabase-aqui'
};
```

---

## Paso 4: Desplegar la Aplicacion en la Nube o en tu App

Dado que ahora la base de datos vive en Supabase, el frontend de ScanActivos POS consta unicamente de archivos estaticos (`index.html`, carpetas `css/` y `js/`).

### Opcion 1: Despliegue Gratuito en Vercel o Netlify (5 minutos)
Al desplegar en Vercel o Netlify, obtienes automaticamente un dominio con **HTTPS seguro**, lo que permite que la camara de tu celular funcione de inmediato para escanear en tiempo real:
- **Netlify**: Entra a [https://app.netlify.com/drop](https://app.netlify.com/drop) y arrastra la carpeta completa del proyecto. Te dara un enlace HTTPS en 10 segundos.
- **Vercel**: Sube el proyecto a GitHub y conectalo con Vercel para despliegue automatico continuo.

### Opcion 2: Integrar en tu App existente (Capacitor / Cordova / React Native / Flutter WebView)
Si tienes un proyecto de aplicacion movil nativa o hibrida:
- Copia los archivos dentro del directorio de assets web de tu app (por ejemplo `public/`, `dist/` o `www/`).
- La aplicacion se conectara a Supabase a traves de Internet sin importar si el usuario esta en red celular 4G/5G o Wi-Fi.

### Opcion 3: Instalar como PWA (App Web Progresiva)
- Abre la direccion HTTPS en Chrome o Safari en tu celular.
- Presiona los 3 puntos o el boton Compartir y elige **"Agregar a la pantalla principal"** o **"Instalar aplicacion"**.
- Se abrira como una aplicacion nativa a pantalla completa con su propio icono en el inicio de tu celular.

---

## Verificacion del Funcionamiento en Tiempo Real

1. Abre la aplicacion en tu computadora y en tu celular al mismo tiempo.
2. En tu celular, escanea un codigo o cambia la ubicacion de un activo (por ejemplo, pasa un teclado a "Caja 2").
3. Observa la pantalla de tu computadora: veras como se actualiza en menos de un segundo sin necesidad de recargar la pagina.
