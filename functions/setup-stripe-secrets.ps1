param(
  [ValidateSet("test", "live")]
  [string]$Mode = "test"
)

$project = "iae-slop-3f7be"
$cli = "npx"

Write-Host "Firebase Stripe secret setup" -ForegroundColor Cyan
Write-Host "Project: $project"
Write-Host "Mode: $Mode"
Write-Host ""
Write-Host "You will be prompted for STRIPE_SECRET_KEY." -ForegroundColor Yellow
Write-Host "Paste the secret key only at the prompt. Never append it to this command." -ForegroundColor Yellow
Write-Host ""

& $cli --yes firebase-tools@latest functions:secrets:set STRIPE_SECRET_KEY --project $project --force
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "A webhook secret is not the Stripe API secret." -ForegroundColor Yellow
Write-Host "After creating the Stripe webhook endpoint, run:"
Write-Host "npx --yes firebase-tools@latest functions:secrets:set STRIPE_WEBHOOK_SECRET --project $project --force"
