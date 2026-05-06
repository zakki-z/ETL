/**
 * Database service — fetches live data from the backend API.
 *
 * Table definitions mirror the actual backend SQLAlchemy models and
 * Pydantic response schemas exactly.
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
  endpoint: string;
  rows: Record<string, unknown>[];
}

// ── Table metadata matching actual backend models ────────────────────────────

export const tableDefinitions: Omit<DatabaseTable, 'rows'>[] = [
  {
    name: 'server',
    description: 'Serveurs CFT inventoriés — un enregistrement par instance CFTUTIL exportée.',
    endpoint: '/api/v1/servers',
    columns: [
      { name: 'id',              type: 'int' },
      { name: 'name',            type: 'string' },
      { name: 'ip_address',      type: 'string' },
      { name: 'environment',     type: 'string' },
      { name: 'install_path',    type: 'string' },
      { name: 'os_info',         type: 'string' },
      { name: 'raw_export_date', type: 'datetime' },
      { name: 'comment',         type: 'text' },
      { name: 'created_at',      type: 'datetime' },
      { name: 'updated_at',      type: 'datetime' },
    ],
  },
  {
    name: 'partner',
    description: 'Partenaires CFT (CFTPART) — enrichis avec l\'activité Copilot.',
    endpoint: '/api/v1/partners',
    columns: [
      { name: 'id',                  type: 'int' },
      { name: 'server_id',           type: 'int' },
      { name: 'name',                type: 'string' },
      { name: 'nrpart',              type: 'string' },
      { name: 'nspart',              type: 'string' },
      { name: 'prot',                type: 'string' },
      { name: 'sap',                 type: 'string' },
      { name: 'state',               type: 'string' },
      { name: 'commut',              type: 'string' },
      { name: 'idf_list',            type: 'text' },
      { name: 'cfttcp_name',         type: 'string' },
      { name: 'cfttcp_id',           type: 'int' },
      { name: 'is_active',           type: 'boolean' },
      { name: 'activity_status',     type: 'string' },
      { name: 'transfer_count_12m',  type: 'int' },
      { name: 'avg_daily_volume',    type: 'float' },
      { name: 'last_transfer_date',  type: 'datetime' },
      { name: 'comment',             type: 'text' },
    ],
  },
  {
    name: 'flow',
    description: 'Flux de transfert CFT (CFTSEND / CFTRECV) — un enregistrement par IDF × partenaire × direction.',
    endpoint: '/api/v1/flows',
    columns: [
      { name: 'id',                  type: 'int' },
      { name: 'partner_id',          type: 'int' },
      { name: 'server_id',           type: 'int' },
      { name: 'idf',                 type: 'string' },
      { name: 'cft_type',            type: 'string' },
      { name: 'ftype',               type: 'string' },
      { name: 'fcode',               type: 'string' },
      { name: 'fname',               type: 'string' },
      { name: 'wfname',              type: 'string' },
      { name: 'nfname',              type: 'string' },
      { name: 'exec',                type: 'string' },
      { name: 'partner_list',        type: 'text' },
      { name: 'is_active',           type: 'boolean' },
      { name: 'activity_status',     type: 'string' },
      { name: 'transfer_count_12m',  type: 'int' },
      { name: 'avg_daily_volume',    type: 'float' },
      { name: 'last_transfer_date',  type: 'datetime' },
      { name: 'comment',             type: 'text' },
    ],
  },
  {
    name: 'cfttcp',
    description: 'Configuration réseau TCP (CFTTCP) — paramètres de connexion par partenaire.',
    endpoint: 'server-scoped:/api/v1/servers/{id}/cfttcp',
    columns: [
      { name: 'id',          type: 'int' },
      { name: 'server_id',   type: 'int' },
      { name: 'name',        type: 'string' },
      { name: 'host',        type: 'string' },
      { name: 'port',        type: 'int' },
      { name: 'cnx_in',     type: 'int' },
      { name: 'cnx_out',    type: 'int' },
      { name: 'cnx_inout',  type: 'int' },
      { name: 'retry_wait', type: 'int' },
      { name: 'retry_max',  type: 'int' },
      { name: 'ssl_id',     type: 'string' },
      { name: 'comment',    type: 'text' },
    ],
  },
  {
    name: 'cftprot',
    description: 'Protocoles CFT (CFTPROT) — définition PeSIT et autres protocoles.',
    endpoint: 'server-scoped:/api/v1/servers/{id}/cftprot',
    columns: [
      { name: 'id',        type: 'int' },
      { name: 'server_id', type: 'int' },
      { name: 'name',      type: 'string' },
      { name: 'prot_type', type: 'string' },
      { name: 'net',       type: 'string' },
      { name: 'sap',       type: 'string' },
      { name: 'ssl_id',    type: 'string' },
      { name: 'compress',  type: 'string' },
      { name: 'restart',   type: 'string' },
      { name: 'concat',    type: 'string' },
      { name: 'comment',   type: 'text' },
    ],
  },
  {
    name: 'cftssl',
    description: 'Configuration SSL/TLS (CFTSSL) — certificats et chiffrements.',
    endpoint: 'server-scoped:/api/v1/servers/{id}/cftssl',
    columns: [
      { name: 'id',        type: 'int' },
      { name: 'server_id', type: 'int' },
      { name: 'name',      type: 'string' },
      { name: 'direct',    type: 'string' },
      { name: 'rootcid',   type: 'string' },
      { name: 'usercid',   type: 'string' },
      { name: 'userkey',   type: 'string' },
      { name: 'version',   type: 'string' },
      { name: 'verify',    type: 'string' },
      { name: 'ciphlist',  type: 'string' },
    ],
  },
  {
    name: 'processing',
    description: 'Scripts de sortie CFT (EXITEOT / EXITBOT / EXITDIR / EXITFILE) — classifiés A/B/C.',
    endpoint: 'server-scoped:/api/v1/servers/{id}/processing',
    columns: [
      { name: 'id',                     type: 'int' },
      { name: 'server_id',              type: 'int' },
      { name: 'flow_id',                type: 'int' },
      { name: 'script_path',            type: 'string' },
      { name: 'script_type',            type: 'string' },
      { name: 'bucket',                 type: 'string' },
      { name: 'classification_notes',   type: 'text' },
      { name: 'migration_action',       type: 'text' },
      { name: 'calls_unknown_scripts',  type: 'boolean' },
      { name: 'unknown_script_paths',   type: 'text' },
      { name: 'branch_condition',       type: 'text' },
      { name: 'branch_action',          type: 'text' },
      { name: 'branch_has_unknown_call', type: 'boolean' },
    ],
  },
  {
    name: 'bosco_route',
    description: 'Routes Bosco (BOSCO_SEND / BOSCO_RECV) — configuration du routeur de fichiers interne.',
    endpoint: 'server-scoped:/api/v1/servers/{id}/bosco-routes',
    columns: [
      { name: 'id',              type: 'int' },
      { name: 'server_id',       type: 'int' },
      { name: 'section_name',    type: 'string' },
      { name: 'route_type',      type: 'string' },
      { name: 'active',          type: 'boolean' },
      { name: 'local_dir',       type: 'string' },
      { name: 'backup_dir',      type: 'string' },
      { name: 'dest_dir',        type: 'string' },
      { name: 'archive_dir',     type: 'string' },
      { name: 'remote_address',  type: 'string' },
      { name: 'remote_port',     type: 'int' },
      { name: 'remote_subdir',   type: 'string' },
      { name: 'file_mask',       type: 'string' },
      { name: 'protocol',        type: 'string' },
      { name: 'partner_ref',     type: 'string' },
      { name: 'idf_ref',         type: 'string' },
      { name: 'schedule',        type: 'string' },
      { name: 'processing_app',  type: 'string' },
      { name: 'comment',         type: 'text' },
    ],
  },
  {
    name: 'copilot_activity',
    description: 'Activité Copilot — historique 12 mois pour distinguer flux actifs et dormants.',
    endpoint: '/api/v1/copilot-activities',
    columns: [
      { name: 'id',                    type: 'int' },
      { name: 'server_name',           type: 'string' },
      { name: 'partner_id_ref',        type: 'string' },
      { name: 'idf',                   type: 'string' },
      { name: 'direction',             type: 'string' },
      { name: 'last_transfer_date',    type: 'datetime' },
      { name: 'transfer_count_12m',    type: 'int' },
      { name: 'avg_daily_volume',      type: 'float' },
      { name: 'status_recommendation', type: 'string' },
    ],
  },
  {
    name: 'migration',
    description: 'Suivi de migration — un enregistrement par flux actif, avec statut et complexité.',
    endpoint: '/api/v1/migrations',
    columns: [
      { name: 'id',              type: 'int' },
      { name: 'flow_id',         type: 'int' },
      { name: 'status',          type: 'string' },
      { name: 'complexity',      type: 'string' },
      { name: 'assigned_to',     type: 'string' },
      { name: 'exception_notes', type: 'text' },
      { name: 'started_at',      type: 'datetime' },
      { name: 'completed_at',    type: 'datetime' },
      { name: 'last_updated',    type: 'datetime' },
    ],
  },
  {
    name: 'remote_server',
    description: 'Profils de connexion SSH vers les serveurs CFT distants.',
    endpoint: '/api/v1/remote-servers',
    columns: [
      { name: 'id',               type: 'int' },
      { name: 'name',             type: 'string' },
      { name: 'remote_host',      type: 'string' },
      { name: 'remote_port',      type: 'int' },
      { name: 'remote_user',      type: 'string' },
      { name: 'remote_data_dir',  type: 'string' },
      { name: 'local_dest',       type: 'string' },
      { name: 'auth_method',      type: 'string' },
      { name: 'environment',      type: 'string' },
      { name: 'is_active',        type: 'boolean' },
      { name: 'last_pull_at',     type: 'datetime' },
      { name: 'last_pull_status', type: 'string' },
      { name: 'description',      type: 'text' },
    ],
  },
];

// ── Routing helpers ──────────────────────────────────────────────────────────

const SERVER_SCOPED_ENDPOINTS: Record<string, (serverId: number) => string> = {
  cfttcp:       (id) => `/api/v1/servers/${id}/cfttcp`,
  cftprot:      (id) => `/api/v1/servers/${id}/cftprot`,
  cftssl:       (id) => `/api/v1/servers/${id}/cftssl`,
  processing:   (id) => `/api/v1/servers/${id}/processing`,
  bosco_route:  (id) => `/api/v1/servers/${id}/bosco-routes`,
};

const GLOBAL_ENDPOINTS: Record<string, string> = {
  server:            '/api/v1/servers?page_size=100',
  partner:           '/api/v1/partners?page_size=200',
  flow:              '/api/v1/flows?page_size=200',
  copilot_activity:  '/api/v1/copilot-activities?page_size=200',
  migration:         '/api/v1/migrations?page_size=200',
  remote_server:     '/api/v1/remote-servers?page_size=100',
};

// ── Public fetch function ────────────────────────────────────────────────────

/**
 * Fetch rows for a named table. Server-scoped tables aggregate across all servers.
 */
export async function fetchTableRows(
    tableName: string,
    servers: { id: number }[] = [],
): Promise<Record<string, unknown>[]> {
  // Server-scoped: aggregate one request per known server
  const scopedBuilder = SERVER_SCOPED_ENDPOINTS[tableName];
  if (scopedBuilder) {
    const allRows: Record<string, unknown>[] = [];
    for (const srv of servers) {
      try {
        const rows = await api.get<Record<string, unknown>[]>(
            `${scopedBuilder(srv.id)}?page_size=200`,
        );
        allRows.push(...rows);
      } catch {
        // server may have no data for this table — skip silently
      }
    }
    return allRows;
  }

  // Global endpoint
  const endpoint = GLOBAL_ENDPOINTS[tableName];
  if (!endpoint) return [];

  try {
    return await api.get<Record<string, unknown>[]>(endpoint);
  } catch {
    return [];
  }
}

// ── Service object ────────────────────────────────────────────────────────────

export const databaseService = {
  listTables(): DatabaseTable[] {
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