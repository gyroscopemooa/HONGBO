# Read-only token check. No file persistence, deployment, or publication.
$ErrorActionPreference = 'Stop'
$threadsInput = Read-Host 'Paste the Threads token here (hidden), then press Enter' -AsSecureString
$threadsPointer = [IntPtr]::Zero
$threadsPlain = $null
$threadsHeaders = $null
try {
    $threadsPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($threadsInput)
    $threadsPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($threadsPointer)
    if ([string]::IsNullOrWhiteSpace($threadsPlain)) { throw 'Missing token' }
    $threadsHeaders = @{ Authorization = 'Bearer ' + $threadsPlain.Trim() }
    $threadsProfile = Invoke-RestMethod -Method Get -Uri 'https://graph.threads.net/v1.0/me?fields=id,username' -Headers $threadsHeaders -TimeoutSec 15 -MaximumRedirection 0
    if ($threadsProfile.username -ne 'iamthehongbo' -or [string]$threadsProfile.id -notmatch '^\d+$') {
        Write-Host 'BLOCKED: this is not the official @iamthehongbo account.'
    } else {
        Write-Host 'VERIFIED: @iamthehongbo. No post was published. Token was not saved.'
    }
} catch {
    # Never print a request, token, exception or raw provider response.
    Write-Host 'CHECK FAILED: verify the token, account and network. No post was published.'
} finally {
    if ($threadsPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($threadsPointer) }
    $threadsHeaders = $null
    $threadsPlain = $null
    $threadsInput.Dispose()
}
