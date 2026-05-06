/**
 * Database service — fetches live data from the backend API.
 *
 * Each "table" corresponds to a real backend endpoint + SQLAlchemy model.
 * The column definitions mirror the backend Pydantic response schemas.
 */
import { api } from './apiService';

export interface TableColumn {
  name: string;
  type: string;
}

export interface DatabaseTable {
  name: string;
  description: string;
  columns: TableColumn[];
  endpoint: string;                       // backend GET path
  rows: Record<string, unknown>[];
}

// ── Table metadata matching backend models ───────────────────────────────

export const tableDefinitions: Omit<DatabaseTable, 'rows'>[] = [
  {
    name: 'server',
    description: 'Serveurs CFT inventoriés (CFTPARM)',
    endpoint: '/api/v1/servers',
    columns: [
      { name: 'id', type: 'int' },
      { name: 'name', type: 'string' },
      { name: 'ip_address', type: 'string' },
      { name: 'environment', type: 'string' },
      { name: 'install_path', type: 'string' },
      { name: 'os_info', type: 'string' },
      { name: 'raw_export_date', type: 'datetime' },
      { name: 'comment', type: 'text' },
      { name: 'created_at', type: 'datetime' },
    ],
  },
  {
    name: 'cft_partner',
    description: 'Partenaires CFT (CFTPART)',
    endpoint: '/api/v1/cft-partners',
    columns: [
      { name: 'id', type: 'string' },
      { name: 'nspart', type: 'string' },
      { name: 'nrpart', type: 'string' },
      { name: 'ssl', type: 'boolean' },
      { name: 'sap', type: 'string' },
      { name: 'nspassw', type: 'string' },
      { name: 'nrpassw', type: 'string' },
    ],
  },
  {
    name: 'cft_flow',
    description: 'Flux CFT (CFTSEND / CFTRECV)',
    endpoint: '/api/v1/cft-flows',
    columns: [
      { name: 'idf_code', type: 'string' },
      { name: 'direct', type: 'string' },
      { name: 'fcode', type: 'string' },
      { name: 'ftype', type: 'string' },
      { name: 'flrecl', type: 'string' },
      { name: 'frecfm', type: 'string' },
      { name: 'fname', type: 'string' },
      { name: 'xlate', type: 'boolean' },
    ],
  },
  {
    name: 'cft_tcp',
    description: 'Configuration réseau TCP par partenaire (CFTTCP)',
    endpoint: '/api/v1/cft-tcp',
    columns: [
      { name: 'partner_id', type: 'string' },
      { name: 'cnxout', type: 'string' },
      { name: 'host', type: 'string' },
    ],
  },
  {
    name: 'transfer',
    description: 'Transferts CFT (lien partenaire ↔ flux)',
    endpoint: '/api/v1/transfers',
    columns: [
      { name: 'id', type: 'int' },
      { name: 'partner_id', type: 'string' },
      { name: 'idf_id', type: 'string' },
      { name: 'date', type: 'datetime' },
      { name: 'nbre_ligne', type: 'int' },
      { name: 'direct', type: 'string' },
      { name: 'is_migrable', type: 'boolean' },
    ],
  },
  {
    name: 'flow_action',
    description: 'Actions associées aux transferts (lien vers scripts)',
    endpoint: '/api/v1/flow-actions',
    columns: [
      { name: 'id', type: 'int' },
      { name: 'transfer_id', type: 'int' },
      { name: 'script_id', type: 'int' },
    ],
  },
  {
    name: 'post_processing_scripts',
    description: 'Scripts de post-traitement',
    endpoint: '/api/v1/post-processing-scripts',
    columns: [
      { name: 'id', type: 'int' },
      { name: 'script_path', type: 'string' },
      { name: 'script_type', type: 'string' },
    ],
  },
  {
    name: 'moncft_config',
    description: 'Configuration MonCFT (monitoring)',
    endpoint: '/api/v1/moncft-configs',
    columns: [
      { name: 'id', type: 'int' },
      { name: 'fname', type: 'string' },
      { name: 'filtre', type: 'string' },
      { name: 'parm', type: 'string' },
      { name: 'nfname', type: 'string' },
      { name: 'transfer_id', type: 'int' },
      { name: 'SAPPL', type: 'string' },
      { name: 'RAPPL', type: 'string' },
      { name: 'SUSER', type: 'string' },
    ],
  },
  {
    name: 'boscosend_config',
    description: 'Configuration BoscoSend',
    endpoint: '/api/v1/boscosend-configs',
    columns: [
      { name: 'id', type: 'int' },
      { name: 'remote_address', type: 'string' },
      { name: 'remote_subdir', type: 'string' },
      { name: 'transfer_id', type: 'int' },
      { name: 'localdir', type: 'string' },
    ],
  },
  {
    name: 'cft_tcp_without_partner',
    description: 'TCP entries sans partenaire associé (staging)',
    endpoint: '/api/v1/stg-cft-tcp-without-partner',
    columns: [
      { name: 'id', type: 'string' },
      { name: 'cnxout', type: 'string' },
      { name: 'host', type: 'string' },
      { name: 'reason', type: 'string' },
    ],
  },
  {
    name: 'remote_server',
    description: 'Profils de connexion serveurs distants (SSH)',
    endpoint: '/api/v1/remote-servers',
    columns: [
      { name: 'id', type: 'int' },
      { name: 'name', type: 'string' },
      { name: 'remote_host', type: 'string' },
      { name: 'remote_port', type: 'int' },
      { name: 'remote_user', type: 'string' },
      { name: 'remote_data_dir', type: 'string' },
      { name: 'local_dest', type: 'string' },
      { name: 'auth_method', type: 'string' },
      { name: 'environment', type: 'string' },
      { name: 'is_active', type: 'boolean' },
      { name: 'last_pull_at', type: 'datetime' },
      { name: 'last_pull_status', type: 'string' },
    ],
  },
];

// ── Fetch helpers ────────────────────────────────────────────────────────

/**
 * Fetch rows for a table from the backend.
 * For server-scoped tables we aggregate across all known servers.
 */
export async function fetchTableRows(
    tableName: string,
    servers: { id: number }[] = [],
): Promise<Record<string, unknown>[]> {
  const def = tableDefinitions.find((t) => t.name === tableName);
  if (!def) return [];

  // Tables that need per-server fetching
  const serverScopedTables: Record<string, (serverId: number) => string> = {
    cfttcp: (id) => `/api/v1/servers/${id}/cfttcp`,
    cftprot: (id) => `/api/v1/servers/${id}/cftprot`,
    cftssl: (id) => `/api/v1/servers/${id}/cftssl`,
    processing: (id) => `/api/v1/servers/${id}/processing`,
    bosco_route: (id) => `/api/v1/servers/${id}/bosco-routes`,
  };

  if (serverScopedTables[tableName]) {
    const builder = serverScopedTables[tableName];
    const allRows: Record<string, unknown>[] = [];
    for (const srv of servers) {
      try {
        const rows = await api.get<Record<string, unknown>[]>(
            `${builder(srv.id)}?page_size=200`,
        );
        allRows.push(...rows);
      } catch {
        // server may not have this data — skip
      }
    }
    return allRows;
  }

  // Global endpoints — respect each controller's page_size limit
  const globalEndpoints: Record<string, string> = {
    server: '/api/v1/servers?page_size=100',
    partner: '/api/v1/partners?page_size=200',
    flow: '/api/v1/flows?page_size=200',
    copilot_activity: '/api/v1/copilot-activities?page_size=200',
    migration: '/api/v1/migrations?page_size=200',
    remote_server: '/api/v1/remote-servers?page_size=100',
  };

  const endpoint = globalEndpoints[tableName];
  if (!endpoint) return [];

  try {
    return await api.get<Record<string, unknown>[]>(endpoint);
  } catch {
    return [];
  }
}

export const databaseService = {
  async listTables(): Promise<DatabaseTable[]> {
    return tableDefinitions.map((def) => ({ ...def, rows: [] }));
  },

  async getTableWithData(
      name: string,
      servers: { id: number }[] = [],
  ): Promise<DatabaseTable | undefined> {
    const def = tableDefinitions.find((t) => t.name === name);
    if (!def) return undefined;
    const rows = await fetchTableRows(name, servers);
    return { ...def, rows };
  },
};