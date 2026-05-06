import { useState, useEffect, useCallback } from 'react';
import RemoteServerForm from '../../components/server/remoteServerForm';
import {
    remoteServerService,
    RemoteServer,
    ExtractionSummary,
} from '../../services/remoteServerService';
import './ServerConfigPage.css';

function ServerConfigPage() {
    const [servers, setServers] = useState<RemoteServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState<Record<number, { type: 'ok' | 'err'; text: string }>>({});
    const [pulling, setPulling] = useState<number | null>(null);
    const [testing, setTesting] = useState<number | null>(null);

    // Password prompt state
    const [passwordModal, setPasswordModal] = useState<{
        serverId: number;
        serverName: string;
        action: 'pull' | 'test';
    } | null>(null);
    const [modalPassword, setModalPassword] = useState('');

    // Extraction summary state
    const [extractionSummary, setExtractionSummary] = useState<{
        serverName: string;
        summary: ExtractionSummary;
    } | null>(null);

    const loadServers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await remoteServerService.list();
            setServers(data);
        } catch {
            setServers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadServers();
    }, [loadServers]);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Supprimer ce serveur distant ?')) return;
        try {
            await remoteServerService.delete(id);
            loadServers();
        } catch {
            // ignore
        }
    };

    // Check if a server needs a password prompt
    const needsPassword = (srv: RemoteServer) => srv.auth_method === 'password';

    const handleTestConnection = async (id: number, password?: string) => {
        setTesting(id);
        setActionMsg((prev) => ({ ...prev, [id]: { type: 'ok', text: 'Test en cours…' } }));
        try {
            const result = await remoteServerService.testConnection(id, password);
            if (result.status === 'success') {
                const dirInfo = result.directory_exists
                    ? ` — ${result.directory_contents?.length ?? 0} éléments trouvés`
                    : ' — répertoire introuvable';
                setActionMsg((prev) => ({
                    ...prev,
                    [id]: { type: 'ok', text: `Connexion OK${dirInfo}` },
                }));
            } else {
                setActionMsg((prev) => ({
                    ...prev,
                    [id]: { type: 'err', text: result.message },
                }));
            }
        } catch (e: any) {
            setActionMsg((prev) => ({
                ...prev,
                [id]: { type: 'err', text: e.message || 'Échec du test' },
            }));
        } finally {
            setTesting(null);
        }
    };

    const handlePull = async (id: number, password?: string) => {
        setPulling(id);
        setActionMsg((prev) => ({ ...prev, [id]: { type: 'ok', text: 'Pull + extraction en cours… (cela peut prendre quelques minutes)' } }));
        try {
            const result = await remoteServerService.pull(id, {
                run_extraction: true,
                ssh_password: password || null,
            });
            setActionMsg((prev) => ({
                ...prev,
                [id]: {
                    type: 'ok',
                    text: result.extraction_ran
                        ? 'Pull et extraction terminés avec succès'
                        : result.message,
                },
            }));
            loadServers();

            // Show extraction summary if available
            if (result.extraction_ran && result.extraction_summary) {
                const srv = servers.find((s) => s.id === id);
                setExtractionSummary({
                    serverName: srv?.name || result.server_name,
                    summary: result.extraction_summary,
                });
            }
        } catch (e: any) {
            setActionMsg((prev) => ({
                ...prev,
                [id]: { type: 'err', text: e.message || 'Échec du pull' },
            }));
        } finally {
            setPulling(null);
        }
    };

    // Handle action that might need password
    const handleAction = (srv: RemoteServer, action: 'pull' | 'test') => {
        if (needsPassword(srv)) {
            setPasswordModal({ serverId: srv.id, serverName: srv.name, action });
            setModalPassword('');
        } else {
            if (action === 'pull') {
                handlePull(srv.id);
            } else {
                handleTestConnection(srv.id);
            }
        }
    };

    const handlePasswordSubmit = () => {
        if (!passwordModal || !modalPassword) return;
        const { serverId, action } = passwordModal;
        setPasswordModal(null);

        if (action === 'pull') {
            handlePull(serverId, modalPassword);
        } else {
            handleTestConnection(serverId, modalPassword);
        }
        setModalPassword('');
    };

    const handlePasswordCancel = () => {
        setPasswordModal(null);
        setModalPassword('');
    };

    const formatDate = (iso: string | null) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="server-config-page">
            <div className="page-header">
                <h2>Serveurs distants</h2>
                <p>
                    Enregistrez les serveurs CFT distants (connexion SSH) pour récupérer les
                    exports CFTUTIL et lancer l'extraction automatique vers la base de données.
                </p>
            </div>

            <div className="page-content">
                <RemoteServerForm onServerAdded={loadServers} />

                {/* ── Extraction Summary Modal ──────────────────────── */}
                {extractionSummary && (
                    <div className="extraction-overlay" onClick={() => setExtractionSummary(null)}>
                        <div className="extraction-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="extraction-modal-header">
                                <h3>Résultat de l'extraction — {extractionSummary.serverName}</h3>
                                <button
                                    type="button"
                                    className="close-btn"
                                    onClick={() => setExtractionSummary(null)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="extraction-modal-body">
                                <p className="extraction-subtitle">
                                    Les configurations CFT ont été extraites et chargées dans la base de données.
                                </p>
                                <div className="summary-grid">
                                    {[
                                        { label: 'Serveurs', key: 'server' },
                                        { label: 'Partenaires', key: 'partner' },
                                        { label: 'Flux (SEND/RECV)', key: 'flow' },
                                        { label: 'CFTTCP', key: 'cfttcp' },
                                        { label: 'CFTPROT', key: 'cftprot' },
                                        { label: 'CFTSSL', key: 'cftssl' },
                                        { label: 'Exit Scripts', key: 'processing' },
                                        { label: 'Routes Bosco', key: 'bosco_route' },
                                        { label: 'Activité Copilot', key: 'copilot_activity' },
                                        { label: 'Migrations', key: 'migration' },
                                    ].map(({ label, key }) => (
                                        <div key={key} className="summary-item">
                                            <span className="summary-count">
                                                {(extractionSummary.summary as any)[key] ?? 0}
                                            </span>
                                            <span className="summary-label">{label}</span>
                                        </div>
                                    ))}
                                </div>

                                {extractionSummary.summary.migration_complexity &&
                                    Object.keys(extractionSummary.summary.migration_complexity).length > 0 && (
                                        <div className="complexity-section">
                                            <h4>Complexité des migrations</h4>
                                            <div className="complexity-bars">
                                                {Object.entries(extractionSummary.summary.migration_complexity).map(
                                                    ([level, count]) => (
                                                        <div key={level} className={`complexity-bar complexity-${level}`}>
                                                            <span className="complexity-level">{level.toUpperCase()}</span>
                                                            <span className="complexity-count">{count}</span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    )}

                                {extractionSummary.summary.dormant_partners &&
                                    extractionSummary.summary.dormant_partners.length > 0 && (
                                        <div className="dormant-section">
                                            <h4>
                                                Partenaires dormants ({extractionSummary.summary.dormant_partners.length})
                                            </h4>
                                            <div className="dormant-list">
                                                {extractionSummary.summary.dormant_partners.map((name) => (
                                                    <span key={name} className="dormant-tag">{name}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                            </div>
                            <div className="extraction-modal-footer">
                                <button
                                    type="button"
                                    className="action-btn action-btn--primary"
                                    onClick={() => setExtractionSummary(null)}
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Password Modal ───────────────────────────────── */}
                {passwordModal && (
                    <div className="extraction-overlay" onClick={handlePasswordCancel}>
                        <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>Mot de passe SSH</h3>
                            <p>
                                Entrez le mot de passe SSH pour{' '}
                                <strong>{passwordModal.serverName}</strong>
                            </p>
                            <div className="form-field">
                                <input
                                    type="password"
                                    value={modalPassword}
                                    onChange={(e) => setModalPassword(e.target.value)}
                                    placeholder="Mot de passe SSH"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && modalPassword) handlePasswordSubmit();
                                        if (e.key === 'Escape') handlePasswordCancel();
                                    }}
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="action-btn action-btn--secondary"
                                    onClick={handlePasswordCancel}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    className="action-btn action-btn--primary"
                                    onClick={handlePasswordSubmit}
                                    disabled={!modalPassword}
                                >
                                    {passwordModal.action === 'pull' ? 'Lancer le Pull' : 'Tester'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="server-list">
                    <h3>Serveurs enregistrés</h3>
                    {loading ? (
                        <p className="loading-text">Chargement…</p>
                    ) : servers.length === 0 ? (
                        <p className="empty-text">Aucun serveur distant enregistré.</p>
                    ) : (
                        <div className="server-cards">
                            {servers.map((srv) => (
                                <div
                                    key={srv.id}
                                    className={`server-card ${srv.is_active ? '' : 'server-card--inactive'}`}
                                >
                                    <div className="server-card-header">
                                        <div className="server-card-title">
                                            <strong>{srv.name}</strong>
                                            <span className={`env-badge env-${srv.environment?.toLowerCase()}`}>
                                                {srv.environment || '—'}
                                            </span>
                                            {!srv.is_active && (
                                                <span className="inactive-badge">inactif</span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() => handleDelete(srv.id)}
                                            title="Supprimer"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="server-card-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Hôte</span>
                                            <code>
                                                {srv.remote_user}@{srv.remote_host}:{srv.remote_port}
                                            </code>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Répertoire distant</span>
                                            <code>{srv.remote_data_dir}</code>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Cache local</span>
                                            <code>{srv.local_dest || '(auto)'}</code>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Auth</span>
                                            <span>{srv.auth_method}</span>
                                            {srv.auth_method === 'key' && srv.ssh_key_path && (
                                                <code className="detail-extra">{srv.ssh_key_path}</code>
                                            )}
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Dernier pull</span>
                                            <span>
                                                {formatDate(srv.last_pull_at)}
                                                {srv.last_pull_status && (
                                                    <span
                                                        className={`pull-status pull-status--${srv.last_pull_status}`}
                                                    >
                                                        {srv.last_pull_status}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        {srv.description && (
                                            <div className="detail-row">
                                                <span className="detail-label">Description</span>
                                                <span>{srv.description}</span>
                                            </div>
                                        )}
                                    </div>

                                    {actionMsg[srv.id] && (
                                        <div
                                            className={`card-msg card-msg--${actionMsg[srv.id].type}`}
                                        >
                                            {actionMsg[srv.id].text}
                                        </div>
                                    )}

                                    <div className="server-card-actions">
                                        <button
                                            type="button"
                                            className="action-btn action-btn--secondary"
                                            onClick={() => handleAction(srv, 'test')}
                                            disabled={testing === srv.id}
                                        >
                                            {testing === srv.id ? 'Test…' : 'Tester la connexion'}
                                        </button>
                                        <button
                                            type="button"
                                            className="action-btn action-btn--primary"
                                            onClick={() => handleAction(srv, 'pull')}
                                            disabled={pulling === srv.id}
                                        >
                                            {pulling === srv.id ? 'Pull en cours…' : 'Pull + Extraction'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ServerConfigPage;