# patch_buttons_v3.ps1
# Line-based approach to inject BulkImportButton button blocks

function Patch-LineRange {
    param($filePath, $startLineNum, $endLineNum, $newLines)
    
    $lines = Get-Content $filePath
    
    if (($lines | Where-Object { $_ -match 'BulkImportButton' }).Count -gt 0) {
        Write-Host "$filePath already patched"
        return
    }
    
    $before = $lines[0..($startLineNum-2)]   # 0-indexed, before the block
    $after  = $lines[$endLineNum..]           # after the block (inclusive of end)
    
    $combined = ($before + $newLines + $after) -join "`r`n"
    [System.IO.File]::WriteAllText($filePath, $combined)
    Write-Host "$filePath patched OK"
}

$base = (Get-Location).Path

# ── Students.jsx: lines 515-522 (1-indexed) = the canCreate block ─────────────
$studPath = "$base\frontend\src\pages\admin\Students.jsx"
$studNew = @(
    '                    {canCreate && (',
    '                        <>',
    '                            <BulkImportButton type="students" onSuccess={handleBulkSuccess} />',
    '                            <button',
    '                                onClick={() => { resetForm(); setShowModal(true); }}',
    '                                className="btn btn-primary"',
    '                            >',
    '                                + Add Student',
    '                            </button>',
    '                        </>',
    '                    )}'
)
Patch-LineRange $studPath 515 522 $studNew

# ── Faculty.jsx: find the canCreate block with btn-animated ───────────────────
$facPath = "$base\frontend\src\pages\admin\Faculty.jsx"
$facLines = Get-Content $facPath
$facStartLine = ($facLines | Select-String 'canCreate && \(' | Select-Object -First 1).LineNumber
if ($facStartLine) {
    # Find ending })  after this
    $endLine = $facStartLine + 7   # approx 8 lines for this block
    $facNew = @(
        '                    {canCreate && (',
        '                        <>',
        '                            <BulkImportButton type="faculty" onSuccess={handleBulkSuccess} />',
        '                            <button',
        '                                onClick={() => { resetForm(); setShowModal(true); }}',
        '                                className="btn btn-primary btn-animated"',
        '                            >',
        '                                + Add Faculty',
        '                            </button>',
        '                        </>',
        '                    )}'
    )
    Patch-LineRange $facPath $facStartLine ($facStartLine + 7) $facNew
} else {
    Write-Host "WARNING: canCreate block not found in Faculty.jsx"
}
