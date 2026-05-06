/**
 * Server service — connects to the backend /api/v1/servers endpoints.
 */
import { api } from './apiService';

// Matches backend ServerResponse schema
export interface Server {
    id: number;
    name: string;
    ip_address: string | null;
    environment: string;
    install_path: string | null;
    os_info: string | null;
    comment: string | null;
    raw_export_date: string | null;
    created_at: string | null;
}

// Matches backend ServerCreate schema
export interface ServerCreate {
    name: string;
    ip_address?: string | null;
    environment?: string;
    install_path?: string | null;
    os_info?: string | null;
    comment?: string | null;
}

// Matches backend ServerUpdate schema
export interface ServerUpdate {
    ip_address?: string | null;
    environment?: string | null;
    install_path?: string | null;
    os_info?: string | null;
    comment?: string | null;
}

// Legacy interface kept for backwards compat with form
export interface ServerConfig {
    name: string;
    environment: string;
    dataPath: string;
}

export const serverService = {
    async listServers(params?: { environment?: string; page?: number; page_size?: number }): Promise<Server[]> {
        const qs = new URLSearchParams();
        if (params?.environment) qs.set('environment', params.environment);
        if (params?.page) qs.set('page', String(params.page));
        if (params?.page_size) qs.set('page_size', String(params.page_size));
        const query = qs.toString();
        return api.get<Server[]>(`/api/v1/servers${query ? '?' + query : ''}`);
    },

    async getServer(id: number): Promise<Server> {
        return api.get<Server>(`/api/v1/servers/${id}`);
    },

    async createServer(data: ServerCreate): Promise<Server> {
        return api.post<Server>('/api/v1/servers', data);
    },

    async updateServer(id: number, data: ServerUpdate): Promise<Server> {
        return api.patch<Server>(`/api/v1/servers/${id}`, data);
    },

    async deleteServer(id: number): Promise<void> {
        return api.delete(`/api/v1/servers/${id}`);
    },
};