$base = (Get-Location).Path

# ------------- STUDENTS.JSX -------------
$studFile = "$base\frontend\src\pages\admin\Students.jsx"
$studContent = [System.IO.File]::ReadAllText($studFile)

# 1. Import
$studImportTarget = 'import { savePdfNative } from "../../utils/capacitorPermissions";'
$studImportNew = 'import { savePdfNative } from "../../utils/capacitorPermissions";' + "`r`n" + 'import BulkImportButton from "../../components/BulkImportButton";'
if (-not $studContent.Contains('import BulkImportButton')) {
    $studContent = $studContent.Replace($studImportTarget, $studImportNew)
}

# 2. Handler
$studHandlerTarget = 'const handleChange = (e) => {'
$studHandlerNew = 'const handleBulkSuccess = (result) => {' + "`r`n" +
'        fetchStudents();' + "`r`n" +
'        alert(`✅ ${result.inserted} student(s) imported successfully!${result.failed > 0 ? ` (${result.failed} rows had errors — check the report)` : ''}`);' + "`r`n" +
'    };' + "`r`n`r`n" +
'    const handleChange = (e) => {'
if (-not $studContent.Contains('const handleBulkSuccess')) {
    $studContent = $studContent.Replace($studHandlerTarget, $studHandlerNew)
}

# 3. Button
$studBtnTarget = '+ Add Student'
$studBtnNew = '</button>' + "`r`n" +
'                            <BulkImportButton type="students" onSuccess={handleBulkSuccess} />' + "`r`n" +
'                            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">' + "`r`n" +
'                                + Add Student'
if (-not $studContent.Contains('<BulkImportButton')) {
    # Only replace the first occurrence of "+ Add Student"
    $idx = $studContent.IndexOf($studBtnTarget)
    if ($idx -ge 0) {
        $studContent = $studContent.Substring(0, $idx) + $studBtnNew + $studContent.Substring($idx + $studBtnTarget.Length)
    }
}

[System.IO.File]::WriteAllText($studFile, $studContent)


# ------------- FACULTY.JSX -------------
$facFile = "$base\frontend\src\pages\admin\Faculty.jsx"
$facContent = [System.IO.File]::ReadAllText($facFile)

# 1. Import
$facImportTarget = 'import { savePdfNative } from "../../utils/capacitorPermissions";'
$facImportNew = 'import { savePdfNative } from "../../utils/capacitorPermissions";' + "`r`n" + 'import BulkImportButton from "../../components/BulkImportButton";'
if (-not $facContent.Contains('import BulkImportButton')) {
    $facContent = $facContent.Replace($facImportTarget, $facImportNew)
}

# 2. Handler
$facHandlerTarget = 'const filteredFaculty = faculty.filter('
$facHandlerNew = 'const handleBulkSuccess = (result) => {' + "`r`n" +
'        fetchFaculty();' + "`r`n" +
'        alert(`✅ ${result.inserted} faculty member(s) imported successfully!${result.failed > 0 ? ` (${result.failed} rows had errors)` : ''}`);' + "`r`n" +
'    };' + "`r`n`r`n" +
'    const filteredFaculty = faculty.filter('
if (-not $facContent.Contains('const handleBulkSuccess')) {
    $facContent = $facContent.Replace($facHandlerTarget, $facHandlerNew)
}

# 3. Button
$facBtnTarget = '+ Add Faculty'
$facBtnNew = '</button>' + "`r`n" +
'                            <BulkImportButton type="faculty" onSuccess={handleBulkSuccess} />' + "`r`n" +
'                            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary btn-animated">' + "`r`n" +
'                                + Add Faculty'
if (-not $facContent.Contains('<BulkImportButton')) {
    # Only replace the first occurrence of "+ Add Faculty"
    $idx = $facContent.IndexOf($facBtnTarget)
    if ($idx -ge 0) {
        $facContent = $facContent.Substring(0, $idx) + $facBtnNew + $facContent.Substring($idx + $facBtnTarget.Length)
    }
}

[System.IO.File]::WriteAllText($facFile, $facContent)
Write-Host "Done patching."
