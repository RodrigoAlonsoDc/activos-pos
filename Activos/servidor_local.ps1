param (
    [int]$HttpPort = 8000,
    [int]$HttpsPort = 8443
)

# 1. Obtener dirección IP local en la red Wi-Fi
$localIp = "127.0.0.1"
try {
    $hostName = [System.Net.Dns]::GetHostName()
    $addresses = [System.Net.Dns]::GetHostEntry($hostName).AddressList
    $ipv4 = $addresses | Where-Object { 
        $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and 
        $_.IPAddressToString -notmatch '^127\.' -and 
        $_.IPAddressToString -notmatch '^169\.254\.' 
    } | Select-Object -First 1
    if ($ipv4) {
        $localIp = $ipv4.IPAddressToString
    }
} catch {
    $localIp = "127.0.0.1"
}

$currentDir = $PSScriptRoot
if (-not $currentDir) { $currentDir = (Get-Location).Path }
$dbPath = Join-Path $currentDir "activos.json"
$locsPath = Join-Path $currentDir "ubicaciones.json"

# Inicializar archivos de datos si no existen
if (-not (Test-Path $dbPath)) {
    [System.IO.File]::WriteAllText($dbPath, "[]", [System.Text.Encoding]::UTF8)
}
if (-not (Test-Path $locsPath)) {
    $defaultLocs = '["Caja 1","Caja 2","Caja 3","Caja Rápida","Mostrador / Pedidos","Oficina / Servidor","Tesorería / Caja Fuerte","Almacén / Respaldo","Mesa Técnica","Sala de Espera"]'
    [System.IO.File]::WriteAllText($locsPath, $defaultLocs, [System.Text.Encoding]::UTF8)
}

# 2. Cargar o generar certificado SSL para HTTPS
$certPath = Join-Path $currentDir "server_cert.pfx"
$certPass = "ActivosPOS2026"
$cert = $null

if (Test-Path $certPath) {
    try {
        $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
            $certPath, 
            $certPass, 
            [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable
        )
    } catch {
        $cert = $null
    }
}

if (-not $cert) {
    try {
        $rsa = [System.Security.Cryptography.RSA]::Create(2048)
        $req = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
            "CN=ActivosPOS", 
            $rsa, 
            [System.Security.Cryptography.HashAlgorithmName]::SHA256, 
            [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
        )
        $rawCert = $req.CreateSelfSigned([DateTimeOffset]::Now.AddDays(-1), [DateTimeOffset]::Now.AddYears(2))
        $pfxBytes = $rawCert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx, $certPass)
        [System.IO.File]::WriteAllBytes($certPath, $pfxBytes)

        $cert = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
            $pfxBytes, 
            $certPass, 
            [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable
        )
    } catch {}
}

# 3. Iniciar Listeners (HTTP y HTTPS simultáneos)
$httpListener = $null
for ($p = $HttpPort; $p -le ($HttpPort + 5); $p++) {
    try {
        $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $p)
        $candidate.Start()
        $httpListener = $candidate
        $HttpPort = $p
        break
    } catch {}
}

$httpsListener = $null
if ($cert) {
    for ($p = $HttpsPort; $p -le ($HttpsPort + 5); $p++) {
        try {
            $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $p)
            $candidate.Start()
            $httpsListener = $candidate
            $HttpsPort = $p
            break
        } catch {}
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     CONTROL DE ACTIVOS POS - SERVIDOR EN TIEMPO REAL     " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host ">> BASE DE DATOS CENTRAL EN TU PC (EN TIEMPO REAL):" -ForegroundColor Green
Write-Host "   $dbPath" -ForegroundColor White
Write-Host ""
Write-Host ">> EN TU COMPUTADORA, abre:" -ForegroundColor White
if ($httpListener)  { Write-Host "   http://localhost:$HttpPort" -ForegroundColor Green }
if ($httpsListener) { Write-Host "   https://localhost:$HttpsPort" -ForegroundColor Green }
Write-Host ""
Write-Host ">> EN TU CELULAR (conectado al mismo Wi-Fi), abre:" -ForegroundColor White
if ($httpListener)  { Write-Host "   [Opcion 1 - HTTP]:  http://${localIp}:$HttpPort" -ForegroundColor Yellow }
if ($httpsListener) { Write-Host "   [Opcion 2 - HTTPS]: https://${localIp}:$HttpsPort" -ForegroundColor Yellow }
Write-Host ""
Write-Host ">> AMBOS PUERTOS FUNCIONAN AL MISMO TIEMPO." -ForegroundColor Magenta
Write-Host "   CADA REGISTRO, ESCANEO O CAMBIO SE GUARDA AL INSTANTE." -ForegroundColor Magenta
Write-Host ""
Write-Host ">> NO CIERRES esta ventana mientras uses la app." -ForegroundColor Gray
Write-Host ">> Presiona Ctrl + C para detener el servidor." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Abrir automáticamente en el navegador de la PC
try {
    if ($httpListener) {
        Start-Process "http://localhost:$HttpPort"
    } elseif ($httpsListener) {
        Start-Process "https://localhost:$HttpsPort"
    }
} catch {}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8";
    ".css"  = "text/css; charset=utf-8";
    ".js"   = "application/javascript; charset=utf-8";
    ".json" = "application/json; charset=utf-8";
    ".svg"  = "image/svg+xml";
    ".png"  = "image/png";
    ".jpg"  = "image/jpeg";
    ".ico"  = "image/x-icon"
}

# Función rápida y segura para leer cuerpo HTTP sin bloqueos
function Read-HttpBody($reader, $contentLength) {
    if ($contentLength -le 0) { return "" }
    $sb = [System.Text.StringBuilder]::new()
    $buffer = New-Object char[] 4096

    while ($sb.Length -lt $contentLength) {
        try {
            $toRead = [Math]::Min($buffer.Length, ($contentLength - $sb.Length))
            $read = $reader.Read($buffer, 0, $toRead)
            if ($read -gt 0) {
                [void]$sb.Append($buffer, 0, $read)
            } else {
                break
            }
        } catch {
            break
        }
        $trimmed = $sb.ToString().Trim()
        if ($trimmed.StartsWith("[") -and $trimmed.EndsWith("]")) {
            break
        }
        if ($trimmed.StartsWith("{") -and $trimmed.EndsWith("}")) {
            break
        }
    }
    return $sb.ToString()
}

# Función para atender cada petición (unificada para HTTP y HTTPS)
function Handle-Connection($client, $isHttps, $cert) {
    $stream = $null
    try {
        $client.ReceiveTimeout = 4000
        $client.SendTimeout = 4000
        $netStream = $client.GetStream()

        if ($isHttps) {
            try {
                $sslStream = [System.Net.Security.SslStream]::new($netStream, $false)
                $sslStream.AuthenticateAsServer($cert, $false, [System.Security.Authentication.SslProtocols]::None, $false)
                $stream = $sslStream
            } catch {
                # Petición HTTP simple al puerto HTTPS -> Redirigir
                try {
                    $redirectMsg = "HTTP/1.1 200 OK`r`nContent-Type: text/html; charset=utf-8`r`nConnection: close`r`n`r`n<script>window.location.href='https://' + window.location.host;</script>"
                    $rBytes = [System.Text.Encoding]::UTF8.GetBytes($redirectMsg)
                    $netStream.Write($rBytes, 0, $rBytes.Length)
                    $netStream.Flush()
                } catch {}
                try { $client.Close() } catch {}
                return
            }
        } else {
            $stream = $netStream
        }

        $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::UTF8)
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            try { $stream.Close(); $client.Close() } catch {}
            return
        }

        $parts = $requestLine.Split(" ")
        $method = $parts[0]
        $urlPath = $parts[1]
        if ($urlPath -eq "/" -or $urlPath -eq "") {
            $urlPath = "/index.html"
        }

        # Leer headers para Content-Length
        $contentLength = 0
        while ($true) {
            $hLine = $reader.ReadLine()
            if (-not $hLine -or $hLine -eq "") { break }
            if ($hLine -match "(?i)^Content-Length:\s*(\d+)") {
                $contentLength = [int]$matches[1]
            }
        }

        # CORS Preflight
        if ($method -eq "OPTIONS") {
            $cors = "HTTP/1.1 200 OK`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Methods: GET, POST, OPTIONS`r`nAccess-Control-Allow-Headers: *`r`nContent-Length: 0`r`nConnection: close`r`n`r`n"
            $b = [System.Text.Encoding]::UTF8.GetBytes($cors)
            $stream.Write($b, 0, $b.Length)
            $stream.Flush()
            try { $stream.Close(); $client.Close() } catch {}
            return
        }

        # API: /api/lan-info
        if ($urlPath.StartsWith("/api/lan-info")) {
            $currentPort = if ($isHttps) { $HttpsPort } else { $HttpPort }
            $proto = if ($isHttps) { "https" } else { "http" }
            $lanJson = "{""ip"":""$localIp"",""port"":$currentPort,""httpPort"":$HttpPort,""httpsPort"":$HttpsPort,""url"":""${proto}://${localIp}:$currentPort""}"
            $b = [System.Text.Encoding]::UTF8.GetBytes($lanJson)
            $h = "HTTP/1.1 200 OK`r`nContent-Type: application/json; charset=utf-8`r`nAccess-Control-Allow-Origin: *`r`nContent-Length: $($b.Length)`r`nConnection: close`r`n`r`n"
            $hb = [System.Text.Encoding]::UTF8.GetBytes($h)
            $stream.Write($hb, 0, $hb.Length)
            $stream.Write($b, 0, $b.Length)
            $stream.Flush()
            try { $stream.Close(); $client.Close() } catch {}
            return
        }

        # API: /api/activos (Base de datos central en activos.json)
        if ($urlPath.StartsWith("/api/activos")) {
            if ($method -eq "POST") {
                $jsonBody = Read-HttpBody $reader $contentLength

                $savedCount = 0
                if ($jsonBody -and $jsonBody.Trim().StartsWith("[") -and $jsonBody.Trim().EndsWith("]")) {
                    [System.IO.File]::WriteAllText($dbPath, $jsonBody, [System.Text.Encoding]::UTF8)
                    try {
                        $parsed = ConvertFrom-Json $jsonBody -ErrorAction SilentlyContinue
                        if ($parsed) { $savedCount = $parsed.Count }
                    } catch {}
                    $originTag = if ($isHttps) { "HTTPS" } else { "HTTP" }
                    Write-Host "[$originTag - TIEMPO REAL] Sincronizado en PC: $(Get-Date -Format 'HH:mm:ss') ($savedCount activos guardados)" -ForegroundColor Green
                }

                $timeStr = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
                $respJson = "{""success"":true,""message"":""Guardado en PC en tiempo real"",""count"":$savedCount,""timestamp"":""$timeStr""}"
                $respBytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                $respH = "HTTP/1.1 200 OK`r`nContent-Type: application/json; charset=utf-8`r`nAccess-Control-Allow-Origin: *`r`nCache-Control: no-cache, no-store, must-revalidate`r`nContent-Length: $($respBytes.Length)`r`nConnection: close`r`n`r`n"
                $hB = [System.Text.Encoding]::UTF8.GetBytes($respH)
                $stream.Write($hB, 0, $hB.Length)
                $stream.Write($respBytes, 0, $respBytes.Length)
                $stream.Flush()
                try { $stream.Close(); $client.Close() } catch {}
                return
            } else {
                if (-not (Test-Path $dbPath)) {
                    [System.IO.File]::WriteAllText($dbPath, "[]", [System.Text.Encoding]::UTF8)
                }
                $dbBytes = [System.IO.File]::ReadAllBytes($dbPath)
                $respH = "HTTP/1.1 200 OK`r`nContent-Type: application/json; charset=utf-8`r`nAccess-Control-Allow-Origin: *`r`nCache-Control: no-cache, no-store, must-revalidate`r`nContent-Length: $($dbBytes.Length)`r`nConnection: close`r`n`r`n"
                $hB = [System.Text.Encoding]::UTF8.GetBytes($respH)
                $stream.Write($hB, 0, $hB.Length)
                $stream.Write($dbBytes, 0, $dbBytes.Length)
                $stream.Flush()
                try { $stream.Close(); $client.Close() } catch {}
                return
            }
        }

        # API: /api/ubicaciones (Gestión de cuadros en tiempo real)
        if ($urlPath.StartsWith("/api/ubicaciones")) {
            if ($method -eq "POST") {
                $jsonBody = Read-HttpBody $reader $contentLength

                if ($jsonBody -and $jsonBody.Trim().StartsWith("[") -and $jsonBody.Trim().EndsWith("]")) {
                    [System.IO.File]::WriteAllText($locsPath, $jsonBody, [System.Text.Encoding]::UTF8)
                    $originTag = if ($isHttps) { "HTTPS" } else { "HTTP" }
                    Write-Host "[$originTag - TIEMPO REAL] Cuadros de ubicacion actualizados en PC: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
                }

                $respJson = "{""success"":true}"
                $respBytes = [System.Text.Encoding]::UTF8.GetBytes($respJson)
                $respH = "HTTP/1.1 200 OK`r`nContent-Type: application/json; charset=utf-8`r`nAccess-Control-Allow-Origin: *`r`nContent-Length: $($respBytes.Length)`r`nConnection: close`r`n`r`n"
                $hB = [System.Text.Encoding]::UTF8.GetBytes($respH)
                $stream.Write($hB, 0, $hB.Length)
                $stream.Write($respBytes, 0, $respBytes.Length)
                $stream.Flush()
                try { $stream.Close(); $client.Close() } catch {}
                return
            } else {
                if (-not (Test-Path $locsPath)) {
                    [System.IO.File]::WriteAllText($locsPath, "[]", [System.Text.Encoding]::UTF8)
                }
                $locBytes = [System.IO.File]::ReadAllBytes($locsPath)
                $respH = "HTTP/1.1 200 OK`r`nContent-Type: application/json; charset=utf-8`r`nAccess-Control-Allow-Origin: *`r`nCache-Control: no-cache, no-store, must-revalidate`r`nContent-Length: $($locBytes.Length)`r`nConnection: close`r`n`r`n"
                $hB = [System.Text.Encoding]::UTF8.GetBytes($respH)
                $stream.Write($hB, 0, $hB.Length)
                $stream.Write($locBytes, 0, $locBytes.Length)
                $stream.Flush()
                try { $stream.Close(); $client.Close() } catch {}
                return
            }
        }

        # Servir archivos estáticos (HTML, CSS, JS, etc.)
        $cleanPath = $urlPath.Split("?")[0].TrimStart("/")
        $filePath = Join-Path $currentDir $cleanPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)

            $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFound = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nConnection: close`r`n`r`nArchivo no encontrado"
            $notBytes = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $stream.Write($notBytes, 0, $notBytes.Length)
        }

        $stream.Flush()
        try { $stream.Close(); $client.Close() } catch {}
    } catch {
        try { if ($stream) { $stream.Close() } } catch {}
        try { if ($client) { $client.Close() } } catch {}
    }
}

# Bucle principal de atención simultánea
while ($true) {
    # 1. Atender conexiones HTTP (puerto 8000)
    if ($httpListener -and $httpListener.Pending()) {
        try {
            $c = $httpListener.AcceptTcpClient()
            Handle-Connection $c $false $null
        } catch {}
    }

    # 2. Atender conexiones HTTPS (puerto 8443)
    if ($httpsListener -and $httpsListener.Pending()) {
        try {
            $c = $httpsListener.AcceptTcpClient()
            Handle-Connection $c $true $cert
        } catch {}
    }

    Start-Sleep -Milliseconds 15
}
