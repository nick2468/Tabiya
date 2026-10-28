# Upgrade the installed Tabiya with this build's installer, through its windows.
#
# Written at phase 53 (2026-10-28), after 1.10.9 and 1.10.10 shipped an upgrade
# that failed: picking the default "Uninstall before installing" over 1.10.8
# gave "Error launching installer" and then "Unable to uninstall!". Every check
# before release had passed, for two reasons this script exists to remove.
#
# 1. The checks installed with /S. A silent install skips the "Already
#    Installed" page, and that page's leave function is where the old
#    uninstaller is run. So this script clicks through the real pages, picks
#    "Uninstall before installing", and records the command line the installer
#    gives the old uninstaller. An empty `_?=` is the 1.10.9 fault.
#
# 2. A Claude Code session's shell runs in a sandbox whose writes to the user's
#    registry and LocalAppData land in a private copy. Installs run from it
#    leave the REAL machine untouched, and the next install run from it sees
#    the private copy. Running this script from that shell proves nothing. It
#    has to be started by Explorer, which runs it as the user:
#
#        Start-Process explorer.exe '"<repo>\scripts\upgrade-walk.cmd"'
#
#    The session then waits for the log's `.finished` marker and reads the log.
#    Do not read the log while it is being written: the script would lose lines.
#
# It drives the windows with WM_COMMAND and BM_CLICK, never the mouse, and it
# stops rather than going on if the uninstaller's "Delete the application data"
# box is ticked. It leaves the new version installed and closed.

param([string]$SetupPath, [string]$Log = "$env:TEMP\tabiya-upgrade-walk.log")

$repo = Split-Path -Parent $PSScriptRoot
if (-not $SetupPath) {
  $version = (Get-Content "$repo\package.json" -Raw | ConvertFrom-Json).version
  $SetupPath = "$repo\src-tauri\target\release\bundle\nsis\Tabiya_${version}_x64-setup.exe"
}

function Finish($how) { Set-Content -LiteralPath "$Log.finished" -Value $how; exit }
function L($m) {
  # Retried, because a reader holding the file makes a write fail silently.
  for ($k = 0; $k -lt 20; $k++) {
    try { Add-Content -LiteralPath $Log -Value ("{0:HH:mm:ss} {1}" -f (Get-Date), $m) -ErrorAction Stop; return }
    catch { Start-Sleep -Milliseconds 100 }
  }
}
trap { L "UNHANDLED: $_"; Finish 'failed' }

Remove-Item -LiteralPath "$Log.finished" -ErrorAction SilentlyContinue
Set-Content -LiteralPath $Log -Value "=== upgrade walk: $SetupPath"

# The helper is a class named W; a method named Main would be refused as a
# second entry point, which is how the first version of this script failed.
Add-Type @"
using System; using System.Text; using System.Collections.Generic; using System.Runtime.InteropServices;
public class W { public delegate bool E(IntPtr h, IntPtr l);
[DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr p, E e, IntPtr l);
[DllImport("user32.dll")] static extern bool EnumWindows(E e, IntPtr l);
[DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
[DllImport("user32.dll")] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
[DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
[DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr h, int m, IntPtr w, IntPtr l);
[DllImport("user32.dll")] public static extern IntPtr PostMessage(IntPtr h, int m, IntPtr w, IntPtr l);
static string T(IntPtr h) { var s = new StringBuilder(512); GetWindowText(h, s, 512); return s.ToString(); }
public static List<IntPtr> Tops(uint pid) { var r = new List<IntPtr>(); EnumWindows((h, l) => { uint p; GetWindowThreadProcessId(h, out p); if (p == pid && IsWindowVisible(h)) r.Add(h); return true; }, IntPtr.Zero); return r; }
public static string Texts(uint pid) { var o = new StringBuilder(); foreach (var h in Tops(pid)) { o.Append("{" + T(h) + ":"); EnumChildWindows(h, (k, m) => { if (!IsWindowVisible(k)) return true; var x = T(k).Replace("\r\n", " "); if (x.Length > 0 && x.Length < 90 && !x.StartsWith("Copyright") && !x.StartsWith("Nullsoft")) o.Append(" [" + x + "]"); return true; }, IntPtr.Zero); o.Append("} "); } return o.ToString(); }
public static IntPtr Child(uint pid, string text) { IntPtr r = IntPtr.Zero; foreach (var h in Tops(pid)) { EnumChildWindows(h, (k, m) => { if (IsWindowVisible(k) && T(k).Replace("&", "").StartsWith(text)) { r = k; return false; } return true; }, IntPtr.Zero); if (r != IntPtr.Zero) break; } return r; }
public static IntPtr Top(uint pid) { foreach (var h in Tops(pid)) { if (T(h).StartsWith("Tabiya")) return h; } return IntPtr.Zero; } }
"@

$WM_COMMAND = 0x111; $BM_CLICK = 0xF5; $BM_GETCHECK = 0xF0
function Next($procId) { [void][W]::PostMessage([W]::Top($procId), $WM_COMMAND, [IntPtr]1, [IntPtr]::Zero) }
function Checked($h) { [int][W]::SendMessage($h, $BM_GETCHECK, [IntPtr]::Zero, [IntPtr]::Zero) }

function State($label) {
  L "--- state: $label"
  $u = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Tabiya' -ErrorAction SilentlyContinue
  L ("uninstall entry: version '{0}', publisher '{1}'" -f $u.DisplayVersion, $u.Publisher)
  # The key an upgrade reads the install folder from, named after the publisher
  # (phase 54), and the one every version up to 1.10.11 wrote instead.
  L ("install-folder key HKCU\Software\Nicholas Walker\Tabiya: '{0}'" -f (Get-ItemProperty 'HKCU:\Software\Nicholas Walker\Tabiya' -ErrorAction SilentlyContinue).'(default)')
  L ("old key HKCU\Software\nick\Tabiya exists: {0}" -f (Test-Path 'HKCU:\Software\nick\Tabiya'))
  foreach ($f in "$env:LOCALAPPDATA\Tabiya\tabiya.exe", "$env:LOCALAPPDATA\Tabiya\uninstall.exe") {
    if (Test-Path $f) {
      $s = Get-AuthenticodeSignature $f
      L ("{0}: version {1}, signature {2}, signer '{3}'" -f (Split-Path $f -Leaf), (Get-Item $f).VersionInfo.ProductVersion, $s.Status, $s.SignerCertificate.Subject)
    } else { L "$(Split-Path $f -Leaf): MISSING" }
  }
  $progress = "$env:APPDATA\Tabiya\progress.json"
  if (Test-Path $progress) { $i = Get-Item $progress; L ("progress.json: {0} bytes, saved {1}" -f $i.Length, $i.LastWriteTime) } else { L "progress.json: MISSING" }
}

function WaitFor($procId, $pattern, $seconds) {
  for ($i = 0; $i -lt $seconds * 2; $i++) {
    Start-Sleep -Milliseconds 500
    $t = [W]::Texts($procId)
    if ($t -match $pattern) { return $t }
    if ($t -match 'Unable to uninstall|Error launching') { L "ERROR WINDOW: $t"; return $t }
  }
  L "TIMEOUT waiting for /$pattern/; last: $([W]::Texts($procId))"
  return $null
}

if (-not (Test-Path $SetupPath)) { L "no installer at $SetupPath"; Finish 'stopped' }
State 'before'
if (Get-Process tabiya -ErrorAction SilentlyContinue) { L 'Tabiya is running; close it first'; Finish 'stopped' }

$setup = Start-Process $SetupPath -PassThru
# SmartScreen checks a new signed file before its window opens, which can take
# most of a minute.
$t = WaitFor $setup.Id 'Welcome to Tabiya Setup' 90; L "page: $t"
Next $setup.Id
$t = WaitFor $setup.Id 'Already Installed|Choose Install Location' 20; L "page: $t"

if ($t -match 'Already Installed') {
  $first = if ($t -match 'Uninstall before installing') { 'Uninstall before installing' } else { 'Uninstall Tabiya' }
  $radio = [W]::Child($setup.Id, $first)
  if ($first -eq 'Uninstall Tabiya') { [void][W]::SendMessage($radio, $BM_CLICK, [IntPtr]::Zero, [IntPtr]::Zero) }
  L ("'{0}' chosen: {1}" -f $first, (Checked $radio))
  Next $setup.Id

  $un = $null
  for ($i = 0; $i -lt 30 -and -not $un; $i++) {
    Start-Sleep -Milliseconds 500
    $un = Get-CimInstance Win32_Process -Filter "ParentProcessId=$($setup.Id)" | Where-Object Name -match 'uninstall|^Un' | Select-Object -First 1
  }
  if (-not $un) { L 'no uninstaller started'; L "setup: $([W]::Texts($setup.Id))"; Finish 'failed' }
  L "uninstaller command line: $($un.CommandLine)"
  if ($un.CommandLine -match '_\?=\s*$') { L 'FAULT: the old uninstaller was given no install folder' }
  $t = WaitFor $un.ProcessId 'Remove Tabiya|NSIS Error' 20; L "uninstaller page: $t"
  if ($t -match 'Error launching') { Finish 'failed' }

  $box = [W]::Child($un.ProcessId, 'Delete the application data')
  L ("'Delete the application data' ticked: {0}" -f (Checked $box))
  if ((Checked $box) -ne 0) { L 'the data box is ticked; stopping without uninstalling'; Finish 'stopped' }
  Next $un.ProcessId
  $t = WaitFor $un.ProcessId 'Uninstallation Complete' 30; L "uninstaller page: $t"
  Next $un.ProcessId
  $t = WaitFor $setup.Id 'Choose Install Location' 20; L "page: $t"
  if ($t -notmatch 'Choose Install Location') { Finish 'failed' }
}

Next $setup.Id
$t = WaitFor $setup.Id 'Installation Complete|Completing' 60; L "page: $t"
if ($t -match 'Installation Complete') { Next $setup.Id; $t = WaitFor $setup.Id 'Completing' 20; L "page: $t" }
$run = [W]::Child($setup.Id, 'Run Tabiya')
if ($run -ne [IntPtr]::Zero -and (Checked $run) -eq 1) { [void][W]::SendMessage($run, $BM_CLICK, [IntPtr]::Zero, [IntPtr]::Zero); L ("'Run Tabiya' unticked: {0}" -f ((Checked $run) -eq 0)) }
Next $setup.Id
$setup.WaitForExit(20000) | Out-Null
L "setup exited: $($setup.HasExited), exit code $($setup.ExitCode)"
Start-Sleep 2
foreach ($p in Get-Process tabiya -ErrorAction SilentlyContinue) { L 'closing a Tabiya the installer started'; [void]$p.CloseMainWindow(); Start-Sleep 3 }

State 'after'
$app = Start-Process "$env:LOCALAPPDATA\Tabiya\tabiya.exe" -PassThru
Start-Sleep 6; $app.Refresh()
L "app window: '$($app.MainWindowTitle)'"
[void]$app.CloseMainWindow(); Start-Sleep 3; $app.Refresh()
L "app closed: $($app.HasExited)"
L '=== done'
Finish 'done'
