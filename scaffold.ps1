$dirs = @(
    "src/app/api/auth",
    "src/app/api/issues/[id]/verify",
    "src/app/api/issues/[id]/cluster",
    "src/app/api/webhooks/cloudinary",
    "src/app/(dashboard)/issues/[id]",
    "src/app/(dashboard)/map",
    "src/app/login",
    "src/components/ui",
    "src/components/issues",
    "src/components/map",
    "src/lib/db",
    "src/lib/ai",
    "src/lib/firebase",
    "src/lib/cloudinary",
    "src/services",
    "src/types",
    "src/utils"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path "web/$dir" | Out-Null
}

$files = @(
    "src/app/api/auth/route.ts",
    "src/app/api/issues/route.ts",
    "src/app/api/issues/[id]/route.ts",
    "src/app/api/issues/[id]/verify/route.ts",
    "src/app/api/issues/[id]/cluster/route.ts",
    "src/app/api/webhooks/cloudinary/route.ts",
    "src/app/(dashboard)/layout.tsx",
    "src/app/(dashboard)/page.tsx",
    "src/app/(dashboard)/issues/page.tsx",
    "src/app/(dashboard)/issues/[id]/page.tsx",
    "src/app/(dashboard)/map/page.tsx",
    "src/app/login/page.tsx",
    "src/components/issues/IssueCard.tsx",
    "src/components/issues/IssueList.tsx",
    "src/components/issues/DuplicateCluster.tsx",
    "src/components/map/IssueMap.tsx",
    "src/lib/db/index.ts",
    "src/lib/db/schema.ts",
    "src/lib/ai/gemini.ts",
    "src/lib/ai/prompts.ts",
    "src/lib/ai/embeddings.ts",
    "src/lib/firebase/admin.ts",
    "src/lib/firebase/client.ts",
    "src/lib/cloudinary/upload.ts",
    "src/services/issue.service.ts",
    "src/services/priority.service.ts",
    "src/services/anomaly.service.ts",
    "src/types/index.ts",
    "src/utils/geo.ts"
)

foreach ($file in $files) {
    New-Item -ItemType File -Force -Path "web/$file" | Out-Null
}

Write-Host "Scaffolded CivicLens folder structure successfully."
