/* Type representing a single update record returned from the API. */
export type UpdateRow = {
	update_id: string;
	structure_id: string;
	update_date?: string;
	update_text?: string;
	[key: string]: unknown;
};
