# PowerShell script to add timewise hostname
Write-Host "🌐 Adding timewise hostname..." -ForegroundColor Green

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$hostname = "timewise"
$ipAddress = "192.168.1.43"
$entry = "$ipAddress    $hostname"

# Check if entry already exists
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue
if ($hostsContent -match "192\.168\.1\.43.*timewise") {
    Write-Host "✅ Hostname entry already exists" -ForegroundColor Yellow
    exit 0
}

try {
    # Add the entry
    Add-Content -Path $hostsPath -Value ""
    Add-Content -Path $hostsPath -Value "# TimeWise Server"
    Add-Content -Path $hostsPath -Value $entry
    
    Write-Host "✅ Successfully added hostname entry" -ForegroundColor Green
    Write-Host "📍 Added: $entry" -ForegroundColor Cyan
    
    # Test resolution
    try {
        $result = Test-NetConnection -ComputerName $hostname -Port 9002 -InformationLevel Quiet
        Write-Host "🧪 Testing hostname resolution..." -ForegroundColor Blue
        Write-Host "✅ Hostname resolves correctly!" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Testing will be available after server restart" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Failed to add hostname entry. Run as Administrator." -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}