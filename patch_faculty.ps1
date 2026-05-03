# patch_faculty.ps1
# Adds BulkImportButton to Faculty.jsx page

$file = "frontend/src/pages/admin/Faculty.jsx"
$content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path)

# 1. Add import at the top (after existing imports)
$oldImport = 'import { savePdfNative } from "../../utils/capacitorPermissions";'
$newImport = $oldImport + "`r`nimport BulkImportButton from `"../../components/BulkImportButton`";"
$content = $content.Replace($oldImport, $newImport)

# 2. Add handleBulkSuccess handler (before the filteredFaculty declaration)
$oldHandler = '    const filteredFaculty = faculty.filter('
$newHandler = @'
    const handleBulkSuccess = (result) => {
        // Re-fetch the faculty list to show newly imported faculty
        fetchFaculty();
        alert(`✅ ${result.inserted} faculty member(s) imported successfully!${result.failed > 0 ? ` (${result.failed} rows had errors)` : ''}`);
    };

    const filteredFaculty = faculty.filter(
'@
$content = $content.Replace($oldHandler, $newHandler)

# 3. Add BulkImportButton next to "+ Add Faculty" button
$oldBtn = '                    {canCreate && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn btn-primary btn-animated"
                        >
                            + Add Faculty
                        </button>
                    )}'
$newBtn = '                    {canCreate && (
                        <>
                            <BulkImportButton type="faculty" onSuccess={handleBulkSuccess} />
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="btn btn-primary btn-animated"
                            >
                                + Add Faculty
                            </button>
                        </>
                    )}'
$content = $content.Replace($oldBtn, $newBtn)

[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content)
Write-Host "Faculty.jsx patched successfully"
