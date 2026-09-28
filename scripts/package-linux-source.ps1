$ErrorActionPreference = 'Stop'

$RootDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$OutputDir = Join-Path $RootDir 'release-linux'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$StageDir = Join-Path $OutputDir ".stage-$Stamp"
$ArchivePath = Join-Path $OutputDir "lingpu-sales-system-linux-source-$Stamp.zip"

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
New-Item -ItemType Directory -Path $StageDir -Force | Out-Null

$ExcludedDirs = @(
  (Join-Path $RootDir '.git'),
  (Join-Path $RootDir 'release'),
  (Join-Path $RootDir 'release-linux'),
  (Join-Path $RootDir 'node_modules'),
  (Join-Path $RootDir 'client\node_modules'),
  (Join-Path $RootDir 'server\node_modules'),
  (Join-Path $RootDir 'portal\node_modules'),
  (Join-Path $RootDir 'client\dist'),
  (Join-Path $RootDir 'server\dist'),
  (Join-Path $RootDir 'portal\dist'),
  (Join-Path $RootDir 'server\uploads')
)

$RobocopyArgs = @(
  $RootDir,
  $StageDir,
  '/E', '/R:1', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS', '/NP',
  '/XD'
) + $ExcludedDirs + @(
  '/XF', '*.sqlite*', '*.db', '*.log', '.env', '.env.*', '*.local',
  'node-v*-win-*.zip', 'node.zip'
)

& robocopy @RobocopyArgs | Out-Null
if ($LASTEXITCODE -ge 8) {
  throw "Robocopy failed with exit code $LASTEXITCODE"
}

Compress-Archive -Path (Join-Path $StageDir '*') -DestinationPath $ArchivePath -CompressionLevel Optimal

$ResolvedOutputDir = (Resolve-Path $OutputDir).Path.TrimEnd('\') + '\'
$ResolvedStageDir = (Resolve-Path $StageDir).Path
if (-not $ResolvedStageDir.StartsWith($ResolvedOutputDir, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to remove staging directory outside release-linux: $ResolvedStageDir"
}
Remove-Item -LiteralPath $ResolvedStageDir -Recurse -Force

Write-Host "Linux source package created: $ArchivePath"
Write-Host 'SQLite databases, uploads, dependencies, build output, and Windows runtimes are excluded.'
