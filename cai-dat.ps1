# Cai dat day chuyen /day_chuyen_all (v2) vao Claude Code.
# Dung:
#   powershell -ExecutionPolicy Bypass -File .\cai-dat.ps1                       # cap user  (~\.claude)
#   powershell -ExecutionPolicy Bypass -File .\cai-dat.ps1 -PhamVi project -DuAn D:\du-an   # cap du an
# File cung ten da co se duoc sao luu truoc khi ghi de.
param(
  [ValidateSet('user', 'project')][string]$PhamVi = 'user',
  [string]$DuAn = (Get-Location).Path
)
$ErrorActionPreference = 'Stop'

$nguon = $PSScriptRoot
if ($PhamVi -eq 'user') { $dich = Join-Path $HOME '.claude' } else { $dich = Join-Path $DuAn '.claude' }
$danhSach = @(
  'agents\dc-planner.md',
  'agents\dc-coder.md',
  'agents\dc-tester.md',
  'agents\dc-reviewer.md',
  'commands\day_chuyen_all.md'
)
$saoLuu = Join-Path $dich ('day-chuyen-sao-luu\' + (Get-Date -Format 'yyyyMMdd-HHmmss'))

foreach ($f in $danhSach) {
  $src = Join-Path $nguon $f
  $dst = Join-Path $dich $f
  if (-not (Test-Path $src)) { throw "Thieu file nguon: $src" }
  New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
  if (Test-Path $dst) {
    $bk = Join-Path $saoLuu $f
    New-Item -ItemType Directory -Force -Path (Split-Path $bk) | Out-Null
    Copy-Item $dst $bk -Force
  }
  Copy-Item $src $dst -Force
  Write-Host "Da cai: $dst"
}
if (Test-Path $saoLuu) { Write-Host "Ban cu da sao luu o: $saoLuu" }
Write-Host 'Xong. Mo phien Claude Code moi roi go: /day_chuyen_all <yeu cau>'
