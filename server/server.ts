import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';

/* Load environmental variables (port, database information, etc.) from the .env file. Variables are loaded into process.env. */
dotenv.config();

/* Create Express application instance to define endpoints, middlewares, and to start the HTTP server. */
const app = express();

/* Read the server port from environment variables. If the port is invalid, set it to 3000. */
const port: number = Number(process.env.PORT) || 3000;

/* Enable Cross-Origin Resource Sharing (CORS) middleware to allow front-end to call this API. */
app.use(cors());

/* Allow Express to parse JSON request bodies. */
app.use(express.json());

/* Create PostgreSQL connection pool that maintains a set of open connections that can be reused across requests. */
const pool: Pool = new Pool({
	/* PostgreSQL host. */
	host: process.env.PGHOST,

	/* PostgreSQL port is optional. If PGPORT is not set, it uses the default (5432). */
	port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,

	/* Database name. */
	database: process.env.PGDATABASE,

	/* Username. */
	user: process.env.PGUSER,

	/* Password (always keep in the .env file for security). */
	password: process.env.PGPASSWORD,
});

/* Name of the schema to query. */
const schema: string = 'ostravision_test';

/* A whitelist mapping of API table names to their primary key names. It is important for security to never accept table names or primary key names from user input */
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

/* A whitelist mapping of tables to the foreign key fields that can be used as filters. */
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

/* Default ordering configuration to provide stable pagination results. */
const defaultOrderBy: Record<string, { column: string; dir: 'ASC' | 'DESC' }> =
	{
		/* Structures are ordered alphabetically by default. */
		structures: { column: 'name', dir: 'ASC' },

		/* Updates are ordered newest first by default. */
		updates: { column: 'update_date', dir: 'DESC' },

		/* Photos are ordered newest first by default. */
		photos: { column: 'photo_date', dir: 'DESC' },
	};

/* List of all whitelisted table names derived from the primary key mapping to expose only allowed tables. */
const tables: string[] = Object.keys(tablePrimaryKeys);

/* Cache of table column names for safe ordering functionality. Prevents SQL injection. */
const tableColumns: Record<string, Set<string>> = {};

/* Root endpoint for the API. Shows available endpoints, supported query parameters and list response shape. */
app.get('/api/data', (req: Request, res: Response) => {
	/* Build endpoints in a structured way so it is easy for clients to discover routes. */
	const endpoints = tables.map(t => ({
		/* List route. */
		list: `/api/data/${t}`,

		/* Detail route for a single record. */
		one: `/api/data/${t}/:id`,
	}));

	/* Return the API info as JSON. */
	res.json({
		name: 'Ostravision API',
		version: '0.0.1 (Alpha)',
		endpoints,
		query: {
			/* Which filters are supported by which table. */
			filters: tableAllowedFilters,

			/* Pagination rules. */
			pagination: { limit: '1..100', offset: '0..' },

			/* Ordering rules. */
			ordering: {
				/* User can request ordering by any existing column, validated via tableColumns cache. */
				order_by: 'any existing column (safe/whitelisted automatically)',

				/* Sort direction. */
				order_dir: 'asc|desc',

				/* Optional NULLS placement. */
				nulls: 'first|last (optional)',

				/* Table-specific default order used when order_by is not provided or invalid. */
				defaults: defaultOrderBy,
			},
		},
		listResponseShape: {
			/* List endpoints return an object, not a bare array. */
			items: 'array of records',
			total: 'count of records matching filters (no pagination)',
			limit: 'applied limit (number or null)',
			offset: 'applied offset (number or null)',
		},
	});
});

/* Meta endpoints return metadata. */
app.get('/api/data/meta', (req: Request, res: Response) => {
	/* Build meta route for each table. */
	const metaEndpoints = tables.map(t => `/api/data/${t}/meta`);

	/* Return schema and all meta endpoints. */
	res.json({ schema, metaEndpoints });
});

/* Load and cache teable columns. We query information_schema.columns to list column names for tables at startup so ordering validation is fast and meta endpoints can expose the columns. */
async function loadTableColumns(): Promise<void> {
	/* Run the loading query for all tables. */
	await Promise.all(
		tables.map(async tableName => {
			const sql: string = `
				SELECT column_name
				FROM information_schema.columns
				WHERE table_schema = $1 AND table_name = $2
			`;

			/* Execute parametrized query with schema and tableName as values. */
			const { rows } = await pool.query(sql, [schema, tableName]);

			/* Store column names in a Set for fast lookup. */
			tableColumns[tableName] = new Set(
				rows.map((r: { column_name: string }) => r.column_name)
			);
		})
	);
}

/* Build a metadata object for a given table. Used by meta endopoints and exposes only safe, non-sensitive information. */
function getTableMeta(tableName: string) {
	/* Primary key column name for this table from our whitelist. */
	const pk: string = tablePrimaryKeys[tableName];

	/* Column set loaded at startup. */
	const cols: Set<string> = tableColumns[tableName];

	/* Allowed filters for this table. Returns an empty list if none defined. */
	const filters: string[] = tableAllowedFilters[tableName] ?? [];

	/* Default ordering for this table, if configured. */
	const def = defaultOrderBy[tableName] ?? null;

	/* Return a structured meta object. */
	return {
		schema,
		table: tableName,
		primaryKey: pk,

		/* Convert Set to sorted array for stable and predictable output. */
		columns: cols ? Array.from(cols).sort() : [],

		/* List of query parameters that can be used as filters. */
		filters,
		ordering: {
			/* Default ordering is used when order_by is missing or invalid. */
			default: def
				? { order_by: def.column, order_dir: def.dir.toLowerCase() }
				: null,

			/* Client can order by any column listed here. */
			allowedOrderBy: cols ? Array.from(cols).sort() : [],

			/* Allowed direction values. */
			allowedOrderDir: ['asc', 'desc'],

			/* Allowed NULLS placement values. */
			allowedNulls: ['first', 'last'],
		},

		/* Pagination rules used by the API. */
		pagination: {
			limit: { min: 1, max: 100, default: null },
			offset: { min: 0, default: null },
		},

		/* Document list response format for clients. */
		listResponseShape: {
			items: 'array of records',
			total: 'count of records matching filters (no pagination)',
			limit: 'applied limit (number or null)',
			offset: 'applied offset (number or null)',
		},
	};
}

/* Build SQL WHERE clause and parameter array from request query parameters. Values are passed as SQL parameters to avoid injection.q Multiple filters are combined using AND. */
function buildWhereFromQuery(
	tableName: string,
	query: Request['query']
): { whereSql: string; params: unknown[] } {
	/* Allowed filter keys for this table. If none, use an empty list. */
	const allowed = tableAllowedFilters[tableName] ?? [];

	/* Conditions hold pieces like "author_id = $1". */
	const conditions: string[] = [];

	/* Params hold actual values passed to the database driver. */
	const params: unknown[] = [];

	/* Parameters hold actual values passed to the database driver. */
	for (const key of allowed) {
		/* Raw query parameter value. */
		const raw = query[key];

		/* Only accept a single string value, ignore array and objects. */
		if (typeof raw === 'string' && raw.trim().length > 0) {
			/* Push the cleaned value to parameters, its placeholder number is params.length. */
			params.push(raw.trim());

			/* Add a WHERE condition with the correct placeholder index. */
			conditions.push(`${key} = $${params.length}`);
		}
	}

	/* If we have conditions, create the WHERE clause. Otherwise return empty string. */
	const whereSql: string = conditions.length
		? ` WHERE ${conditions.join(' AND ')}`
		: '';

	/* Return WHERE clause string and matching parameter array. */
	return { whereSql, params };
}

/* Build a safe ORDER BY clause for list endopints. SQL identifiers (column names) cannot be paramertized like values. We only allow ordering by known table columns from tableColumns cache. */
function buildOrderBy(tableName: string, query: Request['query']): string {
	/* Columns for this table are in Set for fast lookup. */
	const cols: Set<string> = tableColumns[tableName];

	/* Read ordering query parameters. */
	const rawOrderBy = query.order_by;
	const rawOrderDir = query.order_dir;
	const rawNulls = query.nulls;

	/* If the user requested ordering by a specific column- */
	if (typeof rawOrderBy === 'string' && rawOrderBy.trim().length > 0) {
		/* Clean the column name candidate. */
		const orderBy = rawOrderBy.trim();

		/* Validate the requsted column against the known columns. */
		if (cols && cols.has(orderBy)) {
			/* Validate direction, default to ASC if invalid or not provided. */
			const dir =
				typeof rawOrderDir === 'string' && rawOrderDir.toLowerCase() === 'desc'
					? 'DESC'
					: 'ASC';

			/* Optional NULLS placement. If invalid or missing, we omit it. */
			let nullsSql: string = '';
			if (typeof rawNulls === 'string') {
				const v = rawNulls.toLowerCase();
				if (v === 'last') nullsSql = ' NULLS LAST';
				else if (v === 'first') nullsSql = ' NULLS FIRST';
			}

			/* Return a valid ORDER BY clause. */
			return ` ORDER BY ${orderBy} ${dir}${nullsSql}, ${tablePrimaryKeys[tableName]} ${dir}`;
		}
	}

	/* If order_by is invalid, we execute apply default ordering if configured for this table. */
	const def = defaultOrderBy[tableName];
	if (def) {
		/* Extra safety to ensure the default column exists in this table. */
		if (!cols || cols.has(def.column)) {
			return ` ORDER BY ${def.column} ${def.dir}`;
		}
	}

	/* No ordering requsted and no default ordering configured. */
	return '';
}

/* Parse and validate pagination parameters from query string. Returns undefined values if parameters are missing or invalid. */
function parseLimitOffset(query: Request['query']): {
	limit?: number;
	offset?: number;
} {
	/* Parsed limit and offset values, undefined if not provided or invalid. */
	let limit: number | undefined;
	let offset: number | undefined;

	/* Raw query values. */
	const rawLimit = query.limit;
	const rawOffset = query.offset;

	/* Parse limit if provided.*/
	if (typeof rawLimit === 'string') {
		const parsed = parseInt(rawLimit, 10);

		/* Only accept numeric values. */
		if (!Number.isNaN(parsed)) {
			/* Clamp to range [1, 100]. */
			limit = Math.min(Math.max(parsed, 1), 100);
		}
	}

	/* Parse offset if provided. */
	if (typeof rawOffset === 'string') {
		const parsed = parseInt(rawOffset, 10);

		/* Only accept numeric values. */
		if (!Number.isNaN(parsed)) {
			/* Clamp to range [0, +infinity]. */
			offset = Math.max(parsed, 0);
		}
	}

	/* Return parsed pagination values. */
	return { limit, offset };
}

/* Build LIMIT/OFFSET SQL and parameter list with correct placeholder indices. */
function buildPaginationSql(
	limit: number | undefined,
	offset: number | undefined,
	startIndex: number
): { sql: string; params: number[] } {
	/* Pagination parameter values in the order they are used. */
	const params: number[] = [];

	/* SQL frangem we will append to the main query. */
	let sql: string = '';

	/* If limit is provided, add LIMIT placeholder and parameter. */
	if (typeof limit === 'number') {
		params.push(limit);
		sql += ` LIMIT $${startIndex + params.length - 1}`;
	}

	/* If offset is provided, add OFFSET placeholder and parameter. */
	if (typeof offset === 'number') {
		params.push(offset);
		sql += ` OFFSET $${startIndex + params.length - 1}`;
	}

	/* Return pagination SQL fragment and parameters to append to query parameters array. */
	return { sql, params };
}

/* Register endpoints for a specific table. We generate routes for each whitelisted table. */
const setTableEndpoint = (tableName: string): void => {
	/* Determine primary key column for this table. */
	const pk: string = tablePrimaryKeys[tableName];

	/* If primary key is missing, do not register endpoints for this table. */
	if (!pk) return;

	/* Meta endpoints must be registered before ":id" route, otherwise Express would treat "meta" as an id parameter. */
	app.get(`/api/data/${tableName}/meta`, (req: Request, res: Response) => {
		/* Return a metada object. */
		res.json(getTableMeta(tableName));
	});

	/* List endpoints that support filters, ordering, pagination and return items, total, limit and offset. */
	app.get(
		`/api/data/${tableName}`,
		async (req: Request, res: Response): Promise<void> => {
			/* Wrap the handler in try/catch to ensure we respond cleanly if database or query fails. */
			try {
				/* Build WHERE clause and parameters from allowed query filters. */
				const { whereSql, params: whereParams } = buildWhereFromQuery(
					tableName,
					req.query
				);

				/* Build ORDER BY clause using validated column names and default ordering. */
				const orderBySql: string = buildOrderBy(tableName, req.query);

				/* Parse and clamp limit/offset from query string. */
				const { limit, offset } = parseLimitOffset(req.query);

				/* Build pagination SQL fragment with placeholder indices continuing after WHERE params. */
				const { sql: paginationSql, params: paginationParams } =
					buildPaginationSql(limit, offset, whereParams.length + 1);

				/* COUNT query counts total records that match filters only (no limit/offset). */
				const countSql: string = `SELECT COUNT(*)::int AS total FROM ${schema}.${tableName}${whereSql}`;

				/* Execute count query with filter parameters. */
				const countResult = await pool.query<{ total: number }>(
					countSql,
					whereParams
				);

				/* If no row is returned, set default to 0. */
				const total = countResult.rows[0]?.total ?? 0;

				/* Items query to fetch actual rows with filters + ordering + pagination. */
				const itemsSql: string = `SELECT * FROM ${schema}.${tableName}${whereSql}${orderBySql}${paginationSql}`;

				/* Execute items query with combined parameter list. First WHERE parameters, then LIMIT/OFFSET parameters. */
				const itemsResult = await pool.query(itemsSql, [
					...whereParams,
					...paginationParams,
				]);

				/* Respond with the standardized list response object. */
				res.json({
					items: itemsResult.rows,
					total,
					limit: typeof limit === 'number' ? limit : null,
					offset: typeof offset === 'number' ? offset : null,
				});
			} catch (err) {
				/* If anything fails, return a 500 response with an error message. */
				res.status(500).json({
					error: `Failed to fetch data from table ${tableName}.`,
					message: err,
				});
			}
		}
	);

	/* Detail endpoint that returns one record instead of an array. */
	app.get(
		`/api/data/${tableName}/:id`,
		async (req: Request, res: Response): Promise<void> => {
			/* Wrap in try/catch to handle query failures consistently. */
			try {
				/* Extract the record id from the route parameter. */
				const { id } = req.params;

				/* Query whitelisted table and primary key, id is passed as a paremeter ($1) to avoid injection. */
				const queryText: string = `SELECT * FROM ${schema}.${tableName} WHERE ${pk} = $1 LIMIT 1`;

				/* Execute query for a single record. */
				const { rows } = await pool.query(queryText, [id]);

				/* If no record is found, return a 404 response. */
				if (rows.length === 0) {
					res.status(404).json({
						error: 'Not Found (404)',
						message: `No record found in ${tableName} for ${pk}=${id}`,
					});
					return;
				}

				/* Return the first and only row as the record. */
				res.json(rows[0]);
			} catch (err) {
				/* If anything fails, return a 500 response with an error message. */
				res.status(500).json({
					error: `Failed to fetch record from table ${tableName}.`,
					message: err,
				});
			}
		}
	);
};

/* Register endpoints for all whitelisted tables. This loops through "tables" and creates list/detail/meta endpoints for each. */
tables.forEach(setTableEndpoint);

/* Fallback 404 handler for unknown routes. Runs only if no earlier route matched. */
app.use((req: Request, res: Response, next: NextFunction) => {
	res.status(404).json({ error: 'Not Found (404)' });
});

/* Global error 500 handler. */
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
	res.status(500).json({ error: `Internal Server Error (500)`, message: err });
});

/* Start the server only after we have loaded table column metadata for safe dynamic ordering. */
async function startServer(): Promise<void> {
	/* Load and cache table columns from the database. */
	await loadTableColumns();

	/* Start the HTTP server and begin listening for requests. */
	app.listen(port, () => {
		console.log(`Server started on port ${port}`);
	});
}

/* Start the server. If startup fails, log the error and exist with a non-zero code. */
startServer().catch(err => {
	console.error('Failed to start server:', err);
	process.exit(1);
});
