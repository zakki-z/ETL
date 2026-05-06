import { useState } from 'react';
import { remoteServerService, RemoteServerCreate } from '../../services/remoteServerService';
import './ServerConfigForm.css';

interface RemoteServerFormProps {
    onServerAdded: () => void;
}

function RemoteServerForm({ onServerAdded }: RemoteServerFormProps) {
    const [formData, setFormData] = useState<RemoteServerCreate>({
        name: '',
        remote_host: '',
        remote_port: 22,
        remote_user: '',
        remote_data_dir: '',
        local_dest: '',
        auth_method: 'key',
        ssh_key_path: '',
        environment: 'PROD',
        description: '',
        is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
        } else if (type === 'number') {
            setFormData({ ...formData, [name]: value === '' ? undefined : Number(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.remote_host || !formData.remote_user || !formData.remote_data_dir) return;

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const payload: RemoteServerCreate = {
                ...formData,
                local_dest: formData.local_dest || undefined,
                ssh_key_path: formData.ssh_key_path || undefined,
                description: formData.description || undefined,
            };
            const created = await remoteServerService.create(payload);
            setSuccess(`Serveur distant « ${created.name} » enregistré (ID ${created.id})`);
            setFormData({
                name: '',
                remote_host: '',
                remote_port: 22,
                remote_user: '',
                remote_data_dir: '',
                local_dest: '',
                auth_method: 'key',
                ssh_key_path: '',
                environment: 'PROD',
                description: '',
                is_active: true,
            });
            onServerAdded();
        } catch (e: any) {
            setError(e.message || 'Erreur lors de la création');
        } finally {
            setSubmitting(false);
        }
    };

    const canSubmit =
        formData.name && formData.remote_host && formData.remote_user && formData.remote_data_dir && !submitting;

    return (
        <div className="server-form">
            <h3>Enregistrer un serveur distant</h3>

    {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

            {/* ── Identity ─────────────────────────────── */}
            <div className="form-section-label">Identité</div>

                <div className="form-field">
        <label htmlFor="name">Nom du serveur *</label>
        <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. CFT_PROD1"
                />
                </div>

                <div className="form-field">
        <label htmlFor="environment">Environnement</label>
            <select
            id="environment"
            name="environment"
            value={formData.environment || ''}
            onChange={handleChange}
            >
            <option value="PROD">PROD</option>
                <option value="DMZ">DMZ</option>
            <option value="RECETTE">RECETTE</option>
            </select>
            </div>

            <div className="form-field">
        <label htmlFor="description">Description</label>
            <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={2}
            placeholder="Notes optionnelles sur ce serveur…"
                />
                </div>

            {/* ── Connection ───────────────────────────── */}
            <div className="form-section-label">Connexion SSH</div>

        <div className="form-row">
        <div className="form-field form-field-grow">
        <label htmlFor="remote_host">Hôte distant (IP / hostname) *</label>
        <input
            type="text"
            id="remote_host"
            name="remote_host"
            value={formData.remote_host}
            onChange={handleChange}
            placeholder="e.g. 192.168.10.50 ou cft-prod.internal"
                />
                </div>
                <div className="form-field form-field-small">
        <label htmlFor="remote_port">Port SSH</label>
        <input
            type="number"
            id="remote_port"
            name="remote_port"
            value={formData.remote_port ?? 22}
            onChange={handleChange}
            min={1}
            max={65535}
            />
            </div>
            </div>

            <div className="form-field">
        <label htmlFor="remote_user">Utilisateur SSH *</label>
        <input
            type="text"
            id="remote_user"
            name="remote_user"
            value={formData.remote_user}
            onChange={handleChange}
            placeholder="e.g. cft_admin"
                />
                </div>

                <div className="form-field">
        <label htmlFor="auth_method">Méthode d'authentification</label>
        <select
            id="auth_method"
            name="auth_method"
            value={formData.auth_method || 'key'}
            onChange={handleChange}
            >
            <option value="key">Clé SSH</option>
        <option value="password">Mot de passe</option>
        <option value="agent">Agent SSH</option>
        </select>
        </div>

            {formData.auth_method === 'key' && (
                <div className="form-field">
                <label htmlFor="ssh_key_path">Chemin de la clé SSH</label>
            <input
                type="text"
                id="ssh_key_path"
                name="ssh_key_path"
                value={formData.ssh_key_path || ''}
                onChange={handleChange}
                placeholder="e.g. ~/.ssh/id_rsa"
                    />
                    </div>
            )}

            {/* ── Paths ────────────────────────────────── */}
            <div className="form-section-label">Répertoires</div>

                <div className="form-field">
        <label htmlFor="remote_data_dir">Répertoire distant des données CFT *</label>
        <input
            type="text"
            id="remote_data_dir"
            name="remote_data_dir"
            value={formData.remote_data_dir}
            onChange={handleChange}
            placeholder="e.g. /opt/cft/data"
                />
                </div>

                <div className="form-field">
        <label htmlFor="local_dest">Répertoire local de cache</label>
        <input
            type="text"
            id="local_dest"
            name="local_dest"
            value={formData.local_dest || ''}
            onChange={handleChange}
            placeholder="Auto-généré si vide (e.g. /opt/cft-data/cft_prod1)"
            />
            <span className="form-hint">Laissez vide pour auto-générer à partir du nom.</span>
        </div>

            {/* ── Active toggle ─────────────────────────── */}
            <div className="form-field form-field-checkbox">
            <label>
                <input
                    type="checkbox"
            name="is_active"
            checked={formData.is_active ?? true}
            onChange={handleChange}
            />
            Serveur actif
        </label>
        </div>

        <button
            type="button"
            onClick={handleSubmit}
            className="submit-button"
            disabled={!canSubmit}
        >
            {submitting ? 'Enregistrement…' : 'Enregistrer le serveur'}
            </button>
            </div>
        );
        }

        export default RemoteServerForm;