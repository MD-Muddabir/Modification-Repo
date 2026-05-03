# patch_parents.ps1
# Adds BulkImportButton to Parents.jsx page

$file = "frontend/src/pages/admin/Parents.jsx"
$content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path)

# 1. Add import at the top (after existing imports)
$oldImport = 'import "./Dashboard.css";'
$newImport = 'import "./Dashboard.css";' + "`r`nimport BulkImportButton from `"../../components/BulkImportButton`";"
$content = $content.Replace($oldImport, $newImport)

# 2. Add handleBulkSuccess handler (after handleStudentChange function)
$oldHandler = '    if (loading) {'
$newHandler = @'
    const handleBulkSuccess = (result) => {
        // Re-fetch the parent list to show newly imported parents
        fetchParents();
        alert(`✅ ${result.inserted} parent(s) imported and linked to students successfully!${result.failed > 0 ? ` (${result.failed} rows had errors)` : ''}`);
    };

    if (loading) {
'@
$content = $content.Replace($oldHandler, $newHandler)

# 3. Add BulkImportButton next to "+ Add Parent" button
$oldBtn = '                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                    >
                        + Add Parent
                    </button>'
$newBtn = '                    <BulkImportButton type="parents" onSuccess={handleBulkSuccess} />
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                    >
                        + Add Parent
                    </button>'
$content = $content.Replace($oldBtn, $newBtn)

[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content)
Write-Host "Parents.jsx patched successfully"
