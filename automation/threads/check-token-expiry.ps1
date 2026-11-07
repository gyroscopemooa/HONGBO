# Read-only Meta token diagnostics. No token is saved or printed; no posting API.
$ErrorActionPreference = 'Stop'
$threadsExpiryInput = Read-Host 'Paste the same Threads token (hidden), then press Enter' -AsSecureString
$threadsExpiryPointer = [IntPtr]::Zero
$threadsExpiryPlain = $null
$threadsExpiryHeaders = $null
$threadsExpiryUri = $null
try {
    $threadsExpiryPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($threadsExpiryInput)
    $threadsExpiryPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($threadsExpiryPointer).Trim()
    if ([string]::IsNullOrWhiteSpace($threadsExpiryPlain)) { throw 'Missing token' }
    $threadsExpiryHeaders = @{ Authorization = 'Bearer ' + $threadsExpiryPlain }
    $threadsExpiryProfile = Invoke-RestMethod -Method Get -Uri 'https://graph.threads.net/v1.0/me?fields=id,username' -Headers $threadsExpiryHeaders -TimeoutSec 15 -MaximumRedirection 0
    if ($threadsExpiryProfile.username -ne 'iamthehongbo') { throw 'Wrong account' }
    $threadsExpiryUri = 'https://graph.threads.net/debug_token?input_token=' + [Uri]::EscapeDataString($threadsExpiryPlain)
    $threadsExpiryResponse = Invoke-RestMethod -Method Get -Uri $threadsExpiryUri -Headers $threadsExpiryHeaders -TimeoutSec 15 -MaximumRedirection 0
    $threadsExpiryData = $threadsExpiryResponse.data
    if ($threadsExpiryData.is_valid -ne $true -or [string]$threadsExpiryData.user_id -ne [string]$threadsExpiryProfile.id) { throw 'Invalid token identity' }
    if ([long]$threadsExpiryData.expires_at -le 0) {
        Write-Host 'EXPIRY UNKNOWN: Meta returned no positive expiry. Keep automation OFF.'
    } else {
        Write-Host ('EXPIRES_AT: ' + [DateTimeOffset]::FromUnixTimeSeconds([long]$threadsExpiryData.expires_at).UtcDateTime.ToString('o'))
        if ([long]$threadsExpiryData.issued_at -gt 0) {
            Write-Host ('ISSUED_AT: ' + [DateTimeOffset]::FromUnixTimeSeconds([long]$threadsExpiryData.issued_at).UtcDateTime.ToString('o'))
        }
        Write-Host ('PUBLISH_PERMISSION: ' + ($threadsExpiryData.scopes -contains 'threads_content_publish'))
        Write-Host 'ACCOUNT: @iamthehongbo. No post was published. Token was not saved.'
    }
} catch {
    # Never output exceptions: request URLs can contain the token.
    Write-Host 'EXPIRY CHECK FAILED: Meta may require app authentication, or the token may be invalid. Keep automation OFF.'
} finally {
    if ($threadsExpiryPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($threadsExpiryPointer) }
    $threadsExpiryPlain = $null
    $threadsExpiryHeaders = $null
    $threadsExpiryUri = $null
    $threadsExpiryResponse = $null
    $threadsExpiryData = $null
    $threadsExpiryInput.Dispose()
}
