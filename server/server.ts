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

/* Whitelisted tables. */
const tables: string[] = [
	'structures',
	'writers',
	'updates',
	'authors',
	'investors',
	'contractors',
	'locations',
	'sources',
	'photos',
];

/* Root endpoint "/api/data" – information and a list of API endpoints. */
app.get('/api/data', (req: Request, res: Response) => {
	const endpoints = tables.map(endpoint => `/api/data/${endpoint}`);

	res.json({
		name: 'Ostravision API',
		version: '0.0.1 (Alpha)',
		endpoints,
	});
});

/* Function to set the API endpoints. */
const setTableEndpoint = (tableName: string): void => {
	/* Set the endpoints based on the table names. */
	app.get(
		`/api/data/${tableName}`,
		async (req: Request, res: Response): Promise<void> => {
			try {
				/* Query each table to get all the records from the table and send it as JSON. */
				const schema: string = 'ostravision_test';
				const queryText: string = `SELECT * FROM ${schema}.${tableName}`;

				const { rows } = await pool.query(queryText);
				res.json(rows);
			} catch (err) {
				/* Display error message if the query fails. */
				res.status(500).json({
					error: `Failed to fetch data from table ${tableName}.`,
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

/* Start the server. */
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
