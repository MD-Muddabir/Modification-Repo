const fs = require('fs');
const file = 'd:/Modification/Version 1.1.5 (Codex)/Modification-Repo/frontend/src/pages/admin/Parents.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add CredentialRow import
content = content.replace('import BulkImportButton from "../../components/BulkImportButton";', 'import BulkImportButton from "../../components/BulkImportButton";\nimport CredentialRow from "../../components/common/CredentialRow";');

// 2. Add state
content = content.replace('const [search, setSearch] = useState("");\r\n    const [saving, setSaving] = useState(false);', 'const [search, setSearch] = useState("");\r\n    const [saving, setSaving] = useState(false);\r\n\r\n    const [selectedParents, setSelectedParents] = useState([]);\r\n    const [showCredentialsModal, setShowCredentialsModal] = useState(false);\r\n    const [credentialsData, setCredentialsData] = useState([]);\r\n    const [loadingCredentials, setLoadingCredentials] = useState(false);');

// 3. Add handlers
content = content.replace('const handleSubmit = async (e) => {', `const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedParents(parents.map(p => p.id));
        else setSelectedParents([]);
    };

    const handleSelectRow = (id) => {
        setSelectedParents(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
    };

    const handleViewCredentials = async () => {
        if (selectedParents.length === 0) return;
        setLoadingCredentials(true);
        try {
            const res = await api.post('/parents/credentials', { parent_ids: selectedParents });
            if (res.data.success) {
                setCredentialsData(res.data.data);
                setShowCredentialsModal(true);
            }
        } catch (err) {
            console.error('Error fetching credentials:', err);
            alert('Failed to fetch credentials');
        } finally {
            setLoadingCredentials(false);
        }
    };

    const handleViewSingleCredentials = async (parentId) => {
        setLoadingCredentials(true);
        try {
            const res = await api.post('/parents/credentials', { parent_ids: [parentId] });
            if (res.data.success) {
                setCredentialsData(res.data.data);
                setShowCredentialsModal(true);
            }
        } catch (err) {
            console.error('Error fetching credentials:', err);
            alert('Failed to fetch credentials');
        } finally {
            setLoadingCredentials(false);
        }
    };

    const handleSubmit = async (e) => {`);

// 4. Update create success to show password
content = content.replace('await api.post("/parents", formData);\r\n                alert("Parent added successfully");', `const res = await api.post("/parents", formData);
                if (res.data.showPasswordOnScreen) {
                    setCredentialsData([{
                        id: res.data.data.id,
                        identifier: res.data.data.phone || 'Parent',
                        name: res.data.data.name,
                        email: res.data.data.email || 'N/A',
                        password: res.data.initial_password
                    }]);
                    setShowCredentialsModal(true);
                } else {
                    alert("Parent added successfully");
                }`);

// 5. Update header
content = content.replace('<div className="card-header">\r\n                    <h3 className="card-title">All Parents ({parents.length})</h3>', `<div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 className="card-title" style={{ margin: 0 }}>All Parents ({parents.length})</h3>
                    {selectedParents.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                className="btn btn-sm" 
                                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontWeight: 600, border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                onClick={handleViewCredentials}
                                disabled={loadingCredentials}
                            >
                                {loadingCredentials ? '⏳ Loading...' : \`🔑 View \${selectedParents.length} Credentials\`}
                            </button>
                        </div>
                    )}`);

// 6. Update table headers
content = content.replace('<tr>\r\n                                <th>#</th>', `<tr>
                                <th style={{ width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedParents.length === parents.length && parents.length > 0} 
                                        onChange={handleSelectAll} 
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                </th>`);

// 7. Update table rows
content = content.replace(/<tr>\r\n\s*<td>\{idx \+ 1\}<\/td>/g, `<tr>
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedParents.includes(parent.id)} 
                                                onChange={() => handleSelectRow(parent.id)}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                        </td>`);

// 8. Update actions
content = content.replace(/<div style=\{\{ display: "flex", gap: "0\.5rem" \}\}>\r\n\s*<button\r\n\s*className="btn btn-sm btn-primary"\r\n\s*onClick=\{\(\) => handleEdit\(parent\)\}\r\n\s*>/g, `<div style={{ display: "flex", gap: "0.5rem" }}>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600 }}
                                                    onClick={() => handleViewSingleCredentials(parent.id)}
                                                >
                                                    🔑 Keys
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleEdit(parent)}
                                                >`);

// 9. Add modal
const modal = `            {showCredentialsModal && (
                <div className="modal-overlay" onClick={() => setShowCredentialsModal(false)} style={{ zIndex: 9999 }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%' }}>
                        <div className="modal-header" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px 12px 0 0' }}>
                            <div>
                                <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span style={{ fontSize: '1.4rem' }}>🔑</span>
                                    Parent Credentials
                                </h3>
                                <p style={{ margin: '0.2rem 0 0 0', opacity: 0.9, fontSize: '0.85rem' }}>
                                    Manage initial passwords for parents
                                </p>
                            </div>
                            <button onClick={() => setShowCredentialsModal(false)} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>×</button>
                        </div>
                        
                        <div className="modal-body" style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-color, #e5e7eb)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                        <tr>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Phone</th>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Name</th>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Email</th>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Password</th>
                                            <th style={{ padding: '0.8rem 1rem', color: '#475569', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {credentialsData.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary, #6b7280)' }}>
                                                    No credentials to display
                                                </td>
                                            </tr>
                                        ) : (
                                            credentialsData.map((c, idx) => (
                                                <CredentialRow
                                                    key={c.id}
                                                    credential={c}
                                                    identifier={c.identifier}
                                                    isEven={idx % 2 === 0}
                                                    onReset={async (parentId) => {
                                                        try {
                                                            const res = await api.post(\`/parents/\${parentId}/resend-credentials\`);
                                                            if (res.data.success && res.data.initial_password) {
                                                                setCredentialsData(prev => prev.map(x =>
                                                                    x.id === parentId
                                                                        ? { ...x, password: res.data.initial_password, status: 'generated' }
                                                                        : x
                                                                ));
                                                            } else {
                                                                alert('Password reset successfully!');
                                                            }
                                                        } catch (err) {
                                                            const msg = err.response?.data?.message || 'Failed to reset password';
                                                            alert(msg);
                                                        }
                                                    }}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #fef9c3, #fef3c7)', borderRadius: '10px', border: '1px solid #fcd34d', color: '#92400e', fontSize: '0.84rem', lineHeight: '1.5', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
                                <span>
                                    <strong>Security Note:</strong> Initial passwords are visible only until the parent logs in and changes their password.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}`;

content = content.replace(/        <\/div>\r\n    \);\r\n}/, modal);

fs.writeFileSync(file, content);
