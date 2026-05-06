/**
 * Remote Server service — connects to /api/v1/remote-servers endpoints.
 * Manages SSH connection profiles for pulling CFT data from remote VMs.
 */
import { api } from './apiService';

// Matches backend RemoteServerResponse
export interface RemoteServer {
    id: number;
    name: string;
    remote_host: string;
    remote_port: number;
    remote_user: string;
    remote_data_dir: string;
    local_dest: string | null;
    auth_method: string;
    ssh_key_path: string | null;
    environment: string | null;
    description: string | null;
    is_active: boolean;
    last_pull_at: string | null;
    last_pull_status: string | null;
    last_pull_message: string | null;
    created_at: string | null;
    updated_at: string | null;
}

// Matches backend RemoteServerCreate
export interface RemoteServerCreate {
    name: string;
    remote_host: string;
    remote_port?: number;
    remote_user: string;
    remote_data_dir: string;
    local_dest?: string | null;
    auth_method?: string;
    ssh_key_path?: string | null;
    environment?: string | null;
    description?: string | null;
    is_active?: boolean;
}

// Matches backend RemoteServerUpdate
export interface RemoteServerUpdate {
    name?: string;
    remote_host?: string;
    remote_port?: number;
    remote_user?: string;
    remote_data_dir?: string;
    local_dest?: string | null;
    auth_method?: string;
    ssh_key_path?: string | null;
    environment?: string | null;
    description?: string | null;
    is_active?: boolean;
}

// Matches backend RemoteServerPullRequest
export interface RemoteServerPullRequest {
    ssh_password?: string | null;
    reset?: boolean;
    run_extraction?: boolean;
    db_url?: string | null;
}

// Extraction summary returned after pull+extraction
export interface ExtractionSummary {
    server?: number;
    cfttcp?: number;
    cftprot?: number;
    cftssl?: number;
    partner?: number;
    flow?: number;
    processing?: number;
    bosco_route?: number;
    copilot_activity?: number;
    migration?: number;
    migration_complexity?: Record<string, number>;
    dormant_partners?: string[];
}

// Matches backend RemoteServerPullResponse
export interface RemoteServerPullResponse {
    server_id: number;
    server_name: string;
    status: string;
    message: string;
    local_path: string | null;
    extraction_ran: boolean;
    extraction_summary: ExtractionSummary | null;
}

export interface TestConnectionResult {
    status: string;
    message: string;
    directory_exists: boolean | null;
    directory_message: string | null;
    directory_contents: string[];
}

export const remoteServerService = {
    async list(params?: {
        environment?: string;
        is_active?: boolean;
        page?: number;
        page_size?: number;
    }): Promise<RemoteServer[]> {
        const qs = new URLSearchParams();
        if (params?.environment) qs.set('environment', params.environment);
        if (params?.is_active !== undefined) qs.set('is_active', String(params.is_active));
        if (params?.page) qs.set('page', String(params.page));
        if (params?.page_size) qs.set('page_size', String(params.page_size));
        const query = qs.toString();
        return api.get<RemoteServer[]>(`/api/v1/remote-servers${query ? '?' + query : ''}`);
    },

    async get(id: number): Promise<RemoteServer> {
        return api.get<RemoteServer>(`/api/v1/remote-servers/${id}`);
    },

    async create(data: RemoteServerCreate): Promise<RemoteServer> {
        return api.post<RemoteServer>('/api/v1/remote-servers', data);
    },

    async update(id: number, data: RemoteServerUpdate): Promise<RemoteServer> {
        return api.patch<RemoteServer>(`/api/v1/remote-servers/${id}`, data);
    },

    async delete(id: number): Promise<void> {
        return api.delete(`/api/v1/remote-servers/${id}`);
    },

    async pull(id: number, data?: RemoteServerPullRequest): Promise<RemoteServerPullResponse> {
        return api.post<RemoteServerPullResponse>(
            `/api/v1/remote-servers/${id}/pull`,
            data || {},
        );
    },

    async testConnection(id: number, sshPassword?: string): Promise<TestConnectionResult> {
        // Send password in request body, not query string (security)
        return api.post<TestConnectionResult>(
            `/api/v1/remote-servers/${id}/test-connection`,
            { ssh_password: sshPassword || null },
        );
    },
};