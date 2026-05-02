$file = "app.js"
$content = Get-Content $file -Raw

$oldText = "try { await sequelize.query(``ALTER TABLE institutes ADD COLUMN has_used_trial BOOLEAN DEFAULT false;``); } catch (e) { }"

$addition = @"

    // ── Bulk Import Logs Table (bulk.md Phase 1) ─────────────────────────────
    try {
      await sequelize.query(``
        CREATE TABLE IF NOT EXISTS bulk_import_logs (
          id           SERIAL PRIMARY KEY,
          institute_id INT NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
          import_type  VARCHAR(20) NOT NULL,
          imported_by  INT NOT NULL REFERENCES users(id),
          total_rows   INT DEFAULT 0,
          success_rows INT DEFAULT 0,
          failed_rows  INT DEFAULT 0,
          error_report JSONB,
          status       VARCHAR(20) DEFAULT 'completed',
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      ``);
    } catch (e) { /* table already exists */ }
    try { await sequelize.query(``CREATE INDEX IF NOT EXISTS idx_bulk_logs_institute ON bulk_import_logs(institute_id, created_at DESC);``); } catch (e) { }
    console.log('✅ bulk_import_logs table ensured');
"@

$newText = $oldText + $addition
$content = $content.Replace($oldText, $newText)
[System.IO.File]::WriteAllText((Resolve-Path $file).Path, $content)
Write-Host "Done"
