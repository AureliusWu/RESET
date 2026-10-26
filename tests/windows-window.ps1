param([ValidateSet('resize','maximize','minimize','restore','focus','defocus')][string]$Action, [int]$Width=1024, [int]$Height=768)
$ErrorActionPreference='Stop'
Add-Type @'
using System;
using System.Runtime.InteropServices;
public struct ResetRect { public int Left,Top,Right,Bottom; }
public static class ResetWindow {
 [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
 [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int height, uint flags);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out ResetRect rect);
 [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr h);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
}
'@
$Process=Get-Process VNEngine | Where-Object {$_.MainWindowHandle -ne 0} | Select-Object -First 1
if(-not $Process){throw 'RESET native window is missing'}
$Handle=$Process.MainWindowHandle
switch($Action){
 'resize' {[ResetWindow]::ShowWindow($Handle,9)|Out-Null;[ResetWindow]::SetWindowPos($Handle,[IntPtr]::Zero,0,0,$Width,$Height,0x0040)|Out-Null}
 'maximize' {[ResetWindow]::ShowWindow($Handle,3)|Out-Null}
 'minimize' {[ResetWindow]::ShowWindow($Handle,6)|Out-Null}
 'restore' {[ResetWindow]::ShowWindow($Handle,9)|Out-Null;[ResetWindow]::SetForegroundWindow($Handle)|Out-Null}
 'focus' {$Shell=New-Object -ComObject WScript.Shell;[void]$Shell.AppActivate($Process.Id);[ResetWindow]::SetForegroundWindow($Handle)|Out-Null}
 'defocus' {
   Add-Type -AssemblyName System.Windows.Forms
   $Form=New-Object System.Windows.Forms.Form
   $Form.Text='RESET QA focus probe';$Form.TopMost=$true;$Form.Show();$Form.Activate()
   [System.Windows.Forms.Application]::DoEvents();Start-Sleep -Milliseconds 500;$Form.Close();$Form.Dispose()
 }
}
Start-Sleep -Milliseconds 350
$Rect=New-Object ResetRect;[ResetWindow]::GetWindowRect($Handle,[ref]$Rect)|Out-Null
@{action=$Action;width=$Rect.Right-$Rect.Left;height=$Rect.Bottom-$Rect.Top;minimized=[ResetWindow]::IsIconic($Handle);maximized=[ResetWindow]::IsZoomed($Handle)}|ConvertTo-Json -Compress
