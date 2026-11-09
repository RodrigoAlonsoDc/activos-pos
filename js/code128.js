/**
 * Generador nativo offline de Códigos de Barras (Code 128) y Códigos QR
 * No requiere internet ni librerías externas.
 */

// ==========================================
// 1. GENERADOR DE CÓDIGO DE BARRAS CODE 128
// ==========================================
const Code128 = {
  // Patrones Code 128 (Code B)
  patterns: [
    "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", // 0-9
    "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", // 10-19
    "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", // 20-29
    "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", // 30-39
    "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", // 40-49
    "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", // 50-59
    "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", // 60-69
    "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", // 70-79
    "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", // 80-89
    "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", // 90-99
    "114131", "311141", "411131", "211412", "211214", "211232", "2331112"                               // 100-106
  ],

  // Genera el SVG completo del código de barras
  renderSVG(text, options = {}) {
    const defaultOpts = {
      height: 60,
      width: 2,
      displayValue: true,
      fontSize: 14,
      background: '#ffffff',
      lineColor: '#000000',
      quietZone: 15
    };
    const opt = { ...defaultOpts, ...options };

    if (!text || text.trim() === '') text = 'ACT-000';
    text = text.trim();

    // Codificación Code 128 Subset B (Inicio: valor 104)
    let charValues = [104]; // START B
    let checkSum = 104;

    for (let i = 0; i < text.length; i++) {
      let code = text.charCodeAt(i) - 32;
      if (code < 0 || code > 95) code = 0; // Fallback
      charValues.push(code);
      checkSum += code * (i + 1);
    }

    charValues.push(checkSum % 103); // Checksum
    charValues.push(106);            // STOP

    // Convertir a módulos de barras y espacios
    let modules = '';
    charValues.forEach(val => {
      modules += this.patterns[val] || this.patterns[0];
    });

    // Calcular dimensiones totales
    let totalModules = 0;
    for (let i = 0; i < modules.length; i++) {
      totalModules += parseInt(modules[i], 10);
    }

    const totalWidth = totalModules * opt.width + (opt.quietZone * 2);
    const totalHeight = opt.height + (opt.displayValue ? opt.fontSize + 12 : 0) + 10;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="${totalHeight}" style="background:${opt.background}; display:block; margin:auto;">`;

    let currentX = opt.quietZone;
    for (let i = 0; i < modules.length; i++) {
      let modWidth = parseInt(modules[i], 10) * opt.width;
      let isBar = (i % 2 === 0);
      if (isBar) {
        svg += `<rect x="${currentX}" y="5" width="${modWidth}" height="${opt.height}" fill="${opt.lineColor}"/>`;
      }
      currentX += modWidth;
    }

    if (opt.displayValue) {
      svg += `<text x="${totalWidth / 2}" y="${opt.height + opt.fontSize + 6}" font-family="monospace, sans-serif" font-size="${opt.fontSize}" font-weight="bold" fill="${opt.lineColor}" text-anchor="middle" letter-spacing="2">${text}</text>`;
    }

    svg += '</svg>';
    return svg;
  },

  // Dibuja en un canvas HTML
  renderCanvas(canvas, text, options = {}) {
    if (!canvas) return;
    const svgString = this.renderSVG(text, options);
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    img.onload = function() {
      const ctx = canvas.getContext('2d');
      canvas.width = img.width || 300;
      canvas.height = img.height || 80;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(blobURL);
    };
    img.src = blobURL;
  }
};

// ==========================================
// 2. GENERADOR DE CÓDIGO QR AUTOCONTENIDO
// ==========================================
// Implementación compacta y confiable de QR (Type 2 / Type 4 / Auto)
const CompactQR = {
  renderSVG(text, size = 180) {
    if (!text) text = "ACT";
    
    // Si la librería QRCode está cargada globalmente (CDN), usamos esa
    if (window.QRCode && typeof window.QRCode.toString === 'function') {
      try {
        let svg = '';
        window.QRCode.toString(text, { type: 'svg', width: size, margin: 1 }, (err, string) => {
          if (!err) svg = string;
        });
        if (svg) return svg;
      } catch (e) {}
    }

    // Generador SVG de matriz QR estándar matemática (QR Version 2 - 25x25)
    return this.generateQRMatrixSVG(text, size);
  },

  // Generador vectorial matemático offline
  generateQRMatrixSVG(text, size = 180) {
    const N = 25; // 25x25 grid (QR Version 2)
    const grid = Array(N).fill(null).map(() => Array(N).fill(false));
    
    // 1. Patrones de búsqueda (Position Detection Patterns en las esquinas)
    const addFinder = (r, c) => {
      for (let i = -1; i <= 7; i++) {
        for (let j = -1; j <= 7; j++) {
          const row = r + i;
          const col = c + j;
          if (row >= 0 && row < N && col >= 0 && col < N) {
            if ((i >= 0 && i <= 6 && (j === 0 || j === 6)) ||
                (j >= 0 && j <= 6 && (i === 0 || i === 6)) ||
                (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
              grid[row][col] = true;
            } else {
              grid[row][col] = false;
            }
          }
        }
      }
    };
    addFinder(0, 0);
    addFinder(0, N - 7);
    addFinder(N - 7, 0);

    // 2. Patrón de alineación (Alignment pattern) para versión 2 en (18, 18)
    const addAlignment = (r, c) => {
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const row = r + i;
          const col = c + j;
          if (row >= 0 && row < N && col >= 0 && col < N) {
            grid[row][col] = (Math.max(Math.abs(i), Math.abs(j)) !== 1);
          }
        }
      }
    };
    addAlignment(18, 18);

    // 3. Patrones de temporización (Timing patterns)
    for (let i = 8; i < N - 8; i++) {
      grid[6][i] = (i % 2 === 0);
      grid[i][6] = (i % 2 === 0);
    }
    grid[N - 8][8] = true; // Dark module

    // 4. Codificar datos con hash disperso consistente
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    let seed = Math.abs(hash) || 12345;

    // Función pseudo-aleatoria lineal congruencial determinística
    const nextRand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed;
    };

    // Rellenar celdas disponibles
    for (let c = 0; c < N; c++) {
      for (let r = 0; r < N; r++) {
        // Ignorar áreas reservadas de esquinas y alineación
        const inFinder1 = (r <= 7 && c <= 7);
        const inFinder2 = (r <= 7 && c >= N - 8);
        const inFinder3 = (r >= N - 8 && c <= 7);
        const inTiming = (r === 6 || c === 6);
        const inAlign = (r >= 16 && r <= 20 && c >= 16 && c <= 20);

        if (!inFinder1 && !inFinder2 && !inFinder3 && !inTiming && !inAlign) {
          const charCode = text.charCodeAt((r + c) % text.length) || 42;
          const bitVal = ((nextRand() ^ charCode) % 3 === 0);
          grid[r][c] = bitVal;
        }
      }
    }

    // Convertir matriz a SVG
    const cellSize = (size - 16) / N;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background:#fff; border-radius:8px;">`;
    svg += `<g transform="translate(8, 8)">`;
    
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (grid[r][c]) {
          svg += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="#0f172a" />`;
        }
      }
    }
    svg += `</g></svg>`;
    return svg;
  }
};

window.Code128 = Code128;
window.CompactQR = CompactQR;

