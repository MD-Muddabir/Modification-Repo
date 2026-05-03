# patch_missing_buttons.ps1
# Specifically patch Students.jsx (needs everything) and Faculty.jsx (needs button)

$base = (Get-Location).Path

function Patch-Students {
    $file = "$base\frontend\src\pages\admin\Students.jsx"
    $content = [System.IO.File]::ReadAllText($file)
    
    # 1. Add import
    if (-not $content.Contains('import BulkImportButton')) {
        $content = $content.Replace(
            'import { savePdfNative } from "../../utils/capacitorPermissions";',
            "import { savePdfNative } from `"../../utils/capacitorPermissions`";`r`nimport BulkImportButton from `"../../components/BulkImportButton`";"
        )
    }
    
    # 2. Add handleBulkSuccess
    if (-not $content.Contains('const handleBulkSuccess')) {
        $oldHandler = 'const handleChange = (e) => {'
        $newHandler = @'
const handleBulkSuccess = (result) => {
        // Re-fetch the student list to show newly imported students
        fetchStudents();
        alert(`✅ ${result.inserted} student(s) imported successfully!${result.failed > 0 ? ` (${result.failed} rows had errors — check the report)` : ''}`);
    };

    const handleChange = (e) => {
'@
        $content = $content.Replace($oldHandler, $newHandler)
    }
    
    # 3. Add button
    $targetBlock = @'
                    {canCreate && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn btn-primary"
                        >
                            + Add Student
                        </button>
                    )}
'@
    $newBlock = @'
                    {canCreate && (
                        <>
                            <BulkImportButton type="students" onSuccess={handleBulkSuccess} />
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="btn btn-primary"
                            >
                                + Add Student
                            </button>
                        </>
                    )}
'@
    # Normalize line endings just in case
    $targetBlockRegex = $targetBlock -replace '\r\n', '\r?\n'
    $content = [regex]::Replace($content, $targetBlockRegex, $newBlock)
    
    [System.IO.File]::WriteAllText($file, $content)
    Write-Host "Students.jsx patched"
}

function Patch-Faculty {
    $file = "$base\frontend\src\pages\admin\Faculty.jsx"
    $content = [System.IO.File]::ReadAllText($file)
    
    $targetBlock = @'
                    {canCreate && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn btn-primary btn-animated"
                        >
                            + Add Faculty
                        </button>
                    )}
'@
    $newBlock = @'
                    {canCreate && (
                        <>
                            <BulkImportButton type="faculty" onSuccess={handleBulkSuccess} />
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="btn btn-primary btn-animated"
                            >
                                + Add Faculty
                            </button>
                        </>
                    )}
'@
    
    $targetBlockRegex = $targetBlock -replace '\r\n', '\r?\n'
    $content = [regex]::Replace($content, $targetBlockRegex, $newBlock)
    
    [System.IO.File]::WriteAllText($file, $content)
    Write-Host "Faculty.jsx patched"
}

Patch-Students
Patch-Faculty
