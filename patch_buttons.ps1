# patch_buttons.ps1
# Injects BulkImportButton into the canCreate block in all 3 pages

function Patch-Page {
    param($file, $oldCanCreate, $newCanCreate)
    $content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path)
    if ($content.Contains('<BulkImportButton')) {
        Write-Host "$file already patched - skipping"
        return
    }
    $result = $content.Replace($oldCanCreate, $newCanCreate)
    if ($result -eq $content) {
        Write-Host "WARNING: could not find target in $file"
    } else {
        [System.IO.File]::WriteAllText((Resolve-Path $file).Path, $result)
        Write-Host "$file patched OK"
    }
}

# ── Students.jsx ─────────────────────────────────────────────────────────────
$studFile = "frontend/src/pages/admin/Students.jsx"
$studOld = '{canCreate && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn btn-primary"
                        >
                            + Add Student
                        </button>
                    )}'
$studNew = '{canCreate && (
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
Patch-Page $studFile $studOld $studNew

# ── Parents.jsx ──────────────────────────────────────────────────────────────
$parentFile = "frontend/src/pages/admin/Parents.jsx"
$parentOld = '<button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                    >
                        + Add Parent
                    </button>'
$parentNew = '<BulkImportButton type="parents" onSuccess={handleBulkSuccess} />
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn btn-primary"
                    >
                        + Add Parent
                    </button>'
Patch-Page $parentFile $parentOld $parentNew

# ── Faculty.jsx ──────────────────────────────────────────────────────────────
$facFile = "frontend/src/pages/admin/Faculty.jsx"
$facOld = '{canCreate && (
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn btn-primary btn-animated"
                        >
                            + Add Faculty
                        </button>
                    )}'
$facNew = '{canCreate && (
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
Patch-Page $facFile $facOld $facNew
