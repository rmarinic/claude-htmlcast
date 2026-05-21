# install.ps1 — copy the htmlcast skill + htmlcast-init command into ~/.claude/
#
# Usage:
#   ./install.ps1            # copy (overwrites existing)
#   ./install.ps1 -DryRun    # show what would happen, change nothing

[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$RepoRoot      = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeRoot    = Join-Path $HOME '.claude'
$SkillsTarget  = Join-Path $ClaudeRoot 'skills/htmlcast'
$CommandTarget = Join-Path $ClaudeRoot 'commands/htmlcast-init.md'

$SkillSource   = Join-Path $RepoRoot 'skill'
$CommandSource = Join-Path $RepoRoot 'command/htmlcast-init.md'

if (-not (Test-Path $SkillSource))   { throw "Missing source: $SkillSource" }
if (-not (Test-Path $CommandSource)) { throw "Missing source: $CommandSource" }

function Step([string]$msg) { Write-Host "  $msg" -ForegroundColor Cyan }

Write-Host "claude-htmlcast installer" -ForegroundColor White
Write-Host ("  repo:    {0}" -f $RepoRoot)
Write-Host ("  target:  {0}" -f $ClaudeRoot)
if ($DryRun) { Write-Host "  mode:    DRY RUN — no changes" -ForegroundColor Yellow }
Write-Host ""

# 1. Skill
Step ("Installing skill -> {0}" -f $SkillsTarget)
if (-not $DryRun) {
    if (-not (Test-Path (Split-Path $SkillsTarget -Parent))) {
        New-Item -ItemType Directory -Path (Split-Path $SkillsTarget -Parent) -Force | Out-Null
    }
    if (Test-Path $SkillsTarget) {
        Remove-Item -Recurse -Force $SkillsTarget
    }
    Copy-Item -Recurse -Force $SkillSource $SkillsTarget
}

# 2. Command
Step ("Installing command -> {0}" -f $CommandTarget)
if (-not $DryRun) {
    $cmdDir = Split-Path $CommandTarget -Parent
    if (-not (Test-Path $cmdDir)) {
        New-Item -ItemType Directory -Path $cmdDir -Force | Out-Null
    }
    Copy-Item -Force $CommandSource $CommandTarget
}

Write-Host ""
Write-Host "Installed." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. (one time) npm install -g live-server"
Write-Host "  2. In any project, run /htmlcast-init in Claude Code"
Write-Host "  3. In a separate terminal: live-server .htmlcast/"
