/**
 * Módulo de Escáner de Códigos de Barras y QR para Móviles
 * Soporta:
 * 1. Video continuo en vivo (cuando hay contexto seguro / HTTPS / localhost).
 * 2. Captura directa de cámara nativa (para HTTP en celulares donde el navegador bloquea el stream continuo).
 * 3. Procesamiento y mejora de contraste en canvas para detección ultra rápida.
 * 4. BarcodeDetector nativo (Chrome Android / iOS 17+) + Sonido Beep POS + Vibración.
 */

class MobileAssetScanner {
  constructor(options = {}) {
    this.videoElement = null;
    this.stream = null;
    this.audioCtx = null;
    this.isScanning = false;
    this.currentTrack = null;
    this.isTorchOn = false;
    this.barcodeDetector = null;
    this.html5QrCode = null;
    this.lastScannedCode = null;
    this.lastScanTime = 0;
    this.onResult = options.onResult || (() => {});
    this.animFrameId = null;
  }

  // Comprueba si el entorno actual permite video en vivo
  isStreamSupported() {
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const isSecure = window.isSecureContext !== false; // localhost o HTTPS
    return hasMedia && isSecure;
  }

  // Reproduce un sonido 'BEEP' clásico de escáner punto de venta usando Web Audio API
  playBeep() {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1900, this.audioCtx.currentTime); // Tono agudo característico POS
      gain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.11);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.11);

      // Vibración háptica en celulares
      if (navigator.vibrate) {
        navigator.vibrate([70, 40, 70]);
      }
    } catch (e) {
      console.warn("Audio/Haptic no disponible:", e);
    }
  }

  // Comprueba e inicializa BarcodeDetector nativo
  async initDetector() {
    if ('BarcodeDetector' in window) {
      try {
        const supported = await window.BarcodeDetector.getSupportedFormats();
        const formatsToUse = supported.length > 0 ? supported : [
          'code_128',
          'qr_code',
          'ean_13',
          'ean_8',
          'code_39',
          'upc_a',
          'upc_e'
        ];
        this.barcodeDetector = new window.BarcodeDetector({ formats: formatsToUse });
        return true;
      } catch (e) {
        console.warn("BarcodeDetector no se pudo inicializar con formatos específicos:", e);
        try {
          this.barcodeDetector = new window.BarcodeDetector();
          return true;
        } catch (err) {
          console.warn("Fallo total BarcodeDetector:", err);
        }
      }
    }
    return false;
  }

  // Inicia la cámara trasera
  async start(videoEl, errorEl, noticeEl) {
    this.videoElement = videoEl;
    this.isScanning = true;
    this.lastScannedCode = null;

    // Asegurar atributos críticos para móviles (iOS Safari y Android Chrome)
    if (this.videoElement) {
      this.videoElement.setAttribute('autoplay', '');
      this.videoElement.setAttribute('playsinline', '');
      this.videoElement.setAttribute('webkit-playsinline', '');
      this.videoElement.setAttribute('muted', '');
      this.videoElement.muted = true;
      this.videoElement.playsInline = true;
      this.videoElement.autoplay = true;
    }

    // Inicializar detector
    await this.initDetector();

    // Ocultar aviso al intentar abrir cámara en tiempo real
    if (noticeEl) {
      noticeEl.classList.add('hidden');
      noticeEl.style.display = 'none';
    }

    // Función compatible universal para solicitar cámara
    const getMedia = (constraints) => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        return navigator.mediaDevices.getUserMedia(constraints);
      }
      const legacy = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (legacy) {
        return new Promise((res, rej) => legacy.call(navigator, constraints, res, rej));
      }
      return Promise.reject(new Error("MEDIA_NOT_SUPPORTED"));
    };

    // Lista de configuraciones de cámara en orden de compatibilidad (trasera preferida)
    const constraintOptions = [
      {
        video: { facingMode: 'environment' },
        audio: false
      },
      {
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      },
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let stream = null;
    let lastError = null;

    for (const constraints of constraintOptions) {
      try {
        stream = await getMedia(constraints);
        if (stream) break;
      } catch (err) {
        lastError = err;
        console.warn("Intento de cámara con constraints:", constraints, err);
      }
    }

    if (!stream) {
      console.error("No se pudo iniciar ningún stream de cámara:", lastError);
      if (noticeEl) {
        noticeEl.classList.remove('hidden');
        noticeEl.style.display = 'block';
      }
      if (errorEl) {
        errorEl.textContent = "Permiso de cámara no disponible o bloqueado. Usa el botón de foto abajo.";
        errorEl.classList.remove('hidden');
      }
      return false;
    }

    this.stream = stream;
    this.videoElement.srcObject = this.stream;

    // Escuchar cuando el video esté listo para reproducir
    try {
      await this.videoElement.play();
    } catch (e) {
      console.warn("Error en video.play(), esperando evento canplay:", e);
      this.videoElement.oncanplay = () => {
        this.videoElement.play().catch(() => {});
      };
    }

    this.currentTrack = this.stream.getVideoTracks()[0];

    // Verificar si la linterna (torch) está soportada en el móvil
    try {
      const capabilities = this.currentTrack.getCapabilities ? this.currentTrack.getCapabilities() : {};
      const hasTorch = Boolean(capabilities.torch);
      const torchBtn = document.getElementById('btn-scanner-torch');
      if (torchBtn) {
        torchBtn.style.display = hasTorch ? 'inline-flex' : 'none';
      }
    } catch (e) {}

    // Iniciar bucle de detección en vivo
    this.startDetectionLoop();
    return true;
  }

  // Bucle de lectura de frames de cámara
  startDetectionLoop() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const checkFrame = async () => {
      if (!this.isScanning || !this.videoElement || this.videoElement.paused || this.videoElement.ended) {
        return;
      }

      if (this.videoElement.readyState >= 2 && this.videoElement.videoWidth > 0) {
        // 1. Intentar con BarcodeDetector nativo directo del elemento video
        if (this.barcodeDetector) {
          try {
            const barcodes = await this.barcodeDetector.detect(this.videoElement);
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              this.handleDetectedCode(rawValue, barcodes[0].format);
            }
          } catch (e) {
            // Ignorar frames borrosos
          }
        }
      }

      if (this.isScanning) {
        this.animFrameId = requestAnimationFrame(checkFrame);
      }
    };

    this.animFrameId = requestAnimationFrame(checkFrame);
  }

  // Manejo de código detectado (con filtro anti-rebote de 2.2 segundos)
  handleDetectedCode(code, format = 'BARCODE') {
    if (!code) return;
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const now = Date.now();
    if (this.lastScannedCode === cleanCode && (now - this.lastScanTime < 2200)) {
      return; // Evita lecturas duplicadas en ráfaga
    }

    this.lastScannedCode = cleanCode;
    this.lastScanTime = now;

    this.playBeep();

    // Efecto visual de escaneo exitoso
    const guide = document.querySelector('.scanner-guide');
    if (guide) {
      guide.classList.add('scanner-success');
      setTimeout(() => guide.classList.remove('scanner-success'), 500);
    }

    if (this.onResult) {
      this.onResult(cleanCode, format);
    }
  }

  // Encender o apagar la linterna (Flash) en el móvil
  async toggleTorch() {
    if (!this.currentTrack) return;
    try {
      this.isTorchOn = !this.isTorchOn;
      await this.currentTrack.applyConstraints({
        advanced: [{ torch: this.isTorchOn }]
      });
      const torchBtn = document.getElementById('btn-scanner-torch');
      if (torchBtn) {
        torchBtn.classList.toggle('active', this.isTorchOn);
      }
    } catch (e) {
      console.warn("Linterna no soportada o error:", e);
    }
  }

  // Detener la cámara y liberar recursos de hardware
  stop() {
    this.isScanning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.currentTrack && this.isTorchOn) {
      try {
        this.currentTrack.applyConstraints({ advanced: [{ torch: false }] });
      } catch (e) {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isTorchOn = false;
  }

  // Escanear desde un archivo de imagen o foto capturada con la cámara nativa
  async scanFromFile(file) {
    if (!file) return;

    // Asegurar detector
    await this.initDetector();

    try {
      // Crear ImageBitmap para decodificación ultra rápida
      const imageBitmap = await createImageBitmap(file);

      // 1. Probar con BarcodeDetector nativo
      if (this.barcodeDetector) {
        const barcodes = await this.barcodeDetector.detect(imageBitmap);
        if (barcodes.length > 0) {
          this.handleDetectedCode(barcodes[0].rawValue, barcodes[0].format);
          return;
        }
      }

      // 2. Si no detectó al inicio, mejorar contraste en Canvas y reintentar
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = Math.min(imageBitmap.width, 1600);
      canvas.height = Math.round(canvas.width * (imageBitmap.height / imageBitmap.width));

      ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

      // Mejorar nitidez y contraste de barras
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        // Escala de grises
        const gray = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
        // Alto contraste
        const val = gray > 128 ? Math.min(255, gray * 1.2) : Math.max(0, gray * 0.7);
        d[i] = val;
        d[i + 1] = val;
        d[i + 2] = val;
      }
      ctx.putImageData(imgData, 0, 0);

      if (this.barcodeDetector) {
        const enhancedBarcodes = await this.barcodeDetector.detect(canvas);
        if (enhancedBarcodes.length > 0) {
          this.handleDetectedCode(enhancedBarcodes[0].rawValue, enhancedBarcodes[0].format);
          return;
        }

        // Probar rotación de 90 grados por si el código está vertical
        try {
          const rotCanvas = document.createElement('canvas');
          rotCanvas.width = canvas.height;
          rotCanvas.height = canvas.width;
          const rotCtx = rotCanvas.getContext('2d');
          rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
          rotCtx.rotate(Math.PI / 2);
          rotCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

          const rotBarcodes = await this.barcodeDetector.detect(rotCanvas);
          if (rotBarcodes.length > 0) {
            this.handleDetectedCode(rotBarcodes[0].rawValue, rotBarcodes[0].format);
            return;
          }
        } catch (rotErr) {}
      }

      // 3. Probar con Html5Qrcode si está disponible
      if (window.Html5Qrcode) {
        try {
          const scanner = new window.Html5Qrcode('scanner-viewport-reader');
          const result = await scanner.scanFile(file, true);
          if (result) {
            this.handleDetectedCode(result, 'BARCODE');
            return;
          }
        } catch (e) {}
      }

      alert("No se pudo leer el código en la foto.\n\nConsejo: Asegúrate de que el código de barras o QR esté bien enfocado, con buena luz y sin reflejos.");

    } catch (err) {
      console.error("Error al procesar foto:", err);
      alert("Error al procesar la foto: " + (err.message || err));
    }
  }
}

window.MobileAssetScanner = MobileAssetScanner;
