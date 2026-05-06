import { useState } from 'react';
import { serverService, ServerCreate } from '../../services/serverService';
import './ServerConfigForm.css';

interface ServerConfigFormProps {
    onServerAdded: () => void;
}

function ServerConfigForm({ onServerAdded }: ServerConfigFormProps) {
    const [formData, setFormData] = useState<ServerCreate>({
        name: '',
        environment: 'PROD',
        ip_address: '',
        install_path: '',
        os_info: '',
        comment: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.name) return;
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const created = await serverService.createServer(formData);
            setSuccess(`Serveur « ${created.name} » créé (ID ${created.id})`);
            setFormData({ name: '', environment: 'PROD', ip_address: '', install_path: '', os_info: '', comment: '' });
            onServerAdded();
        } catch (e: any) {
            setError(e.message || 'Erreur lors de la création');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="server-form">
            <h3>Ajouter un serveur</h3>

            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-success">{success}</div>}

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
                    value={formData.environment}
                    onChange={handleChange}
                >
                    <option value="PROD">PROD</option>
                    <option value="DMZ">DMZ</option>
                    <option value="RECETTE">RECETTE</option>
                </select>
            </div>

            <div className="form-field">
                <label htmlFor="ip_address">Adresse IP</label>
                <input
                    type="text"
                    id="ip_address"
                    name="ip_address"
                    value={formData.ip_address || ''}
                    onChange={handleChange}
                    placeholder="e.g. 192.168.10.50"
                />
            </div>

            <div className="form-field">
                <label htmlFor="install_path">Chemin d'installation CFT</label>
                <input
                    type="text"
                    id="install_path"
                    name="install_path"
                    value={formData.install_path || ''}
                    onChange={handleChange}
                    placeholder="e.g. D:\Axway\CFT"
                />
            </div>

            <div className="form-field">
                <label htmlFor="os_info">Système d'exploitation</label>
                <input
                    type="text"
                    id="os_info"
                    name="os_info"
                    value={formData.os_info || ''}
                    onChange={handleChange}
                    placeholder="e.g. Windows Server 2019"
                />
            </div>

            <div className="form-field">
                <label htmlFor="comment">Commentaire</label>
                <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment || ''}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Notes optionnelles..."
                />
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                className="submit-button"
                disabled={!formData.name || submitting}
            >
                {submitting ? 'Enregistrement…' : 'Ajouter le serveur'}
            </button>
        </div>
    );
}

export default ServerConfigForm;