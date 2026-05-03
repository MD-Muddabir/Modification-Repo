# patch_students.ps1
# Adds BulkImportButton to Students.jsx page

$file = "frontend/src/pages/admin/Students.jsx"
$content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path)

# 1. Add import at the top (after existing imports)
$oldImport = 'import { savePdfNative } from "../../utils/capacitorPermissions";'
$newImport = $oldImport + "`r`nimport BulkImportButton from `"../../components/BulkImportButton`";"
$content = $content.Replace($oldImport, $newImport)

# 2. Add handleBulkSuccess handler (after resetForm function)
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

# 3. Add BulkImportButton next to "+ Add Student" button
$oldBtn = '                    {canCreate && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn btn-primary"
                        >
                            + Add Student
                        </button>
                    )}'
$newBtn = '                    {canCreate && (
                        <>
                            <BulkImportButton type="students" onSuccess={handleBulkSuccess} />
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="btn btn-primary"
                            >
                                + Add Student
                            </button>
                        </>
                    )}'
$content = $content.Replace($oldBtn, $newBtn)

[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content)
Write-Host "Students.jsx patched successfully"
