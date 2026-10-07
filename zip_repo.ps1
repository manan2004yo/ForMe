$items = @(
    "src",
    "functions",
    "public",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "tailwind.config.js",
    "firebase.json",
    "index.html",
    "README.md",
    "AGENTS.md",
    "GOVERNANCE.md",
    "PRODUCT_ARCHITECTURE.md",
    "FORME_CURRENT_SNAPSHOT_INFO.txt"
)

$destination = "FORME_CURRENT_WORKING_TREE.zip"
if (Test-Path $destination) {
    Remove-Item -Force $destination
}

Compress-Archive -Path $items -DestinationPath $destination
