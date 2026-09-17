$output = "FORME_HANDOFF_TO_CLAUDE.txt"
Clear-Content $output -ErrorAction SilentlyContinue

function Append-File($path, $displayName) {
    if (Test-Path $path) {
        Add-Content $output "============================================================"
        Add-Content $output "FILE: $displayName"
        Add-Content $output "============================================================"
        Get-Content $path | Add-Content $output
        Add-Content $output "`n"
    }
}

Append-File "PRODUCT_ARCHITECTURE.md" "PRODUCT_ARCHITECTURE.md"
Append-File "FORME_Architecture_Upgrade_Plan.md" "FORME_Architecture_Upgrade_Plan.md"
Append-File "package.json" "package.json"
Append-File "src\index.css" "src\index.css"

Get-ChildItem -Path "src" -Include *.ts,*.tsx -Recurse | ForEach-Object {
    # Get relative path for cleaner output
    $relPath = Resolve-Path -Relative $_.FullName
    Append-File $_.FullName $relPath
}

Write-Host "Successfully generated $output"
