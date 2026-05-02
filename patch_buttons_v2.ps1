# patch_buttons_v2.ps1
# Uses regex to find the canCreate button block and inject BulkImportButton

function Inject-BulkButton {
    param($filePath, $type, $addBtnLabel, $addBtnClass)
    
    $content = [System.IO.File]::ReadAllText($filePath)
    
    if ($content.Contains('<BulkImportButton')) {
        Write-Host "$filePath - already has BulkImportButton, skipping"
        return
    }
    
    # Use regex to find and replace the block
    # Pattern matches: {canCreate && ( ... <button ... > ... $addBtnLabel ... </button> ... )}
    $pattern = '\{canCreate \&\& \(\s*<button([^>]*)>\s*' + [regex]::Escape($addBtnLabel) + '\s*</button>\s*\)\}'
    
    $match = [regex]::Match($content, $pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    if (!$match.Success) {
        Write-Host "WARNING: Pattern not matched in $filePath"
        # Fallback: use simpler search
        return
    }
    
    $oldBlock = $match.Value
    # Preserve indentation from original button
    $btnAttrs = $match.Groups[1].Value
    
    $newBlock = "{canCreate && (
                        <>
                            <BulkImportButton type=""$type"" onSuccess={handleBulkSuccess} />
                            <button$($btnAttrs)>
                                $addBtnLabel
                            </button>
                        </>
                    )}"
    
    $content = $content.Replace($oldBlock, $newBlock)
    [System.IO.File]::WriteAllText($filePath, $content)
    Write-Host "$filePath patched OK"
}

$base = (Get-Location).Path

Inject-BulkButton "$base\frontend\src\pages\admin\Students.jsx" "students" "+ Add Student" "btn btn-primary"
Inject-BulkButton "$base\frontend\src\pages\admin\Faculty.jsx" "faculty" "+ Add Faculty" "btn btn-primary btn-animated"

# Parents is different - no canCreate wrapper
$parentPath = "$base\frontend\src\pages\admin\Parents.jsx"
$parentContent = [System.IO.File]::ReadAllText($parentPath)
if (-not $parentContent.Contains('<BulkImportButton')) {
    # For Parents.jsx the button is not wrapped in canCreate
    $pattern2 = '<button\s+onClick=\{[^}]*resetForm[^}]*setShowModal[^}]*\}\}[^>]*>\s*\+\s*Add Parent\s*</button>'
    $match2 = [regex]::Match($parentContent, $pattern2, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    if ($match2.Success) {
        $oldBtn = $match2.Value
        $newBtn = '<BulkImportButton type="parents" onSuccess={handleBulkSuccess} />
                    ' + $oldBtn
        $parentContent = $parentContent.Replace($oldBtn, $newBtn)
        [System.IO.File]::WriteAllText($parentPath, $parentContent)
        Write-Host "Parents.jsx patched OK"
    } else {
        Write-Host "WARNING: Add Parent button not found via regex"
    }
}
