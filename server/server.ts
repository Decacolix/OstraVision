import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';

/* Enable environment (ENV) variables. */
dotenv.config();

/* Set Express framework. */
const app = express();

/* Set port from env, if not available, use port 3000. */
const port: number = Number(process.env.PORT) || 3000;

/* Use Cross-Origin Resource Sharing (CORS) and Express. */
app.use(cors());
app.use(express.json());

/* PostgreSQL pool to set the connection with the database. */
const pool: Pool = new Pool({
	host: process.env.PGHOST,
	port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
	database: process.env.PGDATABASE,
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
});

/* Set the current database schema. */
const schema: string = 'ostravision_test';

/* Whitelisted tables and their primary keys. */
const tablePrimaryKeys: Record<string, string> = {
	structures: 'structure_id',
	writers: 'writer_id',
	updates: 'update_id',
	authors: 'author_id',
	investors: 'investor_id',
	contractors: 'contractor_id',
	locations: 'location_id',
	sources: 'source_id',
	photos: 'photo_id',
};

/* Optional filters for whitelisted tables. */
const tableAllowedFilters: Record<string, string[]> = {
	structures: [
		'author_id',
		'investor_id',
		'contractor_id',
		'writer_id',
		'location_id',
		'source_id',
	],
	updates: ['structure_id', 'writer_id'],
	photos: ['structure_id', 'update_id', 'writer_id'],
};

/* Default ordering - important for stable pagination. */
const defaultOrderBy: Record<string, { column: string; dir: 'ASC' | 'DESC' }> =
	{
		structures: { column: 'name', dir: 'ASC' },
		updates: { column: 'update_date', dir: 'DESC' },
		photos: { column: 'photo_date', dir: 'DESC' },
	};

/* Get table names from the object. */
const tables: string[] = Object.keys(tablePrimaryKeys);

/* Cache: allowed columns per table (loaded from information_schema.columns). This enables safe "order_by any field" without manually maintaining lists. */
const tableColumns: Record<string, Set<string>> = {};

/* Root endpoint "/api/data" – information and a list of API endpoints. */
app.get('/api/data', (req: Request, res: Response) => {
	const endpoints = tables.map(t => ({
		list: `/api/data/${t}`,
		one: `/api/data/${t}/:id`,
	}));

	res.json({
		name: 'Ostravision API',
		version: '0.0.1 (Alpha)',
		endpoints,
		query: {
			filters: tableAllowedFilters,
			pagination: { limit: '1..100', offset: '0..' },
			ordering: {
				order_by: 'any existing column (safe/whitelisted automatically)',
				order_dir: 'asc|desc',
				nulls: 'first|last (optional)',
				defaults: defaultOrderBy,
			},
		},
		listResponseShape: {
			items: 'array of records',
			total: 'count of records matching filters (no pagination)',
			limit: 'applied limit (number or null)',
			offset: 'applied offset (number or null)',
		},
	});
});

/* Meta endpoint - information about tables. */
app.get('/api/data/meta', (req: Request, res: Response) => {
	const metaEndpoints = tables.map(t => `/api/data/${t}/meta`);
	res.json({ schema, metaEndpoints });
});

/* Load table columns so we can safely allow "order_by" any existing column. */
async function loadTableColumns(): Promise<void> {
	await Promise.all(
		tables.map(async tableName => {
			const sql: string = `
				SELECT column_name
				FROM information_schema.columns
				WHERE table_schema = $1 AND table_name = $2
			`;
			const { rows } = await pool.query(sql, [schema, tableName]);

			tableColumns[tableName] = new Set(
				rows.map((r: { column_name: string }) => r.column_name)
			);
		})
	);
}

/* Get meta information for table. */
function getTableMeta(tableName: string) {
	const pk: string = tablePrimaryKeys[tableName];
	const cols: Set<string> = tableColumns[tableName];
	const filters: string[] = tableAllowedFilters[tableName] ?? [];
	const def = defaultOrderBy[tableName] ?? null;

	return {
		schema,
		table: tableName,
		primaryKey: pk,
		columns: cols ? Array.from(cols).sort() : [],
		filters,
		ordering: {
			default: def
				? { order_by: def.column, order_dir: def.dir.toLowerCase() }
				: null,
			allowedOrderBy: cols ? Array.from(cols).sort() : [],
			allowedOrderDir: ['asc', 'desc'],
			allowedNulls: ['first', 'last'],
		},
		pagination: {
			limit: { min: 1, max: 100, default: null },
			offset: { min: 0, default: null },
		},
		listResponseShape: {
			items: 'array of records',
			total: 'count of records matching filters (no pagination)',
			limit: 'applied limit (number or null)',
			offset: 'applied offset (number or null)',
		},
	};
}

/* Build filters for APIs. Supports multiple filters at once, combined with "&"" (AND). */
function buildWhereFromQuery(
	tableName: string,
	query: Request['query']
): { whereSql: string; params: unknown[] } {
	const allowed = tableAllowedFilters[tableName] ?? [];
	const conditions: string[] = [];
	const params: unknown[] = [];

	for (const key of allowed) {
		const raw = query[key];

		/* Only string values are accepted (ignore arrays/objects). */
		if (typeof raw === 'string' && raw.trim().length > 0) {
			params.push(raw.trim());
			conditions.push(`${key} = $${params.length}`);
		}
	}

	const whereSql: string = conditions.length
		? ` WHERE ${conditions.join(' AND ')}`
		: '';
	return { whereSql, params };
}

/* Build safe ordering by any existing column in the table, with defaults for selected tables. */
function buildOrderBy(tableName: string, query: Request['query']): string {
	const cols: Set<string> = tableColumns[tableName];

	/* If columns aren't loaded yet, don't allow dynamic ordering (but still allow default if present). In practice, columns will be loaded before server starts. */
	const rawOrderBy = query.order_by;
	const rawOrderDir = query.order_dir;
	const rawNulls = query.nulls;

	/* If user requested ordering. */
	if (typeof rawOrderBy === 'string' && rawOrderBy.trim().length > 0) {
		const orderBy = rawOrderBy.trim();

		/* Allow only real columns in that table. */
		if (cols && cols.has(orderBy)) {
			const dir =
				typeof rawOrderDir === 'string' && rawOrderDir.toLowerCase() === 'desc'
					? 'DESC'
					: 'ASC';

			let nullsSql: string = '';
			if (typeof rawNulls === 'string') {
				const v = rawNulls.toLowerCase();
				if (v === 'last') nullsSql = ' NULLS LAST';
				else if (v === 'first') nullsSql = ' NULLS FIRST';
			}

			return ` ORDER BY ${orderBy} ${dir}${nullsSql}`;
		}
	}

	/* Default ordering for stable pagination. */
	const def = defaultOrderBy[tableName];
	if (def) {
		/* Only apply default if the column exists (extra safety). */
		if (!cols || cols.has(def.column)) {
			return ` ORDER BY ${def.column} ${def.dir}`;
		}
	}

	return '';
}

/* Build SQL with correct placeholder indexes. */
function parseLimitOffset(query: Request['query']): {
	limit?: number;
	offset?: number;
} {
	let limit: number | undefined;
	let offset: number | undefined;

	const rawLimit = query.limit;
	const rawOffset = query.offset;

	if (typeof rawLimit === 'string') {
		const parsed = parseInt(rawLimit, 10);
		if (!Number.isNaN(parsed)) {
			limit = Math.min(Math.max(parsed, 1), 100);
		}
	}

	if (typeof rawOffset === 'string') {
		const parsed = parseInt(rawOffset, 10);
		if (!Number.isNaN(parsed)) {
			offset = Math.max(parsed, 0);
		}
	}

	return { limit, offset };
}

/* Build pagination with limit and offset. */
function buildPaginationSql(
	limit: number | undefined,
	offset: number | undefined,
	startIndex: number
): { sql: string; params: number[] } {
	const params: number[] = [];
	let sql: string = '';

	if (typeof limit === 'number') {
		params.push(limit);
		sql += ` LIMIT $${startIndex + params.length - 1}`;
	}

	if (typeof offset === 'number') {
		params.push(offset);
		sql += ` OFFSET $${startIndex + params.length - 1}`;
	}

	return { sql, params };
}

/* Function to set the API endpoints. */
const setTableEndpoint = (tableName: string): void => {
	/* Set the endpoints based on the table names. */
	const pk: string = tablePrimaryKeys[tableName];

	/* Should never happen if using tables derived from "tablePrimaryKeys". */
	if (!pk) return;

	/* Meta endpoints. */
	app.get(`/api/data/${tableName}/meta`, (req: Request, res: Response) => {
		res.json(getTableMeta(tableName));
	});

	/* List of endopoints.  */
	app.get(
		`/api/data/${tableName}`,
		async (req: Request, res: Response): Promise<void> => {
			try {
				const { whereSql, params: whereParams } = buildWhereFromQuery(
					tableName,
					req.query
				);

				const orderBySql: string = buildOrderBy(tableName, req.query);

				const { limit, offset } = parseLimitOffset(req.query);
				const { sql: paginationSql, params: paginationParams } =
					buildPaginationSql(limit, offset, whereParams.length + 1);

				/* Total count (matching filters only, no limit/offset). */
				const countSql: string = `SELECT COUNT(*)::int AS total FROM ${schema}.${tableName}${whereSql}`;
				const countResult = await pool.query<{ total: number }>(
					countSql,
					whereParams
				);
				const total = countResult.rows[0]?.total ?? 0;

				/* Page items (filters + order + pagination). */
				const itemsSql: string = `SELECT * FROM ${schema}.${tableName}${whereSql}${orderBySql}${paginationSql}`;
				const itemsResult = await pool.query(itemsSql, [
					...whereParams,
					...paginationParams,
				]);

				res.json({
					items: itemsResult.rows,
					total,
					limit: typeof limit === 'number' ? limit : null,
					offset: typeof offset === 'number' ? offset : null,
				});
			} catch (err) {
				res.status(500).json({
					error: `Failed to fetch data from table ${tableName}.`,
					message: err,
				});
			}
		}
	);

	/* Detail endpoints. */
	app.get(
		`/api/data/${tableName}/:id`,
		async (req: Request, res: Response): Promise<void> => {
			try {
				const { id } = req.params;

				/* Parameterized query prevents SQL injection for values. Values "tableName" and "pk" are safe because they come from the whitelist mapping. */
				const queryText: string = `SELECT * FROM ${schema}.${tableName} WHERE ${pk} = $1 LIMIT 1`;
				const { rows } = await pool.query(queryText, [id]);

				if (rows.length === 0) {
					res.status(404).json({
						error: 'Not Found (404)',
						message: `No record found in ${tableName} for ${pk}=${id}`,
					});
					return;
				}

				res.json(rows[0]);
			} catch (err) {
				res.status(500).json({
					error: `Failed to fetch record from table ${tableName}.`,
					message: err,
				});
			}
		}
	);
};

/* Call the function for each table. */
tables.forEach(setTableEndpoint);

/* Send message for unknown routes (404). */
app.use((req: Request, res: Response, next: NextFunction) => {
	res.status(404).json({ error: 'Not Found (404)' });
});

/* Send message for internal server error (500). */
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
	res.status(500).json({ error: `Internal Server Error (500)`, message: err });
});

/* Start server only after columns are loaded, needed for safe "order_by" by any field. */
async function startServer(): Promise<void> {
	await loadTableColumns();

	app.listen(port, () => {
		console.log(`Server started on port ${port}`);
	});
}

startServer().catch(err => {
	console.error('Failed to start server:', err);
	process.exit(1);
});
