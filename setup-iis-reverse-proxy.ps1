#Requires -RunAsAdministrator

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TimeWise CRM - IIS Reverse Proxy Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$ErrorActionPreference = "Continue"
$sitePath = "C:\Users\TRG\Documents\LOF-CS\TimeWise_FireBase_CRM"
$siteName = "TimeWise"
$appPoolName = "TimeWiseAppPool"
$domain = "timewise.cmis.ac.in"

# Step 1: Install IIS
Write-Host "[1/8] Installing IIS and required features..." -ForegroundColor Yellow
$iisFeature = Get-WindowsFeature -Name Web-Server
if ($iisFeature.Installed) {
    Write-Host "  OK IIS already installed" -ForegroundColor Green
} else {
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools | Out-Null
    Write-Host "  OK IIS installed successfully" -ForegroundColor Green
}
Install-WindowsFeature -Name Web-WebSockets -ErrorAction SilentlyContinue | Out-Null
Write-Host "  OK WebSocket support enabled" -ForegroundColor Green

# Step 2: Download and install URL Rewrite Module
Write-Host "`n[2/8] Installing URL Rewrite Module..." -ForegroundColor Yellow
$urlRewriteKey = "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite"
if (Test-Path $urlRewriteKey) {
    Write-Host "  OK URL Rewrite already installed" -ForegroundColor Green
} else {
    $urlRewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
    $urlRewritePath = "$env:TEMP\urlrewrite.msi"
    Write-Host "  Downloading URL Rewrite Module..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $urlRewriteUrl -OutFile $urlRewritePath -UseBasicParsing
    Write-Host "  Installing URL Rewrite Module..." -ForegroundColor Gray
    Start-Process msiexec.exe -ArgumentList "/i `"$urlRewritePath`" /quiet /norestart" -Wait -NoNewWindow
    Start-Sleep -Seconds 3
    Write-Host "  OK URL Rewrite installed successfully" -ForegroundColor Green
}

# Step 3: Download and install Application Request Routing (ARR)
Write-Host "`n[3/8] Installing Application Request Routing (ARR)..." -ForegroundColor Yellow
$arrKey = "HKLM:\SOFTWARE\Microsoft\IIS Extensions\Application Request Routing"
if (Test-Path $arrKey) {
    Write-Host "  OK ARR already installed" -ForegroundColor Green
} else {
    $arrUrl = "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
    $arrPath = "$env:TEMP\arr.msi"
    Write-Host "  Downloading Application Request Routing..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $arrUrl -OutFile $arrPath -UseBasicParsing
    Write-Host "  Installing Application Request Routing..." -ForegroundColor Gray
    Start-Process msiexec.exe -ArgumentList "/i `"$arrPath`" /quiet /norestart" -Wait -NoNewWindow
    Start-Sleep -Seconds 5
    Write-Host "  OK ARR installed successfully" -ForegroundColor Green
}

# Step 4: Enable ARR Proxy
Write-Host "`n[4/8] Enabling ARR Proxy functionality..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Import-Module WebAdministration -ErrorAction SilentlyContinue
Set-WebConfigurationProperty -PSPath 'MACHINE/WEBROOT/APPHOST' -Filter "system.webServer/proxy" -Name "enabled" -Value "True" -ErrorAction SilentlyContinue
Write-Host "  OK ARR Proxy enabled" -ForegroundColor Green

# Step 5: Create web.config
Write-Host "`n[5/8] Creating web.config..." -ForegroundColor Yellow
@"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyToNextJS" stopProcessing="true">
                    <match url="(.*)" />
                    <action type="Rewrite" url="http://localhost:9002/{R:1}" />
                </rule>
            </rules>
        </rewrite>
        <httpErrors errorMode="Custom" existingResponse="PassThrough" />
        <webSocket enabled="true" />
    </system.webServer>
</configuration>
"@ | Out-File -FilePath "$sitePath\web.config" -Encoding UTF8 -Force
Write-Host "  OK web.config created" -ForegroundColor Green

# Step 6: Create IIS Site
Write-Host "`n[6/8] Creating IIS Website..." -ForegroundColor Yellow
Import-Module WebAdministration
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Remove-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
}
New-WebAppPool -Name $appPoolName | Out-Null
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name managedRuntimeVersion -Value ''

if (Test-Path "IIS:\Sites\$siteName") {
    Remove-Website -Name $siteName -ErrorAction SilentlyContinue
}
New-Website -Name $siteName -PhysicalPath $sitePath -Port 80 -ApplicationPool $appPoolName -HostHeader $domain | Out-Null
Start-Website -Name $siteName
Write-Host "  OK Website created and started" -ForegroundColor Green

# Step 7: Configure Firewall
Write-Host "`n[7/8] Configuring Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "HTTP Inbound" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "HTTPS Inbound" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue | Out-Null
Write-Host "  OK Firewall rules created" -ForegroundColor Green

# Step 8: Summary
Write-Host "`n[8/8] Setup Complete!" -ForegroundColor Green
Write-Host "`nConfiguration:" -ForegroundColor Cyan
Write-Host "  Domain: http://$domain" -ForegroundColor White
Write-Host "  Backend: http://localhost:9002" -ForegroundColor White
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Start Next.js: npm start" -ForegroundColor White
Write-Host "  2. Test: http://$domain" -ForegroundColor White
Write-Host "  3. Setup PM2 (see DEPLOYMENT_GUIDE.md)" -ForegroundColor White
Write-Host "`n========================================`n" -ForegroundColor Cyan
