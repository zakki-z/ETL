/**
 * Base API service for communicating with the FastAPI backend.
 * All endpoints are prefixed with /api/v1.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(body.detail || `HTTP ${res.status}`);
    }

    // 204 No Content
    if (res.status === 204) return undefined as unknown as T;
    return res.json();
}

export const api = {
    get: <T>(path: string) => request<T>(path),

    post: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

    patch: <T>(path: string, body: unknown) =>
        request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

    delete: (path: string) =>
        request<void>(path, { method: 'DELETE' }),
};