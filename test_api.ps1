# Prueba de conectividad API Dashboard Qinaya
param(
    [string]$BaseUrl = 'https://panel.qinaya.co/api2/',
    [string]$Org = '28',
    [string]$Since = '2026-06-01',
    [string]$Until = '2026-06-30'
)

$ErrorActionPreference = 'Continue'
$BaseUrl = $BaseUrl.TrimEnd('/') + '/'

function Test-Endpoint {
    param([string]$Name, [string]$Url, [scriptblock]$Validate)

    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    Write-Host "GET $Url"
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 60
        $body = $r.Content
        Write-Host "HTTP $($r.StatusCode)  Content-Type: $($r.Headers['Content-Type'])" -ForegroundColor Green
        if ($body -match '^<%@|^<\%|^Response\.') {
            Write-Host "ERROR: respuesta es codigo ASP sin ejecutar" -ForegroundColor Red
            return $false
        }
        if ($body -match '^\s*<(!DOCTYPE|html)') {
            Write-Host "ERROR: respuesta es HTML (posible redirect a login)" -ForegroundColor Red
            return $false
        }
        try {
            $null = $body | ConvertFrom-Json
            Write-Host "JSON valido. Bytes: $($body.Length)" -ForegroundColor Green
        } catch {
            Write-Host "ERROR: no es JSON valido: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ($body.Substring(0, [Math]::Min(200, $body.Length)))
            return $false
        }
        if ($Validate) {
            $ok = & $Validate $body
            if (-not $ok) { return $false }
        }
        return $true
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "API Dashboard - prueba de conexion" -ForegroundColor Yellow
Write-Host "Base: $BaseUrl"

$q = "org=$Org&since=$Since&until=$Until"
$results = @{}

$results['organizations'] = Test-Endpoint 'organizations' "${BaseUrl}organizations.asp" {
    param($b)
    $j = $b | ConvertFrom-Json
    if ($j.Count -lt 1) { Write-Host "WARN: array vacio"; return $false }
    Write-Host "Organizaciones: $($j.Count). Primera: $($j[0].name)"
    $true
}

$results['usage'] = Test-Endpoint 'usage' "${BaseUrl}usage.asp?$q" {
    param($b)
    $j = $b | ConvertFrom-Json
    $n = $j.labels.Count
    Write-Host "Dias con datos: $n. totalUsage[0]=$($j.totalUsage[0])"
    ($j.labels.Count -eq $j.localUsage.Count) -and ($j.labels.Count -eq $j.totalUsage.Count)
}

$results['computers'] = Test-Endpoint 'computers' "${BaseUrl}computers.asp?$q" {
    param($b)
    $j = $b | ConvertFrom-Json
    Write-Host "Equipos: $($j.Count). Ejemplo: $($j[0].id) / $($j[0].totalHours) h"
    $j.Count -gt 0
}

$results['websites'] = Test-Endpoint 'websites' "${BaseUrl}websites.asp?$q" {
    param($b)
    $j = $b | ConvertFrom-Json
    Write-Host "Dominios: $($j.Count). Top: $($j[0].name)"
    $j.Count -gt 0
}

# CORS preflight (como navegador)
Write-Host "`n=== CORS OPTIONS ===" -ForegroundColor Cyan
try {
    $opt = Invoke-WebRequest -Uri "${BaseUrl}organizations.asp" -Method Options -UseBasicParsing `
        -Headers @{ Origin = 'http://localhost:5173' }
    $acao = $opt.Headers['Access-Control-Allow-Origin']
    Write-Host "HTTP $($opt.StatusCode)  Access-Control-Allow-Origin: $acao" -ForegroundColor $(if ($acao) { 'Green' } else { 'Red' })
    $results['cors'] = [bool]$acao
} catch {
    Write-Host "ERROR OPTIONS: $($_.Exception.Message)" -ForegroundColor Red
    $results['cors'] = $false
}

# URLs incorrectas frecuentes
Write-Host "`n=== URLs incorrectas (deben fallar) ===" -ForegroundColor Cyan
foreach ($bad in @(
    "$($BaseUrl.TrimEnd('/'))/organizations",
    'https://panel.qinaya.co/api/organizations.asp'
)) {
    try {
        $r = Invoke-WebRequest -Uri $bad -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
        Write-Host "WARN $bad -> $($r.StatusCode) (esperabamos error)" -ForegroundColor Yellow
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "OK $bad -> $code" -ForegroundColor DarkGray
    }
}

Write-Host "`n========== RESUMEN ==========" -ForegroundColor Yellow
$results.GetEnumerator() | Sort-Object Name | ForEach-Object {
    $color = if ($_.Value) { 'Green' } else { 'Red' }
    Write-Host ("{0,-15} {1}" -f $_.Key, $(if ($_.Value) { 'OK' } else { 'FALLO' })) -ForegroundColor $color
}
$allOk = ($results.Values | Where-Object { $_ -eq $false }).Count -eq 0
if ($allOk) {
    Write-Host "`nLa API es accesible. URL base correcta: $BaseUrl" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nHay fallos. Verifique URL, extension .asp y carpeta api2." -ForegroundColor Red
    exit 1
}
