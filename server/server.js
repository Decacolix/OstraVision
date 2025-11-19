import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';

/* Enable environment (ENV) variables. */
dotenv.config();

/* Set Express framework. */
const app = express();

/* Set port from env, if not available, use port 3000. */
const port = process.env.PORT || 3000;

/* Use Cross-Origin Resource Sharing (CORS) and Express. */
app.use(cors());
app.use(express.json());

/* PostgreSQL pool to set the connection with the database. */
const pool = new Pool({
	host: process.env.PGHOST,
	port: Number(process.env.PGPORT),
	database: process.env.PGDATABASE,
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
});

/* Whitelisted tables. */
const tables = [
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
app.get('/api/data', (req, res) => {
	const endpoints = tables.map(endpoint => `/api/data/${endpoint}`);

	res.json({
		name: 'Ostravision API',
		version: '0.0.1 (Alpha)',
		endpoints,
	});
});

/* Function to set the API endpoints. */
const setTableEndpoint = tableName => {
	/* Set the endpoints based on the table names. */
	app.get(`/api/data/${tableName}`, async (req, res) => {
		try {
			/* Query each table to get all the records from the table and send it as JSON. */
			const schema = 'ostravision';
			const queryText = `SELECT * FROM ${schema}.${tableName}`;

			const { rows } = await pool.query(queryText);
			res.json(rows);
		} catch (err) {
			/* Display error message if the query fails. */
			res.status(500).json({
				error: `Failed to fetch data from table ${tableName}.`,
				message: err,
			});
		}
	});
};

/* Call the function for each table. */
tables.forEach(setTableEndpoint);

/* Send message for unknown routes (404). */
app.use((req, res, next) => {
	res.status(404).json({ error: 'Not Found (404)' });
});

/* Send message for internal server error (500). */
app.use((err, req, res, next) => {
	res.status(500).json({ error: `Internal Server Error (500)`, message: err });
});

/* Start the server. */
app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
