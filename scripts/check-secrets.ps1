# Security Check Script for Windows PowerShell
# Prevents committing secrets to Git

Write-Host "🔍 Checking for potential secrets in staged files..." -ForegroundColor Cyan

# Check for common secret patterns
$secretPatterns = @(
    "sk_live_[a-zA-Z0-9]{24,}",
    "sk_test_[a-zA-Z0-9]{24,}",
    "pk_live_[a-zA-Z0-9]{24,}",
    "pk_test_[a-zA-Z0-9]{24,}",
    "whsec_[a-zA-Z0-9]{24,}",
    "mongodb\+srv://[^:]+:[^@]+@",
    "mongodb://[^:]+:[^@]+@"
)

$foundSecrets = $false

# Get staged files
$stagedFiles = git diff --cached --name-only

foreach ($file in $stagedFiles) {
    # Skip .env.example files
    if ($file -match "\.env\.example" -or $file -match "SECURITY_NOTES\.md") {
        continue
    }
    
    foreach ($pattern in $secretPatterns) {
        $diff = git diff --cached $file
        if ($diff -match $pattern) {
            Write-Host "❌ WARNING: Potential secret found in $file" -ForegroundColor Red
            Write-Host "   Pattern: $pattern" -ForegroundColor Yellow
            $foundSecrets = $true
        }
    }
}

# Check for .env files being added
if ($stagedFiles -match "\.env$|\.env\.(local|development|staging|production)$") {
    Write-Host "❌ ERROR: Attempting to commit .env file!" -ForegroundColor Red
    Write-Host "   .env files should NEVER be committed" -ForegroundColor Yellow
    $foundSecrets = $true
}

if ($foundSecrets) {
    Write-Host ""
    Write-Host "🚨 SECURITY ALERT: Potential secrets detected!" -ForegroundColor Red
    Write-Host "   Please remove secrets from code and use environment variables instead." -ForegroundColor Yellow
    Write-Host "   See SECURITY_NOTES.md for more information." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ No secrets detected in staged files" -ForegroundColor Green
    exit 0
}



