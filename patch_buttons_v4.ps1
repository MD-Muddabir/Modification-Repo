# patch_buttons_v4.ps1
# Simple line insertion approach - insert BulkImportButton line BEFORE the canCreate button

function Insert-BulkButton {
    param($filePath, $type, $addBtnText)
    
    $lines = Get-Content $filePath
    
    if (($lines | Where-Object { $_ -match 'BulkImportButton' }).Count -gt 0) {
        Write-Host "$filePath already patched"
        return
    }
    
    # Find the line that contains "+ Add Student" / "+ Add Faculty"
    $targetIdx = $null
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match [regex]::Escape($addBtnText)) {
            $targetIdx = $i
            break
        }
    }
    
    if ($null -eq $targetIdx) {
        Write-Host "WARNING: '$addBtnText' not found in $filePath"
        return
    }
    
    # Walk backward to find the <button line
    $btnLineIdx = $null
    for ($i = $targetIdx; $i -ge 0; $i--) {
        if ($lines[$i] -match '^\s*<button') {
            $btnLineIdx = $i
            break
        }
    }
    
    if ($null -eq $btnLineIdx) {
        Write-Host "WARNING: <button not found before '$addBtnText' in $filePath"
        return
    }
    
    # Walk backward more to find the {canCreate line
    $canCreateIdx = $null
    for ($i = $btnLineIdx; $i -ge 0; $i--) {
        if ($lines[$i] -match 'canCreate') {
            $canCreateIdx = $i
            break
        }
    }
    
    # Get indent from the {canCreate line
    $indent = ($lines[$canCreateIdx] -replace '\{canCreate.*', '')
    
    # Build new lines to insert before the {canCreate block
    $newLines = @(
        "${indent}<>"
        "${indent}    <BulkImportButton type=""$type"" onSuccess={handleBulkSuccess} />"
    )
    
    # Find the closing )} of the canCreate block (find the first )} after btnLineIdx)
    $closeIdx = $null
    for ($i = $targetIdx; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\s*\)\}') {
            $closeIdx = $i
            break
        }
    }
    
    if ($null -eq $closeIdx) {
        Write-Host "WARNING: closing )} not found in $filePath"
        return
    }
    
    # Rebuild the array: insert <> before canCreate line, add </> after closing )}
    $result = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($i -eq $canCreateIdx) {
            # Add the fragment wrapper before
            $result.Add("${indent}<>")
            $result.Add("${indent}    <BulkImportButton type=""$type"" onSuccess={handleBulkSuccess} />")
            $result.Add($lines[$i])
        } elseif ($i -eq $closeIdx) {
            $result.Add($lines[$i])
            $result.Add("${indent}</>")
        } else {
            $result.Add($lines[$i])
        }
    }
    
    $output = $result -join "`r`n"
    [System.IO.File]::WriteAllText((Resolve-Path $filePath).Path, $output)
    Write-Host "$filePath patched OK"
}

$base = (Get-Location).Path

Insert-BulkButton "$base\frontend\src\pages\admin\Students.jsx" "students" "+ Add Student"
Insert-BulkButton "$base\frontend\src\pages\admin\Faculty.jsx" "faculty" "+ Add Faculty"
